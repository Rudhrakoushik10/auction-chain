# AuctionChain — Decentralized Sealed-Bid Vehicle Auction Platform

**Cryptographic Commit-Reveal Vehicle Auctions · Advisory AI Market Valuation (`₹` INR) · On-Chain Price Oracle & Escrow (`Chain ID: 31337`)**

AuctionChain is a decentralized web application designed for the Indian pre-owned passenger vehicle market. It eliminates bid sniping, front-running, and price manipulation in online vehicle auctions by combining **Keccak-256 cryptographic commit-reveal bidding**, **advisory AI vehicle valuation in Indian Rupees (`₹`)**, and **trustless smart contract escrow** on Ethereum (Hardhat Localhost).

---

## 1. Platform Overview & Key Capabilities

1. **AI-Assisted Pre-Owned Vehicle Valuation (`₹` INR)**
   - Inspects structured vehicle specifications (Brand, Model, Year, Odometer in km, Fuel Type, Engine, Transmission, Accident History) and computes an advisory fair market value in **Indian Rupees (`₹`)** and integer **paise**, complete with factor-by-factor price impact weights and a canonical **SHA-256 specification hash**.
2. **On-Chain Price Oracle (`PriceOracle.sol`)**
   - Maintains a live **ETH/INR exchange rate** on-chain so vehicles valued in `₹` (INR) can be seamlessly auctioned and settled in **Test ETH**.
   - Anchors the AI valuation record and SHA-256 vehicle specification hash on-chain before bidding begins.
3. **Cryptographic Commit-Reveal Sealed Bidding (`SealedAuction.sol`)**
   - **Commit Phase**: Bidders submit a blinded commitment hash `keccak256(abi.encodePacked(bidAmountWei, salt, bidderAddress))` while locking an identical fixed collateral deposit (`fixedDepositEth`). Nobody—not even the seller or competing bidders—can see the bid amount.
   - **Reveal Phase**: Bidders unlock their sealed bid with a **1-click reveal** using their browser-stored passkey (or backup JSON file). The smart contract verifies the hash mathematically.
4. **Pull-Over-Push Escrow Settlement**
   - Once finalized, the highest verified bidder above the seller's reserve price wins. Their collateral deposit is automatically credited toward the final bid (`highestBid - fixedDeposit`), losing bidders claim a 100% deposit refund, and the seller withdraws the winning proceeds.
5. **Live Backend Terminal Proofs & Real MetaMask Confirmations**
   - Every smart contract interaction triggers a real **MetaMask transaction confirmation popup** (`eth_sendTransaction`) and prints a structured cryptographic execution proof in the backend terminal (`AI Valuation Proof`, `PriceOracle.sol Anchor Proof`, and `On-Chain Transaction Execution Proof`).

---

## 2. Repository Structure

```text
AuctionChain/
├── blockchain/                  # Hardhat Smart Contract Suite (Solidity 0.8.28)
│   ├── contracts/
│   │   ├── Auction.sol          # SealedAuction: Commit-Reveal & Pull-Payment Escrow
│   │   └── PriceOracle.sol      # Live ETH/INR Feed & AI Valuation Hash Registry
│   ├── scripts/
│   │   ├── deploy.js            # Deploys contracts & exports addresses
│   │   └── priceFeeder.js       # Autonomous ETH/INR oracle feeder (Account 3)
│   └── test/                    # Smart contract unit & integration tests
├── frontend/                    # React 19 + TypeScript + Tailwind CSS Web3 UI
│   ├── public/                  # Static assets & favicon
│   └── src/
│       ├── components/          # Layout, Navbar, Modals, CountdownTimer
│       ├── context/             # WalletContext (Hardhat accounts & MetaMask sync)
│       ├── data/                # Seeded Indian vehicle auctions
│       ├── lib/                 # Keccak-256 hashing, INR/ETH formatters, ABIs
│       ├── pages/               # Public pages, AuctionDetails, CreateAuction, Dashboards
│       ├── services/            # AI Valuation client & MetaMask Web3 service
│       └── types/               # TypeScript domain models
├── scripts/                     # Windows (.bat) 1-click setup & 4-terminal launchers
├── docs/                        # Comprehensive architecture & design documentation
├── server.ts                    # Express Gateway + AI Valuation Engine + Terminal Logger
└── package.json                 # Unified scripts and dependencies
```

---

## 3. Prerequisites & Local System Setup

### 3.1 Required Software
- **Node.js**: `v18.x` or `v20.x+` (with `npm`)
- **Browser**: Google Chrome, Brave, or Microsoft Edge with the **MetaMask Extension** installed
- **Git**: For cloning the repository

