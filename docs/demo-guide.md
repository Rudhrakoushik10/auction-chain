# AuctionChain — 4-Server Live Demo Guide (With Automated Smart Contract Deployment)

## Role Account Structure (Hardhat Local Node — Chain ID 31337)
The platform strictly uses five deterministic Hardhat accounts:

| Account | Role | Responsibility | Deterministic Hardhat Address | Default Private Key |
|---|---|---|---|---|
| **Account 0** | **Admin** | Deploy contracts, configure PriceOracle, platform monitoring | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` | `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80` |
| **Account 1** | **Seller** | Create vehicle sealed-bid auctions & set reserve price | `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` | `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d` |
| **Account 2** | **Bidder 1** | Submit commit hash, deposit collateral, reveal bid | `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC` | `0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a` |
| **Account 3** | **Bidder 2** | Competing bidder: submit commit hash, deposit collateral, reveal bid | `0x90F79bf6EB2c4f870365E785982E1f101E93b906` | `0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6` |
| **Account 4** | **Oracle** | Submit AI valuation predictions on-chain (Background service only) | `0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65` | `0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a` |

---

## 4-Server Architecture Execution

### Server 1: Blockchain Node + Automated Contract Deployment (`blockchain/`)
```bash
scripts/start-blockchain.bat
# Equivalent to:
cd blockchain && npm start
```
*Boots Hardhat local network on `http://127.0.0.1:8545` (Chain ID 31337) and **automatically** deploys `PriceOracle.sol` (with Account 4 authorized) and `Auction.sol`, writing addresses to `frontend/src/contracts/contractAddresses.json`.*

### Server 2: Backend API & Vehicle AI Valuation Engine (`backend/`)
```bash
scripts/start-backend.bat
# Equivalent to:
cd backend && uvicorn app.main:app --reload --port 8000
```
*Serves FastAPI endpoints (`/api/predict-price` and `/api/health`) powered by the `vehicle-v1` ML valuation pipeline.*

### Server 3: Autonomous Oracle Server (`oracle/`)
```bash
scripts/start-oracle.bat
# Equivalent to:
cd oracle && python -m oracle.main
```
*Listens for vehicle auction events, queries the `backend` AI valuation service, and signs predictions onto `PriceOracle.sol` using Account 4 (`0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65`).*

### Server 4: Frontend Web Application (`frontend/`)
```bash
scripts/start-frontend.bat
# Equivalent to:
cd frontend && npm run dev
```
*Runs the React + TypeScript + Vite Web3 interface on `http://localhost:3000`.*
