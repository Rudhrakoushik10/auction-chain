# AuctionChain — Oracle Worker Daemon (Terminal 3)

The Oracle Daemon links the backend vehicle AI valuation service with `PriceOracle.sol` on the Hardhat Local blockchain (Chain ID `31337`).

## Responsibilities
- Listens for new vehicle auction events from `Auction.sol`.
- Queries `backend` (FastAPI on Port 8000) for machine-learned vehicle valuation.
- Formats valuation into integer units (`predictedPricePaise = INR * 100`) and canonical Keccak-256 `productDataHash`.
- Signs and broadcasts transactions to `PriceOracle.sol` using **Account 4** (`0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65`).

## How to Run (Terminal 3)
```bash
cd oracle
pip install -r requirements.txt
python oracle/main.py
```
