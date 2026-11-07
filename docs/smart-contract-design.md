# AuctionChain — Smart Contract Design (`Auction.sol` & `PriceOracle.sol`)

- **`PriceOracle.sol`**: Stores integer valuation units (`USD cents = round(USD * 100)`), `productDataHash` (`bytes32`), `modelVersion` (`"1.0.0"`), `timestamp`, and `oracleAddress`. Includes `onlyOwner` `setAuthorizedOracle(address)`.
- **`Auction.sol`**: Enforces domain-bound commitment hashing `keccak256(abi.encode(auctionId, msg.sender, bidAmount, salt))`, uniform fixed ETH deposits, seller self-bid prevention (`SellerCannotBidOnOwnAuction`), reserve price checks (`SOLD` vs `NO SALE`), and pull-based `claimRefund()` and `withdrawSellerProceeds()`.
