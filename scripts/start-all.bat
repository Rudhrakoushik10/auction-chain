@echo off
title AuctionChain - Launch All 4 Servers
cd /d "%~dp0"

echo ============================================================================
echo   Launching AuctionChain 4-Server Stack in Separate Terminal Windows...
echo ============================================================================
echo.

echo [1/4] Opening Terminal 1: Hardhat Blockchain Node (Port 8545)...
start "AuctionChain - [Terminal 1] Hardhat Blockchain" cmd /c "%~dp0start-blockchain.bat"

timeout /t 4 /nobreak >nul

echo [2/4] Opening Terminal 2: Vehicle Price AI Engine (Port 8000)...
start "AuctionChain - [Terminal 2] AI Backend" cmd /c "%~dp0start-backend.bat"

timeout /t 2 /nobreak >nul

echo [3/4] Opening Terminal 3: Oracle Worker Daemon...
start "AuctionChain - [Terminal 3] Oracle Worker" cmd /c "%~dp0start-oracle.bat"

timeout /t 2 /nobreak >nul

echo [4/4] Opening Terminal 4: Frontend DApp ^& Gateway (Port 3000)...
start "AuctionChain - [Terminal 4] Frontend DApp" cmd /c "%~dp0start-frontend.bat"

echo.
echo ============================================================================
echo   All 4 server terminals have been launched!
echo   Open http://localhost:3000 in your browser once servers are ready.
echo ============================================================================
echo.
set /p DUMMY="Press ENTER to close this launcher window..."
