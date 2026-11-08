# AuctionChain — Smart Contract Design (`PriceOracle.sol` & `Auction.sol`)

## 1. Contract Architecture

The smart contract suite in `/blockchain/contracts/` is written in **Solidity `0.8.28`** and compiled with Hardhat (`evmVersion: "cancun"`, optimizer enabled):

1. **`PriceOracle.sol`**:
   - Stores AI valuation records (`PredictionRecord`) keyed by `uint256 predictionId`.
   - Stores and updates the live **ETH/INR exchange rate** (`ethInrRatePaise` / `ethInrRate`) pushed by the authorized Oracle node (`Account #3`).
   - Enforces role separation via `onlyAuthorizedOracle` and `onlyOwner`.
2. **`Auction.sol` (`SealedAuction`)**:
   - Manages the full lifecycle of sealed-bid vehicle auctions: `Create` → `Commit` → `Reveal` → `Finalize` → `Pull-Payment Escrow Settlement`.
   - Links each auction to its on-chain `oraclePredictionId` and `productDataHash` verified against `PriceOracle.sol`.

---

## 2. Commitment Hash Specification

During the **Commit Phase**, bidders never transmit their plaintext bid amount on-chain. Instead, the browser computes:

```solidity
bytes32 commitmentHash = keccak256(
    abi.encodePacked(
        uint256(bidAmountWei),
        bytes32(salt),
        address(bidder)
    )
);
```

- Including `address(bidder)` (`msg.sender`) inside the hash prevents replay or copycat commitment attacks where a competing bidder copies another bidder's `commitmentHash`.
- Requiring `msg.value == auction.fixedDeposit` for every `commitBid` call ensures that transaction value inspection reveals zero information about any participant's bid amount.

---

## 3. Reveal Verification & Forfeiture Rules

During the **Reveal Phase**, each bidder calls:

```solidity
function revealBid(uint256 auctionId, uint256 bidAmount, bytes32 salt) external
```

The smart contract verifies:
1. `block.timestamp` is within the Reveal window.
2. `keccak256(abi.encodePacked(bidAmount, salt, msg.sender)) == commitment.commitmentHash`.
3. `bidAmount >= auction.startingBid`.

If valid, the bid is recorded and compared against `highestBid`. Bidders who committed a hash but fail to reveal before `revealEndTime` forfeit their collateral deposit.

---

## 4. Pull-Over-Push Escrow Settlement

To eliminate reentrancy vulnerabilities and gas-limit Denial-of-Service (DoS) attacks:
- **`settleWinnerPayment(uint256 auctionId)`**: Called by `winningBidder` with `msg.value == highestBid - fixedDeposit`. Marks the auction settled and credits the seller's withdrawable proceeds.
- **`claimRefund(uint256 auctionId)`**: Called by any non-winning revealed bidder (or any revealed bidder if the reserve price was not met) to withdraw their `fixedDeposit`.
- **`withdrawSellerProceeds(uint256 auctionId)`**: Called by the seller after winner settlement to transfer `highestBid` to `seller`.
