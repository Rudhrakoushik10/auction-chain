# AuctionChain — Security Architecture & Threat Model

## 1. Threat Model & Mitigations

| Threat / Attack Vector | Traditional Auction Vulnerability | AuctionChain Defense |
| :--- | :--- | :--- |
| **Mempool Front-Running & Bid Sniping** | Observers inspect pending bid transactions and submit a slightly higher bid with higher gas. | **Keccak-256 Commit-Reveal**: Plaintext bids are never broadcast during the Commit Phase; only `keccak256(bidAmountWei, salt, bidder)` is submitted. |
| **Deposit Value Inference** | If bidders send their bid amount as `msg.value`, anyone can read the bid value on-chain even if the calldata is hashed. | **Uniform Fixed Collateral Deposit**: Every bidder locks the exact same `fixedDepositEth` during the Commit Phase. |
| **Commitment Replay / Copycat Attack** | Bidder B copies Bidder A's `commitmentHash` and tries to claim the same bid. | **Sender-Bound Hashing**: `msg.sender` is packed directly inside `keccak256(abi.encodePacked(bidAmountWei, salt, msg.sender))`. |
| **Strategic Non-Reveal Griefing** | A bidder submits multiple high commitments and refuses to reveal the highest one if competitors bid low. | **Collateral Forfeiture**: Unrevealed commitments forfeit their locked `fixedDepositEth`. |
| **Vehicle Spec Tampering After Valuation** | Seller alters mileage or accident history after obtaining a high valuation. | **Canonical SHA-256 Anchoring**: The vehicle's sorted JSON attributes are hashed (`product_data_hash`) and anchored in `PriceOracle.sol`. |
| **Reentrancy & Refund DoS Attacks** | Malicious contract reverts inside a loop of automatic push refunds, freezing auction finalization. | **Pull-Over-Push Escrow + `ReentrancyGuard`**: Each participant withdraws their own refund or proceeds independently. |
| **Cross-Account UI State Leakage** | Switching wallets on a shared demo machine leaks confirmation banners or bidding forms to non-bidders. | **Role-Gated Views & Account-Switch Reset**: Commit forms are restricted strictly to `Bidder` accounts, and switching wallets clears transient confirmation banners and resets navigation. |
