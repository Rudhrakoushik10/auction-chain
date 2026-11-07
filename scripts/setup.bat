@echo off
title AuctionChain - Environment Setup
cd /d "%~dp0.."

echo ============================================================================
echo   AuctionChain - Setting Up 4-Server Environment
echo   (Root Gateway, Hardhat Blockchain, AI Backend, Oracle, and Frontend)
echo ============================================================================
echo.

echo [1/5] Installing Root Gateway dependencies...
call npm install
if errorlevel 1 (
    echo [WARNING] Root npm install reported an issue. Retrying with --legacy-peer-deps...
    call npm install --legacy-peer-deps
)
echo.

echo [2/5] Installing Hardhat Blockchain dependencies...
pushd blockchain
call npm install
if errorlevel 1 (
    echo [WARNING] Blockchain npm install reported an issue. Retrying with --legacy-peer-deps...
    call npm install --legacy-peer-deps
)
popd
echo.

echo [3/5] Installing Python AI Backend dependencies (LightGBM v1.0.0)...
pushd backend
pip install -r requirements.txt
popd
echo.

echo [4/5] Installing Python Oracle Worker dependencies...
pushd oracle
pip install -r requirements.txt
popd
echo.

echo [5/5] Installing Frontend dependencies...
pushd frontend
call npm install
if errorlevel 1 (
    echo [WARNING] Frontend npm install reported an issue. Retrying with --legacy-peer-deps...
    call npm install --legacy-peer-deps
)
popd
echo.

echo ============================================================================
echo   Setup Complete! All dependencies are installed.
echo ============================================================================
echo.
set /p DUMMY="Press ENTER to close this terminal window..."
