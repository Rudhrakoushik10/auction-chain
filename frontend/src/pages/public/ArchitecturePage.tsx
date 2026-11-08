import React from 'react';

export const ArchitecturePage: React.FC = () => {
  const servers = [
    {
      index: '01',
      name: 'Web3 Frontend',
      everydayRole: 'The Digital Showroom & Private Bid Sealer',
      plainExplanation:
        'The Frontend is the website interface that sellers, buyers, and administrators interact with in their browser. Beyond displaying vehicles and dashboards, its most important job is protecting buyer privacy: when a buyer enters a bid price, the Frontend locks that price inside a digital envelope directly on the user’s computer before sending it out. Because the sealing happens on the user’s own device, the actual bid amount is never exposed over the internet while bidding is open.',
      summary: {
        role: 'Provides role dashboards and seals buyer bids privately in the browser.',
        communicatesWith: 'Sends car details to the AI Backend; sends sealed bids to the Blockchain.',
        guarantee: 'Your secret bid amount never leaves your computer in plain text during bidding.',
      },
    },
    {
      index: '02',
      name: 'AI Valuation Backend',
      everydayRole: 'The Independent Car Appraiser',
      plainExplanation:
        'Before a car is put up for auction, both the seller and potential buyers need to know what the vehicle is fairly worth in the Indian market. The AI Backend receives the car’s details—make, model, age, kilometers driven, fuel type, transmission, and condition—and calculates an objective fair-market valuation in Indian Rupees (₹). It also creates a unique digital fingerprint of the car’s description so the vehicle specifications cannot be altered later.',
      summary: {
        role: 'Evaluates vehicle details and estimates fair resale value in Indian Rupees (₹).',
        communicatesWith: 'Receives vehicle specs from the Frontend; sends the valuation record to the Oracle.',
        guarantee: 'Provides an unbiased Indian market price benchmark before anyone places a bid.',
      },
    },
    {
      index: '03',
      name: 'Blockchain Node',
      everydayRole: 'The Automated Escrow Vault & Referee',
      plainExplanation:
        'The Blockchain acts as an impartial digital referee and a secure vault that no single person or company can manipulate. While the auction is running, it safely holds every buyer’s refundable security deposit and keeps track of the official countdown timers. Once the bidding window closes and buyers unlock their bids, the Blockchain checks that no bid was tampered with, identifies the highest valid offer above the seller’s minimum price, and immediately unlocks deposit refunds for everyone else.',
      summary: {
        role: 'Enforces auction timers, holds refundable deposits, and selects the winner.',
        communicatesWith: 'Receives sealed bids from the Frontend; checks vehicle records with the Oracle.',
        guarantee: 'No human auctioneer can favour a buyer, peek at bids early, or withhold refunds.',
      },
    },
    {
      index: '04',
      name: 'Price Oracle',
      everydayRole: 'The Trusted Rate & Record Messenger',
      plainExplanation:
        'A blockchain is a closed system—on its own, it cannot look up real-world Indian Rupee exchange rates or read external AI car appraisals. The Oracle serves as the trusted bridge between the outside world and the Blockchain. It records the AI Backend’s car valuation on the ledger before the auction starts, and continuously supplies the live ETH-to-Indian Rupee (₹) exchange rate so every deposit and bid is displayed accurately in Rupees.',
      summary: {
        role: 'Connects off-chain AI appraisals and live Rupee exchange rates to the Blockchain.',
        communicatesWith: 'Receives valuation records from the AI Backend; feeds verified data to the Blockchain.',
        guarantee: 'Ensures every auctioned car has a verified valuation record and accurate ₹ INR conversion.',
      },
    },
  ];

  const communicationSteps = [
    {
      step: '01',
      fromTo: 'Frontend → AI Backend',
      whatIsSent: 'Vehicle details (Make, Model, Year, Kilometers, Condition)',
      whyItHappens: 'To calculate a fair Indian Rupee (₹) market price before the seller launches the auction.',
    },
    {
      step: '02',
      fromTo: 'AI Backend → Price Oracle',
      whatIsSent: 'Estimated ₹ INR value and the vehicle’s digital fingerprint',
      whyItHappens: 'To lock the official appraisal record on-chain so the car description cannot be changed.',
    },
    {
      step: '03',
      fromTo: 'Frontend → Blockchain',
      whatIsSent: 'Sealed bid envelopes and refundable security deposits',
      whyItHappens: 'To record each buyer’s locked offer and hold their deposit safely until the timer ends.',
    },
    {
      step: '04',
      fromTo: 'Price Oracle → Blockchain & Frontend',
      whatIsSent: 'Verified appraisal proof and live ETH-to-Rupee (₹) exchange rate',
      whyItHappens: 'To confirm the vehicle is genuine and display every ETH amount in Indian Rupees (₹).',
    },
  ];

  return (
    <div className="space-y-24 pb-24">
      {/* =====================================================================
          SECTION 1: EDITORIAL INTRODUCTION
         ===================================================================== */}
      <section className="pt-4 space-y-6 max-w-3xl">
        <div className="flex items-center gap-3 text-xs font-mono text-[#8E95A5]">
          <span className="text-[#C5A46D]">System Architecture</span>
          <span aria-hidden="true">·</span>
          <span>Four-Server Topology</span>
        </div>

        <h1
          className="text-3xl sm:text-5xl font-display font-semibold text-[#F4F5F7] tracking-tight leading-[1.1]"
          style={{ textWrap: 'balance' }}
        >
          How the Four System Components Work Together
        </h1>

        <p className="text-base text-[#8E95A5] leading-relaxed">
          To keep bids private, car valuations objective, and security deposits safe, AuctionChain separates responsibilities across four dedicated servers. Think of them as a <strong className="text-[#F4F5F7] font-medium">Digital Showroom</strong>, an <strong className="text-[#F4F5F7] font-medium">Independent Appraiser</strong>, an <strong className="text-[#F4F5F7] font-medium">Automated Escrow Vault</strong>, and a <strong className="text-[#F4F5F7] font-medium">Trusted Messenger</strong>.
        </p>
      </section>

      {/* =====================================================================
          SECTION 2: CLEAN VISUAL BLOCK DIAGRAM
         ===================================================================== */}
      <section className="space-y-8">
        <div className="max-w-2xl space-y-2">
          <div className="text-xs font-mono text-[#C5A46D]">
            01. System Block Diagram
          </div>
          <h2 className="text-2xl sm:text-3xl font-display font-semibold text-[#F4F5F7] tracking-tight">
            How the Servers Exist and Communicate
          </h2>
          <p className="text-sm text-[#8E95A5]">
            The diagram below shows the four servers and the exact information they exchange during an auction.
          </p>
        </div>

        <div className="bg-[#12141A] border border-[#232730] rounded-md p-6 sm:p-10 space-y-8">
          {/* Top Row: Frontend <---> AI Backend */}
          <div className="grid grid-cols-1 lg:grid-cols-11 gap-6 items-stretch">
            {/* Block 01: Frontend */}
            <div className="lg:col-span-4 bg-[#0B0C10] border border-[#232730] rounded-md p-6 flex flex-col justify-between space-y-4">
              <div className="space-y-1.5">
                <div className="text-xs font-mono text-[#C5A46D]">01 · CLIENT SERVER</div>
                <h3 className="text-lg font-display font-semibold text-[#F4F5F7]">
                  Web3 Frontend
                </h3>
                <div className="text-xs text-[#8E95A5]">
                  The Digital Showroom &amp; Bid Sealer
                </div>
              </div>
              <p className="text-xs text-[#8E95A5] leading-relaxed pt-3 border-t border-[#232730]">
                Where sellers list cars and buyers place secret bids. Seals bid amounts privately inside the user’s browser.
              </p>
            </div>

            {/* Horizontal Connector 1 */}
            <div className="lg:col-span-3 flex flex-col items-center justify-center text-center px-2 py-2 space-y-2">
              <div className="text-xs font-mono text-[#F4F5F7]">
                1. Sends Car Specifications →
              </div>
              <div className="w-full border-t border-[#C5A46D]/50" />
              <div className="text-xs font-mono text-[#C5A46D]">
                ← 2. Returns Fair Price in ₹ INR
              </div>
            </div>

            {/* Block 02: AI Backend */}
            <div className="lg:col-span-4 bg-[#0B0C10] border border-[#232730] rounded-md p-6 flex flex-col justify-between space-y-4">
              <div className="space-y-1.5">
                <div className="text-xs font-mono text-[#C5A46D]">02 · VALUATION SERVER</div>
                <h3 className="text-lg font-display font-semibold text-[#F4F5F7]">
                  AI Valuation Backend
                </h3>
                <div className="text-xs text-[#8E95A5]">
                  The Independent Car Appraiser
                </div>
              </div>
              <p className="text-xs text-[#8E95A5] leading-relaxed pt-3 border-t border-[#232730]">
                Analyzes the car’s age, mileage, make, and condition to estimate its fair market value in Indian Rupees (₹).
              </p>
            </div>
          </div>

          {/* Middle Vertical Communication Arrows */}
          <div className="grid grid-cols-1 lg:grid-cols-11 gap-6 py-4 border-y border-[#232730] text-center">
            <div className="lg:col-span-4 space-y-1">
              <div className="text-xs font-mono text-[#C5A46D]">
                ▼ 3. Submits Sealed Bids &amp; Deposits ▲
              </div>
              <div className="text-xs text-[#8E95A5]">
                Locks refundable deposits during bidding; unlocks bids during reveal
              </div>
            </div>

            <div className="lg:col-span-3 flex items-center justify-center">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#646C7E]">
                Off-Chain ⇄ On-Chain Bridge
              </span>
            </div>

            <div className="lg:col-span-4 space-y-1">
              <div className="text-xs font-mono text-[#C5A46D]">
                ▼ 4. Anchors Valuation Record ▲
              </div>
              <div className="text-xs text-[#8E95A5]">
                Records the AI appraisal fingerprint and live ETH-to-Rupee exchange rate
              </div>
            </div>
          </div>

          {/* Bottom Row: Blockchain <---> Oracle */}
          <div className="grid grid-cols-1 lg:grid-cols-11 gap-6 items-stretch">
            {/* Block 03: Blockchain */}
            <div className="lg:col-span-4 bg-[#0B0C10] border border-[#232730] rounded-md p-6 flex flex-col justify-between space-y-4">
              <div className="space-y-1.5">
                <div className="text-xs font-mono text-[#C5A46D]">03 · BLOCKCHAIN SERVER</div>
                <h3 className="text-lg font-display font-semibold text-[#F4F5F7]">
                  Blockchain Node
                </h3>
                <div className="text-xs text-[#8E95A5]">
                  The Automated Vault &amp; Referee
                </div>
              </div>
              <p className="text-xs text-[#8E95A5] leading-relaxed pt-3 border-t border-[#232730]">
                Holds security deposits safely, verifies unlocked bids when the timer ends, crowns the winner, and refunds non-winners.
              </p>
            </div>

            {/* Horizontal Connector 2 */}
            <div className="lg:col-span-3 flex flex-col items-center justify-center text-center px-2 py-2 space-y-2">
              <div className="text-xs font-mono text-[#F4F5F7]">
                Checks Vehicle Appraisal →
              </div>
              <div className="w-full border-t border-[#C5A46D]/50" />
              <div className="text-xs font-mono text-[#C5A46D]">
                ← Supplies Live ₹ INR Rate
              </div>
            </div>

            {/* Block 04: Oracle */}
            <div className="lg:col-span-4 bg-[#0B0C10] border border-[#232730] rounded-md p-6 flex flex-col justify-between space-y-4">
              <div className="space-y-1.5">
                <div className="text-xs font-mono text-[#C5A46D]">04 · ORACLE SERVICE</div>
                <h3 className="text-lg font-display font-semibold text-[#F4F5F7]">
                  Price Oracle
                </h3>
                <div className="text-xs text-[#8E95A5]">
                  The Trusted Rate &amp; Record Messenger
                </div>
              </div>
              <p className="text-xs text-[#8E95A5] leading-relaxed pt-3 border-t border-[#232730]">
                Stores the official AI valuation certificate on-chain and provides the live ETH-to-Indian Rupee (₹) conversion rate.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION 3: DETAILED SERVER ROLES IN PLAIN LANGUAGE (EDITORIAL LEDGER)
         ===================================================================== */}
      <section className="space-y-8">
        <div className="max-w-2xl space-y-2">
          <div className="text-xs font-mono text-[#C5A46D]">
            02. Server Roles &amp; Responsibilities
          </div>
          <h2 className="text-2xl sm:text-3xl font-display font-semibold text-[#F4F5F7] tracking-tight">
            What Each Server Does in the System
          </h2>
          <p className="text-sm text-[#8E95A5]">
            A clear breakdown of each server’s purpose, how it interacts with the other components, and what it guarantees for users.
          </p>
        </div>

        <div className="border-t border-[#232730] divide-y divide-[#232730]">
          {servers.map((srv) => (
            <article
              key={srv.index}
              className="py-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
            >
              {/* Left Column: Server Number & Title (3 cols) */}
              <div className="lg:col-span-3 space-y-2">
                <div className="text-2xl font-mono font-semibold text-[#C5A46D] tabular-nums">
                  {srv.index}
                </div>
                <h3 className="text-lg font-display font-semibold text-[#F4F5F7]">
                  {srv.name}
                </h3>
                <div className="text-xs text-[#8E95A5] pt-0.5">
                  {srv.everydayRole}
                </div>
              </div>

              {/* Center Column: Plain-Language Explanation (5 cols) */}
              <div className="lg:col-span-5 space-y-2">
                <div className="text-xs font-mono text-[#646C7E]">
                  Role in Plain Language
                </div>
                <p className="text-sm text-[#8E95A5] leading-relaxed">
                  {srv.plainExplanation}
                </p>
              </div>

              {/* Right Column: Clean 3-Point Summary (4 cols) */}
              <div className="lg:col-span-4 bg-[#12141A] border border-[#232730] rounded-md p-5 space-y-3.5 text-xs">
                <div className="font-mono text-[#C5A46D] pb-2 border-b border-[#232730]">
                  Component Summary · {srv.name}
                </div>

                <dl className="space-y-3">
                  <div>
                    <dt className="text-[#646C7E] font-mono">Primary Responsibility</dt>
                    <dd className="text-[#F4F5F7] mt-0.5 leading-relaxed">{srv.summary.role}</dd>
                  </div>
                  <div className="pt-2.5 border-t border-[#232730]">
                    <dt className="text-[#646C7E] font-mono">How It Connects</dt>
                    <dd className="text-[#F4F5F7] mt-0.5 leading-relaxed">
                      {srv.summary.communicatesWith}
                    </dd>
                  </div>
                  <div className="pt-2.5 border-t border-[#232730]">
                    <dt className="text-[#646C7E] font-mono">User Guarantee</dt>
                    <dd className="text-[#8E95A5] mt-0.5 leading-relaxed">
                      {srv.summary.guarantee}
                    </dd>
                  </div>
                </dl>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* =====================================================================
          SECTION 4: SIMPLE COMMUNICATION SUMMARY TABLE
         ===================================================================== */}
      <section className="space-y-6">
        <div className="max-w-2xl space-y-2">
          <div className="text-xs font-mono text-[#C5A46D]">
            03. Communication Flow
          </div>
          <h2 className="text-2xl sm:text-3xl font-display font-semibold text-[#F4F5F7] tracking-tight">
            How Information Travels Across the System
          </h2>
        </div>

        <div className="bg-[#12141A] border border-[#232730] rounded-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-[#0B0C10] border-b border-[#232730] text-xs font-mono text-[#8E95A5]">
                  <th className="py-4 px-6 font-medium w-16">Step</th>
                  <th className="py-4 px-6 font-medium w-1/4">Servers Involved</th>
                  <th className="py-4 px-6 font-medium w-1/3">Information Shared</th>
                  <th className="py-4 px-6 font-medium">Why It Happens</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#232730]">
                {communicationSteps.map((row) => (
                  <tr key={row.step} className="hover:bg-[#171A22]/50 transition-colors">
                    <td className="py-5 px-6 font-mono text-xs text-[#C5A46D] align-top">
                      {row.step}
                    </td>
                    <td className="py-5 px-6 font-medium text-[#F4F5F7] align-top">
                      {row.fromTo}
                    </td>
                    <td className="py-5 px-6 text-[#F4F5F7] text-xs sm:text-sm align-top">
                      {row.whatIsSent}
                    </td>
                    <td className="py-5 px-6 text-[#8E95A5] text-xs sm:text-sm leading-relaxed align-top">
                      {row.whyItHappens}
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
