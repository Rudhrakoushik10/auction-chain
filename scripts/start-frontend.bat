@echo off
title AuctionChain - [Terminal 4] Frontend DApp ^& Gateway (Port 3000)
cd /d "%~dp0.."

echo ============================================================================
echo   [Terminal 4] Starting AuctionChain Frontend DApp ^& API Gateway
echo   App URL: http://localhost:3000
echo ============================================================================
echo.

call npm run dev

echo.
echo ============================================================================
echo   Frontend Server stopped.
echo ============================================================================
set /p DUMMY="Press ENTER to close this terminal window..."
