import React from 'react';

export const HowItWorksPage: React.FC = () => {
  const lifecycleStages = [
    {
      index: '01',
      phase: 'Vehicle Consignment & AI Valuation',
      actor: 'Vehicle Seller',
      plainExplanation:
        'Before an auction begins, the seller enters the vehicle’s physical specifications—make, model, manufacturing year, odometer reading in kilometers, fuel type, transmission, and accident history. The platform’s AI valuation engine evaluates these parameters against Indian pre-owned automotive market data to establish an objective fair-market estimate in Indian Rupees (₹). Using this reference, the seller sets a public Starting Bid, a minimum Reserve Price, and the durations for the bidding and reveal windows.',
      systemVerification: {
        input: '11 structured vehicle attributes',
        process: 'AI market valuation (₹ INR) + canonical SHA-256 specification hash',
        outcome: 'Valuation fingerprint anchored on PriceOracle.sol; auction deployed on SealedAuction.sol',
      },
    },
    {
      index: '02',
      phase: 'Sealed Bid Submission (Commit Window)',
      actor: 'Competing Buyers',
      plainExplanation:
        'While the Commit timer is active, interested buyers submit their offers privately. When a buyer types a bid amount, their browser locks that price together with a randomly generated secret key—creating a digital sealed envelope—and downloads a backup passkey file to their device. Every participating buyer locks the exact same refundable security deposit in ETH so that no one watching the public ledger can deduce how much anyone else has bid.',
      systemVerification: {
        input: 'Private bid amount + 256-bit random salt + uniform refundable deposit',
        process: 'Browser computes keccak256(abi.encode(auctionId, bidder, bidWei, salt))',
        outcome: 'Only the scrambled 32-byte commitment hash and fixed deposit are recorded on-chain',
      },
    },
    {
      index: '03',
      phase: 'Simultaneous Unsealing (Reveal Window)',
      actor: 'Competing Buyers',
      plainExplanation:
        'Once the Commit deadline expires, the bidding box is permanently closed—no new offers can be submitted. The auction enters the Reveal window, where each buyer unlocks their sealed envelope using their saved secret key. The smart contract checks that the revealed price and key match the original digital fingerprint from Stage 02. Because all offers were locked before anyone’s price became visible, last-second bid sniping and reactive outbidding are impossible.',
      systemVerification: {
        input: 'Plaintext bid amount + saved 256-bit secret salt',
        process: 'SealedAuction.sol recomputes the Keccak-256 hash on-chain and compares against Stage 02',
        outcome: 'Matching bids are verified and ranked; altered or mismatched amounts are rejected',
      },
    },
    {
      index: '04',
      phase: 'Automated Winner Determination',
      actor: 'Smart Contract Referee',
      plainExplanation:
        'When the Reveal timer concludes, the smart contract finalizes the auction without human intervention. It reviews all verified bids, confirms whether the highest verified offer meets or exceeds the seller’s minimum Reserve Price, and records the winning buyer on the blockchain ledger. If no revealed bid meets the reserve threshold, the auction closes without a sale and the seller retains ownership of the vehicle.',
      systemVerification: {
        input: 'All verified revealed bids + seller reserve threshold',
        process: 'Deterministic state transition via finalizeAuction(auctionId)',
        outcome: 'Highest qualifying bidder is locked as winner; non-winning deposits are unlocked for refund',
      },
    },
    {
      index: '05',
      phase: 'Escrow Settlement & Deposit Refunds',
      actor: 'Winner, Non-Winners & Seller',
      plainExplanation:
        'All financial settlement occurs directly through the smart contract escrow without a middleman bank holding funds:\n\n• Winning Buyer: Their initial security deposit is credited toward the purchase, and they pay only the remaining balance (Winning Bid minus Deposit).\n• Non-Winning Buyers: Every buyer who revealed a valid bid reclaims 100% of their security deposit directly back to their wallet.\n• Vehicle Seller: Once the winner settles the balance, the seller withdraws the full sale proceeds.',
      systemVerification: {
        input: 'Finalized auction state on SealedAuction.sol',
        process: 'Pull-over-push settlement (settleWinner, claimRefund, withdrawSellerProceeds)',
        outcome: 'Zero custodial risk; instant self-service refunds for all non-winning participants',
      },
    },
  ];

  const settlementRules = [
    {
      scenario: 'A buyer places a sealed bid, reveals it on time, but is outbid by another participant',
      resolution: '100% Deposit Refunded',
      detail:
        'The non-winning buyer clicks Claim Refund after finalization and receives their entire security deposit back immediately.',
    },
    {
      scenario: 'A participant attempts to change their bid amount while unlocking it during the Reveal window',
      resolution: 'Rejected by Smart Contract',
      detail:
        'Altering the bid amount by even a single unit changes the resulting Keccak-256 hash. The smart contract detects the mismatch and rejects the transaction.',
    },
    {
      scenario: 'The highest revealed bid is lower than the seller’s minimum Reserve Price',
      resolution: 'No Sale · Full Refunds Issued',
      detail:
        'The seller is never obligated to sell below their reserve. The auction closes with no winner, and every buyer who revealed on time reclaims 100% of their deposit.',
    },
    {
      scenario: 'A participant submits a sealed commitment to spam the auction but refuses to reveal it',
      resolution: 'Deposit Remains Locked',
      detail:
        'Only bidders who complete the Reveal phase can reclaim their security deposit, deterring fake bids and griefing attacks.',
    },
  ];

  return (
    <div className="space-y-24 pb-24">
      {/* =====================================================================
          SECTION 1: EDITORIAL HEADER & THE SEALED-TENDER PRINCIPLE
         ===================================================================== */}
      <section className="pt-4 space-y-12">
        <div className="max-w-3xl space-y-4">
          <div className="flex items-center gap-3 text-xs font-mono text-[#8E95A5]">
            <span className="text-[#C5A46D]">Operational Workflow</span>
            <span aria-hidden="true">·</span>
            <span>End-to-End Auction Mechanics</span>
          </div>

          <h1
            className="text-3xl sm:text-5xl font-display font-semibold text-[#F4F5F7] tracking-tight leading-[1.1]"
            style={{ textWrap: 'balance' }}
          >
            How a Sealed-Bid Vehicle Auction Works from Listing to Settlement
          </h1>

          <p className="text-base text-[#8E95A5] leading-relaxed max-w-2xl">
            In a conventional open auction, everyone hears the current price in real time—allowing competitors to wait until the final seconds to outbid you by a fraction, or insiders to place artificial bids that drive up the price. AuctionChain replaces open shouting with a <strong className="text-[#F4F5F7] font-medium">digital sealed-envelope tender</strong> governed by smart contracts.
          </p>
        </div>

        {/* Clean 2-Column Structural Comparison (Hairline Divided, No Nested Boxes) */}
        <div className="border-t border-b border-[#232730] grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#232730]">
          <div className="py-8 md:pr-10 space-y-3">
            <div className="text-xs font-mono text-[#8E95A5]">
              01. The Physical Sealed-Envelope Analogy
            </div>
            <h2 className="text-lg font-display font-semibold text-[#F4F5F7]">
              Everyone Submits in Private, Everyone Opens Together
            </h2>
            <p className="text-sm text-[#8E95A5] leading-relaxed">
              Imagine buying a car where every interested buyer writes their best offer on a sheet of paper, seals it inside an opaque envelope, and places it into a locked vault along with a standard refundable security deposit. Because the envelopes are sealed, no buyer can peek at a competitor’s offer, and no one can jump in after seeing the highest price. Only when the submission clock expires are all envelopes opened simultaneously.
            </p>
          </div>

          <div className="py-8 md:pl-10 space-y-3">
            <div className="text-xs font-mono text-[#C5A46D]">
              02. How AuctionChain Automates This Digitally
            </div>
            <h2 className="text-lg font-display font-semibold text-[#F4F5F7]">
              Cryptographic Seals &amp; Non-Custodial Escrow
            </h2>
            <p className="text-sm text-[#8E95A5] leading-relaxed">
              AuctionChain executes this exact process in software. First, an AI valuation engine estimates the vehicle’s fair market worth in Indian Rupees (₹) so buyers and sellers share an objective baseline. Next, your browser locks your bid inside a cryptographic hash during the <strong className="text-[#F4F5F7] font-medium">Commit Window</strong>. Once bidding closes, participants unlock their bids during the <strong className="text-[#F4F5F7] font-medium">Reveal Window</strong>, the smart contract verifies every seal, awards the vehicle to the highest qualifying bidder, and returns 100% of the security deposit to everyone else.
            </p>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION 1B: ESSENTIAL AUCTION TERMINOLOGIES & PHASE DEFINITIONS
         ===================================================================== */}
      <section className="space-y-8">
        <div className="max-w-3xl space-y-2">
          <div className="text-xs font-mono text-[#C5A46D]">
            Glossary &amp; Phase Definitions
          </div>
          <h2 className="text-2xl sm:text-3xl font-display font-semibold text-[#F4F5F7] tracking-tight">
            Key Auction Terminologies &amp; Phases Explained
          </h2>
          <p className="text-sm text-[#8E95A5] leading-relaxed">
            Before participating as a Seller or Bidder, review these core terms that govern how prices, deposits, and auction windows work on AuctionChain.
          </p>
        </div>

        {/* Part A: Core Price & Deposit Terminologies */}
        <div className="border-t border-b border-[#232730] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#232730]">
          <div className="py-7 md:pr-7 space-y-2.5">
            <div className="text-xs font-mono text-[#C5A46D]">01 · Starting Bid</div>
            <h3 className="text-base font-display font-semibold text-[#F4F5F7]">
              Public Opening Floor Price
            </h3>
            <p className="text-xs text-[#8E95A5] leading-relaxed">
              The lowest bid amount accepted by the auction smart contract. Any revealed bid below the Starting Bid is automatically rejected by <code className="text-[#F4F5F7] font-mono">SealedAuction.sol</code>.
            </p>
          </div>

          <div className="py-7 md:px-7 space-y-2.5">
            <div className="text-xs font-mono text-[#C5A46D]">02 · Seller Reserve Price</div>
            <h3 className="text-base font-display font-semibold text-[#F4F5F7]">
              Minimum Acceptable Sale Price
            </h3>
            <p className="text-xs text-[#8E95A5] leading-relaxed">
              The minimum price the seller is willing to accept to part with the vehicle. Even if a bidder places the highest offer, the car is only marked <strong className="text-[#F4F5F7]">Sold</strong> if the highest revealed bid meets or exceeds the Seller Reserve Price. Otherwise, the lot closes as <strong className="text-[#F4F5F7]">No Sale</strong> and all deposits are refunded.
            </p>
          </div>

          <div className="py-7 md:pl-7 space-y-2.5">
            <div className="text-xs font-mono text-[#C5A46D]">03 · Collateral Deposit</div>
            <h3 className="text-base font-display font-semibold text-[#F4F5F7]">
              Uniform Refundable Security Lock
            </h3>
            <p className="text-xs text-[#8E95A5] leading-relaxed">
              A fixed security deposit (e.g., <code className="text-[#F4F5F7] font-mono">0.25 ETH</code>) that every bidder locks in the smart contract when submitting a sealed bid. Because every bidder locks the exact same deposit regardless of whether they bid ₹3 Lakhs or ₹5 Lakhs, observers cannot guess anyone’s bid from their wallet transfer. It is 100% refunded to non-winners after they reveal their bid.
            </p>
          </div>
        </div>

        <div className="border-b border-[#232730] grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#232730]">
          <div className="py-7 md:pr-7 space-y-2.5">
            <div className="text-xs font-mono text-[#C5A46D]">04 · AI Advisory Valuation (₹ INR)</div>
            <h3 className="text-base font-display font-semibold text-[#F4F5F7]">
              Fair-Market Benchmark Estimate
            </h3>
            <p className="text-xs text-[#8E95A5] leading-relaxed">
              An independent fair resale estimate in Indian Rupees (₹) computed from the vehicle’s brand, model year, kilometer reading, fuel type, and condition. Its SHA-256 fingerprint (<code className="text-[#F4F5F7] font-mono">product_data_hash</code>) is anchored on <code className="text-[#F4F5F7] font-mono">PriceOracle.sol</code> so buyers know the car specs were not altered after listing.
            </p>
          </div>

          <div className="py-7 md:px-7 space-y-2.5">
            <div className="text-xs font-mono text-[#C5A46D]">05 · Secret Salt &amp; Commitment Hash</div>
            <h3 className="text-base font-display font-semibold text-[#F4F5F7]">
              Your Digital Envelope &amp; Passkey
            </h3>
            <p className="text-xs text-[#8E95A5] leading-relaxed">
              A 32-byte random secret key (<strong className="text-[#F4F5F7]">Salt</strong>) combined with your bid amount to produce a <strong className="text-[#F4F5F7]">Keccak-256 Commitment Hash</strong>. During bidding, only the scrambled hash is sent to the blockchain—keeping your rupee/ETH offer completely private until the Reveal window.
            </p>
          </div>

          <div className="py-7 md:pl-7 space-y-2.5">
            <div className="text-xs font-mono text-[#C5A46D]">06 · Live ETH / ₹ Oracle Feed</div>
            <h3 className="text-base font-display font-semibold text-[#F4F5F7]">
              Real-Time Rupee Conversion
            </h3>
            <p className="text-xs text-[#8E95A5] leading-relaxed">
              While smart contract escrow transfers execute in ETH on Hardhat Chain 31337, the platform’s live Oracle rate converts every Starting Bid, Seller Reserve, Collateral Deposit, and Sealed Bid into Indian Rupees (₹) in real time.
            </p>
          </div>
        </div>

        {/* Part B: The 4 Auction Lifecycle Phases Explained */}
        <div className="bg-[#12141A] border border-[#232730] rounded-md overflow-hidden">
          <div className="px-6 py-4 bg-[#0B0C10] border-b border-[#232730] flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-[#C5A46D]">
              Auction Phase Progression (State Machine)
            </span>
            <span className="text-xs font-mono text-[#8E95A5]">
              Commit → Reveal → Sold / No Sale
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-[#232730] text-xs">
            <div className="p-5 space-y-2">
              <div className="font-mono text-[#C5A46D] font-semibold">Phase 1 · Commit Window</div>
              <div className="text-sm font-semibold text-[#F4F5F7]">Bidding Open (Sealed)</div>
              <p className="text-[#8E95A5] leading-relaxed">
                Bidders submit their encrypted commitment hash and lock the uniform collateral deposit. All bid amounts remain strictly hidden from the seller and other bidders.
              </p>
            </div>
            <div className="p-5 space-y-2">
              <div className="font-mono text-[#C5A46D] font-semibold">Phase 2 · Reveal Window</div>
              <div className="text-sm font-semibold text-[#F4F5F7]">Opening Envelopes</div>
              <p className="text-[#8E95A5] leading-relaxed">
                New bids are blocked. Bidders click <strong className="text-[#F4F5F7]">1-Click Verify &amp; Reveal</strong> to unseal their saved offer. The smart contract verifies that the bid + salt match the Phase 1 hash.
              </p>
            </div>
            <div className="p-5 space-y-2">
              <div className="font-mono text-emerald-400 font-semibold">Outcome A · Sold</div>
              <div className="text-sm font-semibold text-[#F4F5F7]">Reserve Price Met</div>
              <p className="text-[#8E95A5] leading-relaxed">
                Highest revealed bid ≥ Seller Reserve Price. Winner pays the remaining balance (Bid − Deposit), seller withdraws the full sale price, and non-winners claim 100% deposit refunds.
              </p>
            </div>
            <div className="p-5 space-y-2">
              <div className="font-mono text-amber-400 font-semibold">Outcome B · No Sale</div>
              <div className="text-sm font-semibold text-[#F4F5F7]">Below Seller Reserve</div>
              <p className="text-[#8E95A5] leading-relaxed">
                Highest revealed bid is below the Seller Reserve Price (or no valid bids were revealed). Seller keeps the vehicle and all revealed bidders claim a 100% deposit refund.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION 2: THE 5-STAGE LIFECYCLE LEDGER (CONTINUOUS EDITORIAL FLOW)
         ===================================================================== */}
      <section className="space-y-8">
        <div className="max-w-2xl space-y-2">
          <div className="text-xs font-mono text-[#C5A46D]">
            Five-Stage Sequence
          </div>
          <h2 className="text-2xl sm:text-3xl font-display font-semibold text-[#F4F5F7] tracking-tight">
            Step-by-Step Execution Flow
          </h2>
          <p className="text-sm text-[#8E95A5] leading-relaxed">
            Every vehicle consignment progresses through five sequential stages. Below is what happens in plain language alongside the underlying smart contract verification at each step.
          </p>
        </div>

        <div className="border-t border-[#232730] divide-y divide-[#232730]">
          {lifecycleStages.map((stage) => (
            <article
              key={stage.index}
              className="py-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
            >
              {/* Column 1: Stage Number & Actor (3 cols) */}
              <div className="lg:col-span-3 space-y-2">
                <div className="text-2xl font-mono font-semibold text-[#C5A46D] tabular-nums">
                  {stage.index}
                </div>
                <h3 className="text-lg font-display font-semibold text-[#F4F5F7] leading-snug">
                  {stage.phase}
                </h3>
                <div className="text-xs font-mono text-[#8E95A5] pt-1">
                  Actor: <span className="text-[#F4F5F7]">{stage.actor}</span>
                </div>
              </div>

              {/* Column 2: Plain-English Narrative (5 cols) */}
              <div className="lg:col-span-5 space-y-2">
                <div className="text-xs font-mono text-[#646C7E]">
                  How It Works in Plain Language
                </div>
                <p className="text-sm text-[#8E95A5] leading-relaxed whitespace-pre-line">
                  {stage.plainExplanation}
                </p>
              </div>

              {/* Column 3: Protocol Verification Ledger (4 cols) */}
              <div className="lg:col-span-4 bg-[#12141A] border border-[#232730] rounded-md p-5 space-y-3.5 text-xs">
                <div className="font-mono text-[#C5A46D] pb-2 border-b border-[#232730]">
                  Protocol Verification · Stage {stage.index}
                </div>

                <dl className="space-y-3">
                  <div>
                    <dt className="text-[#646C7E] font-mono">Input</dt>
                    <dd className="text-[#F4F5F7] mt-0.5">{stage.systemVerification.input}</dd>
                  </div>
                  <div className="pt-2.5 border-t border-[#232730]">
                    <dt className="text-[#646C7E] font-mono">Mechanism</dt>
                    <dd className="text-[#F4F5F7] font-mono text-[11px] mt-0.5">
                      {stage.systemVerification.process}
                    </dd>
                  </div>
                  <div className="pt-2.5 border-t border-[#232730]">
                    <dt className="text-[#646C7E] font-mono">Verified Outcome</dt>
                    <dd className="text-[#8E95A5] mt-0.5">{stage.systemVerification.outcome}</dd>
                  </div>
                </dl>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* =====================================================================
          SECTION 3: PARTICIPANT ROLES AT A GLANCE
         ===================================================================== */}
      <section className="space-y-8">
        <div className="max-w-2xl space-y-2">
          <div className="text-xs font-mono text-[#C5A46D]">
            Role Responsibilities
          </div>
          <h2 className="text-2xl sm:text-3xl font-display font-semibold text-[#F4F5F7] tracking-tight">
            What Each Participant Does
          </h2>
        </div>

        <div className="border-t border-b border-[#232730] grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#232730]">
          <div className="py-8 md:pr-8 space-y-4">
            <div className="text-xs font-mono text-[#C5A46D]">01. Vehicle Seller</div>
            <h3 className="text-lg font-display font-semibold text-[#F4F5F7]">
              Consigns the Vehicle & Collects Proceeds
            </h3>
            <ol className="space-y-2.5 text-sm text-[#8E95A5] leading-relaxed list-decimal list-inside">
              <li>Submits accurate vehicle specifications for AI valuation in ₹ INR.</li>
              <li>Configures the Starting Bid, Reserve Price, and Commit/Reveal timers.</li>
              <li>Finalizes the auction once the Reveal deadline finishes.</li>
              <li>Withdraws the full winning sale proceeds from escrow.</li>
            </ol>
          </div>

          <div className="py-8 md:px-8 space-y-4">
            <div className="text-xs font-mono text-[#C5A46D]">02. Competing Buyer (Bidder)</div>
            <h3 className="text-lg font-display font-semibold text-[#F4F5F7]">
              Seals the Offer & Unlocks on Time
            </h3>
            <ol className="space-y-2.5 text-sm text-[#8E95A5] leading-relaxed list-decimal list-inside">
              <li>Reviews the vehicle dossier and AI Indian Rupee benchmark.</li>
              <li>Locks a sealed bid and refundable deposit during the Commit window.</li>
              <li>Unlocks the sealed bid during the Reveal window using the saved passkey.</li>
              <li>Either settles the winning balance or claims a 100% deposit refund.</li>
            </ol>
          </div>

          <div className="py-8 md:pl-8 space-y-4">
            <div className="text-xs font-mono text-[#C5A46D]">03. Smart Contract & Oracle</div>
            <h3 className="text-lg font-display font-semibold text-[#F4F5F7]">
              Enforces Rules Without Favouritism
            </h3>
            <ol className="space-y-2.5 text-sm text-[#8E95A5] leading-relaxed list-decimal list-inside">
              <li>Anchors the vehicle’s SHA-256 specification hash and live ETH/INR rate.</li>
              <li>Holds all bidder security deposits in non-custodial escrow.</li>
              <li>Verifies that revealed offers match their original sealed hashes.</li>
              <li>Determines the highest valid bidder and unlocks instant refunds.</li>
            </ol>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION 4: EDGE-CASE & SCENARIO RESOLUTION TABLE
         ===================================================================== */}
      <section className="space-y-6">
        <div className="max-w-2xl space-y-2">
          <div className="text-xs font-mono text-[#C5A46D]">
            Protocol Safeguards
          </div>
          <h2 className="text-2xl sm:text-3xl font-display font-semibold text-[#F4F5F7] tracking-tight">
            How the System Handles Every Scenario
          </h2>
          <p className="text-sm text-[#8E95A5]">
            Because rules are enforced by deterministic smart contracts, every outcome is predictable and transparent before you place a bid.
          </p>
        </div>

        <div className="bg-[#12141A] border border-[#232730] rounded-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-[#0B0C10] border-b border-[#232730] text-xs font-mono text-[#8E95A5]">
                  <th className="py-4 px-6 font-medium w-2/5">Scenario</th>
                  <th className="py-4 px-6 font-medium w-1/5">Contract Outcome</th>
                  <th className="py-4 px-6 font-medium w-2/5">How Funds Are Handled</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#232730]">
                {settlementRules.map((rule) => (
                  <tr key={rule.scenario} className="hover:bg-[#171A22]/50 transition-colors">
                    <td className="py-5 px-6 text-[#F4F5F7] font-medium align-top">
                      {rule.scenario}
                    </td>
                    <td className="py-5 px-6 font-mono text-xs text-[#C5A46D] align-top">
                      {rule.resolution}
                    </td>
                    <td className="py-5 px-6 text-[#8E95A5] text-xs sm:text-sm leading-relaxed align-top">
                      {rule.detail}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION 5: VISUAL END-TO-END AUCTION FLOWCHART
         ===================================================================== */}
      <section className="space-y-10 pt-4">
        <div className="max-w-3xl space-y-2">
          <div className="text-xs font-mono text-[#C5A46D]">
            Complete Visual Walkthrough
          </div>
          <h2 className="text-2xl sm:text-3xl font-display font-semibold text-[#F4F5F7] tracking-tight">
            Auction Flowchart: From Car Listing to Final Payout
          </h2>
          <p className="text-sm text-[#8E95A5] leading-relaxed">
            Follow the diagram below to see how a vehicle moves from initial AI price estimation to sealed bidding, simultaneous opening, and automatic money settlement.
          </p>
        </div>

        <div className="bg-[#12141A] border border-[#232730] rounded-md p-6 sm:p-10">
          <div className="max-w-4xl mx-auto flex flex-col items-center">
            {/* NODE 1: SELLER LISTS CAR & AI VALUATION */}
            <div className="w-full max-w-2xl bg-[#0B0C10] border border-[#232730] rounded-md p-5 sm:p-6 relative">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-[#232730]">
                <span className="text-xs font-mono font-semibold text-[#C5A46D]">
                  STEP 1 · LISTING &amp; AI VALUATION
                </span>
                <span className="text-[11px] font-mono text-[#8E95A5]">
                  Done by: Vehicle Seller
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-display font-semibold text-[#F4F5F7]">
                Seller Enters Car Details &amp; Gets AI Fair Market Price (₹ INR)
              </h3>
              <p className="text-xs sm:text-sm text-[#8E95A5] mt-2 leading-relaxed">
                Seller enters the car’s make, model, year, and kilometers driven. The AI estimates its fair resale value in Rupees (₹) and records a tamper-proof fingerprint on the blockchain. The seller then sets the <strong className="text-[#F4F5F7]">Starting Bid</strong>, the <strong className="text-[#F4F5F7]">Seller Reserve Price</strong> (minimum acceptable sale price), and a uniform <strong className="text-[#F4F5F7]">Collateral Deposit</strong>.
              </p>
            </div>

            {/* CONNECTOR ARROW 1 -> 2 */}
            <div className="flex flex-col items-center py-2" aria-hidden="true">
              <div className="w-px h-7 bg-[#C5A46D]/60" />
              <div className="text-[11px] font-mono text-[#C5A46D] px-3 py-1 bg-[#0B0C10] border border-[#232730] rounded">
                Auction Opens for Bidding
              </div>
              <div className="w-px h-5 bg-[#C5A46D]/60" />
              <svg className="w-3.5 h-3.5 text-[#C5A46D] -mt-1" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 12L2 6h12L8 12z" />
              </svg>
            </div>

            {/* NODE 2: COMMIT WINDOW (SEALED BIDDING) */}
            <div className="w-full max-w-2xl bg-[#0B0C10] border border-[#232730] rounded-md p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-[#232730]">
                <span className="text-xs font-mono font-semibold text-[#C5A46D]">
                  STEP 2 · COMMIT PHASE (SEALED BIDDING WINDOW)
                </span>
                <span className="text-[11px] font-mono text-[#8E95A5]">
                  Done by: Competing Bidders
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-display font-semibold text-[#F4F5F7]">
                Buyers Lock Their Secret Bid Inside a Digital Envelope
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3 pt-1 text-xs text-[#8E95A5]">
                <div className="bg-[#12141A] border border-[#232730] rounded p-3.5 space-y-1">
                  <div className="font-mono text-[#F4F5F7] font-medium">
                    1. Secret Offer + Passkey (Hidden)
                  </div>
                  <p className="leading-relaxed">
                    Your actual bid price is scrambled with a secret passkey (Salt) in your browser. Nobody—not even the seller or other buyers—can see how much you bid.
                  </p>
                </div>
                <div className="bg-[#12141A] border border-[#232730] rounded p-3.5 space-y-1">
                  <div className="font-mono text-[#F4F5F7] font-medium">
                    2. Equal Collateral Deposit (Locked)
                  </div>
                  <p className="leading-relaxed">
                    Every bidder locks the exact same refundable deposit (e.g. 0.25 ETH) in MetaMask so nobody can guess your bid from the wallet transfer amount.
                  </p>
                </div>
              </div>
            </div>

            {/* CONNECTOR ARROW 2 -> 3 */}
            <div className="flex flex-col items-center py-2" aria-hidden="true">
              <div className="w-px h-7 bg-[#C5A46D]/60" />
              <div className="text-[11px] font-mono text-[#C5A46D] px-3 py-1 bg-[#0B0C10] border border-[#232730] rounded">
                Commit Timer Ends · New Bids Blocked
              </div>
              <div className="w-px h-5 bg-[#C5A46D]/60" />
              <svg className="w-3.5 h-3.5 text-[#C5A46D] -mt-1" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 12L2 6h12L8 12z" />
              </svg>
            </div>

            {/* NODE 3: REVEAL WINDOW (UNSEALING) */}
            <div className="w-full max-w-2xl bg-[#0B0C10] border border-[#232730] rounded-md p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-[#232730]">
                <span className="text-xs font-mono font-semibold text-[#C5A46D]">
                  STEP 3 · REVEAL PHASE (OPENING THE ENVELOPES)
                </span>
                <span className="text-[11px] font-mono text-[#8E95A5]">
                  Done by: Bidders + Smart Contract
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-display font-semibold text-[#F4F5F7]">
                1-Click Bid Reveal &amp; Automatic Fingerprint Check
              </h3>
              <p className="text-xs sm:text-sm text-[#8E95A5] mt-2 leading-relaxed">
                Each bidder clicks <strong className="text-[#F4F5F7]">Reveal My Bid Now</strong>. Their saved passkey unlocks the sealed envelope, and the smart contract verifies that the opened price matches the original sealed fingerprint from Step 2. Any attempt to change the bid price is automatically rejected.
              </p>
            </div>

            {/* CONNECTOR ARROW 3 -> 4 (DECISION POINT) */}
            <div className="flex flex-col items-center py-2" aria-hidden="true">
              <div className="w-px h-7 bg-[#C5A46D]/60" />
              <div className="text-[11px] font-mono text-[#C5A46D] px-3 py-1 bg-[#0B0C10] border border-[#232730] rounded">
                Reveal Timer Ends · Finalize Auction
              </div>
              <div className="w-px h-5 bg-[#C5A46D]/60" />
              <svg className="w-3.5 h-3.5 text-[#C5A46D] -mt-1" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 12L2 6h12L8 12z" />
              </svg>
            </div>

            {/* NODE 4: DECISION CHECKPOINT */}
            <div className="w-full max-w-xl bg-[#0B0C10] border-2 border-[#C5A46D]/70 rounded-md p-5 text-center space-y-2">
              <div className="text-[11px] font-mono uppercase tracking-wider text-[#C5A46D]">
                STEP 4 · SMART CONTRACT DECISION CHECKPOINT
              </div>
              <h3 className="text-base sm:text-lg font-display font-semibold text-[#F4F5F7]">
                Is the Highest Revealed Bid ≥ Seller Reserve Price?
              </h3>
              <p className="text-xs text-[#8E95A5]">
                The smart contract compares the highest verified offer against the seller’s minimum acceptable price.
              </p>
            </div>

            {/* SPLIT BRANCH CONNECTORS (YES vs NO) */}
            <div className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              {/* LEFT BRANCH: YES -> VEHICLE SOLD */}
              <div className="flex flex-col items-center">
                <div className="flex flex-col items-center pb-3" aria-hidden="true">
                  <div className="w-px h-5 bg-emerald-500/60" />
                  <span className="px-3 py-1 rounded bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 font-mono text-xs font-semibold">
                    YES · Reserve Price Met
                  </span>
                  <div className="w-px h-4 bg-emerald-500/60" />
                  <svg className="w-3.5 h-3.5 text-emerald-400 -mt-1" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 12L2 6h12L8 12z" />
                  </svg>
                </div>

                <div className="w-full flex-1 bg-[#0B0C10] border border-emerald-500/40 rounded-md p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-[#232730] pb-3">
                    <span className="text-xs font-mono font-semibold text-emerald-400">
                      OUTCOME A · VEHICLE SOLD
                    </span>
                    <span className="text-[11px] font-mono text-[#8E95A5]">
                      Highest Bidder Wins
                    </span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="p-3 rounded bg-[#12141A] border border-[#232730] space-y-1">
                      <div className="font-mono text-[#F4F5F7] font-semibold">
                        1. Winning Buyer Pays Remaining Balance
                      </div>
                      <p className="text-[#8E95A5] leading-relaxed">
                        Their locked deposit is counted toward the purchase. They pay only <strong className="text-[#F4F5F7]">Winning Bid − Collateral Deposit</strong>.
                      </p>
                    </div>

                    <div className="p-3 rounded bg-[#12141A] border border-[#232730] space-y-1">
                      <div className="font-mono text-[#F4F5F7] font-semibold">
                        2. Other Buyers Get 100% Deposit Refund
                      </div>
                      <p className="text-[#8E95A5] leading-relaxed">
                        Every non-winning buyer who revealed on time clicks <strong className="text-[#F4F5F7]">Claim Refund</strong> to get their full deposit back.
                      </p>
                    </div>

                    <div className="p-3 rounded bg-[#12141A] border border-[#232730] space-y-1">
                      <div className="font-mono text-[#F4F5F7] font-semibold">
                        3. Seller Withdraws Full Sale Price
                      </div>
                      <p className="text-[#8E95A5] leading-relaxed">
                        Once the winner completes payment, the seller clicks <strong className="text-[#F4F5F7]">Withdraw Proceeds</strong> to receive the full winning amount.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT BRANCH: NO -> NO SALE */}
              <div className="flex flex-col items-center">
                <div className="flex flex-col items-center pb-3" aria-hidden="true">
                  <div className="w-px h-5 bg-amber-500/60" />
                  <span className="px-3 py-1 rounded bg-amber-950/60 border border-amber-500/40 text-amber-300 font-mono text-xs font-semibold">
                    NO · Below Seller Reserve
                  </span>
                  <div className="w-px h-4 bg-amber-500/60" />
                  <svg className="w-3.5 h-3.5 text-amber-400 -mt-1" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 12L2 6h12L8 12z" />
                  </svg>
                </div>

                <div className="w-full flex-1 bg-[#0B0C10] border border-amber-500/40 rounded-md p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-[#232730] pb-3">
                    <span className="text-xs font-mono font-semibold text-amber-400">
                      OUTCOME B · NO SALE
                    </span>
                    <span className="text-[11px] font-mono text-[#8E95A5]">
                      Reserve Not Met
                    </span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="p-3 rounded bg-[#12141A] border border-[#232730] space-y-1">
                      <div className="font-mono text-[#F4F5F7] font-semibold">
                        1. Seller Retains the Vehicle
                      </div>
                      <p className="text-[#8E95A5] leading-relaxed">
                        The seller is protected from selling below their minimum acceptable price and keeps full ownership of the car.
                      </p>
                    </div>

                    <div className="p-3 rounded bg-[#12141A] border border-[#232730] space-y-1">
                      <div className="font-mono text-[#F4F5F7] font-semibold">
                        2. All Revealed Buyers Get 100% Refund
                      </div>
                      <p className="text-[#8E95A5] leading-relaxed">
                        Every buyer who revealed their sealed bid on time clicks <strong className="text-[#F4F5F7]">Claim Refund</strong> and receives 100% of their collateral deposit back.
                      </p>
                    </div>

                    <div className="p-3 rounded bg-[#12141A] border border-[#232730] space-y-1">
                      <div className="font-mono text-[#F4F5F7] font-semibold">
                        3. Ready for Re-Listing or Reset
                      </div>
                      <p className="text-[#8E95A5] leading-relaxed">
                        The seller can list the vehicle again with updated terms, or the Admin can clean up completed auction records.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
