"""Cleaning, feature engineering, splitting and imputation.

Design goals
------------
* Keep the raw dataset intact on disk; all transformations are deterministic.
* Parse the US-market formatting actually present in the CSV (``$`` prices,
  ``mi.`` mileage) instead of assuming another unit or currency.
* Feed CatBoost native categorical features, while remaining usable by
  LightGBM and the scikit-learn baselines.
* Fit every learned preprocessing statistic (numeric medians, category levels)
  on the training partition only.
"""
from __future__ import annotations

import math
import re
from typing import Any

import numpy as np
import pandas as pd
from sklearn.model_selection import GroupShuffleSplit

import config
from src.data.load_dataset import PLACEHOLDER_VALUES, parse_mileage, parse_price

# ---------------------------------------------------------------------------
# Value normalisation helpers
# ---------------------------------------------------------------------------

BRAND_FIXES: dict[str, tuple[str, str]] = {
    # truncated brand -> (expected model prefix, corrected brand)
    "LAND": ("ROVER", "LAND ROVER"),
    "ASTON": ("MARTIN", "ASTON MARTIN"),
    "ALFA": ("ROMEO", "ALFA ROMEO"),
}

FUEL_CANONICAL = {
    "gasoline": "Gasoline",
    "gas": "Gasoline",
    "diesel": "Diesel",
    "hybrid": "Hybrid",
    "plug-in hybrid": "Plug-in Hybrid",
    "plug in hybrid": "Plug-in Hybrid",
    "e85 flex fuel": "E85 Flex Fuel",
    "flex fuel": "E85 Flex Fuel",
    "electric": "Electric",
}

COLOR_SYNONYMS: dict[str, list[str]] = {
    "Black": [
        "black",
        "blk",
        "ebony",
        "onyx",
        "nero",
        "charcoal",
        "anthracite",
        "graphite",
        "jet black",
        "midnight",
    ],
    "White": ["white", "pearl", "ivory", "alabaster"],
    "Gray": ["gray", "grey", "granite", "steel", "gunmetal"],
    "Silver": ["silver", "platinum"],
    "Blue": ["blue", "navy", "azure", "teal", "turquoise", "indigo", "cobalt"],
    "Red": ["red", "burgundy", "maroon", "pimento", "crimson", "carmine", "rioja"],
    "Green": ["green", "olive", "emerald", "forest"],
    "Brown": ["brown", "bronze", "copper", "mocha", "espresso", "chestnut", "walnut"],
    "Beige": ["beige", "tan", "cream", "sand", "parchment", "oyster", "linen"],
    "Gold": ["gold", "champagne"],
    "Orange": ["orange", "coral"],
    "Yellow": ["yellow"],
    "Purple": ["purple", "violet", "lavender", "plum"],
    "Pink": ["pink", "rose"],
}

HP_RE = re.compile(r"(\d+(?:\.\d+)?)\s*hp", re.IGNORECASE)
DISPLACEMENT_RE = re.compile(r"(\d+(?:\.\d+)?)\s*(?:l\b|liter|litre)", re.IGNORECASE)
LAYOUT_CYLINDER_RE = re.compile(r"\b(v|i|w|h)\s*[- ]?(\d{1,2})\b", re.IGNORECASE)
WORD_CYLINDER_RE = re.compile(r"\b(straight|inline|flat)\s*[- ]?(\d{1,2})\b", re.IGNORECASE)
COUNT_CYLINDER_RE = re.compile(r"(\d{1,2})\s*cylinder", re.IGNORECASE)
SPEED_RE = re.compile(r"(\d{1,2})\s*[- ]?\s*(?:speed|spd)\b", re.IGNORECASE)


def is_placeholder(value: Any) -> bool:
    if value is None or (isinstance(value, float) and math.isnan(value)):
        return True
    text = str(value).strip().lower()
    return text in PLACEHOLDER_VALUES


def clean_text(value: Any) -> str | None:
    """Return a trimmed string or None for placeholders/missing values."""
    if is_placeholder(value):
        return None
    return re.sub(r"\s+", " ", str(value)).strip()


