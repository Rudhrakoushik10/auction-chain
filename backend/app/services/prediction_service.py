import hashlib
import json
import time
from app.schemas.vehicle import VehiclePredictionRequest

def predict_vehicle_price(req: VehiclePredictionRequest) -> dict:
    attrs = req.attributes.dict()
    canonical = json.dumps({"category": "vehicle", **{k: str(v).lower() if isinstance(v, str) else v for k, v in sorted(attrs.items())}}, separators=(",", ":"))
    digest = "0x" + hashlib.sha256(canonical.encode("utf-8")).hexdigest()
    age = max(0, 2026 - attrs["manufacturing_year"])
    age_factor = 0.87 ** age
    mileage_factor = max(0.55, 1.0 - (attrs["mileage_km"] / 10000.0) * 0.024)
    predicted_inr = int(round((attrs["original_price_inr"] * age_factor * mileage_factor * 0.85) / 500.0) * 500)
    return {
        "category": "vehicle",
        "predicted_price_inr": predicted_inr,
        "predicted_price_paise": predicted_inr * 100,
        "currency": "INR",
        "model_version": "vehicle-v1",
        "prediction_timestamp": int(time.time()),
        "product_data_hash": digest,
    }
