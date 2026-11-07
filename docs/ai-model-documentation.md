# AuctionChain — Vehicle Price Valuation Model (`backend/`)

- **Model**: LightGBM `v1.0.0` (`regression_l1`, 31 leaves, learning rate `0.03`, 934 trees, `models/vehicle_price_model.txt`).
- **Dataset**: Trained and evaluated on 4,009 US-market used-car listings (`dataset/raw/used_cars.csv`) using a group-aware 70/15/15 train/validation/test split.
- **Held-Out Test Metrics**: MAE `$9,484.57`, RMSE `$27,311.06`, R² `0.7615` (`0.8571` trimmed excluding top 0.5% exotic outliers > `$417,061`), Median AE `$3,854.70`.
- **Inputs**: Required `brand`, `model`, `year`, `mileage` (miles); optional `fuel_type`, `engine_type`, `transmission`, `exterior_color`, `interior_color`, `accident_history`, `clean_title`.
- **Output Currency**: US Dollars (`USD` / `$`), converted to integer cents (`USD * 100`) for on-chain registration in `PriceOracle.sol`.
