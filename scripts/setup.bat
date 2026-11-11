@echo off
title AuctionChain - Environment Setup
cd /d "%~dp0.."

echo ============================================================================
echo   AuctionChain - Local Environment Setup
echo   (Web3 Frontend, AI Vehicle Valuation Engine, Hardhat Node ^& Price Oracle)
echo ============================================================================
echo.

if not exist ".env" (
    if exist ".env.example" (
        echo [Setup] Creating .env from .env.example...
        copy /Y ".env.example" ".env" >nul
        echo [Setup] Created .env file.
        echo.
    )
)

echo [1/2] Installing Root Application ^& AI Valuation dependencies...
call npm install
if errorlevel 1 (
    echo [WARNING] Root npm install reported an issue. Retrying with --legacy-peer-deps...
    call npm install --legacy-peer-deps
)
echo.

echo [2/2] Installing Hardhat Blockchain ^& Smart Contract dependencies...
pushd blockchain
call npm install
if errorlevel 1 (
    echo [WARNING] Blockchain npm install reported an issue. Retrying with --legacy-peer-deps...
    call npm install --legacy-peer-deps
)
popd
echo.

echo ============================================================================
echo   Setup Complete! All dependencies are installed.
echo   Next step:
echo     1. Open the .env file and set your GEMINI_API_KEY
echo     2. Run scripts\start-all.bat
echo ============================================================================
echo.
set /p DUMMY="Press ENTER to close this terminal window..."
