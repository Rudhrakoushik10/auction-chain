@echo off
title AuctionChain - [Terminal 2] Vehicle Price AI Engine (Port 8000)
cd /d "%~dp0.."

echo ============================================================================
echo   [Terminal 2] Starting AuctionChain Vehicle Price AI Engine (LightGBM v1.0.0)
echo   API URL: http://127.0.0.1:8000
echo ============================================================================
echo.

pushd backend
python -m uvicorn src.api.main:app --reload --port 8000
popd

echo.
echo ============================================================================
echo   AI Backend Server stopped.
echo ============================================================================
set /p DUMMY="Press ENTER to close this terminal window..."
