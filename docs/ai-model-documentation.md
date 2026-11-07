# AuctionChain — Vehicle AI Valuation Model (`backend/`)

- **Category**: Exclusively `vehicle` (`vehicle-v1`).
- **Inputs**: `brand`, `model`, `manufacturing_year`, `mileage_km`, `fuel_type`, `transmission`, `condition`, `original_price_inr`.
- **Output Currency**: Indian Rupees (`INR` / `₹`), converted to integer paise (`INR * 100`) for on-chain storage in `PriceOracle.sol`.
- **Mock Simulation**: `frontend/src/services/mock/mockAIService.ts` provides deterministic local inference when `backend/` is running in mock/offline mode.