### 3.2 Step 1 — Environment Variables Setup (`.env`)
Before starting the servers, create a `.env` file in the root directory by copying `.env.example`:

- **Windows (Command Prompt / PowerShell)**:
  ```cmd
  copy .env.example .env
  ```
- **macOS / Linux (Bash / Zsh)**:
  ```bash
  cp .env.example .env
  ```

*(Note: Running `scripts\setup.bat` on Windows will automatically create `.env` from `.env.example` if it does not already exist.)*

#### Environment Variables Reference (`.env`)
```ini
# 1. Server Port (Default: 3000 for Web3 Frontend & Gateway)
PORT=3000

# 2. AI Vehicle Valuation API Key (Optional)
# Leave as default or provide a key. If omitted or offline, AuctionChain automatically
# uses its built-in deterministic Indian Vehicle Market Valuation Engine (₹ INR).
GEMINI_API_KEY=your_api_key_here
```
*(Note: Hardhat RPC `http://127.0.0.1:8545` and Chain ID `31337` are deterministic system constants and are hardcoded directly into the application configuration.)*

### 3.3 Step 2 — Install Dependencies
Open a terminal in the project root directory and run:

```bash
# 1. Install root (Frontend + AI Server) dependencies
npm install

# 2. Install Hardhat blockchain dependencies
cd blockchain
npm install
cd ..
```
*(On Windows, you can simply double-click `scripts\setup.bat` to automate both `.env` creation and dependency installation.)*

### 3.4 Step 3 — Launch the Platform

#### Option A: Windows 1-Click 4-Terminal Launcher (Recommended for Demo)
Double-click `scripts\start-all.bat` (or run `npm run start:all:win`). This opens **4 dedicated terminal windows**:
1. **Terminal 1 — Hardhat Blockchain Node (`Port 8545`)**: Starts the local Ethereum node and auto-deploys `PriceOracle.sol` and `SealedAuction.sol`.
2. **Terminal 2 — AI Vehicle Valuation Engine (`Port 8000`)**: Runs the Indian Vehicle Valuation Engine and prints live AI, Oracle, and Blockchain proof banners.
3. **Terminal 3 — Autonomous ETH/INR Price Oracle (`Account 3`)**: Fetches live ETH/INR market rates and pushes on-chain updates to `PriceOracle.sol`.
4. **Terminal 4 — Web3 Frontend Application (`Port 3000`)**: Serves the React Web3 interface at `http://localhost:3000`.

#### Option B: Unified Single-Command Start (macOS / Linux / Windows)
To run the full application stack from two terminals on `http://localhost:3000`:
```bash
# Terminal A: Start Hardhat node & deploy contracts
npm run blockchain:node
# (In another tab, deploy contracts once node is up: npm run blockchain:deploy)

# Terminal B: Start Full-Stack Web3 App + AI Valuation Engine on Port 3000
npm run dev
```

---

## 4. MetaMask Configuration & Nonce Recovery Guide

### 4.1 Add Hardhat Localhost Network in MetaMask
- **Network Name**: `Hardhat Localhost`
- **New RPC URL**: `http://127.0.0.1:8545`
- **Chain ID**: `31337`
- **Currency Symbol**: `ETH`

### 4.2 Import the 4 Interactive Role Accounts (10,000 Test ETH each)
In MetaMask, click **Account Menu → Add account or hardware wallet → Import account** and paste the private keys below:

| Platform Role | ENS Label | Ethereum Address | Private Key (Import into MetaMask) |
| :--- | :--- | :--- | :--- |
| **Seller** | `seller.eth` | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` | `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80` |
| **Bidder 1** | `bidder1.eth` | `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` | `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d` |
| **Bidder 2** | `bidder2.eth` | `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC` | `0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a` |
| **Admin** | `admin.eth` | `0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65` | `0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a` |

*(Note: Hardhat Account #3 `0x90F79bf6EB2c4f870365E785982E1f101E93b906` acts autonomously in the background as the authorized `PriceOracle.sol` signer.)*

### 4.3 Handling MetaMask Nonce Errors After Restarting the Hardhat Node
When you stop and restart the local Hardhat Blockchain Node (`Terminal 1`), the blockchain resets every account's transaction counter (**nonce**) back to `0`. However, MetaMask caches the previous session's higher nonce (e.g., `Nonce 4`), which normally causes a `"Nonce too high. Expected nonce to be 0 but got 4"` error.

AuctionChain handles this automatically at three levels:
1. **Automatic Background & Pre-Transaction Nonce Sync (`hardhat_setNonce`)**:
   - Whenever the app detects that the Hardhat node was restarted (`hardhatNonce < cachedMetaMaskNonce`), it automatically calls `hardhat_setNonce` on `http://127.0.0.1:8545` to fast-forward the Hardhat account nonce to match MetaMask before you send a transaction.
