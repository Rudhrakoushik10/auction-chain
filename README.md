# AuctionChain — Decentralized Vehicle Auction Platform

**Time-Windowed Blind Vehicle Bidding · AI Market Valuation (`₹` INR) · On-Chain Price Oracle & Smart Contract Settlement (`Chain ID: 31337`)**

AuctionChain is a decentralized web application designed for the Indian pre-owned passenger vehicle market. It eliminates bid sniping, shill bidding, and price manipulation in online vehicle auctions by combining **time-windowed blind bidding**, **advisory AI vehicle valuation in Indian Rupees (`₹`)**, and **direct smart contract settlement** on Ethereum (Hardhat Localhost).

---

## 1. Complete Technology Stack

| Layer | Technology / Library | Version | Purpose in AuctionChain |
| :--- | :--- | :--- | :--- |
| **Smart Contracts** | **Solidity** | `^0.8.24` | Core smart contracts (`Auction.sol` & `PriceOracle.sol`) |
| **Contract Security** | **OpenZeppelin Contracts** (`@openzeppelin/contracts`) | `^5.1.0` | `ReentrancyGuard` (`nonReentrant`) protection on all ETH transfers & settlements |
| **Local Blockchain** | **Hardhat Network** (`hardhat`, `@nomicfoundation/hardhat-ethers`) | `^2.22.0` | Local Ethereum JSON-RPC node (`http://127.0.0.1:8545`, `Chain ID: 31337`) |
| **Web3 / EVM Client** | **Ethers.js v6** (`ethers`) & **MetaMask** (`window.ethereum`) | `^6.13.0` | Wallet connection, contract ABI encoding, transaction signing & receipt verification |
| **Frontend Framework** | **React 19** + **TypeScript** + **Vite 6** | `^19.0.0` | Role-based Web3 Single Page Application (Seller, Bidder, Admin dashboards) |
| **Styling & UI** | **Tailwind CSS v4** + **Lucide React** | `^4.1.14` | Responsive dark-themed layout, workflow diagrams, and interactive modals |
| **3D Visualization** | **Three.js** + **React Three Fiber / Drei** | `^0.170.0` | Interactive 3D Honda City sedan showcase in the hero section |
| **Backend Gateway** | **Node.js** + **Express** + **TSX** | `^4.21.2` | API gateway (`Port 3000`), valuation routing, and terminal execution audit logs |
| **AI Valuation Engine** | **Gemini 2.5 Flash** (`@google/genai`) / **FastAPI + Scikit-Learn** | `^1.29.0` | Pre-owned Indian vehicle market valuation in `₹` (INR) & integer paise (`Port 8000`) |
| **Price Oracle Daemon** | **Node.js Background Service** (`priceFeedDaemon.js`) | `v20+` | Autonomous ETH/INR rate synchronization and `PriceOracle.sol` registration |

---

## 2. Simplified 4-Step Auction Workflow

AuctionChain uses a streamlined, transparent 4-step auction lifecycle without requiring upfront bidder deposits during the bidding window:

1. **Step 1 — Seller Lists Vehicle & Gets AI Valuation**
   - The Seller enters the vehicle specifications (Brand, Model, Year, Mileage in km, Fuel Type, Transmission, Condition) and runs the **AI Valuation Engine** to get an estimated fair market price in **Indian Rupees (`₹`)**.
   - The AI valuation and canonical **SHA-256 vehicle data hash** are anchored on-chain in `PriceOracle.sol`.
   - The Seller sets the **Starting Price (ETH)** and **Bidding Window Duration** and deploys the listing to `Auction.sol` via MetaMask.

2. **Step 2 — Bidders Place Confidential Bids (`0 ETH` Upfront)**
   - While the countdown timer is active, Bidders submit their bid amounts through MetaMask (`Auction.commitBid`).
   - **No upfront ETH deposit** is locked when placing a bid—bidders only sign the transaction (`0 ETH` transfer + standard gas fee).
   - All bid amounts remain hidden from competing bidders and the seller while the bidding window is open.

3. **Step 3 — Bidding Window Closes, Bids Revealed & Seller Approves Winner**
   - When the timer reaches `00:00` (or when the Seller clicks **End Bidding Window Now**), all participant bids are revealed to the Seller and every participant, ranked highest to lowest.
   - The highest bidder is highlighted for the Seller, who clicks **Approve Highest Bid** (`Auction.finalizeAuction`) in MetaMask.

4. **Step 4 — Winner Pays Full Amount & Auction Closes**
   - Once approved by the Seller, the winning Bidder clicks **Pay Full Bid Amount** (`Auction.settleWinningBid`) in MetaMask.
   - The smart contract transfers the full ETH payment directly to the Seller's wallet and permanently closes the auction as **Completed & Sold**.

---

## 3. System Architecture (4 Local Servers)

When running locally via `scripts\start-all.bat`, the platform operates across **4 coordinated processes**:

