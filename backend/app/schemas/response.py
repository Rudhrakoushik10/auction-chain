from pydantic import BaseModel

class VehiclePredictionResponse(BaseModel):
    category: str
    predicted_price_inr: int
    predicted_price_paise: int
    currency: str
    model_version: str
    prediction_timestamp: int
    product_data_hash: str
