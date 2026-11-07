@echo off
echo [Terminal 2] Starting AuctionChain Backend & Vehicle AI Engine (LightGBM v1.0.0) on Port 8000...
cd backend
uvicorn src.api.main:app --reload --port 8000
