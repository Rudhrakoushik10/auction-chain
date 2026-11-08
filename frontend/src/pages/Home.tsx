import React from 'react';
import { ArrowRight } from 'lucide-react';
import { PublicNavTab } from '../components/layout/PublicHeader';
import { InteractiveSuvScene } from '../components/common/InteractiveSuvScene';

interface HomeProps {
  onNavigate: (tab: PublicNavTab) => void;
}

export const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  const problemStatements = [
    {
      index: '01',
      title: 'Bid Sniping & Shill Bidding in Open Auctions',
      problem:
        'In conventional open-outcry and online English vehicle auctions, every participant sees the current highest bid in real time. Buyers hold back their true valuation until the final seconds (sniping), while unscrupulous sellers or insiders place artificial shill bids to force genuine buyers higher.',
      consequence: 'Distorted market discovery and unfair price inflation for genuine buyers.',
    },
    {
      index: '02',
      title: 'Public Mempool Front-Running on Standard Blockchains',
      problem:
        'Even when auctions move to standard smart contracts, submitting a plaintext bid broadcasts the exact bid amount and ETH transfer value in the public mempool. Automated bots and competing bidders can inspect pending transactions and outbid by a fraction before the block is mined.',
      consequence: 'Complete loss of bid privacy on transparent ledgers.',
    },
    {
      index: '03',
      title: 'Opaque & Uncalibrated Indian Pre-Owned Vehicle Pricing',
      problem:
        'Used-car valuation in India depends heavily on regional brand liquidity, kilometer odometer wear, powertrain demand, transmission type, and accident history. Without an objective, transparent benchmark in Indian Rupees (₹), sellers misprice reserves and buyers bid blind.',
      consequence: 'Information asymmetry between vehicle consignors and bidders.',
    },
    {
      index: '04',
      title: 'Counterparty Default & Custodial Escrow Friction',
      problem:
        'Traditional auction portals either allow non-serious bidders to place unbacked bids and walk away after winning, or lock buyer funds inside centralized bank accounts that take days or weeks to refund losing participants.',
      consequence: 'Delayed capital return and settlement defaults.',
    },
  ];

  const solutions = [
    {
      step: '01',
      title: 'Keccak-256 Sealed-Bid Commit-Reveal Protocol',
      subtitle: 'Zero Bid Visibility During Active Bidding',
      description:
        'Instead of sending a visible price, the bidder’s browser combines their bid amount and a secret 32-byte random salt into a one-way cryptographic hash. Only this sealed fingerprint is stored on SealedAuction.sol during the Commit phase, guaranteeing mathematical privacy until the bidding clock expires.',
    },
    {
      step: '02',
      title: 'Uniform Collateral Deposit (Zero Value Signalling)',
      subtitle: 'Identical Escrow Transfer for Every Participant',
      description:
        'If bidders sent their full bid amount in ETH during commitment, observers could deduce the bid from the wallet transfer value. AuctionChain requires every bidder to lock the exact same fixed refundable deposit during the Commit phase, masking whether a bid is conservative or aggressive while deterring spam.',
    },
    {
      step: '03',
      title: 'Gemini AI Valuation Engine for the Indian Market',
      subtitle: 'Explainable ₹ INR Benchmark Anchored on PriceOracle.sol',
      description:
        'Before a vehicle auction opens, structured vehicle specifications are evaluated by the AI valuation engine calibrated for the Indian pre-owned market. The resulting fair-market estimate in Indian Rupees (₹) and the canonical SHA-256 specification hash are anchored on-chain for every bidder to verify.',
    },
    {
      step: '04',
      title: 'Deterministic Smart Contract Settlement & Instant Refunds',
      subtitle: 'Reentrancy-Protected Pull-Over-Push Escrow',
      description:
        'During the Reveal phase, SealedAuction.sol recomputes each bidder’s hash on-chain to verify no bid was altered. Once finalized, the highest verified bidder above the seller’s reserve wins, losing bidders immediately reclaim 100% of their deposit via claimRefund(), and the seller withdraws proceeds.',
    },
  ];

  const comparisonRows = [
    {
      dimension: 'Bid Privacy During Active Window',
      traditional: 'Publicly visible to all bidders & insiders',
      naiveBlockchain: 'Exposed in public mempool & msg.value',
      auctionChain: 'Cryptographically sealed via salted Keccak-256 hash',
    },
    {
      dimension: 'Protection Against Last-Second Sniping',
      traditional: 'Vulnerable to final-second bid increments',
      naiveBlockchain: 'Vulnerable to gas-priority front-running',
      auctionChain: 'Immune — all sealed bids are blind and independent',
    },
    {
      dimension: 'Vehicle Fair-Value Benchmarking',
      traditional: 'Subjective dealer estimate or opaque book range',
      naiveBlockchain: 'None — purely speculative bidding',
      auctionChain: 'AI Indian Market Valuation (₹ INR) + SHA-256 Oracle Hash',
    },
    {
      dimension: 'Security Deposit & Refund Handling',
      traditional: 'Centralized custodian (3–10 business day refund)',
      naiveBlockchain: 'Push-transfer loops vulnerable to gas DoS',
      auctionChain: 'Uniform collateral with instant pull-based claimRefund()',
    },
    {
      dimension: 'Auditability of Winner Selection',
      traditional: 'Closed auctioneer database',
      naiveBlockchain: 'On-chain but lacks pre-bid privacy',
      auctionChain: '100% verifiable on-chain hash match & reserve enforcement',
    },
  ];

  return (
    <div className="space-y-24 pb-24">
      {/* ===================================================================
          SECTION 1: HERO STAGE — ABOUT THE PLATFORM (SCOPED 3D SCENE)
         =================================================================== */}
      <section className="relative border-b border-[#232730] pb-12 pt-4 overflow-hidden">
        {/* Scoped 3D SUV Background Animation (Top Hero Section Only) */}
        <InteractiveSuvScene />

        {/* Subtle Scoped Contrast Scrim */}
        <div
          className="absolute inset-0 pointer-events-none bg-gradient-to-b from-[#0B0C10]/40 via-transparent to-[#0B0C10] z-[1]"
          aria-hidden="true"
        />

        <div className="relative z-10 space-y-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            {/* Left Column: About AuctionChain (7 cols) */}
            <div className="lg:col-span-7 flex flex-col justify-center space-y-6 pt-2">
              <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-[#8E95A5]">
                <span className="text-[#C5A46D]">About AuctionChain</span>
                <span aria-hidden="true">·</span>
                <span>AI-Anchored Sealed-Bid Vehicle Exchange</span>
              </div>

              <div className="space-y-4">
                <h1
                  className="text-3xl sm:text-5xl font-display font-semibold tracking-tight text-[#F4F5F7] leading-[1.1]"
                  style={{ textWrap: 'balance' }}
                >
                  Fair Price Discovery for the Indian Automotive Market through{' '}
                  <span className="text-[#C5A46D]">Cryptographic Sealed Bids.</span>
                </h1>

                <p className="text-base text-[#8E95A5] max-w-2xl leading-relaxed">
                  AuctionChain is a decentralized vehicle remarketing platform engineered to eliminate bid sniping, price manipulation, and valuation opacity. By combining an <strong className="text-[#F4F5F7] font-medium">AI-powered Indian market valuation engine</strong> with a <strong className="text-[#F4F5F7] font-medium">two-phase Commit-Reveal smart contract protocol</strong>, every vehicle is priced transparently and every bid remains mathematically confidential until the auction closes.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-6 pt-2">
                <button
                  type="button"
                  onClick={() => onNavigate('how-it-works')}
                  className="px-5 py-3 rounded-md bg-[#C5A46D] hover:bg-[#D4B57E] text-[#0B0C10] font-semibold text-xs uppercase tracking-[0.12em] inline-flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <span>Explore How It Works</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate('architecture')}
                  className="text-xs font-mono uppercase tracking-[0.12em] text-[#8E95A5] hover:text-[#C5A46D] transition-colors cursor-pointer"
                >
                  System Architecture →
                </button>
              </div>
            </div>

            {/* Right Column: How AuctionChain Blinds Every Bid (Clean Single-Level Ledger) */}
            <div className="lg:col-span-5">
              <div className="bg-[#12141A]/90 border border-[#232730] rounded-md p-6 space-y-5">
                <div className="flex items-center justify-between border-b border-[#232730] pb-3.5">
                  <span className="text-xs font-mono text-[#C5A46D]">
                    How AuctionChain Blinds Every Bid
                  </span>
                  <span className="text-xs font-mono text-[#8E95A5]">
                    Client-Side Sealing
                  </span>
                </div>

                <dl className="divide-y divide-[#232730] text-xs">
                  <div className="py-3 space-y-1">
                    <dt className="font-mono text-[#646C7E]">01. Private Input (Hidden)</dt>
                    <dd className="font-semibold text-[#F4F5F7] text-sm">
                      True Bid Amount + 256-Bit Secret Salt
                    </dd>
                    <dd className="text-[#8E95A5]">
                      Computed in your browser; never transmitted in plain text during the Commit phase.
                    </dd>
                  </div>

                  <div className="py-3 space-y-1">
                    <dt className="font-mono text-[#646C7E]">02. Uniform Deposit (Public)</dt>
                    <dd className="font-semibold text-[#C5A46D] text-sm">
                      Identical Fixed Collateral Deposit
                    </dd>
                    <dd className="text-[#8E95A5]">
                      Every participant locks the exact same refundable deposit so wallet transfers never leak bid size.
                    </dd>
                  </div>

                  <div className="pt-3 space-y-1">
                    <dt className="font-mono text-[#646C7E]">03. On-Chain Commitment</dt>
                    <dd className="font-mono text-[#F4F5F7]">
                      keccak256(abi.encode(auctionId, bidder, bidWei, salt))
                    </dd>
                    <dd className="text-[#8E95A5]">
                      Stored on SealedAuction.sol — impossible to reverse-engineer or alter after submission.
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>

          {/* Clean 4-Column Hairline Architectural Strip (No Floating Pill Cards) */}
          <div className="border-t border-[#232730] pt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="space-y-1">
              <div className="text-xs font-mono text-[#646C7E]">Auction Mechanism</div>
              <div className="text-base font-display font-semibold text-[#F4F5F7]">
                Commit-Reveal
              </div>
              <div className="text-xs text-[#8E95A5]">Two-Phase Sealed Bidding</div>
            </div>

            <div className="space-y-1">
              <div className="text-xs font-mono text-[#646C7E]">Cryptographic Seal</div>
              <div className="text-base font-display font-semibold text-[#F4F5F7]">
                Keccak-256 + Salt
              </div>
              <div className="text-xs text-[#8E95A5]">Tamper-Proof Commitment</div>
            </div>

            <div className="space-y-1">
              <div className="text-xs font-mono text-[#646C7E]">Valuation Engine</div>
              <div className="text-base font-display font-semibold text-[#C5A46D]">
                Gemini AI (₹ INR)
              </div>
              <div className="text-xs text-[#8E95A5]">Indian Automotive Market</div>
            </div>

            <div className="space-y-1">
              <div className="text-xs font-mono text-[#646C7E]">Escrow Security</div>
              <div className="text-base font-display font-semibold text-[#F4F5F7]">
                Pull-Over-Push
              </div>
              <div className="text-xs text-[#8E95A5]">Solidity 0.8.20 Smart Contracts</div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================
          SECTION 2: THE PROBLEM STATEMENT (EDITORIAL LEDGER)
         =================================================================== */}
      <section className="space-y-8">
        <div className="max-w-2xl space-y-2">
          <div className="text-xs font-mono text-[#C5A46D]">
            01. The Problem Statement
          </div>
          <h2 className="text-2xl sm:text-3xl font-display font-semibold text-[#F4F5F7] tracking-tight">
            Why Traditional &amp; First-Generation Blockchain Vehicle Auctions Fail
          </h2>
          <p className="text-sm text-[#8E95A5] leading-relaxed">
            High-value vehicle remarketing suffers from structural information asymmetry. When bids are visible in real time—or when vehicle valuations rely on guesswork—neither the seller nor the buyer achieves fair market execution.
          </p>
        </div>

        <div className="border-t border-[#232730] divide-y divide-[#232730]">
          {problemStatements.map((item) => (
            <article
              key={item.index}
              className="py-9 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
            >
              <div className="lg:col-span-4 space-y-1.5">
                <div className="text-2xl font-mono font-semibold text-[#C5A46D] tabular-nums">
                  {item.index}
                </div>
                <h3 className="text-lg font-display font-semibold text-[#F4F5F7] leading-snug">
                  {item.title}
                </h3>
              </div>

              <div className="lg:col-span-5 space-y-1.5">
                <div className="text-xs font-mono text-[#646C7E]">
                  Structural Flaw
                </div>
                <p className="text-sm text-[#8E95A5] leading-relaxed">
                  {item.problem}
                </p>
              </div>

              <div className="lg:col-span-3 space-y-1.5">
                <div className="text-xs font-mono text-[#646C7E]">
                  Market Impact
                </div>
                <p className="text-sm text-[#F4F5F7] leading-relaxed">
                  {item.consequence}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ===================================================================
          SECTION 3: HOW AUCTIONCHAIN SOLVES IT (2x2 ARCHITECTURAL MATRIX)
         =================================================================== */}
      <section className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="max-w-2xl space-y-2">
            <div className="text-xs font-mono text-[#C5A46D]">
              02. How AuctionChain Solves It
            </div>
            <h2 className="text-2xl sm:text-3xl font-display font-semibold text-[#F4F5F7] tracking-tight">
              Four-Pillar Cryptographic &amp; AI Architecture
            </h2>
            <p className="text-sm text-[#8E95A5] leading-relaxed">
              Every vulnerability identified in conventional vehicle auctions is resolved at the protocol layer through verifiable smart contracts and calibrated AI valuation.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('how-it-works')}
            className="text-xs font-mono uppercase tracking-[0.12em] text-[#C5A46D] hover:text-[#D4B57E] inline-flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <span>See Step-by-Step Workflow</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="border-t border-b border-[#232730] grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#232730]">
          <div className="divide-y divide-[#232730]">
            {[solutions[0], solutions[2]].map((sol) => (
              <div key={sol.step} className="py-9 md:pr-10 space-y-3">
                <div className="flex items-center gap-2.5 text-xs font-mono">
                  <span className="text-[#C5A46D] font-semibold">{sol.step}</span>
                  <span className="text-[#646C7E]" aria-hidden="true">·</span>
                  <span className="text-[#8E95A5]">{sol.subtitle}</span>
                </div>
                <h3 className="text-lg font-display font-semibold text-[#F4F5F7]">
                  {sol.title}
                </h3>
                <p className="text-sm text-[#8E95A5] leading-relaxed">
                  {sol.description}
                </p>
              </div>
            ))}
          </div>

          <div className="divide-y divide-[#232730]">
            {[solutions[1], solutions[3]].map((sol) => (
              <div key={sol.step} className="py-9 md:pl-10 space-y-3">
                <div className="flex items-center gap-2.5 text-xs font-mono">
                  <span className="text-[#C5A46D] font-semibold">{sol.step}</span>
                  <span className="text-[#646C7E]" aria-hidden="true">·</span>
                  <span className="text-[#8E95A5]">{sol.subtitle}</span>
                </div>
                <h3 className="text-lg font-display font-semibold text-[#F4F5F7]">
                  {sol.title}
                </h3>
                <p className="text-sm text-[#8E95A5] leading-relaxed">
                  {sol.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================================================================
          SECTION 4: PROTOCOL COMPARISON MATRIX
         =================================================================== */}
      <section className="space-y-6">
        <div className="max-w-2xl space-y-2">
          <div className="text-xs font-mono text-[#C5A46D]">
            03. Protocol Comparison Matrix
          </div>
          <h2 className="text-2xl sm:text-3xl font-display font-semibold text-[#F4F5F7] tracking-tight">
            Traditional Auctions vs. Standard Smart Contracts vs. AuctionChain
          </h2>
        </div>

        <div className="bg-[#12141A] border border-[#232730] rounded-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-[#0B0C10] border-b border-[#232730] text-xs font-mono text-[#8E95A5]">
                  <th className="py-4 px-6 font-medium w-1/4">Evaluation Dimension</th>
                  <th className="py-4 px-6 font-medium w-1/4">Traditional Open Auction</th>
                  <th className="py-4 px-6 font-medium w-1/4">Standard Blockchain Auction</th>
                  <th className="py-4 px-6 font-medium w-1/4 text-[#C5A46D]">
                    AuctionChain Protocol
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#232730]">
                {comparisonRows.map((row) => (
                  <tr key={row.dimension} className="hover:bg-[#171A22]/50 transition-colors">
                    <td className="py-5 px-6 font-medium text-[#F4F5F7] align-top">
                      {row.dimension}
                    </td>
                    <td className="py-5 px-6 text-[#8E95A5] text-xs sm:text-sm leading-relaxed align-top">
                      {row.traditional}
                    </td>
                    <td className="py-5 px-6 text-[#8E95A5] text-xs sm:text-sm leading-relaxed align-top">
                      {row.naiveBlockchain}
                    </td>
                    <td className="py-5 px-6 font-medium text-[#F4F5F7] text-xs sm:text-sm leading-relaxed align-top bg-[#C5A46D]/[0.03]">
                      {row.auctionChain}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
};
