"""Dataset loading and validation for the vehicle price dataset.

The loader keeps all columns as strings first.  This is intentional: the raw
CSV stores prices as ``"$10,300"`` and mileage as ``"51,000 mi."``.  Parsing is
performed explicitly in ``preprocessing.py`` so that every conversion is
auditable and unit-tested.
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd

import config

REQUIRED_COLUMNS = [
    "brand",
    "model",
    "model_year",
    "milage",
    "fuel_type",
    "engine",
    "transmission",
    "ext_col",
    "int_col",
    "accident",
    "clean_title",
    "price",
]

PLACEHOLDER_VALUES = {"", "-", "–", "—", "not supported", "nan", "none", "null"}


class DatasetError(ValueError):
    """Raised when the raw dataset is missing required columns or is invalid."""


def load_raw_dataset(path: str | Path | None = None) -> pd.DataFrame:
    """Load the raw CSV while preserving the original string representation."""
    csv_path = Path(path) if path is not None else config.RAW_DATA_PATH
    if not csv_path.exists():
        raise FileNotFoundError(
            f"Dataset not found at {csv_path}. Place used_cars.csv in dataset/raw/."
        )

    df = pd.read_csv(csv_path, dtype=str, keep_default_na=False)
    df.columns = [str(c).strip() for c in df.columns]

    # CSV uses empty strings for missing values; normalise to real NaN.
    df = df.replace({"": np.nan})

    missing_columns = [c for c in REQUIRED_COLUMNS if c not in df.columns]
    if missing_columns:
        raise DatasetError(
            f"Dataset is missing required columns: {missing_columns}. "
            f"Found: {list(df.columns)}"
        )

    return df


def _clean_numeric_text(series: pd.Series, pattern: str) -> pd.Series:
    """Remove formatting characters from a numeric-looking text column."""
    return series.astype("string").str.replace(pattern, "", regex=True)


def parse_price(series: pd.Series) -> pd.Series:
    """Parse ``$10,300`` style prices into floats."""
    cleaned = _clean_numeric_text(series, r"[$,\s]")
    return pd.to_numeric(cleaned, errors="coerce")


def parse_mileage(series: pd.Series) -> pd.Series:
    """Parse ``51,000 mi.`` style mileage into floats (miles)."""
    cleaned = _clean_numeric_text(series, r"[,\s]|mi\.?")
    return pd.to_numeric(cleaned, errors="coerce")


def _describe_numeric(series: pd.Series) -> dict[str, Any]:
    valid = series.dropna()
    if valid.empty:
        return {"count": 0}
    percentiles = [0.01, 0.05, 0.25, 0.5, 0.75, 0.95, 0.99, 0.995]
    quantiles = valid.quantile(percentiles).to_dict()
    result = {
        "count": int(valid.shape[0]),
        "mean": float(valid.mean()),
        "std": float(valid.std()),
        "min": float(valid.min()),
        "max": float(valid.max()),
    }
    for p, value in quantiles.items():
        result[f"p{int(p * 1000) / 10:g}"] = float(value)
    return result


def analyse_raw_dataset(df: pd.DataFrame) -> dict[str, Any]:
    """Build a JSON-serialisable data-quality report."""
    price = parse_price(df["price"])
    mileage = parse_mileage(df["milage"])
    year = pd.to_numeric(df["model_year"], errors="coerce")

    exact_duplicates = int(df.duplicated().sum())
    vehicle_key = ["brand", "model", "model_year", "milage"]
    duplicate_vehicle_keys = int(df.duplicated(subset=vehicle_key).sum())

    price_p99_5 = float(price.quantile(0.995))
    mileage_p99_5 = float(mileage.quantile(0.995))
    price_outliers = df.loc[price > price_p99_5, ["brand", "model", "price"]].copy()
    price_outliers["price_parsed"] = price.loc[price > price_p99_5]

    placeholder_counts = {
        column: int(
            df[column]
            .astype("string")
            .str.strip()
            .str.lower()
            .isin(PLACEHOLDER_VALUES)
            .fillna(False)
            .sum()
        )
        for column in df.columns
    }

    report: dict[str, Any] = {
        "dataset": {
            "rows": int(df.shape[0]),
            "columns": int(df.shape[1]),
            "column_names": list(df.columns),
            "currency": config.CURRENCY,
            "mileage_unit": config.MILEAGE_UNIT,
            "market": config.MARKET,
            "unit_evidence": {
                "price_examples": df["price"].dropna().head(3).tolist(),
                "mileage_examples": df["milage"].dropna().head(3).tolist(),
                "currency_symbol": "$ (USD)",
                "mileage_suffix": "mi. (miles)",
            },
        },
        "missing_values": {
            column: {
                "count": int(df[column].isna().sum()),
                "percent": round(float(df[column].isna().mean() * 100), 3),
            }
            for column in df.columns
        },
        "placeholder_values": placeholder_counts,
        "unique_values": {column: int(df[column].nunique(dropna=True)) for column in df.columns},
        "duplicates": {
            "exact_rows": exact_duplicates,
            "vehicle_key_duplicates": duplicate_vehicle_keys,
            "vehicle_key": vehicle_key,
        },
        "price": _describe_numeric(price),
        "mileage": _describe_numeric(mileage),
        "model_year": _describe_numeric(year),
        "categorical_distributions": {
            "brand": {str(k): int(v) for k, v in df["brand"].value_counts().items()},
            "fuel_type": {
                str(k): int(v) for k, v in df["fuel_type"].fillna("MISSING").value_counts().items()
            },
            "accident": {
                str(k): int(v) for k, v in df["accident"].fillna("MISSING").value_counts().items()
            },
            "clean_title": {
                str(k): int(v) for k, v in df["clean_title"].fillna("MISSING").value_counts().items()
            },
            "transmission_top_20": {
                str(k): int(v) for k, v in df["transmission"].value_counts().head(20).items()
            },
        },
        "outliers": {
            "price_above_p99_5": {
                "threshold": price_p99_5,
                "count": int((price > price_p99_5).sum()),
                "rows": price_outliers.head(15).to_dict(orient="records"),
            },
            "mileage_above_p99_5": {
                "threshold": mileage_p99_5,
                "count": int((mileage > mileage_p99_5).sum()),
            },
            "price_below_3000": {
                "count": int((price < 3000).sum()),
                "rows": df.loc[price < 3000, ["brand", "model", "model_year", "milage", "price"]]
                .head(15)
                .to_dict(orient="records"),
            },
        },
        "data_quality_notes": [
            "Prices are US dollars and mileage is in miles (verified from '$' and 'mi.' formatting).",
            "The 'clean_title' column only contains 'Yes' for 3413 rows and is missing for 596 rows; "
            "it has no usable variance and missingness is correlated with listing source, so it is "
            "excluded from model features.",
            "The fuel_type column uses '–' and 'not supported' as placeholders; these are treated as "
            "unknown and inferred as Electric when the engine description is electric.",
            "Brand values 'Land', 'Aston' and 'Alfa' are truncated forms of Land Rover, Aston Martin "
            "and Alfa Romeo; they are repaired using the first token of the model column.",
            "The engine column is free text (1146 unique strings). It is parsed into horsepower, "
            "displacement, cylinder count, forced-induction and electric indicators.",
            "One Maserati Quattroporte (2005) is listed at $2,954,083, which is implausible for the "
            "model and is retained as an anomaly rather than silently deleted. MAE training limits "
            "its impact; metrics with and without outliers are discussed in the evaluation report.",
            "No exact duplicate rows exist. Three vehicle keys appear twice (6 rows), likely duplicate "
            "listings; a grouped split keeps them in the same partition to prevent leakage.",
        ],
    }
    return report


def write_json(data: dict[str, Any], path: str | Path) -> None:
    output_path = Path(path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8") as handle:
        json.dump(data, handle, indent=2, ensure_ascii=False, default=str)
