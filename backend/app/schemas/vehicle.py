from pydantic import BaseModel, Field

class VehicleAttributes(BaseModel):
    brand: str
    model: str
    manufacturing_year: int = Field(..., ge=1995, le=2026)
    mileage_km: int = Field(..., ge=0)
    fuel_type: str
    transmission: str
    condition: str
    original_price_inr: int = Field(..., gt=0)

class VehiclePredictionRequest(BaseModel):
    category: str = "vehicle"
    attributes: VehicleAttributes
