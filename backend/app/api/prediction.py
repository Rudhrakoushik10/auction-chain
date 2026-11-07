from fastapi import APIRouter
from app.schemas.vehicle import VehiclePredictionRequest
from app.schemas.response import VehiclePredictionResponse
from app.services.prediction_service import predict_vehicle_price

router = APIRouter()

@router.post("/predict-price", response_model=VehiclePredictionResponse)
def predict_price_endpoint(payload: VehiclePredictionRequest):
    return predict_vehicle_price(payload)