1. **Server 1 — Blockchain Node (`Port 8545`)**: Runs the local Hardhat Ethereum network (`Chain ID: 31337`), deploys `PriceOracle.sol` and `Auction.sol`, and mines every transaction.
2. **Server 2 — AI Valuation Server (`Port 8000`)**: Evaluates vehicle specifications (Brand, Model, Year, Mileage, Condition) and returns an estimated resale value in Indian Rupees (`₹`).
3. **Server 3 — Price Bridge Service (`Oracle Daemon`)**: Converts between Indian Rupees (`₹`) and ETH (`1 ETH = ₹2,50,000`) and registers AI valuations on-chain using Account `#4`.
4. **Server 4 — Web Application (`Port 3000`)**: Serves the React 19 Web3 interface and connects directly to your browser's **MetaMask** wallet and the local Hardhat node.

---

## 4. Repository Structure

```text
AuctionChain/
├── blockchain/                  # Hardhat Smart Contract Suite (Solidity 0.8.24 + OpenZeppelin)
│   ├── contracts/
│   │   ├── Auction.sol          # Vehicle Auction Smart Contract (ReentrancyGuard)
│   │   └── PriceOracle.sol      # ETH/INR Price Feed & AI Valuation Registry
│   ├── scripts/
│   │   ├── startWithAutoDeploy.js # Compiles & auto-deploys contracts on startup
│   │   ├── deployLocal.js       # Deploys PriceOracle.sol & Auction.sol to Port 8545
│   │   └── priceFeedDaemon.js   # Autonomous ETH/INR oracle service (Account #4)
│   └── test/                    # Smart contract unit & integration tests
├── frontend/                    # React 19 + TypeScript + Tailwind CSS + Three.js UI
│   └── src/
│       ├── components/          # Navbar, 3D Honda City Scene, Receipt Inspector Modal
│       ├── context/             # WalletContext (Hardhat RPC & MetaMask state sync)
│       ├── data/                # Seeded Indian vehicle auctions
│       ├── lib/                 # Hashing utilities, INR/ETH formatters, contract configs
│       ├── pages/               # Overview, HowItWorks, Architecture, Marketplace, Dashboards
│       ├── services/            # MetaMask & Hardhat JSON-RPC transaction service
│       └── types/               # TypeScript domain interfaces
├── scripts/                     # Windows (.bat) 1-click setup & 4-terminal launcher scripts
├── server.ts                    # Express Gateway + AI Valuation API + Terminal Audit Logger
└── package.json                 # Unified scripts and dependencies
```

---

## 5. Step-by-Step Local Setup & Testing Guide

### 5.1 Prerequisites
- **Node.js**: `v18.x` or `v20.x+` (with `npm`)
- **Browser**: Chrome, Brave, or Edge with the **MetaMask** extension installed

### 5.2 Step 1 — Install Dependencies (`scripts\setup.bat`)
From the project root directory, run:

```cmd
scripts\setup.bat
```

This creates your `.env` file from `.env.example` and installs all root and `blockchain/` packages.

### 5.3 Step 2 — Add Your `GEMINI_API_KEY` in `.env`
Open `.env` in the root folder and set your Gemini API key:

```ini
PORT=3000
GEMINI_API_KEY=your_gemini_api_key_here
```

### 5.4 Step 3 — Launch All 4 Servers (`scripts\start-all.bat`)
Run the launcher script:

```cmd
scripts\start-all.bat
```

Wait ~10 seconds for **Terminal 1 (Hardhat Node)** to compile and deploy `PriceOracle.sol` and `Auction.sol`, then open **`http://localhost:3000`**.

### 5.5 Step 4 — Configure MetaMask for Hardhat (`Chain ID: 31337`)
Add the local Hardhat network in MetaMask:
- **Network Name**: `Hardhat Localhost 8545`
- **RPC URL**: `http://127.0.0.1:8545`
- **Chain ID**: `31337`
- **Currency Symbol**: `ETH`

Import the test accounts into MetaMask using **Add account → Import account**:

| Role | Hardhat Account | ENS Label | Address | Private Key |
| :--- | :--- | :--- | :--- | :--- |
| **Seller** | Account #0 | `seller.auction.eth` | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` | `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80` |
| **Bidder 1** | Account #1 | `bidder1.auction.eth` | `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` | `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d` |
| **Bidder 2** | Account #2 | `bidder2.auction.eth` | `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC` | `0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a` |
| **Admin** | Account #3 | `admin.auction.eth` | `0x90F79bf6EB2c4f870365E785982E1f101E93b906` | `0x7c852118294e51e653712a81e5800f419141751be58f605c371e15141b007a6` |

### 5.6 Step 5 — End-to-End Walkthrough
1. **Create Auction (Seller)**: Connect as **Seller**, click **Create Auction**, enter vehicle details, click **Get AI Valuation**, set the starting price and timer, and confirm `createAuction` in MetaMask.
2. **Place Bids (Bidder 1 & Bidder 2)**: Switch to **Bidder 1** and **Bidder 2**, open the listing, and submit competing bids (`0 ETH` upfront).
3. **End Bidding Window & Approve Winner (Seller)**: Switch back to **Seller**, click **End Bidding Window Now** (or wait for the countdown), review all revealed bids, and click **Approve Highest Bid**.
4. **Pay Seller & Complete Sale (Winning Bidder)**: Switch to the winning **Bidder**, click **Pay Full Bid Amount**, and confirm in MetaMask. The ETH is transferred to the Seller's wallet and the auction closes.
