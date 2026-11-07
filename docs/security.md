# AuctionChain — Security & Cryptographic Guarantees

1. **Domain-Bound Commitment Hash**: `keccak256(abi.encode(auctionId, bidderAddress, bidAmount, salt))` prevents cross-auction and cross-wallet replay attacks.
2. **Uniform Fixed Participation Deposit**: Prevents observers from inferring a bidder's hidden bid value from `msg.value` during the Commit phase.
3. **Pull-Based Withdrawals & Reentrancy Guard**: Protects `claimRefund` and `withdrawSellerProceeds` against reentrancy and DoS reverts.
