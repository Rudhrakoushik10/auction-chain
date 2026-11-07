"""Inference wrapper used by the API and by backend integrations.

The saved model is loaded exactly once per process.  Feature construction reuses
the same parsing/normalisation functions as training, so serving cannot silently
diverge from training preprocessing.
"""
from __future__ import annotations

import json
import math
import time
from datetime import datetime
from pathlib import Path
from typing import Any

import joblib
import lightgbm as lgb
import numpy as np
import pandas as pd
from catboost import CatBoostRegressor

import config
from src.data.preprocessing import (
    canonicalize_brand_model,
    encode_categorical_features,
    normalise_accident,
    normalise_color,
    normalise_fuel_type,
    normalise_transmission,
    parse_engine,
)


class PredictionError(ValueError):
    """Raised when a request cannot be scored safely."""


class VehiclePricePredictor:
    def __init__(self, model_dir: str | Path | None = None) -> None:
        self.model_dir = Path(model_dir) if model_dir is not None else config.MODELS_DIR
        self.metadata_path = self.model_dir / "model_metadata.json"
        self.feature_config_path = self.model_dir / "feature_config.json"

        if not self.metadata_path.exists():
            raise FileNotFoundError(
                f"Model metadata not found at {self.metadata_path}. "
                "Train the model first: python -m src.training.train"
            )
        if not self.feature_config_path.exists():
            raise FileNotFoundError(
                f"Feature configuration not found at {self.feature_config_path}."
            )

        with self.metadata_path.open("r", encoding="utf-8") as handle:
            self.metadata = json.load(handle)
        with self.feature_config_path.open("r", encoding="utf-8") as handle:
            self.feature_config = json.load(handle)

        self.algorithm: str = self.metadata["algorithm"]
        self.model_version: str = self.metadata["model_version"]
        self.currency: str = self.metadata.get("currency", config.CURRENCY)
        self.reference_year: int = int(self.metadata.get("reference_year", config.REFERENCE_YEAR))
        self.feature_columns: list[str] = list(self.metadata["features"]["feature_columns"])
        self.categorical_features: list[str] = list(
            self.metadata["features"]["categorical_features"]
        )
        self.numerical_features: list[str] = list(
            self.metadata["features"]["numerical_features"]
        )
        self.numeric_medians: dict[str, float] = {
            key: float(value) for key, value in self.metadata["numeric_medians"].items()
        }
        self.category_levels: dict[str, list[str]] = self.metadata.get("category_levels", {})
        self.known_values: dict[str, list[str]] = self.metadata.get("known_values", {})
        self.model_year_range: tuple[int, int] = tuple(
            int(value) for value in self.metadata.get("model_year_range", [1900, 2100])
        )
        self.mileage_range: tuple[float, float] = tuple(
            float(value) for value in self.metadata.get("mileage_range", [0, 1_000_000])
        )

        self.model_path = self.model_dir / self.metadata["model_file"]
        if not self.model_path.exists():
            raise FileNotFoundError(f"Model artifact not found at {self.model_path}")

        self._load_model()

    def _load_model(self) -> None:
        start = time.perf_counter()
        if self.algorithm == "catboost":
            self.model: Any = CatBoostRegressor()
            self.model.load_model(str(self.model_path))
        elif self.algorithm == "lightgbm":
            self.model = lgb.Booster(model_file=str(self.model_path))
        elif self.algorithm.startswith("sklearn"):
            self.model = joblib.load(self.model_path)
        else:
            raise PredictionError(f"Unsupported model algorithm: {self.algorithm}")
        self.load_seconds = time.perf_counter() - start

    # ------------------------------------------------------------------
    # Input handling
    # ------------------------------------------------------------------

    @staticmethod
    def _first(payload: dict[str, Any], *keys: str, default: Any = None) -> Any:
        for key in keys:
            if key in payload and payload[key] not in (None, ""):
                return payload[key]
        return default

    @staticmethod
    def _as_optional_bool(value: Any) -> bool | None:
        if value is None:
            return None
        if isinstance(value, bool):
            return value
        if isinstance(value, (int, float)) and value in (0, 1):
            return bool(value)
        if isinstance(value, str):
            lowered = value.strip().lower()
            if lowered in {"true", "yes", "y", "1"}:
                return True
            if lowered in {"false", "no", "n", "0"}:
                return False
        return None

    def _validate(self, year: int, mileage: float) -> None:
        max_year = datetime.now().year + 2
        if not 1900 <= year <= max_year:
            raise PredictionError(
                f"year must be between 1900 and {max_year}, received {year}"
            )
        if not math.isfinite(mileage):
            raise PredictionError("mileage must be a finite number")
        if mileage < 0 or mileage > 1_500_000:
            raise PredictionError(
                f"mileage must be between 0 and 1,500,000 miles, received {mileage}"
            )

    def _build_features(self, payload: dict[str, Any]) -> tuple[pd.DataFrame, list[str], bool]:
        brand_raw = self._first(payload, "brand")
        model_raw = self._first(payload, "model")
        year_raw = self._first(payload, "year", "model_year")
        mileage_raw = self._first(payload, "mileage", "milage")
        if brand_raw is None or str(brand_raw).strip() == "":
            raise PredictionError("brand is required")
        if model_raw is None or str(model_raw).strip() == "":
            raise PredictionError("model is required")
        if year_raw is None:
            raise PredictionError("year (or model_year) is required")
        if mileage_raw is None:
            raise PredictionError("mileage (or milage) is required")

        try:
            year = int(year_raw)
            mileage = float(mileage_raw)
        except (TypeError, ValueError) as error:
            raise PredictionError("year and mileage must be numeric") from error
        self._validate(year, mileage)

        brand, model = canonicalize_brand_model(brand_raw, model_raw)

        fuel_raw = self._first(payload, "fuel_type", "fuel")
        engine_raw = self._first(payload, "engine_type", "engine")
        transmission_raw = self._first(payload, "transmission")
        exterior_raw = self._first(payload, "exterior_color", "ext_col")
        interior_raw = self._first(payload, "interior_color", "int_col")
        accident_raw = self._first(payload, "accident_history", "accident")

        engine = parse_engine(engine_raw)
        is_electric = bool(engine["is_electric"])
        fuel_type = normalise_fuel_type(fuel_raw, is_electric)
        transmission, transmission_speeds = normalise_transmission(transmission_raw)
        exterior_color = normalise_color(exterior_raw)
        interior_color = normalise_color(interior_raw)

        accident_bool = self._as_optional_bool(accident_raw)
        if isinstance(accident_raw, str) and accident_bool is None:
            accident_history = normalise_accident(accident_raw)
        elif accident_bool is True:
            accident_history = "Reported"
        elif accident_bool is False:
            accident_history = "None"
        else:
            accident_history = "Unknown"

        vehicle_age = max(self.reference_year - year, 0)
        mileage_per_year = mileage / vehicle_age if vehicle_age > 0 else mileage

        row: dict[str, Any] = {
            "brand": brand,
            "model": model,
            "model_year": year,
            "mileage": mileage,
            "vehicle_age": float(vehicle_age),
            "mileage_per_year": float(mileage_per_year),
            "horsepower": engine["horsepower"],
            "displacement_l": engine["displacement_l"],
            "cylinders": engine["cylinders"],
            "transmission_speeds": transmission_speeds,
            "is_turbo": engine["is_turbo"],
            "is_supercharged": engine["is_supercharged"],
            "is_electric": engine["is_electric"],
            "engine_data_missing": engine["engine_data_missing"],
            "fuel_type": fuel_type,
            "transmission": transmission,
            "exterior_color": exterior_color,
            "interior_color": interior_color,
            "accident_history": accident_history,
            "engine_family": engine["engine_family"],
        }

        for column, median in self.numeric_medians.items():
            value = row.get(column)
            if value is None or (isinstance(value, float) and math.isnan(value)):
                row[column] = median

        warnings: list[str] = []
        ood = False

        optional_inputs = {
            "fuel_type": fuel_raw,
            "engine_type": engine_raw,
            "transmission": transmission_raw,
            "exterior_color": exterior_raw,
            "interior_color": interior_raw,
            "accident_history": accident_raw,
        }
        missing_optional = [name for name, value in optional_inputs.items() if value is None]
        if missing_optional:
            warnings.append(
                "Optional fields missing ("
                + ", ".join(missing_optional)
                + "); neutral/imputed values were used, so this estimate is less precise."
            )

        known_brands = set(self.known_values.get("brand", []))
        if known_brands and brand not in known_brands:
            warnings.append(
                f"Unsupported brand '{brand_raw}' is not present in the training data; "
                "the prediction is flagged as out-of-distribution."
            )
            ood = True

        known_models = set(self.known_values.get("model", []))
        if known_models and model not in known_models:
            warnings.append(
                f"Unsupported model '{model_raw}' is not present in the training data; "
                "the prediction is flagged as out-of-distribution."
            )
            ood = True

        if not self.model_year_range[0] <= year <= self.model_year_range[1]:
            warnings.append(
                f"Model year {year} is outside the training range "
                f"{self.model_year_range[0]}-{self.model_year_range[1]}; "
                "the prediction is flagged as out-of-distribution."
            )
            ood = True

        if not self.mileage_range[0] <= mileage <= self.mileage_range[1]:
            warnings.append(
                f"Mileage {mileage:,.0f} miles is outside the training range "
                f"{self.mileage_range[0]:,.0f}-{self.mileage_range[1]:,.0f}; "
                "the prediction is flagged as out-of-distribution."
            )
            ood = True

        if fuel_raw is not None and fuel_type == "Unknown":
            warnings.append(
                f"Fuel type '{fuel_raw}' is not recognised; treated as Unknown."
            )
        if transmission_raw is not None and transmission == "Unknown":
            warnings.append(
                f"Transmission '{transmission_raw}' is not recognised; treated as Unknown."
            )
        if engine_raw is not None and engine["engine_data_missing"] == 1:
            warnings.append(
                "Engine description could not be parsed; engine specifications were imputed."
            )

        frame = pd.DataFrame([row])
        for column in self.categorical_features:
            frame[column] = frame[column].astype(str)
        for column in self.numerical_features:
            frame[column] = pd.to_numeric(frame[column], errors="coerce").astype(float)
        frame = frame[self.feature_columns]
        return frame, warnings, not ood

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def predict(self, payload: dict[str, Any]) -> dict[str, Any]:
        frame, warnings, in_distribution = self._build_features(payload)

        start = time.perf_counter()
        if self.algorithm == "catboost":
            prediction = self.model.predict(frame)
        elif self.algorithm == "lightgbm":
            encoded = encode_categorical_features(
                frame,
                self.feature_columns,
                self.categorical_features,
                self.numerical_features,
                self.category_levels,
            )
            prediction = self.model.predict(encoded)
        else:
            prediction = self.model.predict(frame)
        inference_ms = (time.perf_counter() - start) * 1000.0

        value = float(np.ravel(prediction)[0])
        if not math.isfinite(value):
            raise PredictionError("Model produced a non-finite prediction")
        value = max(value, 0.0)

        return {
            "predicted_price": round(value, 2),
            "currency": self.currency,
            "model_version": self.model_version,
            "warnings": warnings,
            "in_training_distribution": in_distribution,
            "inference_ms": round(inference_ms, 3),
        }

    def model_info(self) -> dict[str, Any]:
        return {
            "model_version": self.model_version,
            "algorithm": self.algorithm,
            "algorithm_display_name": self.metadata.get("algorithm_display_name"),
            "model_file": self.metadata["model_file"],
            "model_size_mb": self.metadata.get("model_size_mb"),
            "currency": self.currency,
            "mileage_unit": self.metadata.get("mileage_unit"),
            "reference_year": self.reference_year,
            "feature_count": len(self.feature_columns),
            "test_metrics": self.metadata.get("test_metrics"),
            "model_year_range": list(self.model_year_range),
            "mileage_range": list(self.mileage_range),
            "model_load_seconds": round(float(self.load_seconds), 4),
        }
