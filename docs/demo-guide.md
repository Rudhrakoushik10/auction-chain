# AuctionChain — Quick Demonstration Checklist

Use this quick checklist during project evaluations and live demonstrations.

---

## 1. Pre-Demo Startup Checklist

1. **Start All 4 Servers**:
   - Windows: Run `scripts\start-all.bat`
   - Or run `npm run blockchain:node` (Terminal 1) and `npm run dev` (Terminal 2)
2. **Verify MetaMask**:
   - Network set to **Hardhat Localhost** (`http://127.0.0.1:8545`, Chain ID `31337`).
   - Accounts #0 (`Seller`), #1 (`Bidder 1`), #2 (`Bidder 2`), and #4 (`Admin`) imported.
   - If you restarted the Hardhat node, click **Settings → Advanced → Clear activity tab data** in MetaMask.
3. **Keep the Backend Terminal Visible**:
   - Arrange your screen so the browser (`http://localhost:3000`) and the **Backend Terminal (`Port 8000 / 3000`)** can be shown side-by-side when demonstrating AI, Oracle, and Blockchain proofs.

---

## 2. 6-Minute Live Demo Script

1. **Overview & How It Works (1 min)**
   - Show the **Overview** page and **How It Works → Key Auction Terminologies & Phases Explained** (*Collateral Deposit*, *Seller Reserve Price*, *Keccak-256 Hash*, *Secret Salt*, *Pull-Based Escrow*).
2. **Seller AI Valuation & Auction Deployment (1.5 min)**
   - Connect as **Seller (`seller.eth` - Account #0)**.
   - Go to **Create New Auction** → select a vehicle preset → click **Compute AI Valuation (INR)**.
   - Show the **Backend Terminal** displaying `[AI VALUATION ENGINE · PROOF OF INFERENCE]` and `[PRICE ORACLE CONTRACT · PriceOracle.sol ANCHOR PROOF]`.
   - Configure auction terms → click **Confirm & Deploy to SealedAuction.sol** → approve the **MetaMask popup**.
3. **Sealed Bidding by Bidder 1 & Bidder 2 (1.5 min)**
   - Switch to **Bidder 1 (`bidder1.eth` - Account #1)**. Notice the sidebar resets to the first menu item and the **Submit Sealed Bid** form is unlocked.
   - Enter `2.10 ETH`, check the passkey confirmation box, click **Lock Collateral & Commit Bid**, and confirm in **MetaMask**.
   - Switch to **Bidder 2 (`bidder2.eth` - Account #2)**. Point out that Bidder 1's green confirmation banner is not visible and Bidder 1's bid amount is completely hidden.
   - Enter `2.45 ETH`, commit the bid, and confirm in **MetaMask**.
4. **1-Click Bid Reveal (1 min)**
   - Advance auction phase to **Reveal Phase**.
   - Show that **Seller (`seller.eth`)** sees the **Seller Reveal & Finalization Desk** (`0 / 2 Revealed`), not a bidder reveal form.
   - Switch to **Bidder 1**, click the 1-click **Reveal My Bid Now (2.10 ETH)** button, and confirm in **MetaMask**.
   - Switch to **Bidder 2**, click **Reveal My Bid Now (2.45 ETH)**, and confirm in **MetaMask**.
5. **Finalization & Escrow Settlement (0.5 min)**
   - Click **Execute finalizeAuction()** and confirm in **MetaMask** → **Bidder 2** wins with `2.45 ETH`.
   - **Bidder 2** pays remaining balance (`2.20 ETH`), **Bidder 1** claims `0.25 ETH` refund, and **Seller** withdraws `2.45 ETH` proceeds.
6. **Admin Delete & Platform Reset (0.5 min)**
   - Switch to **Admin (`admin.eth` - Account #4)**.
   - Demonstrate deleting an individual auction or clicking **Reset All Platform Data** to restore the platform to its clean initial state.