def canonicalize_brand_model(brand: Any, model: Any) -> tuple[str, str]:
    """Repair truncated multi-word brands and normalise case.

    The source splits the brand at the first space, producing rows such as
    ``brand='Land', model='Rover Range Rover Sport...'``.  All 158 such rows
    have the expected model prefix, so the repair is deterministic.
    """
    brand_text = clean_text(brand) or "UNKNOWN"
    model_text = clean_text(model) or "UNKNOWN"
    brand_upper = brand_text.upper()
    model_upper = model_text.upper()

    if brand_upper in BRAND_FIXES:
        prefix, corrected = BRAND_FIXES[brand_upper]
        if model_upper.startswith(prefix + " "):
            brand_upper = corrected
            model_upper = model_upper[len(prefix) + 1 :].strip()
        elif model_upper == prefix:
            brand_upper = corrected
            model_upper = "BASE"
    return brand_upper, model_upper


def normalise_color(value: Any) -> str:
    """Map a marketing colour name to a small, stable base-colour palette."""
    text = clean_text(value)
    if text is None:
        return "Unknown"
    lowered = text.lower()
    best: tuple[int, str] | None = None
    for base, synonyms in COLOR_SYNONYMS.items():
        for synonym in synonyms:
            match = re.search(rf"\b{re.escape(synonym)}\b", lowered)
            if match:
                position = match.start()
                if best is None or position < best[0]:
                    best = (position, base)
    return best[1] if best else "Other"


def normalise_accident(value: Any) -> str:
    text = clean_text(value)
    if text is None:
        return "Unknown"
    lowered = text.lower()
    if "none" in lowered or "no accident" in lowered:
        return "None"
    if "accident" in lowered or "damage" in lowered:
        return "Reported"
    return "Unknown"


def normalise_fuel_type(value: Any, is_electric: bool) -> str:
    text = clean_text(value)
    if text is None:
        return "Electric" if is_electric else "Unknown"
    lowered = text.lower()
    if "plug" in lowered and "hybrid" in lowered:
        return "Plug-in Hybrid"
    for key, canonical in FUEL_CANONICAL.items():
        if key in lowered:
            return canonical
    return "Electric" if is_electric else "Unknown"


def normalise_transmission(value: Any) -> tuple[str, float]:
    """Return (transmission family, number of speeds)."""
    text = clean_text(value)
    if text is None:
        return "Unknown", np.nan
    lowered = text.lower()

    speed_match = SPEED_RE.search(lowered)
    speeds = float(speed_match.group(1)) if speed_match else np.nan
    if "single-speed" in lowered or "single speed" in lowered:
        speeds = 1.0

    if "at/mt" in lowered or "auto/manual" in lowered or "at / mt" in lowered:
        return "Automatic", speeds
    if any(k in lowered for k in ["cvt", "variable", "continuously variable"]):
        return "CVT", speeds
    if any(
        k in lowered
        for k in [
            "dual shift",
            "dual-clutch",
            "dual clutch",
            "dct",
            "pdk",
            "s tronic",
            "auto-shift",
            "autoshift",
            "automated manual",
        ]
    ):
        return "Dual-Clutch", speeds
    if "single-speed" in lowered or "single speed" in lowered:
        return "Single-Speed", speeds
    if re.search(r"\bm/t\b", lowered) or "manual" in lowered or re.search(r"\bmt\b", lowered):
        return "Manual", speeds
    if (
        re.search(r"\ba/t\b", lowered)
        or "automatic" in lowered
        or re.search(r"\bauto\b", lowered)
        or re.search(r"\bat\b", lowered)
    ):
        return "Automatic", speeds
    return "Unknown", speeds


