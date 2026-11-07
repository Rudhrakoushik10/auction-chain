"""Unit tests for the production VehiclePricePredictor wrapper."""
from __future__ import annotations

import pytest

from src.prediction.predictor import PredictionError, VehiclePricePredictor


@pytest.fixture(scope="module")
def predictor() -> VehiclePricePredictor:
    return VehiclePricePredictor()


def test_predict_standard_vehicle(predictor: VehiclePricePredictor) -> None:
    result = predictor.predict(
        {
            "brand": "Ford",
            "model": "F-150 XLT",
            "year": 2020,
            "mileage": 45000,
            "fuel_type": "Gasoline",
            "engine_type": "3.5L V6 400hp Twin Turbo",
            "transmission": "10-Speed Automatic",
            "exterior_color": "Black",
            "interior_color": "Black",
            "accident_history": False,
            "clean_title": True,
        }
    )
    assert result["predicted_price"] > 0
    assert result["currency"] == "USD"
    assert result["model_version"] == "1.0.0"
    assert result["in_training_distribution"] is True
    assert result["warnings"] == []
    assert result["inference_ms"] >= 0


def test_predict_missing_optional_fields(predictor: VehiclePricePredictor) -> None:
    result = predictor.predict(
        {
            "brand": "Toyota",
            "model": "Camry SE",
            "year": 2021,
            "mileage": 32000,
        }
    )
    assert result["predicted_price"] > 0
    assert any("Optional fields missing" in w for w in result["warnings"])


def test_predict_clean_title_has_no_effect(predictor: VehiclePricePredictor) -> None:
    base_payload = {
        "brand": "Ford",
        "model": "F-150 XLT",
        "year": 2020,
        "mileage": 45000,
        "fuel_type": "Gasoline",
        "engine_type": "3.5L V6 400hp Twin Turbo",
        "transmission": "10-Speed Automatic",
        "exterior_color": "Black",
        "interior_color": "Black",
        "accident_history": False,
    }
    res_true = predictor.predict({**base_payload, "clean_title": True})
    res_false = predictor.predict({**base_payload, "clean_title": False})
    assert res_true["predicted_price"] == res_false["predicted_price"]


def test_predict_flags_out_of_distribution(predictor: VehiclePricePredictor) -> None:
    result = predictor.predict(
        {
            "brand": "UnknownMaker",
            "model": "Concept X",
            "year": 1965,
            "mileage": 500000,
        }
    )
    assert result["predicted_price"] > 0
    assert result["in_training_distribution"] is False
    assert len(result["warnings"]) >= 2


@pytest.mark.parametrize(
    "bad_payload",
    [
        {"brand": "", "model": "Camry", "year": 2020, "mileage": 30000},
        {"brand": "Toyota", "model": "", "year": 2020, "mileage": 30000},
        {"brand": "Toyota", "model": "Camry", "year": 1850, "mileage": 30000},
        {"brand": "Toyota", "model": "Camry", "year": 2020, "mileage": -100},
        {"brand": "Toyota", "model": "Camry", "year": 2020, "mileage": 2_000_000},
    ],
)
def test_predict_rejects_invalid_inputs(
    predictor: VehiclePricePredictor, bad_payload: dict
) -> None:
    with pytest.raises(PredictionError):
        predictor.predict(bad_payload)
