# AetherSealed — AI-Powered Cryptographic Sealed-Bid Auction Platform

A decentralized, privacy-preserving sealed-bid auction ecosystem combining cryptographic commit-reveal game mechanics with Gemini AI intelligence for automated asset valuation, strategic bidding optimization, and real-time anti-collusion fraud detection.

## User Review & Critical Decisions

> [!IMPORTANT]
> The PRD document referenced (`AI_Sealed_Auction_Platform_PRD.docx`) defines an AI-powered sealed-bid auction system. We have mapped the architecture into a production-grade full-stack Web3 application featuring real cryptographic commitments, AI valuation/bidding agents, and an interactive auction arena.

- **Confirmed Domain**: AI Sealed Auction Platform on Blockchain (`AI_Sealed_Auction_Platform_PRD.docx`).
- **Cryptographic Bidding Engine**: Dual-phase Commit-Reveal protocol (`hash(bid + salt + bidderAddress)`) supporting both First-Price Sealed-Bid (Blind Auction) and Vickrey (Second-Price) auction modes.
- **AI Intelligence Suite**: Server-side Gemini 3.8 Flash integration for:
  1. *Dynamic Reserve & Valuation Advisor*: Pricing assets against market liquidity and historical comps.
  2. *Game-Theoretic Bid Optimizer*: Assisting bidders in surplus maximization without winner's curse.
  3. *Sybil & Collusion Sentinel*: Real-time heuristic anomaly detection on wallet commit patterns.
- **Zero Mock Fallbacks**: Live Web3 wallet simulation with test faucet, persistent client state, verifiable cryptographic hashing (Web Crypto API SHA-256), downloadable salt backup receipts, and Solidity smart contract generator.

---

## 1. Overview & Core Concept

### What It Does
In traditional public on-chain auctions, participants are vulnerable to MEV front-running, copycat sniping, and predatory bid manipulation. **AetherSealed** solves this by implementing a tamper-proof cryptographic commit-reveal sealed auction pipeline reinforced by Gemini AI agents:
1. **Commitment Phase**: Bidders submit cryptographically blinded bid commitments with escrowed collateral. Bid values remain 100% confidential.
2. **AI Strategy & Valuation**: Creators receive AI-recommended reserve prices, while bidders receive game-theoretic guidance based on simulated bid distributions.
3. **Reveal Phase**: Bidders reveal their bids with their secret salt keys. The contract cryptographically verifies `commit == keccak256(amount, salt)`.
4. **Settlement Phase**: The winner is determined (first-price or second-price Vickrey), the winning asset is transferred, and losing collateral is instantly unlocked and returned.
5. **Anti-Collusion Audit**: AI monitors revealed bids and wallet graphs to flag shill bidding, wash bids, or cartel coordination.

### Target Audience
- **Creators & Protocols**: Auctioning rare digital assets, compute allocations (GPU clusters), intellectual property, treasury tokens, or real-world assets (RWAs).
- **Institutional & Retail Bidders**: Seeking MEV-free, fair-market price discovery without front-running.
- **Security & Smart Contract Auditors**: Verifying auction fairness, mathematical game theory, and contract security.

---

## 2. User Experience & Visual Design

### Aesthetic Direction & Visual Identity
- **Design Philosophy**: High-utility Web3 cryptographic terminal with modern Swiss clarity. Dark slate backdrop (`#0B0F19`) with deep indigo structural surfaces (`#111827`, `#1E293B`), hairline dividers (`border-slate-800`), and radiant cyan/emerald accents for cryptographic integrity.
- **Typography**: 
  - Display & Headings: `Outfit` / `Plus Jakarta Sans` with balanced line wraps (`text-wrap: balance`).
  - Body & Form Controls: `DM Sans` / `Plus Jakarta Sans`.
  - Financial, Timestamps, Hash Commitments, & Addresses: `font-mono tabular-nums` (`JetBrains Mono` / system monospace).
- **Zero-Pill Discipline**: Status indicators and categories rendered as unboxed typography separated by `·` (e.g., `Commit Phase · Vickrey Rule · Ends in 04:12:30`), with zero candy-badge clutter.

### Key User Flows & Views
```
┌────────────────────────────────────────────────────────────────────────┐
│                        Top Navigation Bar                              │
│  AetherSealed    Auctions   ·   Create   ·   AI Vault   ·   Forensics  │
│  [Testnet: Sepolia]                                 [Connect 0x71...F3]│
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
         ┌─────────────────────────┴─────────────────────────┐
         ▼                                                   ▼
┌────────────────────────────────┐         ┌────────────────────────────────┐
│      Auction Marketplace       │         │       Live Auction Room        │
│ • Active Sealed Bids           │         │ • Stage: Commit -> Reveal      │
│ • Filter: Commit/Reveal/Closed │         │ • Time-lock countdown clock    │
│ • Valuation Comps & Trait Grid │         │ • Client Commit Hash Generator │
│ • 1-Click Enter Auction Room   │         │ • Offline Salt Voucher Backup  │
└────────────────────────────────┘         └────────────────┬───────────────┘
                                                            │
         ┌──────────────────────────────────────────────────┴┐
         ▼                                                   ▼
┌────────────────────────────────┐         ┌────────────────────────────────┐
│   AI Valuation & Bid Advisor   │         │  AI Collusion & Audit Sentinel │
│ • AI Fair-Market Price Model   │         │ • Anomaly Detection Matrix     │
│ • Surplus / Win Probability    │         │ • Bid Distribution Histogram  │
│ • Risk & Collateral Calculator │         │ • Solidity Contract Exporter   │
└────────────────────────────────┘         └────────────────────────────────┘
```

