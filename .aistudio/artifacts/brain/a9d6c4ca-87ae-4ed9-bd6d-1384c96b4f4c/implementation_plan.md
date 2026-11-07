# AuctionChain — Reference Web3 & MetaMask Reliability Upgrade Plan

This plan integrates the proven Web3, MetaMask popup signing, nonce-mismatch diagnostics, live receipt inspection, and smart contract probe-safety patterns from your reference project into **AuctionChain** so live demonstrations run smoothly even across Hardhat restarts.

## User Review & Critical Decisions

> [!IMPORTANT]
> **Confirmed Priority — Explicit Nonce Mismatch Detection & Guided Recovery After Hardhat Restarts**
> When the Hardhat terminal is closed and reopened, the local blockchain resets to Block `#0` while MetaMask retains its cached transaction history and higher nonce counter.
> - **Clear Diagnostic Alert**: Whenever a nonce mismatch (`Nonce too high` / `Expected nonce to be X but got Y`) or node reset is detected during wallet connection or transaction signing, the UI will display a clear, human-readable alert explaining that the Hardhat node was restarted and showing the exact manual steps (**MetaMask → Settings → Advanced → Clear activity tab data**).
> - **One-Click & Automatic Nonce Sync (`hardhat_setNonce`)**: Alongside the clear educational error message for your demonstration, the system will also provide a one-click **"Auto-Sync Hardhat Nonce"** action (using Hardhat's `hardhat_setNonce` RPC method) so you can demonstrate the error clearly and then resolve it immediately during a live presentation.

- **Confirmed Decision 1 — Real MetaMask Popup Signing for All Role Actions**: Every auction lifecycle action (`Create Auction`, `Commit Sealed Bid`, `Reveal Bid`, `Finalize Auction`) will trigger a live MetaMask confirmation popup and record real on-chain transaction hashes, block numbers, and gas metrics on `http://127.0.0.1:8545`.
- **Confirmed Decision 2 — Live On-Chain Transaction Receipt Inspector Modal**: Clicking any transaction hash (`0x...`) will query `eth_getTransactionReceipt` and `eth_getTransactionByHash` directly from `http://127.0.0.1:8545` to verify on-chain status (`0x1 Success`), block hash, gas used, nonce, and confirmations.
- **Confirmed Decision 3 — Probe-Safe Solidity Contracts & Dedicated Deployer Account #9**: `PriceOracle.sol` and `Auction.sol` will include ERC-165/token probe-safe methods so MetaMask never triggers `<unrecognized selector>` warnings in Terminal 1, and contracts will be deployed via Hardhat Account #9 so all 4 human role accounts (`Admin`, `Seller`, `Bidder 1`, `Bidder 2`) start with `Nonce = 0` and `10,000.00 ETH`.

---

## 1. Overview & Core Concept

- **What It Does**: Upgrades AuctionChain's blockchain interaction layer so that wallet connections, contract deployments, sealed-bid transactions, nonce mismatch warnings after Hardhat restarts, and receipt verifications behave with the same reliability as your reference project.
- **Target Audience / Persona**: Project evaluators, instructors, and live demonstration audiences observing multi-role interactions (`Admin`, `Seller`, `Bidder 1`, `Bidder 2`) across MetaMask and the 4 local server terminals.
- **Key Value**: Eliminates silent or cryptic MetaMask errors during live demos, turns Hardhat restart nonce mismatches into a clear, demonstrable security/state checkpoint with guided recovery, and provides verifiable on-chain transaction receipts.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Hardhat Restart & Nonce Mismatch Flow**:
     - If Terminal 1 (`Hardhat Node`) is closed and reopened, the app detects if a connected wallet or transaction encounters a stale MetaMask nonce (`Expected nonce to be 0 but got N`) or if previously stored local auctions belong to an earlier Hardhat session.
     - A structured **MetaMask Nonce & Chain Reset Diagnostic Banner** appears in both the Wallet Modal and the active workspace header, clearly stating:
       - **Cause**: Hardhat Node was restarted and reset on-chain nonces to `0`, while MetaMask still holds cached nonce data.
       - **Manual Fix**: Step-by-step instruction (`MetaMask → Settings → Advanced → Clear activity tab data`).
       - **Instant Demo Recovery**: Buttons to **"Sync Nonce on Hardhat (`hardhat_setNonce`)"** or **"Reset Stale Demo State"**.
  2. **Live MetaMask Transaction Confirmation Flow**:
     - When `Seller` creates an auction or `Bidder 1` / `Bidder 2` commits, reveals, or finalizes a bid, MetaMask opens a transaction confirmation popup on `Chain ID 31337`.
     - If MetaMask's active account matches the current role, it calls the contract directly; if MetaMask is focused on another imported account, it uses the safe role-confirmation pattern so `eth_call` simulation never reverts.
  3. **Live On-Chain Transaction Receipt Inspector Modal**:
     - Clicking any transaction hash (`0x...`) in the Seller, Bidder, Admin, or Auction Details views opens a modal displaying live RPC verification from `http://127.0.0.1:8545`: execution status (`0x1 Success`), block number, block hash, gas used, effective gas price, sender/recipient addresses, nonce, and decoded contract events.
- **Visual Identity & Theme**:
  - **Aesthetic Direction**: Institutional automotive financial marketplace and dark blockchain verification console.
  - **Color Palette & Mood**: Deep slate canvas (`#090D1A` / `#0F172A`), crisp structural borders (`#1E293B`), primary action blue (`#2563EB`), verified emerald (`#16A34A`), warning amber (`#D97706`), and error/mismatch crimson (`#DC2626`).
  - **Typography & Hierarchy**: `Outfit` for headings and navigation, `DM Sans` for body copy, and `JetBrains Mono` (`tabular-nums`) for all Ethereum addresses, nonces, block numbers, ETH amounts, and SHA-256 / Keccak-256 hashes.
- **Interactive Feedback & Motion**:
  - Restrained 150ms transitions; explicit 5-stage transaction progress feedback (`Waiting for MetaMask Approval` → `Transaction Submitted` → `Pending Confirmation` → `Confirmed On-Chain` / `Nonce or Execution Error`).

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Dual Nonce Mismatch Handling (Clear Error Message + One-Click Auto-Sync)**
  - *Chosen Approach*: When a nonce mismatch occurs after restarting Hardhat, first surface a clear, educational error banner explaining why MetaMask's cached nonce conflicts with the fresh Hardhat node and how to clear MetaMask's activity tab, accompanied by a button that executes `hardhat_setNonce` to align the node automatically.
  - *Why*: During a project defense or demo, evaluators often ask what happens when the local chain resets. Showing a clear diagnostic message proves you understand EVM transaction nonces, while the one-click sync saves time during the demo.
  - *Alternatives Considered*: Silently auto-fixing without showing an explanation (hides the educational demonstration value) or failing with a raw JSON-RPC stack trace (confusing during a demo).
- **Decision 2: Dedicated Deployer Account #9 (`0xa0Ee7A...9720`)**
  - *Chosen Approach*: Deploy `PriceOracle.sol` and `Auction.sol` using Hardhat Account #9 and transfer contract administration to Account #0 (`Admin`).
  - *Why*: Ensures all 4 human role accounts (`Account #0` Admin, `Account #1` Seller, `Account #2` Bidder 1, `Account #3` Bidder 2) start at `Nonce 0` (`0x0`) and `10,000.0000 ETH`, preventing immediate nonce mismatches on Account #0 right after startup.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

- **Architecture & Component Diagram**:

```text
┌───────────────────────────────────────────────────────────────────────────┐
│                     AuctionChain Frontend (Port 3000)                     │
│  ┌─────────────────────┐  ┌──────────────────────┐  ┌──────────────────┐  │
│  │   AuthModal &       │  │  Role Dashboards &   │  │   On-Chain Tx    │  │
│  │ Nonce Diagnostic UI │  │   Auction Details    │  │ Receipt Inspector│  │
│  └──────────┬──────────┘  └──────────┬───────────┘  └────────┬─────────┘  │
│             └────────────────────────┼───────────────────────┘            │
│                                      ▼                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │        Web3 & Wallet Service (Ethers.js v6 + RPC Heartbeat)         │  │
│  │  • MetaMask Popup Signing          • Nonce Mismatch Detector        │  │
│  │  • hardhat_setNonce Auto-Sync      • Live Receipt Verifier          │  │
│  └─────────────────┬─────────────────────────────────┬─────────────────┘  │
└────────────────────┼─────────────────────────────────┼────────────────────┘
                     │ EIP-1193 / Ethers v6            │ Direct JSON-RPC 2.0
                     ▼                                 ▼
      ┌──────────────────────────────┐  ┌────────────────────────────────┐
      │  MetaMask Browser Extension  │  │  Hardhat Node (127.0.0.1:8545) │
      │  Accounts #0, #1, #2, #3     │─►│  • PriceOracle.sol (Probe-Safe)│
      │  Chain ID 31337 (0x7a69)     │  │  • Auction.sol     (Probe-Safe)│
      └──────────────────────────────┘  └────────────────────────────────┘
```

- **Data Model & State**:
  - `NonceDiagnosticInfo`: Tracks `{ detected: boolean, address: string, expectedHardhatNonce: number, metaMaskNonce?: number, message: string }` so any component can display the nonce mismatch banner and trigger recovery.
  - `LiveReceiptVerification`: Stores live RPC verification fields (`verified`, `blockNumber`, `blockHash`, `transactionIndex`, `gasUsed`, `effectiveGasPriceGwei`, `status`, `confirmations`, `from`, `to`, `nonce`, `events`, `error`).
- **Interactive Component & State Mapping**:
  - **Wallet Connection & Heartbeat**: Pings `http://127.0.0.1:8545` every 3 seconds for `eth_chainId`, `eth_blockNumber`, `eth_getBalance`, and `eth_getTransactionCount`. Detects if Hardhat restarted (`latestBlock <= 2` while cached transactions exist from a higher block) and notifies the user with a one-click reset/sync bar.
  - **Contract Execution (`createAuction`, `commitBid`, `revealBid`, `finalizeAuction`)**: Invokes MetaMask confirmation, catches `Nonce too high` / `Expected nonce to be X but got Y` errors, surfaces the clear diagnostic message, and offers one-click `hardhat_setNonce` synchronization + retry.
  - **Transaction Receipt Inspector Modal**: Opens whenever any `txHash` badge or link is clicked, querying live receipt data from `http://127.0.0.1:8545`.
