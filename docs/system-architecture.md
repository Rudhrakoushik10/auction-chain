# AuctionChain — System Architecture

AuctionChain operates on a clean **4-Server Architecture**:

1. **Server 1 (`blockchain/`)**: Local Hardhat Ethereum node (`Chain ID 31337`, Port `8545`) with built-in automated deployment (`scripts/startWithAutoDeploy.js`) for `PriceOracle.sol` and `Auction.sol`.
2. **Server 2 (`backend/`)**: Unified FastAPI Backend & Vehicle Resale Valuation Engine (`vehicle-v1`) on Port `8000`. Also includes a deterministic client-side mock fallback (`frontend/src/services/mock/mockAIService.ts`) when running offline.
3. **Server 3 (`oracle/`)**: Autonomous Oracle Server signing `predictedPricePaise` and `productDataHash` onto `PriceOracle.sol` using Hardhat Account 4 (`0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65`).
4. **Server 4 (`frontend/`)**: React 19 + TypeScript + Vite Web3 DApp on Port `3000` with Ethers.js v6 and MetaMask role-based switching.
