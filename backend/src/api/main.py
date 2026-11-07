"""FastAPI service exposing the vehicle price model.

Start locally:

    uvicorn src.api.main:app --host 127.0.0.1 --port 8000

The model is loaded once during application startup and reused for every
request.  No training data is exposed by any endpoint.
"""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import Depends, FastAPI, HTTPException, Request

import config
from src.api.schemas import HealthResponse, PredictionResponse, VehiclePredictionRequest
from src.prediction.predictor import PredictionError, VehiclePricePredictor

logger = logging.getLogger("vehicle_price_api")
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    app.state.predictor = None
    app.state.load_error = None
    try:
        predictor = VehiclePricePredictor()
        app.state.predictor = predictor
        logger.info(
            "Loaded %s model version %s in %.1f ms",
            predictor.algorithm,
            predictor.model_version,
            predictor.load_seconds * 1000,
        )
    except Exception as error:  # keep /health reachable for diagnostics
        app.state.load_error = str(error)
        logger.exception("Failed to load the vehicle price model")
    yield
    app.state.predictor = None


app = FastAPI(
    title="AuctionChain Vehicle Price Prediction API",
    version=config.MODEL_VERSION,
    description=(
        "Advisory vehicle market-value estimation for AuctionChain listings. "
        "Predictions are estimates, not guaranteed sale prices, and never "
        "execute blockchain transactions."
    ),
    lifespan=lifespan,
)


def get_predictor(request: Request) -> VehiclePricePredictor:
    predictor = getattr(request.app.state, "predictor", None)
    if predictor is None:
        error = getattr(request.app.state, "load_error", None)
        raise HTTPException(
            status_code=503,
            detail=f"Model is not loaded. {error}" if error else "Model is not loaded.",
        )
    return predictor


@app.get("/health", response_model=HealthResponse, tags=["service"])
def health(request: Request) -> HealthResponse:
    predictor = getattr(request.app.state, "predictor", None)
    if predictor is None:
        return HealthResponse(
            status="degraded",
            model_loaded=False,
            load_error=getattr(request.app.state, "load_error", None),
        )
    return HealthResponse(
        status="ok",
        model_loaded=True,
        model_version=predictor.model_version,
        algorithm=predictor.algorithm,
    )


@app.post("/predict", response_model=PredictionResponse, tags=["prediction"])
def predict(
    payload: VehiclePredictionRequest,
    predictor: VehiclePricePredictor = Depends(get_predictor),
) -> PredictionResponse:
    try:
        result = predictor.predict(payload.model_dump())
    except PredictionError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
    except Exception as error:  # pragma: no cover - defensive
        logger.exception("Prediction failed")
        raise HTTPException(
            status_code=500, detail="Prediction failed due to an internal error."
        ) from error

    return PredictionResponse(
        success=True,
        predicted_price=result["predicted_price"],
        currency=result["currency"],
        model_version=result["model_version"],
        prediction_unit="vehicle",
        in_training_distribution=result["in_training_distribution"],
        warnings=result["warnings"],
        inference_ms=result["inference_ms"],
    )
