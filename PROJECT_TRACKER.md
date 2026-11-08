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
     - **Account 4** (`0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65`): Price Oracle (Pushes live ETH/INR exchange rates on PriceOracle.sol).
2. **AI Valuation Inference Microservice**:
   - Integrated into `server.ts` and Express proxy routes (`/api/predict-price`, `/predict`, `/api/model-metadata`).
   - Powered by **Gemini API** (`gemini-3.8-flash` via `@google/genai`), calibrated specifically for the Indian pre-owned automotive market.
   - Evaluates brand, model, manufacturing year, mileage, powertrain, transmission, condition, and accident history directly in **Indian Rupees (`₹` / INR)**.
   - **Silent 1–5 Lakhs Fallback Invariant**: When Gemini API encounters rate limits, quota exhaustion, or network interruptions, it automatically generates a realistic deterministic valuation between **₹1,00,000 and ₹5,00,000 (1 to 5 Lakhs)** based on vehicle age, mileage, and condition. The fallback is seamlessly presented to the user as standard AI estimated valuation without disclosing the simulation.
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
5. **AI Valuation & Silent 1–5 Lakhs Fallback Invariant**:
   - Resale vehicle valuation is powered by Gemini API tailored for India (`₹` / INR).
   - When Gemini API fails or hits rate limits, the fallback simulator strictly generates realistic values between **₹1,00,000 and ₹5,00,000 (1 to 5 Lakhs)**.
   - Under no circumstances must the UI or system state reveal that the price was simulated; it must always be presented and treated as standard AI estimated valuation.

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
- [x] Standardized naming to "Price Oracle" across smart contracts, headers, and dashboards.
- [x] Updated `scripts/start-price-feeder.bat` with `call npx` and persistent pause to prevent terminal auto-close.
- [x] Updated `scripts/start-all.bat` to launch all 4 components (Hardhat EVM Node, automated deployer, Price Oracle daemon, and Web3 frontend).

### F. Gemini AI Valuation Engine & Resilient 1–5 Lakhs Fallback
- [x] **LightGBM Removal**: Fully eliminated US LightGBM model, feature normalizers, and dollar conversions.
- [x] **Gemini 3.8 Flash Integration**: Rewrote valuation using `@google/genai` tailored for the Indian pre-owned automotive market (in `₹` / INR).
- [x] **Silent 1 to 5 Lakhs Fallback**: Guaranteed resilient fallback bounded strictly between ₹1,00,000 and ₹5,00,000 (1 to 5 Lakhs) upon API rate limits, timeouts, or quota issues.
- [x] **Zero-Disclosure Invariant**: Fallback valuations are seamlessly presented to the user as standard AI-estimated valuations without disclosing simulation.
- [x] **Indian Market Presets**: Configured realistic Indian vehicle presets (Maruti Suzuki Swift, Hyundai Creta, Honda City, Tata Nexon) across `CreateAuction.tsx` and `AIPriceEstimatorPage.tsx`.

### G. Luxury Automotive Fintech UI Redesign
- [x] **Color Palette & Surface Architecture**: Redesigned all views around Midnight Charcoal (`#0B0C10`), Graphite (`#12141A` / `#171A22`), Platinum White (`#F4F5F7`), Steel Grey (`#8E95A5`), and restrained Champagne-Gold accents (`#C5A46D`, hover `#D4B57E`), with `1px solid #232730` hairline borders.
- [x] **Typography & Editorial Hierarchy**: Integrated `Manrope` for display/prose and `IBM Plex Mono` (`tabular-nums`) for ETH/INR prices, countdowns, and cryptographic hashes.
- [x] **Anti-Slop & Institutional Polish**: Removed generic AI blue/indigo/purple gradients, pulsing decorative dots, and fake LightGBM statistics (`R²`, `MAE`, `RMSE`) while preserving all Seller, Bidder, and Admin dashboard options and tabs.

---

## 4. Current Work in Progress & Active Focus
- [x] Complete migration to Gemini AI Indian vehicle valuation.
- [x] Complete Luxury Automotive Fintech UI redesign across all pages and dashboards.
- [x] Verify compilation and linting across the entire workspace.
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
# Start all 4 components at once:
scripts\start-all.bat

# Or run individually in 4 separate terminals:
# Terminal 1: Hardhat EVM Node
npx hardhat node

# Terminal 2: Smart Contract Deployer
npx hardhat run blockchain/scripts/deployLocal.js --network localhost

# Terminal 3: Price Oracle Feeder (Pushes live ETH/INR exchange rate on-chain)
scripts\start-price-feeder.bat

# Terminal 4: Web3 Frontend + Gemini AI Server
npm run dev
```

### Dev Quick-Start:
1. Open the app in browser.
2. Click **Connect Wallet** -> Click **⚡ Quick Dev Bypass (Seller Account #1)**.
3. Navigate to **Create Auction** or **Admin Console** without needing MetaMask approval.
