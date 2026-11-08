# AuctionChain — State & Data Storage Design

## 1. Hybrid On-Chain & Client Storage Model

AuctionChain follows a strict separation between **immutable cryptographic state** (stored on-chain in `PriceOracle.sol` and `SealedAuction.sol`) and **rich presentation metadata & private bidder passkeys**:

| Data Category | Storage Location | Integrity Mechanism |
| :--- | :--- | :--- |
| **Vehicle Specifications (`VehicleAttributes`)** | Off-chain JSON + UI State (`localStorage`) | Anchored on-chain via canonical SHA-256 `productDataHash` in `PriceOracle.sol` |
| **AI Valuation (`predicted_price_paise`)** | On-Chain (`PriceOracle.sol`) + UI State | Signed and anchored by Authorized Oracle (`Account #3`) |
| **Live ETH/INR Conversion Rate** | On-Chain (`PriceOracle.sol`) | Updated by `priceFeeder.js` (`Account #3`) |
| **Auction Terms & Escrow Balances** | On-Chain (`SealedAuction.sol`) | Enforced by EVM state transitions |
| **Sealed Bid Commitment (`commitmentHash`)** | On-Chain (`SealedAuction.sol`) | `keccak256(abi.encodePacked(bidAmountWei, salt, bidder))` |
| **Secret Reveal Passkey (`salt` + `bidAmountEth`)** | Client Browser `localStorage` + JSON Download | Never leaves the bidder's browser until the Reveal Phase |

---

## 2. Client-Side Passkey Persistence (`LocalRevealBackupSecret`)

When a bidder commits a sealed bid, their secret `salt` and `bidAmountEth` are stored locally in the browser under a wallet- and auction-scoped key:

```text
auctionchain_reveal_secret_v1_<auctionId>_<bidderAddress_lowercase>
```

### Schema (`LocalRevealBackupSecret`)
```json
{
  "platform": "AuctionChain",
  "chainId": 31337,
  "auctionId": "auc-101",
  "numericAuctionId": 101,
  "auctionTitle": "2022 Tata Nexon EV Max XZ+ Lux",
  "bidderAddress": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
  "bidAmountEth": "1.65",
  "salt": "0x8a3f...c91b",
  "commitmentHash": "0x4d12...e80a",
  "fixedDepositEth": 0.2,
  "createdAt": "2025-05-10T10:30:00.000Z"
}
```

Because the key is strictly scoped by `bidderAddress.toLowerCase()`, switching between **Bidder 1 (`bidder1.eth`)** and **Bidder 2 (`bidder2.eth`)** automatically loads only the active wallet's passkey during the **Reveal Phase**, enabling a seamless **1-Click Reveal** workflow while preserving privacy between accounts.
