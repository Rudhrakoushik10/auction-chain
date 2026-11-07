# AuctionChain — Blockchain & Smart Contracts (Terminal 1)

Contains the Solidity smart contracts, deployment scripts, test suites, and Hardhat network environment for AuctionChain.

## Smart Contracts
- `contracts/Auction.sol` — Commit-reveal sealed-bid vehicle auction protocol.
- `contracts/PriceOracle.sol` — On-chain AI price registry with authorized Oracle address enforcement.

## Automated Node & Auto-Deploy (Single Terminal)
To avoid needing an extra terminal for contract deployment, `npm start` automatically:
1. Boots the local Hardhat Ethereum node on `http://127.0.0.1:8545` (Chain ID `31337`).
2. Waits until the RPC endpoint is active.
3. Automatically executes `scripts/deployLocal.js` to deploy `PriceOracle.sol` and `Auction.sol`.
4. Configures Oracle Account 4 (`0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65`).
5. Synchronizes addresses to `frontend/src/contracts/contractAddresses.json`.
6. Keeps the Hardhat node running continuously in the same terminal.

## How to Run (Terminal 1)
```bash
cd blockchain
npm install
npm start
```
*(Alternatively, `npm run node:auto`)*
