# AuctionChain — Project Tracker & Architectural Invariants

**Single Source of Truth for Implementation Status, System Architecture, and Verification Invariants**

---

## 1. Project Identity & Scope

- **Project Name**: AuctionChain — Decentralized Sealed-Bid Vehicle Auction Platform with AI Valuation & On-Chain Oracle Verification
- **Target Domain**: Indian Pre-Owned Passenger Vehicle Market (`₹` / INR valuation paired with Hardhat Test ETH on-chain escrow)
- **Primary Objective**: Eliminate bid sniping, front-running, and price opacity in online vehicle auctions by combining:
  1. **Cryptographic Commit-Reveal Sealed Bidding (`SealedAuction.sol`)** using `keccak256(abi.encodePacked(bidAmountWei, salt, bidderAddress))`
  2. **Advisory AI Vehicle Valuation Engine (`server.ts`)** producing transparent Indian Rupee (`₹` / integer paise) market estimates, factor breakdowns, and canonical SHA-256 vehicle specification hashes
  3. **On-Chain Oracle Verification (`PriceOracle.sol`)** anchoring live ETH/INR conversion rates and AI valuation records on-chain via Hardhat Account 4 (`0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65`)

---

## 2. Clean Repository Architecture

```text
AuctionChain/
├── blockchain/                        # Hardhat Smart Contract Workspace (Solidity 0.8.28)
│   ├── contracts/
│   │   ├── Auction.sol                # SealedAuction.sol — Commit-Reveal & Pull-Payment Escrow
│   │   └── PriceOracle.sol            # Live ETH/INR Price Feed & AI Valuation Anchor Contract
│   ├── scripts/
│   │   ├── deploy.js                  # Deploys PriceOracle & SealedAuction to Chain ID 31337
│   │   └── priceFeeder.js             # Autonomous ETH/INR oracle daemon (Account 4)
│   ├── test/
│   │   ├── Auction.test.js            # Unit tests for Commit, Reveal, Finalize & Escrow
│   │   └── Integration.test.js        # End-to-end Oracle + Auction integration tests
│   ├── hardhat.config.js              # Hardhat Localhost network configuration (Port 8545)
│   └── package.json
├── frontend/                          # React 19 + TypeScript + Tailwind CSS Web3 Application
│   ├── public/                        # Static favicon & brand assets
│   └── src/
│       ├── assets/images/             # AuctionChain logo & vehicle photography presets
│       ├── components/                # Navbar, Footer, CountdownTimer, Wallet/Role modals
│       ├── context/                   # WalletContext (Hardhat Account mapping & live ETH/INR)
│       ├── data/                      # Seeded vehicle auctions & initial state
│       ├── lib/                       # Keccak-256 commitment hashing, INR/ETH formatters, Hardhat config
│       ├── pages/                     # Public pages, AuctionDetails, CreateAuction, Role Dashboards
│       ├── services/                  # AI API client & MetaMask Web3 transaction service
│       └── types/                     # Strict TypeScript interfaces for auctions, bids & events
├── scripts/                           # Windows (.bat) 1-click setup & 4-terminal launcher scripts
│   ├── setup.bat
│   ├── start-all.bat
│   ├── start-blockchain.bat
│   ├── start-backend.bat
│   ├── start-price-feeder.bat
│   └── start-frontend.bat
├── docs/                              # Technical documentation & live demonstration guide
│   ├── project-overview.md
│   ├── system-architecture.md
│   ├── ai-model-documentation.md
│   ├── smart-contract-design.md
│   ├── database-design.md
│   ├── security.md
│   └── demo-guide.md
├── server.ts                          # Express Gateway + AI Valuation Engine + Terminal Proof Logger
├── package.json                       # Unified workspace scripts & dependencies
├── tsconfig.json                      # TypeScript compiler configuration
├── vite.config.ts                     # Vite build & proxy configuration
└── README.md                          # Platform overview, setup instructions & demo walkthrough
```

---

## 3. Core Architectural Invariants

### 3.1 Hardhat Localhost Account Mapping (`Chain ID: 31337`)

| Hardhat Account | Address | Platform Role | Visibility |
| :--- | :--- | :--- | :--- |
| **Account #0** | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` | **Seller (`seller.eth`)** | Interactive UI Role |
| **Account #1** | `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` | **Bidder 1 (`bidder1.eth`)** | Interactive UI Role |
| **Account #2** | `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC` | **Bidder 2 (`bidder2.eth`)** | Interactive UI Role |
| **Account #3** | `0x90F79bf6EB2c4f870365E785982E1f101E93b906` | **Oracle (`oracle.eth`)** | Autonomous Background Service |
| **Account #4** | `0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65` | **Admin (`admin.eth`)** | Interactive UI Role |

