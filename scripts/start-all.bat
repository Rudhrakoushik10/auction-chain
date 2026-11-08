@echo off
title AuctionChain - Launch All Servers
cd /d "%~dp0"

echo ============================================================================
echo   Launching AuctionChain Stack in Separate Terminal Windows...
echo ============================================================================
echo.

echo [1/3] Opening Terminal 1: Hardhat Blockchain Node (Port 8545)...
start "AuctionChain - [Terminal 1] Hardhat Blockchain" cmd /c "%~dp0start-blockchain.bat"

timeout /t 4 /nobreak >nul

echo [2/3] Opening Terminal 2: Vehicle Price AI Engine (Port 8000)...
start "AuctionChain - [Terminal 2] AI Backend" cmd /c "%~dp0start-backend.bat"

timeout /t 2 /nobreak >nul

echo [3/3] Opening Terminal 3: Frontend DApp ^& Gateway (Port 3000)...
start "AuctionChain - [Terminal 3] Frontend DApp" cmd /c "%~dp0start-frontend.bat"

echo.
echo ============================================================================
echo   All server terminals have been launched!
echo   Open http://localhost:3000 in your browser once servers are ready.
echo ============================================================================
echo.
set /p DUMMY="Press ENTER to close this launcher window..."
