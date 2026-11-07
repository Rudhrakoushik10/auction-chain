@echo off
title AuctionChain - [Terminal 1] Hardhat Blockchain Node (Port 8545)
cd /d "%~dp0.."

echo ============================================================================
echo   [Terminal 1] Starting Hardhat Node ^& Auto-Deploying Smart Contracts
echo   RPC URL: http://127.0.0.1:8545 ^| Chain ID: 31337
echo ============================================================================
echo.

pushd blockchain
if not exist "node_modules\@nomicfoundation\hardhat-ethers" (
    echo [Blockchain] Installing Hardhat Ethers plugins...
    call npm install
)
if not exist "node_modules\@openzeppelin\contracts" (
    echo [Blockchain] Installing OpenZeppelin Contracts v5...
    call npm install
)
call npm start
popd

echo.
echo ============================================================================
echo   Hardhat Blockchain Node stopped.
echo ============================================================================
set /p DUMMY="Press ENTER to close this terminal window..."
