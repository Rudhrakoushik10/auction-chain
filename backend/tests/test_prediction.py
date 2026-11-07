from app.schemas.vehicle import VehicleAttributes, VehiclePredictionRequest
from app.services.prediction_service import predict_vehicle_price


def test_predict_vehicle_price():
    req = VehiclePredictionRequest(
        category="vehicle",
        attributes=VehicleAttributes(
            brand="BMW",
            model="iX1 xDrive30 M Sport",
            manufacturing_year=2024,
            mileage_km=9200,
            fuel_type="Electric",
            transmission="Automatic",
            condition="Like New",
            original_price_inr=6690000,
        ),
    )
    result = predict_vehicle_price(req)
    assert result["category"] == "vehicle"
    assert result["model_version"] == "vehicle-v1"
    assert result["predicted_price_inr"] > 0
    assert result["predicted_price_paise"] == result["predicted_price_inr"] * 100
    assert result["product_data_hash"].startswith("0x")
