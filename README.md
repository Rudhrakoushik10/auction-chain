# AuctionChain — Decentralized Vehicle Sealed-Bid Auction Platform

**Predict · Bid · Verify**

AuctionChain is a decentralized vehicle auction platform combining LightGBM machine-learning resale valuation (`v1.0.0`), two-phase Keccak-256 commit-reveal bidding (`Auction.sol`), and a live Chainlink-compatible ETH/INR Price Feed Oracle (`PriceOracle.sol`) on the Ethereum Hardhat local network (Chain ID: `31337`).

> 📋 **Active Project Tracker**: See [PROJECT_TRACKER.md](./PROJECT_TRACKER.md) for live work logs, completed components, strict architectural invariants, and the pending development backlog.

---

## System Architecture

The platform is organized into three core modules:

```text
AuctionChain/
│
├── blockchain/         # Server 1: Hardhat Node + Automated Contract Deployment (Port 8545)
├── backend/            # Server 2: LightGBM v1.0.0 Vehicle Price Prediction Service (Port 8000)
└── frontend/           # Server 3: React 19 + TypeScript + Vite Web3 Client (Port 3000)
```

---

## Service Overview

| Terminal | Service | Directory | Port | Start Command | Description |
|:---|:---|:---|:---|:---|:---|
| **Terminal 1** | **Blockchain & Auto-Deploy** | `blockchain/` | `8545` (Chain ID 31337) | `npm start` | Boots Hardhat node and automatically deploys `Auction.sol` and syncs contract addresses. |
| **Terminal 2** | **Vehicle Valuation Engine** | `backend/` | `8000` | `uvicorn src.api.main:app --port 8000 --reload` | FastAPI service serving the trained LightGBM `v1.0.0` (`regression_l1`, 934 trees) US-market vehicle price prediction model (`GET /health`, `POST /predict`). |
| **Terminal 3** | **Web3 Frontend & API Gateway** | `./` or `frontend/` | `3000` | `npm run dev` | Web3 client with role-based workspaces (Admin, Seller, Bidder 1, Bidder 2) and integrated API proxy. |

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

### 3. Terminal 3 (Web Application)
```bash
npm install
npm run dev
```
Open `http://localhost:3000` in your browser (or run `scripts\start-all.bat` on Windows to launch all servers automatically).

---

## Currency & Valuation Display Convention (Indian Rupees — ₹ / INR)

- **AI Model Raw Output vs. Frontend Display**:
  - The underlying `LightGBM v1.0.0` vehicle valuation model (`backend/models/vehicle_price_model.txt`) was trained on 4,009 used-car listings and computes raw predictions in US Dollars (`USD`).
  - **Throughout the entire frontend application, all fiat monetary valuations are converted and displayed exclusively in Indian Rupees (`₹` / `INR`, `en-IN` locale)** using a deterministic conversion rate (`1 USD = ₹84 INR`, with integer subunits displayed in `paise = INR × 100`).
- **On-Chain Bidding & Live ETH-to-INR Display**:
  - All auction bids, reserve prices, and uniform sealed-bid collateral deposits on `SealedAuction.sol` are denominated and settled in **Test ETH** on the local Hardhat Ethereum network (Chain ID `31337`).
  - **Everywhere Test ETH is entered or displayed across the website** (including live input fields for Starting Bid, Seller Reserve, Fixed Collateral Deposit, Confidential Commit Bid, and Reveal Bid, as well as auction cards, dashboards, and wallet balances), its equivalent value in **Indian Rupees (`₹` / `INR`, at `1 ETH = ₹2,50,000 INR`)** is calculated and shown in real time alongside the ETH amount.

## Dev Bypass Login & Architecture Simplification

- **⚡ Quick Dev Bypass (Development & Debugging)**:
  - For rapid testing and demo purposes without waiting for MetaMask extension approval popups, click **"⚡ Bypass Login (Seller)"** inside the Connect Wallet modal.
  - This activates **Account #1 (Seller)** with 10,000 ETH test balance in 1 click, allowing immediate access to creating auctions, committing bids, and managing settlements.
  - Role switching in the header remains instant and prompt-free across all preconfigured Hardhat accounts.
- **Direct Auction Architecture (No Intermediary Oracle Required)**:
  - The AI model computes the vehicle resale valuation as an advisory benchmark displayed in Indian Rupees (`₹` / `INR`).
  - Sellers directly configure starting bid, reserve price, and fixed collateral deposit in Test ETH and deploy straight to `SealedAuction.sol` without requiring an intermediary Oracle smart contract transaction. All auction bidding, reveal verification, reserve checks, and escrow settlements are executed deterministically on `SealedAuction.sol`.

---

## MetaMask Connection & Nonce Reset Note

- **Single Initial Authorization**: MetaMask prompts for connection authorization only once when clicking **Connect Wallet** at startup. Switching between **Admin (Account #0)**, **Seller (Account #1)**, **Bidder 1 (Account #2)**, and **Bidder 2 (Account #3)** in the top-right account switcher happens instantaneously without requiring repeated MetaMask authorization popups.
- **When Restarting Terminal 1 (Hardhat Node)**: If Terminal 1 is closed and reopened, Hardhat resets its block height and account nonces back to `0`. Either click **"Auto-Sync Hardhat Nonce Now"** in the frontend diagnostic banner, or in MetaMask go to **Settings → Developer Tools → Click on "Delete activity and nonce data"**.

