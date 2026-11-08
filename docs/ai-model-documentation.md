# AuctionChain — AI Indian Vehicle Valuation Engine Documentation

## 1. Overview

The **AuctionChain AI Vehicle Valuation Engine** (`server.ts` — `AuctionChain AI v2.4 (India Market)`) provides real-time, advisory market valuations in **Indian Rupees (`₹` INR)** for pre-owned passenger vehicles listed on the platform.

Every prediction produces:
1. **`predicted_price_inr`**: Estimated fair market resale value in Indian Rupees (`₹`).
2. **`predicted_price_paise`**: Exact integer paise (`Math.round(predicted_price_inr * 100)`) for lossless storage in `PriceOracle.sol` (`uint256`).
3. **`confidence_min_inr` / `confidence_max_inr`**: Fair market valuation range (`±7%`).
4. **`product_data_hash`**: Canonical `0x`-prefixed **SHA-256** digest of the vehicle's specification JSON.
5. **`feature_breakdown`**: Transparent factor-by-factor impact weights explaining how the valuation was derived.

---

## 2. Input Schema (`VehicleAttributes`)

| Field | Type | Example | Description |
| :--- | :--- | :--- | :--- |
| `brand` | `string` | `"Hyundai"` | Vehicle manufacturer (Maruti Suzuki, Hyundai, Tata, Mahindra, Toyota, Honda, Kia, etc.) |
| `model` | `string` | `"Creta SX"` | Specific model and trim variant |
| `year` | `number` | `2021` | Manufacturing / registration year |
| `mileage` | `number` | `32000` | Odometer reading in kilometers (`km`) |
| `fuel_type` | `string` | `"Diesel"` | `Petrol`, `Diesel`, `Electric`, `CNG`, or `Hybrid` |
| `engine_type` | `string` | `"1.5L CRDi Diesel"` | Engine displacement / powertrain specification |
| `transmission` | `string` | `"Manual"` | `Manual` or `Automatic` |
| `exterior_color` | `string` | `"Polar White"` | Exterior paint finish |
| `interior_color` | `string` | `"Dual Tone"` | Cabin trim color |
| `accident_history` | `boolean \| null` | `false` | Reported structural or collision history |

---

## 3. Canonical SHA-256 Specification Hashing

To prove that the AI valuation corresponds to the exact vehicle specifications displayed to bidders, `server.ts` serializes the normalized vehicle attributes with alphabetically sorted keys (`canonicalizeJson`) and computes:

$$\text{product\_data\_hash} = \text{0x} \parallel \text{SHA256}(\text{canonical\_json})$$

This 32-byte hash (`bytes32`) is anchored on-chain in `PriceOracle.sol` alongside the `prediction_id` and `predicted_price_paise`.

---

## 4. Valuation Factor Breakdown

Each valuation returns four structured explanation factors:
1. **Make & Segment Tier**: Base ex-showroom segment positioning in the Indian market (e.g., Compact SUV, Executive Sedan, EV, Luxury).
2. **Age & Depreciation Curve**: Compound annual Indian market depreciation based on manufacturing year (`12%` per year floor-clamped).
3. **Odometer Utilization (`km`)**: Adjustment relative to standard Indian passenger usage (`~12,000 km/year`).
4. **Powertrain, Transmission & History**: Premiums for Diesel/EV/Hybrid powertrains and Automatic transmissions, or deductions (`-18%`) for reported accident history.
