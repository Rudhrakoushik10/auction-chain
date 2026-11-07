# AuctionChain — System Architecture

AuctionChain operates on a modular **4-Service Architecture**:

1. **Server 1 (`blockchain/`)**: Local Hardhat Ethereum node (`Chain ID 31337`, Port `8545`) with automated contract deployment (`scripts/startWithAutoDeploy.js`) for `PriceOracle.sol` and `Auction.sol`.
2. **Server 2 (`backend/`)**: LightGBM `v1.0.0` Vehicle Price Valuation Service (`src/api/main.py`) on Port `8000`, providing `GET /health` and `POST /predict`.
3. **Server 3 (`oracle/`)**: Autonomous Oracle Relayer signing integer cents valuations and canonical SHA-256 `productDataHash` digests onto `PriceOracle.sol` using Hardhat Account 4 (`0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65`).
4. **Server 4 (`frontend/` & `server.ts`)**: React 19 + TypeScript + Vite Web3 application on Port `3000` with Ethers.js v6 and MetaMask role-based account verification.
