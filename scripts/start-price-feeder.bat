@echo off
title AuctionChain - Chainlink Price Feed Feeder Daemon (Account 4)
cd /d "%~dp0..\blockchain"

echo ============================================================================
echo   Starting Autonomous Chainlink ETH/INR Price Feeder (Account 4)
echo ============================================================================
echo.

npx hardhat run scripts/priceFeedDaemon.js --network localhost
pause
