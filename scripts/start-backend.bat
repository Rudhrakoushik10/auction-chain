@echo off
title AuctionChain - [Terminal 2] AI Indian Vehicle Valuation Engine (Port 8000)
cd /d "%~dp0.."

echo ============================================================================
echo   [Terminal 2] Starting AI Indian Vehicle Valuation Engine
echo   API URL: http://127.0.0.1:8000
echo ============================================================================
echo.

call npm run ai:server

echo.
echo ============================================================================
echo   AI Valuation Server stopped.
echo ============================================================================
set /p DUMMY="Press ENTER to close this terminal window..."