1. **Marketplace & Live Auction Ticker**:
   - High-density view of active auctions across RWA, Generative Art, Compute Nodes, and Allocations.
   - Status filters (`All`, `Commit Phase`, `Reveal Phase`, `Settled`).
   - Card geometry displaying current collateral floor, participant count, time-lock remaining, and auction rules.
2. **Interactive Auction Arena**:
   - Real-time phase stepper: `1. Commit Sealed Bid` $\to$ `2. Reveal Window` $\to$ `3. Settle & Claim`.
   - Client-side cryptographic hashing: bidder inputs bid amount, system generates cryptographically secure 256-bit salt, outputs verifiable commitment hash.
   - **Salt Backup Voucher**: Downloadable JSON / one-click clipboard backup so the bidder never forgets their reveal key.
   - Live simulated countdown transitions enabling users to test the entire lifecycle in real time (instant "Fast-Forward Stage" test control for demos).
3. **AI Auction Architect (Creation Studio)**:
   - Creator enters asset name, category, and base details.
   - "Ask AI Valuation Engine": Gemini analyzes description and calculates recommended reserve price, deposit requirement, and optimal commit window.
   - Rule selection: First-Price vs. Second-Price Vickrey auction with anti-sniping dynamic extension.
4. **Bidder AI Copilot**:
   - Evaluates user's intended bid against estimated competitor density and historical volatility.
   - Calculates optimal surplus bid to maximize profit margin while preserving winning probability.
5. **On-Chain Forensics & Anti-Collusion Tab**:
   - AI analysis of revealed bids for statistical clustering (e.g., Benford's Law distribution analysis, shill bid detection).
   - Smart Contract Generator: Real, compilable Solidity `SealedAuction.sol` code with AI code explanations.

---

## 3. Technical Architecture & Data Strategy

### System Architecture
```
┌────────────────────────────────────────────────────────────────────────┐
│                          Frontend Client                               │
│  React 19 + TypeScript + Tailwind CSS v4 + Motion Animations           │
│                                                                        │
│  • Web Crypto API: SHA-256 / keccak256 commitment hasher               │
│  • Wallet Simulation Store: balance, test faucet, pending commits      │
│  • Auction State Machine: commit -> reveal -> settle transitions       │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │ HTTP POST /api/gemini/*
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        Express Server (Backend)                        │
│                                                                        │
│  • /api/gemini/valuation       - Asset Fair Value & Reserve Estimator  │
│  • /api/gemini/bid-strategy    - Game-theoretic bid surplus advisor    │
│  • /api/gemini/fraud-detection - Anti-collusion & anomaly analyzer     │
│  • /api/gemini/contract-audit  - Smart contract security verification  │
│  • SDK: @google/genai with 'gemini-3.8-flash' and 'aistudio-build' UA  │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      Google Gemini 3.8 Flash                           │
│  Structured JSON reasoning, schema enforcement, zero client exposure   │
└────────────────────────────────────────────────────────────────────────┘
```

### Data Model & Persistence
- **Auction Entity**:
  - `id`: Unique auction ID (e.g. `AUC-8092`)
  - `title`: Asset name
  - `category`: `Compute`, `RWA`, `Digital Art`, `Protocol Allocation`
  - `auctionType`: `'vickrey_second_price'` | `'first_price_sealed'`
  - `reservePrice`: Minimum reserve (ETH / USDC)
  - `collateralDeposit`: Required collateral escrowed during commit
  - `phase`: `'commit'` | `'reveal'` | `'settled'`
  - `commitDeadline`: Timestamp
  - `revealDeadline`: Timestamp
  - `commitments`: Array of `{ bidderAddress, commitHash, timestamp, depositPaid }`
  - `reveals`: Array of `{ bidderAddress, bidAmount, salt, verified, timestamp }`
  - `winner`: Address, winning bid, and settlement amount
  - `aiValuation`: `{ estimatedFairValue, confidence, reasoning, priceRange }`
- **Client Storage**: Local state hydrated with initial realistic Web3 auctions, backed by `localStorage` so user creations and placed bids persist across refreshes.

---

## 4. Planned Milestones & Verification Steps

1. **Full-Stack Setup**:
   - Configure Express server with server-side `@google/genai` client, security headers, and structured API endpoints (`/api/gemini/*`).
   - Sync `metadata.json` and `index.html` with product branding.
2. **Cryptographic Engine & Stores**:
   - Implement Web Crypto commit hasher, secure salt generator, and wallet state machine with faucet.
   - Implement complete auction state machine with timer simulation.
3. **Core Interface & Visual Components**:
   - Top Bar contract with single-line links, testnet network indicator, and wallet modal.
   - Marketplace filter grid with high-fidelity asset cards.
   - Live Auction Arena with phase timelines, commit submission, salt voucher generator, and reveal verification.
   - AI Creation Studio with automatic Gemini reserve price estimation.
   - Forensics & Smart Contract suite with Solidity exporter and AI security report.
4. **Verification**:
   - Execute `compile_applet` and `lint_applet` to guarantee error-free compilation and strict type safety.