### 3.2 Cryptographic & Smart Contract Invariants
1. **Commitment Hash Formula**:
   $$\text{commitment} = \text{keccak256}(\text{abi.encodePacked}(\text{uint256}(\text{bidAmountWei}), \text{bytes32}(\text{salt}), \text{address}(\text{bidder})))$$
   Both `frontend/src/lib/crypto.ts` and `blockchain/contracts/Auction.sol` compute the exact same byte-level hash.
2. **Equal Collateral Deposit**:
   During the Commit Phase, every bidder locks the exact same `fixedDepositEth` (`msg.value == fixedDeposit`), preventing observers from inferring a bidder's secret valuation from the ETH value transferred in the transaction.
3. **Pull-Over-Push Escrow Settlement**:
   No automatic ETH loops occur during `finalizeAuction()`. Losing bidders call `claimRefund()`, the winning bidder calls `settleWinnerPayment()`, and the seller calls `withdrawSellerProceeds()`.
4. **Advisory AI Principle**:
   The AI Valuation Engine provides an objective Indian market estimate (`₹` INR and integer paise) anchored in `PriceOracle.sol`, while the seller retains full autonomy to configure `startingBidEth`, `reservePriceEth`, and `fixedDepositEth`.

---

## 4. Milestone Completion Matrix

| Milestone | Module | Status | Key Implementation Details |
| :--- | :--- | :---: | :--- |
| **M1** | **Smart Contracts (`Auction.sol` & `PriceOracle.sol`)** | Completed | Full Commit-Reveal lifecycle, `ReentrancyGuard`, pull-payment escrow, live ETH/INR rate storage, and AI prediction hash anchoring. |
| **M2** | **AI Indian Vehicle Valuation Engine (`server.ts`)** | Completed | Computes fair market value in `₹` (INR) and integer paise, canonical SHA-256 vehicle spec hash, confidence interval, and factor breakdown. |
| **M3** | **Real MetaMask Confirmation Popups (`walletService.ts`)** | Completed | Every on-chain action (`createAuction`, `commitBid`, `revealBid`, `finalizeAuction`, `settleWinnerPayment`, `claimRefund`, `withdrawSellerProceeds`) triggers a real MetaMask transaction confirmation popup (`eth_sendTransaction`) with live value and ABI calldata. |
| **M4** | **Backend Terminal Proof Logging (`server.ts`)** | Completed | Structured ASCII proof banners printed in the backend terminal for every AI inference (`/api/predict-price`), PriceOracle registration (`/api/oracle/register`), and MetaMask/Hardhat transaction (`/api/blockchain/log-tx`). |
| **M5** | **Role-Restricted Bidding & 1-Click Reveal (`AuctionDetails.tsx`)** | Completed | Commit panel strictly visible to `Bidder` accounts only; Bidder Reveal auto-loads the saved browser passkey for 1-click verification; Seller/Admin see a dedicated **Seller Reveal & Finalization Desk** with live bidder reveal progress. |
| **M6** | **Account Switch Hygiene & Navigation Reset** | Completed | Switching accounts resets the dashboard sidebar to the first tab (`dashboard`), clears any open auction detail view, clears per-bidder confirmation banners (`actionFeedback`), and scrolls to the top of the page. |
| **M7** | **Admin Delete Auction & Full Platform Data Reset** | Completed | Admin dashboard (`admin.eth`) includes per-auction **Delete** buttons (including completed auctions) and a **Reset All Platform Data** control with inline confirmation. |
| **M8** | **Editorial UI Polish & Terminology Guide** | Completed | Overview, How It Works (with full Auction Terminologies & Phases guide), Marketplace, Seller Dashboard, Bidder Dashboard, and Admin Console refined for zero clutter and institutional clarity. |
| **M9** | **Codebase Audit, Dead-Code Removal & Documentation** | Completed | Removed unused legacy files and tool folders; synchronized `README.md`, `PROJECT_TRACKER.md`, `blockchain/README.md`, and all `docs/*.md` files. |

---

## 5. Verification & Build Commands

- **Install Dependencies**:
  ```bash
  npm install
  cd blockchain && npm install
  ```
- **Compile & Test Smart Contracts**:
  ```bash
  npm run blockchain:compile
  npm run blockchain:test
  ```
- **Type-Check & Lint Frontend/Server**:
  ```bash
  npm run lint
  ```
- **Production Bundle Build**:
  ```bash
  npm run build
  ```