2. **Automatic Reactive Nonce Self-Healing**:
   - Even if MetaMask throws a nonce mismatch error on submission, `walletService.ts` intercepts the exact nonce expected by MetaMask, synchronizes Hardhat's RPC nonce immediately, and completes your transaction without failing.
3. **Manual Reset in MetaMask (Optional)**:
   - If you ever want to manually reset MetaMask's cached activity and nonce data back to `0`:
     - Open MetaMask → **Settings → Advanced → Clear activity tab data** *(or in newer MetaMask versions: **Settings → Developer Tools → Delete activity and nonce data**)*.
     - Or click the **Auto-Sync Nonce** button if the yellow Nonce Desynchronization banner appears at the top of the dashboard.

---

## 5. Step-by-Step Live Demonstration Guide

Follow this sequence to demonstrate every capability of **AuctionChain**—including **AI Valuation**, **On-Chain Oracle Anchoring**, **MetaMask Transaction Confirmations**, **Sealed Bidding**, **1-Click Reveal**, **Escrow Settlement**, and **Admin Data Management**.

### Step 1: Public Overview, Terminologies & Visual Flowchart
1. Open `http://localhost:3000`.
2. Show the **Overview** page highlighting how sealed-bid vehicle auctions prevent front-running and sniping.
3. Click **How It Works** in the top navigation bar:
   - Review **Key Auction Terminologies & Phases Explained** (*Starting Bid*, *Seller Reserve Price*, *Collateral Deposit*, *Secret Salt & Commitment Hash*, and *Commit / Reveal / Sold / No Sale* phases).
   - Scroll to the bottom of the **How It Works** page to show the **Visual End-to-End Auction Flowchart**, which illustrates the entire process from Vehicle Listing to the Smart Contract Reserve Price Checkpoint (`YES → Vehicle Sold` vs. `NO → No Sale · 100% Refund`).

