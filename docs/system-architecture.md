# AuctionChain — System Architecture

## 1. High-Level 4-Service Topology

AuctionChain operates across four coordinated local services:

| Terminal / Service | Port / Identity | Responsibility |
| :--- | :--- | :--- |
| **1. Hardhat Blockchain Node** | `http://127.0.0.1:8545` (`Chain ID: 31337`) | Executes Solidity smart contracts (`PriceOracle.sol` and `SealedAuction.sol`), mines blocks, and manages the 5 deterministic accounts. |
| **2. AI Vehicle Valuation Engine** | `http://127.0.0.1:8000` (Proxied via `:3000/api`) | Evaluates Indian pre-owned vehicle specifications, computes `₹` (INR) fair market valuations & SHA-256 hashes, anchors records to `PriceOracle.sol`, and outputs terminal proof logs. |
| **3. Autonomous ETH/INR Price Feeder** | Hardhat Account #3 (`0x90F7...3b906`) | Periodically fetches live ETH/INR exchange rates and updates `PriceOracle.sol` on-chain via `updateEthInrRate()`. |
| **4. React 19 + TypeScript Web3 Frontend** | `http://localhost:3000` | Role-based Web3 interface connecting to MetaMask (`window.ethereum`) and the Hardhat JSON-RPC node. |

---

## 2. End-to-End Sequence Flow

### Phase A: AI Valuation & Oracle Anchoring
1. **Seller (`seller.eth`)** enters structured vehicle attributes in `CreateAuction.tsx`.
2. Frontend sends `POST /api/predict-price` to `server.ts`.
3. `server.ts` canonicalizes the vehicle specification JSON, computes its **SHA-256 hash (`product_data_hash`)**, calculates the fair market valuation in **Indian Rupees (`₹`)** and integer **paise**, and prints the `[AI VALUATION ENGINE · PROOF OF INFERENCE]` banner in the terminal.
4. Frontend calls `POST /api/oracle/register`, which anchors the `prediction_id`, `predicted_price_paise`, and `product_data_hash` into `PriceOracle.sol` and logs the `[PRICE ORACLE CONTRACT · PriceOracle.sol ANCHOR PROOF]` banner in the terminal.

### Phase B: Auction Deployment
1. Seller configures `startingBidEth`, `reservePriceEth`, `fixedDepositEth`, `commitDurationSeconds`, and `revealDurationSeconds`.
2. Seller clicks **Confirm & Deploy to SealedAuction.sol**.
3. `walletService.ts` triggers a **MetaMask transaction confirmation popup** (`eth_sendTransaction`) from Seller (`0xf39F...2266`) to `SealedAuction.sol`.
4. Upon confirmation, the backend terminal logs `[METAMASK_CONFIRMED_TX · ON-CHAIN EXECUTION PROOF]`.

### Phase C: Commit Phase (Sealed Bidding)
1. **Bidder (`bidder1.eth` / `bidder2.eth`)** enters a secret bid amount in ETH.
2. Browser generates a random 32-byte hex `salt` and computes:
   ```solidity
   bytes32 commitmentHash = keccak256(abi.encodePacked(bidAmountWei, salt, bidderAddress));
   ```
3. Browser saves the passkey locally (`auctionchain_reveal_secret_v1_<auctionId>_<bidderAddress>`) and triggers a **MetaMask confirmation popup** sending `fixedDepositEth` to `commitBid(auctionId, commitmentHash)`.

### Phase D: Reveal Phase (1-Click Verification)
1. When the Commit window closes, the auction enters the **Reveal Phase**.
2. Bidder opens the auction page; the UI automatically loads their saved `bidAmountEth` and `salt` and displays a 1-click **Reveal My Bid Now** button.
3. Bidder confirms `revealBid(auctionId, bidAmountWei, salt)` in MetaMask.
4. `SealedAuction.sol` recomputes `keccak256(abi.encodePacked(bidAmountWei, salt, msg.sender))` and verifies it matches the stored `commitmentHash`.

### Phase E: Finalization & Pull-Based Escrow Settlement
1. Seller or Admin executes `finalizeAuction(auctionId)` via MetaMask.
2. If `highestBid >= reservePrice`, the auction transitions to **Sold**:
   - **Winner** calls `settleWinnerPayment(auctionId)` with `msg.value = highestBid - fixedDeposit`.
   - **Losing Bidders** call `claimRefund(auctionId)` to recover 100% of their `fixedDeposit`.
   - **Seller** calls `withdrawSellerProceeds(auctionId)` to receive the full `highestBid` proceeds.
