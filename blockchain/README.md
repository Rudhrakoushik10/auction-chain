# AuctionChain — Hardhat Smart Contract Workspace (`/blockchain`)

This directory contains the Solidity `0.8.28` smart contracts, deployment scripts, autonomous ETH/INR price oracle feeder, and automated test suite for **AuctionChain**.

---

## 1. Smart Contracts

- **`contracts/PriceOracle.sol`**
  - On-chain registry for AI Indian vehicle valuations (`prediction_id`, `predicted_price_paise`, `product_data_hash`, `model_version`).
  - Stores the live **ETH/INR exchange rate** updated by the authorized Oracle signer (`Account #3`).
- **`contracts/Auction.sol` (`SealedAuction`)**
  - Implements the 4-phase sealed-bid auction state machine (`Commit` → `Reveal` → `Finalizable` → `Sold / No Sale`) with `keccak256(abi.encodePacked(bidAmountWei, salt, bidderAddress))` verification and pull-payment escrow settlement.

---

## 2. Commands

Run these commands from the `/blockchain` directory (or via the root `package.json` scripts):

```bash
# Compile smart contracts
npx hardhat compile

# Run unit and integration tests
npx hardhat test

# Start local Hardhat JSON-RPC node on http://127.0.0.1:8545 (Chain ID: 31337)
npx hardhat node

# Deploy PriceOracle.sol and SealedAuction.sol to localhost
npx hardhat run scripts/deploy.js --network localhost

# Start the autonomous ETH/INR Price Oracle feeder (Account #3)
node scripts/priceFeeder.js
```
