# AuctionChain — Oracle Server Documentation (`oracle/`)

The Oracle Server (`oracle/`) bridges off-chain `LightGBM v1.0.0` USD predictions from `backend/` to `PriceOracle.sol` on Hardhat Chain ID `31337` by converting `predicted_price` into integer cents (`round(predicted_price * 100)`) and signing `registerPrediction(...)` with the dedicated Oracle account (**Account 4**: `0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65`).
