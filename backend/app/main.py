from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.prediction import router as prediction_router

app = FastAPI(
    title="AuctionChain Backend & Vehicle AI Valuation Service",
    version="1.0.0",
    description="Unified Backend REST API & Vehicle Resale Valuation Engine (vehicle-v1)",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(prediction_router, prefix="/api")


@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "service": "AuctionChain Backend & Vehicle AI Valuation Service",
        "category": "vehicle",
        "model_version": "vehicle-v1",
        "chainId": 31337,
    }
