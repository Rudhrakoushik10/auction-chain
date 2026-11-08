# AuctionChain — Project Tracker & Development Lifecycle

> **Single Source of Truth** for architecture decisions, completed work, active invariants, and pending backlog.
> **Last Updated**: November 8, 2026 (Local App Time)

---

## 1. Project Mission & System Architecture

AuctionChain is a decentralized, fair sealed-bid commit-reveal vehicle auction dApp with AI-powered resale valuation and a live Chainlink-compatible on-chain ETH/INR price feed oracle.

### System Components (3-Server Topology)
1. **Local EVM Blockchain Node**:
   - Running Hardhat Network (`Chain ID 31337`) at `http://127.0.0.1:8545`.
   - Pre-funded accounts (10,000 ETH each):
     - **Account 0** (`0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`): Platform Administrator & Contract Owner.
     - **Account 1** (`0x70997970C51812dc3A010C7d01b50e0d17dc79C8`): Primary Seller (Dev Bypass Default).
     - **Account 2** (`0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC`): Bidder 1 (Alice).
     - **Account 3** (`0x90F79bf6EB2c0d804191F73244F400557027DD70`): Bidder 2 (Bob).
     - **Account 4** (`0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65`): Price Oracle Feeder (Pushes live ETH/INR exchange rates).
2. **AI Valuation Inference Microservice**:
   - Located in `/backend/src/api/main.py` at `http://localhost:8000`.
   - LightGBM `v1.0.0` model (`R² = 0.7615`, `MAE = ₹9,484.57`, trained on 4,009 vehicle records).
   - Predicts vehicle market valuation in Indian Rupees (INR) with confidence intervals based on year, mileage, make, model, condition, fuel, transmission, and state.
3. **Web3 Frontend**:
   - React 19 + TypeScript + Vite + Tailwind CSS + Ethers.js v6.
   - Running on port `3000`.

---

## 2. Invariants & Guardrails (DO NOT BREAK)

These rules are critical to ensure no hallucinations or architectural drift:

1. **Indian Rupee (INR / ₹) Display Rule**:
   - **Everywhere** an ETH amount appears (bids, deposits, starting prices, reserve prices, escrow balances, balances), it MUST be accompanied by its Indian Rupee equivalent (`₹`), formatted using the live on-chain Oracle rate.
   - Default exchange rate: `1 ETH = ₹2,50,000.00 INR` (dynamic via `liveEthInrRate`).
2. **Dev Bypass Login Rule**:
   - **Never remove or hide** the `⚡ Quick Dev Bypass (Seller Account #1)` button in `AuthModal.tsx`.
   - It allows 1-click instant login for testing and development without requiring MetaMask connection or approval popups.
3. **Oracle Role & Scope Boundary**:
   - **Do NOT** use `PriceOracle.sol` as a middleman bottleneck for registering AI vehicle valuations. The seller uses the AI prediction directly to set starting and reserve prices during auction creation.
   - **`PriceOracle.sol`'s Real Purpose**: It operates as a **Chainlink-Compatible AggregatorV3Interface** providing on-chain, verifiable `ETH / INR` exchange rates (`latestRoundData()`, `getLatestEthInrRate()`, `updateEthInrPrice()`, with 8-decimal precision).
4. **No Obsolete Oracle Service**:
   - The old standalone Python `/oracle` folder and `start-oracle.bat` have been permanently removed. The stack is clean with 3 services (`Hardhat Node`, `FastAPI Backend`, `React Frontend`).

---

## 3. Completed Milestones & Work Done

### A. Smart Contracts (`/blockchain/contracts/`)
- [x] **`SealedAuction.sol`**:
  - Two-phase sealed-bid commit-reveal mechanism (`commitDeadline` & `revealDeadline`).
  - Commitment hash: `keccak256(abi.encode(auctionId, msg.sender, bidAmount, salt))`.
  - Fixed refundable anti-spam deposit (0.1 ETH).
  - Earliest-commit timestamp tie-breaking logic.
  - Automatic refund distribution for unrevealed non-winning bidders and overpaid deposits.
- [x] **`PriceOracle.sol` & `interfaces/IPriceOracle.sol`**:
  - Implemented `AggregatorV3Interface` methods:
    - `latestRoundData() -> (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)`.
    - `getLatestEthInrRate() -> uint256` (convenience helper returning integer rupees).
    - `updateEthInrPrice(int256 _newPrice)` (authorized feeder / owner update with `PriceUpdated` event).
    - `decimals() = 8`, `description() = "ETH / INR Price Feed"`, `version() = 3`.
  - Retained historical prediction data structures for backward compatibility.
- [x] **`solidityCode.ts`**:
  - Updated in-memory Solidity contract representations so the on-page smart contract inspector accurately reflects the latest `PriceOracle.sol` code.

