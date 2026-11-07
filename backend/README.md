# AuctionChain Backend & AI Engine Service (Terminal 2)

Houses the unified backend REST API and the Machine Learning valuation engine for vehicle sealed-bid auctions.

## Features
- **FastAPI Server** (`app/main.py`) running on port `8000`.
- **Vehicle AI Valuation Engine** (`artifacts/vehicle_model.joblib`) with pre-trained regression pipeline.
- Canonical Keccak-256 / SHA-256 data hashing matching `PriceOracle.sol`.
- Confidence intervals, feature engineering, and data preprocessing.

## Key Endpoints
- `GET  /api/health` — Microservice and model health status.
- `POST /api/predict-price` — Vehicle feature input, price prediction in INR (`₹`), and verification hash.
- `GET  /api/model-metadata` — Model architecture, R² accuracy (91.8%), and feature importances.

## How to Run (Terminal 2)
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
