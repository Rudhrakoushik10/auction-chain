@echo off
title AuctionChain - [Terminal 3] Oracle Worker Daemon
cd /d "%~dp0.."

echo ============================================================================
echo   [Terminal 3] Starting AuctionChain Oracle Worker Daemon
echo   Listening to PriceOracle on http://127.0.0.1:8545 (Account #4 Signer)
echo ============================================================================
echo.

pushd oracle
python -m oracle.main
popd

echo.
echo ============================================================================
echo   Oracle Worker Daemon stopped.
echo ============================================================================
set /p DUMMY="Press ENTER to close this terminal window..."
