# Implementation Plan: Live ETH/INR Price Feed Oracle (Chainlink-Style)

## 1. Concept & Architectural Value
Instead of using an Oracle as a redundant intermediary for AI car valuations, an **ETH/INR Price Feed Oracle** provides genuine blockchain value:
- **Chainlink Standard (`AggregatorV3Interface`)**: Implements `latestRoundData()`, `getLatestPrice()`, and `updatePrice()` on `PriceOracle.sol`.
- **Dynamic On-Chain Valuation**: Stores the real-time exchange rate of ETH to Indian Rupees (INR) with 8 decimals (standard Chainlink convention) or integer paise on-chain.
- **Smart Contract & Client Integration**: The smart contract and frontend query the Price Feed Oracle to convert between Test ETH bids and Indian Rupees (`₹`) dynamically rather than relying on a static hardcoded number.
- **Transparent Admin / Simulator**: Admin or automated relayer can update or simulate market price fluctuations (e.g., ETH = ₹2,45,000 → ₹2,60,000), immediately updating the website's real-time INR display across all auction lots.

---

## 2. Technical Implementation Details

### A. Smart Contract (`blockchain/contracts/PriceOracle.sol` & `IPriceOracle.sol`)
1. Add Chainlink-style Aggregator interface and state variables:
   - `int256 private ethInrPrice;` (e.g., `25000000000000` = ₹250,000.00 with 8 decimals, or paise equivalent).
   - `uint8 public constant decimals = 8;`
   - `string public constant description = "ETH / INR Price Feed";`
   - `uint256 public latestTimestamp;`
   - `uint80 public latestRoundId;`
2. Functions:
   - `latestRoundData()`: Returns `(roundId, answer, startedAt, updatedAt, answeredInRound)` matching the standard Chainlink Aggregator interface.
   - `getLatestEthInrPrice()`: Returns the price in Indian Rupees (and paise).
   - `updateEthInrPrice(int256 _newPrice)`: Allows authorized oracle signer or admin to broadcast fresh exchange rate data, emitting `PriceUpdated(roundId, price, timestamp)`.

### B. Frontend Integration & Oracle Sync
1. **Dynamic Exchange Rate in Frontend (`lib/crypto.ts` & `context/WalletContext.tsx`)**:
   - Provide an observable `liveEthInrRate` initialized to ₹250,000 and queryable from `PriceOracle.sol`.
   - Update `convertEthToInr` and `formatEthToInr` to use the dynamic on-chain rate.
2. **Oracle Price Feed Indicator in Header & Admin Dashboard**:
   - Display a live ticker badge in the header: **"Oracle Feed: 1 ETH = ₹2,50,000 INR"** with a green pulse dot indicating live on-chain status.
   - In `AdminDashboard.tsx`, show the **Live Chainlink ETH/INR Price Feed** panel where the admin can view round data and test simulated price updates.

---

## 3. Verification & Execution Status: COMPLETED
1. **Smart Contracts**: `PriceOracle.sol` & `IPriceOracle.sol` updated with `AggregatorV3Interface` methods (`latestRoundData()`, `getLatestEthInrRate()`, `updateEthInrPrice()`, `decimals() = 8`).
2. **Frontend Dynamic Rates**: `crypto.ts` and `WalletContext.tsx` dynamically convert Test ETH bids and reserves to Indian Rupees (`₹`) based on the live oracle price feed.
3. **Live UI Badges & Admin Console**:
   - Live Chainlink ticker badge displayed in `AuthenticatedHeader.tsx` (`Chainlink ETH/INR: ₹2,50,000`).
   - Admin Dashboard equipped with live Chainlink feed monitor, round statistics, and simulation tool.
4. **Verification**: `compile_applet` and `lint_applet` both succeeded with 0 errors. Dev server restarted and active.