### Step 2: Seller Creates a Vehicle Auction with AI Valuation & Oracle Proof
1. Click **Connect Wallet** in the top-right corner and select **Seller (`seller.eth` - Account #0)** (also select Account #0 in MetaMask).
2. Notice you are taken to the **Seller Dashboard** on the first sidebar tab. Click **Create New Auction** in the left sidebar.
3. **01. Vehicle Specifications**:
   - Choose a vehicle preset (e.g., *2021 Hyundai Creta SX 1.5L CRDi Diesel* or *2022 Tata Nexon EV Max XZ+ Lux*) or customize the mileage, year, and condition.
   - Click **Compute AI Valuation (INR)**.
4. **02. Advisory Vehicle Market Valuation (INR)**:
   - Show the **Estimated Fair Market Value in `₹` (INR)**, integer paise, **SHA-256 Specification Hash**, and **Valuation Factor Breakdown**.
   - **Switch to the Backend Terminal (`Terminal 2 / 4`)**: Point out the `[AI VALUATION ENGINE · PROOF OF INFERENCE]` box and the `[PRICE ORACLE CONTRACT · PriceOracle.sol ANCHOR PROOF]` box showing the exact `prediction_id`, `product_data_hash`, and on-chain block number.
5. **03. Configure Auction Terms**:
   - Configure the **Starting Bid (ETH)**, **Hidden Reserve Price (ETH)**, and **Fixed Collateral Deposit (ETH)** (with live `₹` INR equivalents shown underneath).
   - Click **Review & Deploy**.
6. **04. Deploy to `SealedAuction.sol`**:
   - Click **Confirm & Deploy to SealedAuction.sol**.
   - **Approve the transaction in the MetaMask popup**.
   - Show the `[METAMASK_CONFIRMED_TX · ON-CHAIN EXECUTION PROOF]` log printed in the backend terminal.

### Step 3: Bidder 1 & Bidder 2 Submit Sealed Bids (Commit Phase)
1. Switch wallet role to **Bidder 1 (`bidder1.eth` - Account #1)** (and switch MetaMask to Account #1).
   - Notice the dashboard automatically resets to the first sidebar option (**Overview & Active Bids**).
2. Open the newly created vehicle auction in the **Marketplace**.
   - Point out that the **Submit Sealed Bid** panel is visible **only** to Bidder accounts (Seller and Admin accounts cannot bid).
3. **Bidder 1 Commits a Sealed Bid**:
   - Enter a secret bid amount (e.g., `2.10 ETH`).
   - Show the live **Keccak-256 Commitment Hash** generated in the browser.
   - Check the confirmation box acknowledging the secret passkey backup and click **Lock Collateral & Commit Bid**.
   - **Confirm the transaction in the MetaMask popup** (locking the fixed collateral deposit, e.g., `0.25 ETH`).
   - Show the green confirmation box for Bidder 1 and the on-chain execution proof in the backend terminal.
4. **Bidder 2 Commits a Competing Sealed Bid**:
   - Switch wallet role to **Bidder 2 (`bidder2.eth` - Account #2)** (and switch MetaMask to Account #2).
   - Open the same auction. Point out that Bidder 1's green confirmation banner is **not** shown to Bidder 2, and Bidder 1's bid amount remains completely hidden on-chain (`LOCKED` behind the Keccak-256 hash while locking the exact same `0.25 ETH` deposit).
   - Enter a higher secret bid (e.g., `2.45 ETH`), check the box, click **Lock Collateral & Commit Bid**, and **confirm in MetaMask**.

### Step 4: 1-Click Bid Reveal (Reveal Phase)
1. Use the **Demo Phase Controls** bar at the top of the Auction Details page (available to Seller/Admin) to click **Advance to Reveal Phase**.
2. **Seller View During Reveal**:
   - While on Seller (`seller.eth`), point out the **Seller Reveal & Finalization Desk**, which shows live reveal progress (`0 / 2 Revealed`) without confusing the seller with a bidder reveal input form.
3. **Bidder 1 & Bidder 2 Reveal with 1 Click**:
   - Switch to **Bidder 1 (`bidder1.eth`)**. Notice the **Reveal Sealed Bid** panel automatically loads Bidder 1's saved browser passkey (`Ready to Reveal — Your Sealed Bid Passkey was Found Automatically`).
   - Click **Reveal My Bid Now (2.10 ETH)** and **confirm in MetaMask**.
   - Switch to **Bidder 2 (`bidder2.eth`)**, click **Reveal My Bid Now (2.45 ETH)**, and **confirm in MetaMask**.
   - Show the `[ON-CHAIN EXECUTION PROOF]` in the backend terminal verifying that `keccak256(bidAmountWei, salt, bidder)` matched the commitment stored in `SealedAuction.sol`.

### Step 5: Finalization & Trustless Escrow Settlement
1. Advance the phase to **Finalizable** (or switch to **Seller `seller.eth`**) and click **Execute finalizeAuction()**. Confirm in MetaMask.
   - The smart contract verifies that Bidder 2's `2.45 ETH` bid exceeds the Seller's reserve price and declares **Bidder 2 (`bidder2.eth`)** the winner.
2. **Winner Settles Net Balance**:
   - Switch to **Bidder 2 (`bidder2.eth`)** and click **Pay Remaining Balance (`2.20 ETH`)** (`2.45 ETH` winning bid minus `0.25 ETH` locked deposit). Confirm in MetaMask.
3. **Losing Bidder Claims 100% Refund**:
   - Switch to **Bidder 1 (`bidder1.eth`)** and click **Claim `0.25 ETH` Refund**. Confirm in MetaMask.
4. **Seller Withdraws Auction Proceeds**:
   - Switch to **Seller (`seller.eth`)** and click **Withdraw `2.45 ETH` Proceeds**. Confirm in MetaMask.

### Step 6: Admin Governance, Auction Deletion & Platform Data Reset
1. Switch wallet role to **Admin (`admin.eth` - Account #4)**.
2. Open the **Admin Console**:
   - Inspect the **Authorized Oracle Node**, live **ETH/INR Oracle Feed**, and **On-Chain Event Ledger**.
   - In the **Platform Auction State Matrix**, demonstrate deleting any individual registered or completed auction using the **Delete** button in the Action column.
   - Demonstrate the **Reset All Platform Data** button in the top-right header to restore all auctions, balances, and browser passkeys to a clean initial state at any time.

---

## 6. Further Documentation

Detailed architectural and module-level documentation is available in `/docs`:
- [`docs/project-overview.md`](docs/project-overview.md) — Problem statement, domain context, and core innovations
- [`docs/system-architecture.md`](docs/system-architecture.md) — 4-service topology, data flow, and sequence diagrams
- [`docs/ai-model-documentation.md`](docs/ai-model-documentation.md) — Indian Vehicle Valuation Engine, feature weights, and SHA-256 canonical hashing
- [`docs/smart-contract-design.md`](docs/smart-contract-design.md) — `SealedAuction.sol` and `PriceOracle.sol` specifications and state machines
- [`docs/database-design.md`](docs/database-design.md) — On-chain vs. off-chain state schema and local passkey storage
- [`docs/security.md`](docs/security.md) — Threat model, front-running mitigation, and pull-payment escrow guards
- [`docs/demo-guide.md`](docs/demo-guide.md) — Quick-reference checklist for live evaluation and viva demonstrations
