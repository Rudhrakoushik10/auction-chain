# AuctionChain — Decentralized Vehicle Sealed-Bid Auction Platform

**Predict · Bid · Verify**

AuctionChain is a decentralized vehicle auction platform combining LightGBM machine-learning resale valuation (`v1.0.0`), two-phase Keccak-256 commit-reveal bidding (`Auction.sol`), and on-chain Oracle attestation (`PriceOracle.sol`) on the Ethereum Hardhat local network (Chain ID: `31337`).

---

## System Architecture

The platform is organized into four core modules:

```text
AuctionChain/
│
├── blockchain/         # Server 1: Hardhat Node + Automated Contract Deployment (Port 8545)
├── backend/            # Server 2: LightGBM v1.0.0 Vehicle Price Prediction Service (Port 8000)
├── oracle/             # Server 3: Autonomous Oracle Relayer Service (Account 4)
└── frontend/           # Server 4: React 19 + TypeScript + Vite Web3 Client (Port 3000)
```

---

## Service Overview

| Terminal | Service | Directory | Port | Start Command | Description |
|:---|:---|:---|:---|:---|:---|
| **Terminal 1** | **Blockchain & Auto-Deploy** | `blockchain/` | `8545` (Chain ID 31337) | `npm start` | Boots Hardhat node and automatically deploys `PriceOracle.sol` & `Auction.sol`, authorizes Oracle Account 4, and syncs contract addresses. |
| **Terminal 2** | **Vehicle Valuation Engine** | `backend/` | `8000` | `uvicorn src.api.main:app --port 8000 --reload` | FastAPI service serving the trained LightGBM `v1.0.0` (`regression_l1`, 934 trees) US-market vehicle price prediction model (`GET /health`, `POST /predict`). |
| **Terminal 3** | **Oracle Worker Service** | `oracle/` | Daemon | `python -m oracle.main` | Event listener that fetches advisory valuations from the backend and commits signed predictions to `PriceOracle.sol` using Account 4. |
| **Terminal 4** | **Web3 Frontend & API Gateway** | `./` or `frontend/` | `3000` | `npm run dev` | Web3 client with role-based workspaces (Admin, Seller, Bidder 1, Bidder 2) and integrated API proxy. |

---

## Step-by-Step Local Startup

### 1. Terminal 1 (Blockchain + Auto-Deploy)
```bash
cd blockchain
npm install
npm start
```

### 2. Terminal 2 (Backend LightGBM Valuation Service)
```bash
cd backend
pip install -r requirements.txt
uvicorn src.api.main:app --host 127.0.0.1 --port 8000 --reload
```

### 3. Terminal 3 (Oracle Worker Service)
```bash
cd oracle
pip install -r requirements.txt
python -m oracle.main
```

### 4. Terminal 4 (Web Application)
```bash
npm install
npm run dev
```
Open `http://localhost:3000` in your browser.