def parse_engine(engine_value: Any) -> dict[str, Any]:
    """Extract numeric and categorical information from the free-text engine."""
    text = clean_text(engine_value)
    result: dict[str, Any] = {
        "horsepower": np.nan,
        "displacement_l": np.nan,
        "cylinders": np.nan,
        "is_turbo": 0,
        "is_supercharged": 0,
        "is_electric": 0,
        "engine_family": "Unknown",
        "engine_data_missing": 1,
    }
    if text is None:
        return result

    lowered = text.lower()

    hp_match = HP_RE.search(text)
    if hp_match:
        result["horsepower"] = float(hp_match.group(1))

    displacement_match = DISPLACEMENT_RE.search(text)
    if displacement_match:
        result["displacement_l"] = float(displacement_match.group(1))

    cylinders: float | None = None
    layout: str | None = None
    layout_match = LAYOUT_CYLINDER_RE.search(text)
    if layout_match:
        letter = layout_match.group(1).upper()
        cylinders = float(layout_match.group(2))
        layout = f"{letter}{int(cylinders)}"
    else:
        word_match = WORD_CYLINDER_RE.search(text)
        if word_match:
            word = word_match.group(1).lower()
            cylinders = float(word_match.group(2))
            layout = f"{'H' if word == 'flat' else 'I'}{int(cylinders)}"
        else:
            count_match = COUNT_CYLINDER_RE.search(text)
            if count_match:
                cylinders = float(count_match.group(1))

    if cylinders is not None:
        result["cylinders"] = cylinders

    has_electric = "electric" in lowered
    has_hybrid = "hybrid" in lowered
    has_gas = "gas" in lowered or "gasoline" in lowered
    has_motor = "motor" in lowered
    has_displacement = result["displacement_l"] is not None and not pd.isna(
        result["displacement_l"]
    )
    is_electric = (has_electric or has_motor) and not has_hybrid and not has_gas
    if is_electric and has_displacement:
        # A displacement value alongside an electric motor usually indicates a
        # range extender, not a pure EV.
        is_electric = False
    if is_electric:
        result["is_electric"] = 1
        result["displacement_l"] = 0.0
        result["cylinders"] = 0.0
        result["engine_family"] = "Electric"
    elif layout is not None:
        result["engine_family"] = layout
    elif cylinders is not None:
        result["engine_family"] = f"{int(cylinders)}-Cyl"
    elif "rotary" in lowered:
        result["engine_family"] = "Rotary"

    result["is_turbo"] = int("turbo" in lowered)
    result["is_supercharged"] = int("supercharg" in lowered)

    has_any_spec = any(
        [
            result["horsepower"] is not None and not pd.isna(result["horsepower"]),
            result["displacement_l"] is not None and not pd.isna(result["displacement_l"]),
            result["cylinders"] is not None and not pd.isna(result["cylinders"]),
            result["engine_family"] != "Unknown",
        ]
    )
    result["engine_data_missing"] = 0 if has_any_spec else 1
    return result


# ---------------------------------------------------------------------------
# Dataset construction and splitting
# ---------------------------------------------------------------------------


