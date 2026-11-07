@echo off
echo [Terminal 2] Starting AuctionChain Backend & Vehicle AI Engine on Port 8000...
cd backend
uvicorn app.main:app --reload --port 8000
