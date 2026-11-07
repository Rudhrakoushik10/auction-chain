# AuctionChain — AI-Powered Decentralized Vehicle Sealed-Bid Auction Platform

**Predict · Bid · Verify**

AuctionChain is a production-grade decentralized vehicle auction platform featuring machine learning price prediction, sealed-bid cryptographic commit-reveal bidding, and on-chain Oracle verification on the Ethereum Hardhat local network (Chain ID: 31337).

---

## 4-Server Live Demonstration Architecture

The platform runs across **4 continuously running servers/terminals**. The smart contract deployment has been automated directly into Terminal 1, completely eliminating the need for a 5th manual terminal:

```
AuctionChain/
│
├── blockchain/         # Server 1: Hardhat Node + Automated Contract Deployment (Port 8545)
├── backend/            # Server 2: Unified Backend API + Vehicle AI Engine (Port 8000)
├── oracle/             # Server 3: Autonomous Oracle Worker Daemon
└── frontend/           # Server 4: React + Vite Web Client (Port 3000)
```

---

## Server & Terminal Breakdown

| Terminal | Service | Folder | Port | Start Command | Description |
|:---|:---|:---|:---|:---|:---|
| **Terminal 1** | **Blockchain & Auto-Deploy** | `blockchain/` | `8545` (Chain ID 31337) | `npm start` | Boots Hardhat node and **automatically deploys** `PriceOracle.sol` & `Auction.sol`, configures Oracle Account 4, and syncs contract addresses without a separate terminal. |
| **Terminal 2** | **Backend & AI Engine** | `backend/` | `8000` | `uvicorn app.main:app --port 8000 --reload` | FastAPI service combining backend REST endpoints and the trained CatBoost/GBM vehicle valuation model (`vehicle-v1`). |
| **Terminal 3** | **Oracle Worker Server** | `oracle/` | Daemon | `python oracle/main.py` | Event listener that listens for auctions, fetches AI valuations from the backend, and commits signed predictions to `PriceOracle.sol` using Account 4. |
| **Terminal 4** | **Frontend Application** | `frontend/` | `3000` | `npm run dev` | Modern Web3 user interface with pre-login landing catalog, role switcher (Admin, Seller, Bidder 1, Bidder 2), and dark blockchain theme. |

---

## Step-by-Step Demonstration Startup

### 1. Terminal 1 (Blockchain + Auto-Deploy)
```bash
cd blockchain
npm install
npm start
```
*Note: `npm start` (or `npm run node:auto`) launches the local node AND automatically deploys all contracts as soon as the node is live.*

### 2. Terminal 2 (Backend & AI Engine)
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Terminal 3 (Oracle Worker Server)
```bash
cd oracle
pip install -r requirements.txt
python oracle/main.py
```

### 4. Terminal 4 (Web Frontend)
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:3000` in your browser.