def engineer_features(raw_df: pd.DataFrame, reference_year: int | None = None) -> pd.DataFrame:
    """Transform raw listings into model-ready features plus the target."""
    reference = int(reference_year if reference_year is not None else config.REFERENCE_YEAR)
    df = raw_df.copy()

    prices = parse_price(df["price"])
    mileage = parse_mileage(df["milage"])
    year = pd.to_numeric(df["model_year"], errors="coerce")

    if prices.isna().any():
        bad = df.loc[prices.isna(), "price"].head(5).tolist()
        raise ValueError(f"Unparseable price values: {bad}")
    if mileage.isna().any():
        bad = df.loc[mileage.isna(), "milage"].head(5).tolist()
        raise ValueError(f"Unparseable mileage values: {bad}")
    if year.isna().any():
        bad = df.loc[year.isna(), "model_year"].head(5).tolist()
        raise ValueError(f"Unparseable model_year values: {bad}")

    # Invalid/negative values are data errors, not legitimate listings.
    valid = (prices > 0) & (mileage >= 0) & year.between(1900, reference + 2)
    if not valid.all():
        dropped = int((~valid).sum())
        print(f"[preprocessing] Dropping {dropped} rows with invalid price/mileage/year")
    df = df.loc[valid].copy()
    prices = prices.loc[valid]
    mileage = mileage.loc[valid]
    year = year.loc[valid]

    brands, models = zip(
        *(canonicalize_brand_model(b, m) for b, m in zip(df["brand"], df["model"]))
    )
    engine_specs = [parse_engine(value) for value in df["engine"]]

    result = pd.DataFrame(index=df.index)
    result["listing_id"] = np.arange(len(df), dtype=int)
    result["brand"] = list(brands)
    result["model"] = list(models)
    result["model_year"] = year.astype(int)
    result["price"] = prices.astype(float)

    result["mileage"] = mileage.astype(float)
    result["vehicle_age"] = (reference - result["model_year"]).clip(lower=0).astype(float)
    result["mileage_per_year"] = np.where(
        result["vehicle_age"] > 0,
        result["mileage"] / result["vehicle_age"],
        result["mileage"],
    )

    engine_df = pd.DataFrame(engine_specs, index=df.index)
    for column in [
        "horsepower",
        "displacement_l",
        "cylinders",
        "is_turbo",
        "is_supercharged",
        "is_electric",
        "engine_family",
        "engine_data_missing",
    ]:
        result[column] = engine_df[column]

    result["fuel_type"] = [
        normalise_fuel_type(fuel, bool(is_ev))
        for fuel, is_ev in zip(df["fuel_type"], result["is_electric"])
    ]

    transmission = [normalise_transmission(value) for value in df["transmission"]]
    result["transmission"] = [item[0] for item in transmission]
    result["transmission_speeds"] = [item[1] for item in transmission]

    result["exterior_color"] = df["ext_col"].map(normalise_color)
    result["interior_color"] = df["int_col"].map(normalise_color)
    result["accident_history"] = df["accident"].map(normalise_accident)

    result = result.reset_index(drop=True)

    # Group near-duplicate listings (same vehicle signature and mileage bucket)
    # so that they cannot straddle train/test boundaries.
    mileage_bucket = (result["mileage"] // 500 * 500).astype(int)
    result[config.GROUP_COLUMN] = (
        result["brand"]
        + "|"
        + result["model"]
        + "|"
        + result["model_year"].astype(str)
        + "|"
        + mileage_bucket.astype(str)
    )
    return result


def split_dataset(
    df: pd.DataFrame,
    seed: int | None = None,
    test_fraction: float | None = None,
    validation_fraction: float | None = None,
) -> pd.DataFrame:
    """Group-aware train/validation/test split.

    Listings sharing a vehicle signature stay in one partition, preventing
    duplicate advertisements from inflating test performance.
    """
    seed = int(seed if seed is not None else config.RANDOM_SEED)
    test_fraction = float(test_fraction if test_fraction is not None else config.TEST_FRACTION)
    validation_fraction = float(
        validation_fraction if validation_fraction is not None else config.VALIDATION_FRACTION
    )

    groups = df[config.GROUP_COLUMN]
    outer = GroupShuffleSplit(n_splits=1, test_size=test_fraction, random_state=seed)
    train_val_idx, test_idx = next(outer.split(df, groups=groups))

    train_val = df.iloc[train_val_idx]
    relative_val = validation_fraction / (1.0 - test_fraction)
    inner = GroupShuffleSplit(n_splits=1, test_size=relative_val, random_state=seed)
    train_rel_idx, val_rel_idx = next(
        inner.split(train_val, groups=train_val[config.GROUP_COLUMN])
    )
    train_idx = train_val.index[train_rel_idx]
    val_idx = train_val.index[val_rel_idx]
    test_idx = df.index[test_idx]

    result = df.copy()
    result[config.SPLIT_COLUMN] = "unassigned"
    result.loc[train_idx, config.SPLIT_COLUMN] = "train"
    result.loc[val_idx, config.SPLIT_COLUMN] = "validation"
    result.loc[test_idx, config.SPLIT_COLUMN] = "test"

    if (result[config.SPLIT_COLUMN] == "unassigned").any():
        raise RuntimeError("Some rows were not assigned to a split")

    split_groups = {
        split: set(result.loc[result[config.SPLIT_COLUMN] == split, config.GROUP_COLUMN])
        for split in ["train", "validation", "test"]
    }
    if split_groups["train"] & split_groups["validation"]:
        raise RuntimeError("Group leakage between train and validation")
    if split_groups["train"] & split_groups["test"]:
        raise RuntimeError("Group leakage between train and test")
    if split_groups["validation"] & split_groups["test"]:
        raise RuntimeError("Group leakage between validation and test")

    return result


def fit_numeric_medians(train_df: pd.DataFrame) -> dict[str, float]:
    medians: dict[str, float] = {}
    for column in config.IMPUTABLE_NUMERICAL_FEATURES:
        value = train_df[column].median()
        medians[column] = float(value) if not pd.isna(value) else 0.0
    return medians


def apply_numeric_imputation(df: pd.DataFrame, medians: dict[str, float]) -> pd.DataFrame:
    result = df.copy()
    for column, fill_value in medians.items():
        if column in result.columns:
            result[column] = result[column].fillna(fill_value)
    return result


def category_levels(df: pd.DataFrame) -> dict[str, list[str]]:
    return {
        column: sorted(df[column].dropna().astype(str).unique().tolist())
        for column in config.CATEGORICAL_FEATURES
    }


def feature_ranges(df: pd.DataFrame) -> dict[str, dict[str, float]]:
    ranges: dict[str, dict[str, float]] = {}
    for column in config.NUMERICAL_FEATURES:
        ranges[column] = {
            "min": float(df[column].min()),
            "max": float(df[column].max()),
            "p01": float(df[column].quantile(0.01)),
            "p99": float(df[column].quantile(0.99)),
        }
    return ranges


def build_feature_config(
    train_df: pd.DataFrame,
    medians: dict[str, float],
    reference_year: int,
) -> dict[str, Any]:
    levels = category_levels(train_df)
    return {
        "feature_columns": list(config.FEATURE_COLUMNS),
        "categorical_features": list(config.CATEGORICAL_FEATURES),
        "numerical_features": list(config.NUMERICAL_FEATURES),
        "imputable_numerical_features": list(config.IMPUTABLE_NUMERICAL_FEATURES),
        "numeric_medians": medians,
        "category_levels": levels,
        "known_values": {column: levels[column] for column in config.CATEGORICAL_FEATURES},
        "feature_ranges": feature_ranges(train_df),
        "reference_year": int(reference_year),
        "target": config.TARGET_COLUMN,
        "currency": config.CURRENCY,
        "mileage_unit": config.MILEAGE_UNIT,
        "model_version": config.MODEL_VERSION,
    }


def prepare_splits(
    raw_df: pd.DataFrame,
    reference_year: int | None = None,
    seed: int | None = None,
) -> tuple[pd.DataFrame, dict[str, float], dict[str, Any]]:
    """Engineer features, split, impute using train-only statistics."""
    features = engineer_features(raw_df, reference_year=reference_year)
    features = split_dataset(features, seed=seed)

    train_df = features[features[config.SPLIT_COLUMN] == "train"]
    medians = fit_numeric_medians(train_df)
    features = apply_numeric_imputation(features, medians)

    config_payload = build_feature_config(
        train_df=apply_numeric_imputation(train_df, medians),
        medians=medians,
        reference_year=int(reference_year if reference_year is not None else config.REFERENCE_YEAR),
    )
    return features, medians, config_payload


def encode_categorical_features(
    frame: pd.DataFrame,
    feature_columns: list[str],
    categorical: list[str],
    numerical: list[str],
    levels: dict[str, list[str]],
) -> pd.DataFrame:
    """Encode categorical columns as pandas categories for LightGBM.

    Categories are fixed to the training levels.  Values not seen in training
    become NaN, which LightGBM treats as missing rather than crashing.
    """
    encoded = frame[feature_columns].copy()
    for column in categorical:
        categories = levels.get(column, [])
        values = encoded[column].astype(str)
        # Values unseen during training become NaN (LightGBM treats them as
        # missing) instead of relying on a deprecated pandas coercion path.
        values = values.where(values.isin(set(categories)), other=np.nan)
        encoded[column] = pd.Categorical(values, categories=categories)
    for column in numerical:
        if column in encoded.columns:
            encoded[column] = encoded[column].astype(float)
    return encoded
