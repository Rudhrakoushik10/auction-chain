"""Pydantic request/response models for the prediction API."""
from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

MAX_MODEL_YEAR = datetime.now().year + 2


class VehiclePredictionRequest(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        str_strip_whitespace=True,
        json_schema_extra={
            "example": {
                "brand": "Toyota",
                "model": "Camry",
                "year": 2021,
                "mileage": 35000,
                "fuel_type": "Gasoline",
                "engine_type": "2.5L I4",
                "transmission": "Automatic",
                "exterior_color": "White",
                "interior_color": "Black",
                "accident_history": False,
                "clean_title": True,
            }
        },
    )

    brand: str = Field(..., min_length=1, max_length=80, description="Vehicle manufacturer")
    model: str = Field(..., min_length=1, max_length=120, description="Vehicle model and trim")
    year: int = Field(..., ge=1900, le=MAX_MODEL_YEAR, description="Model year")
    mileage: float = Field(
        ..., ge=0, le=1_500_000, description="Odometer reading in miles (US dataset)"
    )
    fuel_type: str | None = Field(None, max_length=80, description="Gasoline, Diesel, Hybrid, ...")
    engine_type: str | None = Field(
        None, max_length=200, description="Free-text engine description"
    )
    transmission: str | None = Field(None, max_length=120, description="Transmission description")
    exterior_color: str | None = Field(None, max_length=120)
    interior_color: str | None = Field(None, max_length=120)
    accident_history: bool | None = Field(
        None, description="True if an accident or damage was reported; null if unknown"
    )
    clean_title: bool | None = Field(
        None,
        description=(
            "Accepted for API compatibility. The training dataset only contains "
            "'Yes' values, so this field has no learned effect on the prediction."
        ),
    )

    @field_validator(
        "fuel_type",
        "engine_type",
        "transmission",
        "exterior_color",
        "interior_color",
        mode="before",
    )
    @classmethod
    def empty_string_to_none(cls, value: object) -> object:
        if isinstance(value, str) and value.strip() == "":
            return None
        return value

    @field_validator("accident_history", "clean_title", mode="before")
    @classmethod
    def coerce_optional_bool(cls, value: object) -> object:
        """Accept native booleans plus the yes/no strings common in listings."""
        if value is None or isinstance(value, bool):
            return value
        if isinstance(value, (int, float)) and value in (0, 1):
            return bool(value)
        if isinstance(value, str):
            lowered = value.strip().lower()
            if lowered in {"true", "yes", "y", "1"}:
                return True
            if lowered in {"false", "no", "n", "0"}:
                return False
            if lowered in {"", "none", "null", "nan", "unknown", "not reported"}:
                return None
        raise ValueError("must be a boolean or one of yes/no/true/false/unknown")


class PredictionResponse(BaseModel):
    success: bool = True
    predicted_price: float
    currency: str
    model_version: str
    prediction_unit: str = "vehicle"
    in_training_distribution: bool
    warnings: list[str] = Field(default_factory=list)
    inference_ms: float


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    model_version: str | None = None
    algorithm: str | None = None
    load_error: str | None = None