### B. Frontend Authentication & Wallet System (`/frontend/src/`)
- [x] **1-Click Dev Bypass**:
  - `devBypassLogin(roleAddress)` in `WalletContext.tsx`.
  - Added 1-click **⚡ Quick Dev Bypass (Seller Account #1)** button to `AuthModal.tsx`.
  - Direct role switcher supporting Admin, Seller, Bidder Alice, and Bidder Bob.
- [x] **Dynamic Oracle Price Feed State**:
  - Added `liveEthInrRate`, `oracleRoundId`, and `updateLivePriceFeed()` to `WalletContext.tsx`.
  - Dynamic rate formatting in `crypto.ts` (`convertEthToInr`, `formatEthToInr`, `formatEthWithInr`).
  - Added pulsing green **Chainlink ETH/INR: ₹2,50,000** badge in `AuthenticatedHeader.tsx`.

### C. Auction Creation Wizard (`/frontend/src/pages/CreateAuction.tsx`)
- [x] Direct 4-step wizard without the artificial Oracle registration step:
  - Step 1: Vehicle Specifications (VIN, Make, Model, Year, Mileage, Condition).
  - Step 2: Instant AI Valuation Preview (queries FastAPI microservice, displays predicted price and confidence range in INR).
  - Step 3: Auction Parameters (Starting bid in ETH/INR, Reserve price in ETH/INR, Fixed deposit in ETH/INR, Phase durations).
  - Step 4: Review & On-Chain Deployment (`SealedAuction.sol`).

### D. Admin Dashboard (`/frontend/src/pages/admin/AdminDashboard.tsx`)
- [x] **Chainlink Price Feed Oracle Panel**:
  - Live round KPI cards: ETH/INR rate, Round ID, 8 decimals, heartbeat status.
  - Interactive simulator to broadcast new rounds (presets: ₹2.40L, ₹2.50L, ₹2.60L, ₹2.75L, ₹2.90L, or custom input).
  - **Live Real-World Market Ingestion**: Integrated CoinGecko Spot API & Binance fallback with 1-click **"Fetch Live Spot Market Price"** button and 60-second periodic auto-sync.
  - **Autonomous Feeder Daemon (`blockchain/scripts/priceFeedDaemon.js`)**: Standalone Node.js service using Hardhat Account 4 to continuously query CoinGecko spot rates and broadcast `PriceOracle.updateEthInrPrice` on-chain every 30s.
  - Full technical specifications and architecture callout.
- [x] **Updated Role Directory & Topology**:
  - Hardhat Account 4 updated to "Price Oracle Feeder".
  - Cleaned service topology to reflect the 3-server stack.

### E. Code Cleanup & Project Scripts
- [x] Removed obsolete `/oracle` directory and `/docs/oracle-documentation.md`.
- [x] Updated `/scripts/start-all.bat` to launch only the 3 required services (Hardhat node, FastAPI backend, React frontend).
- [x] Verified build and lint (`compile_applet` and `lint_applet`) passing with 0 errors.

---

## 4. Current Work in Progress & Active Focus
- [x] Documenting development lifecycle, tasks, and state in `PROJECT_TRACKER.md`.
- [ ] End-to-end user testing of all auction lifecycle transitions (Creation -> Commit Phase -> Reveal Phase -> Final Settlement).

---

## 5. Backlog & Future Tasks

### Priority 1: User Experience & Real-Time Sync
- [ ] **Simulated Time Advance Button**: In Dev/Admin mode, allow accelerating Hardhat block timestamp (`evm_increaseTime`) to quickly advance past `commitDeadline` and `revealDeadline` for easy demoing.
- [ ] **Bidder Receipt Download**: Optional PDF or JSON export of secret salt and commitment hash for bidders to safeguard their reveal credentials.

### Priority 2: Edge Case Handling
- [ ] **Unrevealed Bidder Penalties**: Verify fixed deposit forfeit behavior when a bidder commits but fails to reveal before deadline.
- [ ] **Reserve Price Not Met**: Confirm lot returns to seller without transfer if the highest revealed bid is below `reservePriceEth`.

### Priority 3: UI Polish & Responsive Tuning
- [ ] Mobile navigation drawer fine-tuning for smaller screens (< 640px).
- [ ] Offline notification banner when local Hardhat node (port 8545) is stopped.

---

## 6. How to Run & Verify

```bash
# 1. Start all 3 servers
scripts/start-all.bat

# Or run individually:
# Terminal 1: Hardhat Node
npx hardhat node

# Terminal 2: FastAPI AI Backend
cd backend && uvicorn src.api.main:app --port 8000 --reload

# Terminal 3: React Frontend Dev Server
npm run dev
```

### Dev Quick-Start:
1. Open the app in browser.
2. Click **Connect Wallet** -> Click **⚡ Quick Dev Bypass (Seller Account #1)**.
3. Navigate to **Create Auction** or **Admin Console** without needing MetaMask approval.
