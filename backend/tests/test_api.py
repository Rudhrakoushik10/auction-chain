"""End-to-end tests for the FastAPI service (lifespan-aware)."""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from src.api.main import app

PAYLOAD = {
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


@pytest.fixture(scope="module")
def client() -> TestClient:
    with TestClient(app) as test_client:
        yield test_client


def test_health_reports_loaded_model(client: TestClient) -> None:
    response = client.get("/health")

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["model_loaded"] is True
    assert body["algorithm"] == "lightgbm"
    assert body["model_version"] == "1.0.0"


def test_predict_success(client: TestClient) -> None:
    response = client.post("/predict", json=PAYLOAD)

    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert body["currency"] == "USD"
    assert body["prediction_unit"] == "vehicle"
    assert body["predicted_price"] > 0
    assert body["in_training_distribution"] is True
    assert body["warnings"] == []
    assert body["inference_ms"] >= 0


def test_predict_with_required_fields_only(client: TestClient) -> None:
    response = client.post(
        "/predict",
        json={
            "brand": "Tesla",
            "model": "Model 3 Long Range",
            "year": 2022,
            "mileage": 15000,
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["predicted_price"] > 0
    assert body["warnings"], "missing optional fields should produce warnings"


def test_predict_flags_unsupported_vehicle(client: TestClient) -> None:
    response = client.post(
        "/predict",
        json={"brand": "UnknownBrand", "model": "Mystery", "year": 2010, "mileage": 100000},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["predicted_price"] > 0
    assert body["in_training_distribution"] is False
    assert any("Unsupported brand" in warning for warning in body["warnings"])


def test_clean_title_is_compatible_and_neutral(client: TestClient) -> None:
    base = client.post("/predict", json={**PAYLOAD, "clean_title": True}).json()
    without = client.post("/predict", json={**PAYLOAD, "clean_title": False}).json()
    dataset_style = client.post("/predict", json={**PAYLOAD, "clean_title": "Yes"}).json()

    assert base["predicted_price"] == without["predicted_price"]
    assert base["predicted_price"] == dataset_style["predicted_price"]


def test_boolean_fields_accept_dataset_style_strings(client: TestClient) -> None:
    reported = client.post(
        "/predict", json={**PAYLOAD, "accident_history": "Yes", "clean_title": "Yes"}
    )
    clean = client.post(
        "/predict", json={**PAYLOAD, "accident_history": "No", "clean_title": "No"}
    )
    unknown = client.post(
        "/predict", json={**PAYLOAD, "accident_history": "Unknown", "clean_title": None}
    )

    assert reported.status_code == 200
    assert clean.status_code == 200
    assert unknown.status_code == 200


def test_predict_rejects_missing_required_field(client: TestClient) -> None:
    payload = dict(PAYLOAD)
    payload.pop("brand")

    response = client.post("/predict", json=payload)

    assert response.status_code == 422


def test_predict_rejects_extra_fields(client: TestClient) -> None:
    response = client.post("/predict", json={**PAYLOAD, "unknown_field": "value"})

    assert response.status_code == 422


@pytest.mark.parametrize(
    "override",
    [
        {"year": 1800},
        {"mileage": -1},
        {"mileage": 2_000_000},
        {"year": 2100},
        {"brand": ""},
    ],
)
def test_predict_rejects_invalid_values(client: TestClient, override: dict) -> None:
    response = client.post("/predict", json={**PAYLOAD, **override})

    assert response.status_code == 422


def test_no_dataset_endpoint_is_exposed(client: TestClient) -> None:
    for path in ["/dataset", "/data", "/training-data"]:
        assert client.get(path).status_code == 404
