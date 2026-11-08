# AuctionChain — Project Overview

## 1. Executive Summary

**AuctionChain** is a decentralized sealed-bid auction platform engineered for the Indian pre-owned passenger vehicle market. Traditional online vehicle auctions suffer from three structural weaknesses:
1. **Last-Second Bid Sniping & Front-Running**: In open ascending auctions, participants wait until the final seconds to outbid competitors by a minimal increment, or observe pending transactions in the mempool to outbid them.
2. **Valuation Opacity**: Buyers and sellers frequently lack an objective, transparent baseline for a pre-owned vehicle's fair market value in Indian Rupees (`₹` INR) based on its age, odometer reading, fuel type, transmission, and accident history.
3. **Counterparty & Escrow Risk**: Centralized auction intermediaries hold deposits and settlement funds in opaque off-chain accounts.

AuctionChain solves all three challenges through a unified 3-layer architecture:
- **Layer 1 — Advisory AI Vehicle Valuation Engine (`₹` INR)**: Computes an objective fair market valuation in Indian Rupees (`₹` and integer paise), factor-by-factor price impact breakdown, and a canonical **SHA-256 specification hash** before the auction is deployed.
- **Layer 2 — On-Chain Price Oracle (`PriceOracle.sol`)**: Anchors the AI valuation record and SHA-256 vehicle specification hash on-chain and maintains a live **ETH/INR exchange rate** via an autonomous oracle node (Hardhat Account #3).
- **Layer 3 — Cryptographic Commit-Reveal Smart Contract (`SealedAuction.sol`)**: Conceals every bid during the Commit Phase using `keccak256(abi.encodePacked(bidAmountWei, salt, bidderAddress))` paired with a uniform collateral deposit (`fixedDepositEth`), verifies revealed bids mathematically during the Reveal Phase, and settles funds via a reentrancy-protected pull-payment escrow.

---

## 2. Core Design Principles

1. **Advisory AI, Sovereign Seller**:
   - The AI valuation is strictly advisory. It anchors an immutable reference valuation on-chain so bidders can evaluate the vehicle transparently, while the seller retains full freedom to set the Starting Bid, Hidden Reserve Price, and Collateral Deposit.
2. **Zero Information Leakage During Bidding**:
   - Because `msg.value` is visible on any public blockchain, requiring bidders to send their full bid amount during the Commit Phase would leak their bid size. AuctionChain requires every bidder to lock the exact same `fixedDepositEth` during the Commit Phase, ensuring complete privacy until the Reveal Phase.
3. **1-Click User-Friendly Reveal with Cryptographic Rigor**:
   - When a bidder commits a sealed bid, AuctionChain automatically stores their secret passkey (`salt` + `bidAmountEth`) in browser local storage scoped to their wallet address and auction ID, while also offering a downloadable JSON backup. During the Reveal Phase, the bidder can reveal their bid in a single click and confirm in MetaMask.
4. **Verifiable Terminal Proofs for Live Demonstrations**:
   - Every AI valuation, `PriceOracle.sol` registration, and MetaMask/Hardhat blockchain transaction prints a structured verification banner in the backend terminal so evaluators can inspect live cryptographic hashes, block numbers, and gas receipts in real time.
