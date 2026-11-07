# AuctionChain — Oracle Server Documentation (`oracle/`)

The Oracle Server (`oracle/`) bridges off-chain `vehicle-v1` INR predictions from `backend/` to `PriceOracle.sol` on Hardhat Chain ID `31337` by converting `predicted_price_inr` into integer paise (`predicted_price_inr * 100`) and signing `registerPrediction(...)` with the dedicated Oracle account (**Account 4**: `0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65`).
