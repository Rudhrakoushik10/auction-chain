# AuctionChain — Complete Local Setup & Demonstration Guide

> **Stack**: Hardhat Local Node (EVM Port 8545) + FastAPI LightGBM AI Service (Port 8000) + React 19 Web3 Frontend (Port 3000)

---

## 1. Prerequisites

Ensure you have the following installed on your machine:
- **Node.js**: v18+ or v20+ (`node -v`)
- **npm**: v9+ (`npm -v`)
- **Python**: 3.9+ or 3.10+ (`python --version`)
- **Git** (optional, for cloning)
- **MetaMask Browser Extension** (optional — not required if using the built-in **1-Click Dev Bypass**)

---

## 2. Local Environment Installation (One-Time Setup)

### Quick Setup (Windows)
Run the automated setup script from the project root:
```cmd
scripts\setup.bat
```

### Manual Setup (Cross-Platform: Windows / macOS / Linux)

#### Step 1: Install Blockchain & Hardhat Dependencies
```bash
cd blockchain
npm install
cd ..
```

#### Step 2: Install Python AI Backend Dependencies
```bash
cd backend
pip install -r requirements.txt
cd ..
```

#### Step 3: Install Frontend Dependencies
```bash
cd frontend
npm install
cd ..
```

---

## 3. Starting the Services

You need 3 processes running simultaneously.

### Option A: 1-Click Launch (Windows)
Double-click or run:
```cmd
scripts\start-all.bat
```
*This opens 3 dedicated command prompt windows and starts each service in sequence.*

---

### Option B: Manual Launch (3 Separate Terminals)

#### Terminal 1: Hardhat EVM Blockchain Node (Port 8545)
```bash
cd blockchain
npm start
```
*Output*: Starts local EVM node at `http://127.0.0.1:8545` (Chain ID `31337`), deploys `PriceOracle.sol` and `Auction.sol`, and writes deployed addresses to `frontend/src/contracts/contractAddresses.json`.

#### Terminal 2: FastAPI AI Valuation Microservice (Port 8000)
```bash
cd backend
uvicorn src.api.main:app --port 8000 --reload
```
*Output*: LightGBM model loaded into memory, serving valuation API at `http://127.0.0.1:8000/docs`.

#### Terminal 3: React Web3 Application (Port 3000)
```bash
# In the project root or frontend directory:
npm run dev
```
*Output*: Vite dev server listening at `http://localhost:3000`.

---

## 4. End-to-End Demo Script (5-Minute Walkthrough)

Open your browser and navigate to: **`http://localhost:3000`**

### Step 1: 1-Click Dev Bypass Login
1. Click **Connect Wallet** in the top-right corner.
2. In the modal, click the blue button:
   👉 **⚡ Quick Dev Bypass (Seller Account #1)**
3. You are instantly logged in as **Seller (0x7099...79C8)** with 10,000 ETH — **no MetaMask popups required!**
4. Notice the header displays:
   - Green pulsing badge: **`Chainlink ETH/INR: ₹2,50,000`**
   - Active account badge with balance and role.

---

### Step 2: Create a Sealed-Bid Auction with AI Valuation
1. Click **Create Auction** in the top navigation.
2. **Step 1 — Vehicle Specs**:
   - Select or customize details (e.g., 2021 BMW 3 Series, 35,000 km, Good condition, Petrol).
   - Click **Next: Run AI Valuation**.
3. **Step 2 — AI Prediction (INR)**:
   - The dApp calls the FastAPI LightGBM microservice.
   - Observe the predicted market value displayed in Indian Rupees (e.g., `₹28,50,000 INR`) along with confidence intervals.
   - Click **Next: Set Auction Terms**.
4. **Step 3 — Auction Parameters**:
   - Set Starting Price (e.g., `10.00 ETH` — automatically shows `₹25,00,000 INR`).
   - Set Reserve Price (e.g., `11.50 ETH` — automatically shows `₹28,75,000 INR`).
   - Deposit amount defaults to `0.10 ETH` (`₹25,000 INR`).
   - Phase durations: Commit Phase (e.g. 10 mins), Reveal Phase (e.g. 10 mins).
   - Click **Next: Review & Deploy**.
5. **Step 4 — Review & Deploy**:
   - Click **Deploy Auction to Blockchain**.
   - The contract creates the auction on `SealedAuction.sol`.

---

### Step 3: Switch to a Bidder Account & Submit a Sealed Bid
1. Click on your wallet badge in the header -> Click **Switch Role**.
2. Select **Bidder 1 — Alice (Account #2)**.
3. Click on the auction lot you just created.
4. Click **Submit Sealed Commitment**:
   - Enter your secret bid (e.g., `12.50 ETH` / `₹31,25,000 INR`).
   - The dApp automatically generates a cryptographic secret salt.
   - Computes Keccak-256 hash: `keccak256(abi.encode(auctionId, aliceAddress, bidAmount, salt))`.
   - Sends the 0.1 ETH fixed collateral deposit.
   - alice's commitment is securely recorded on-chain while keeping the bid amount private.

---

### Step 4: Competing Bidder (Bidder 2 — Bob)
1. Switch role to **Bidder 2 — Bob (Account #3)**.
2. Submit a competing sealed bid (e.g., `13.00 ETH` / `₹32,50,000 INR`).
3. Deposit 0.1 ETH collateral. Bob's hash is registered on-chain.

---

### Step 5: Reveal Phase & Settlement
1. When the Commit Phase timer expires, the auction enters the **Reveal Phase**.
2. Bidders reveal their bids by supplying their secret salt.
3. The smart contract validates `keccak256(...) == storedHash`:
   - Bob's 13.00 ETH bid beats Alice's 12.50 ETH bid.
   - Alice receives her 0.1 ETH deposit back immediately.
   - Bob wins the vehicle lot!
   - Seller receives the winning settlement funds.

---

### Step 6: Inspect Chainlink Price Feed Oracle in Admin Console
1. Switch role to **Administrator (Account #0)**.
2. In the header, click **Admin Console**.
3. Click the **Chainlink Price Feed** tab:
   - View live round metadata: **Round #1**, Decimals: **8**, Description: `"ETH / INR Price Feed"`.
   - **Simulate Price Fluctuation**: Click a quick preset like **`₹2.75L`** (or type a custom rate) and click **Push Oracle Round**.
   - Notice the live round updates to Round #2 and all ETH values across the platform instantly recalculate with the new live rate!

---

## 5. Troubleshooting & Tips

- **Resetting Blockchain State**: If you restart the Hardhat node, simply run `npm start` in `blockchain/` to re-deploy contracts and sync addresses.
- **Nonce Mismatch**: If you use MetaMask and reset the Hardhat node, click the in-app **Clear Stale Nonce** button or reset your account in MetaMask (*Settings -> Advanced -> Clear activity tab data*).
- **FastAPI Documentation**: View interactive Swagger docs at `http://127.0.0.1:8000/docs`.
