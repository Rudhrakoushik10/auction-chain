# AuctionChain — Data & State Storage Design

- **On-Chain State (`PriceOracle.sol` & `Auction.sol`)**: Authoritative source of truth for vehicle prediction records (`predictionId`, `predictedPricePaise`, `productDataHash`), auction terms (`startingPrice`, `reservePrice`, `fixedDeposit`), sealed commitments, revealed bids, and pull-based refunds/proceeds.
- **Browser Local Vault (`localStorage` + `.json` Export)**: Stores the bidder's secret `bidAmount` and 32-byte `salt` locally and exports a portable `.json` backup file for the Reveal phase.
