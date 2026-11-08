@echo off
title AuctionChain - Price Oracle Daemon (Account 4)
cd /d "%~dp0..\blockchain"

echo ============================================================================
echo   Starting Autonomous Price Oracle (ETH/INR) Daemon (Account 4)
echo ============================================================================
echo.

set HARDHAT_DISABLE_TELEMETRY=true
set CI=true

call npx hardhat run scripts/priceFeedDaemon.js --network localhost

if errorlevel 1 (
    echo.
    echo ============================================================================
    echo [ERROR] Price Oracle daemon exited.
    echo.
    echo Common reasons:
    echo   1. Blockchain node is not running on http://127.0.0.1:8545
    echo      ^> Make sure you run scripts\start-blockchain.bat first!
    echo   2. Contracts are not deployed yet
    echo      ^> Wait for '[Auto-Deploy] Smart contracts successfully deployed!' in Terminal 1.
    echo ============================================================================
)

echo.
echo Press any key to close this terminal window...
pause >nul
