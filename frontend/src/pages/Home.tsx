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
      title: 'Last-Second Bid Sniping & Fake Price Driving',
      problem:
        'In regular online car auctions, everyone can see the current highest bid. Buyers wait until the last few seconds to jump in (sniping), while dishonest sellers or insiders place fake bids just to push genuine buyers into paying more.',
      consequence: 'Unfair bidding wars and inflated car prices for real buyers.',
    },
    {
      index: '02',
      title: 'Visible Bids on Standard Public Platforms',
      problem:
        'Even on basic blockchain auction sites, the amount you bid and the money you transfer are visible to the public right away. Competitors and automated bots can see your offer while it is still processing and outbid you by a tiny margin.',
      consequence: 'Zero privacy—competitors can copy or beat your offer instantly.',
    },
    {
      index: '03',
      title: 'Guesswork in Indian Used-Car Pricing',
      problem:
        'A used car’s true value in India depends on its brand demand, kilometers driven, fuel type, transmission, and accident history. Without an independent price estimate in Indian Rupees (₹), sellers set unrealistic prices and buyers overpay.',
      consequence: 'Buyers and sellers don’t have a trusted reference price.',
    },
    {
      index: '04',
      title: 'Non-Serious Bidders & Slow Deposit Refunds',
      problem:
        'Many traditional portals either let casual bidders win and walk away without paying, or hold buyer security deposits in company bank accounts that take days or weeks to refund if you don’t win.',
      consequence: 'Wasted time for sellers and locked-up money for honest buyers.',
    },
  ];

  const solutions = [
    {
      step: '01',
      title: 'Digital Sealed-Envelope Bidding',
      subtitle: 'Your Offer Stays Secret Until Bidding Closes',
      description:
        'Instead of showing your bid to the public, your browser locks your price inside a private digital envelope before sending it. Nobody—not the seller, other buyers, or the platform—can see how much you offered while the auction is open.',
    },
    {
      step: '02',
      title: 'Same Security Deposit for Every Bidder',
      subtitle: 'Wallet Transfers Never Give Away Your Bid Size',
      description:
        'If buyers had to send their full bid amount up front, anyone watching wallet transfers could guess how much they bid. On AuctionChain, every bidder puts down the exact same refundable security deposit, keeping your actual offer completely hidden.',
    },
    {
      step: '03',
      title: 'AI Fair-Price Guide in Indian Rupees (₹)',
      subtitle: 'Objective Valuation Before You Bid',
      description:
        'Before any vehicle goes live, our AI valuation engine checks its make, model, year, mileage, and condition against the Indian pre-owned car market. Every listing displays a clear fair-value range in Rupees (₹) so you can bid with confidence.',
    },
    {
      step: '04',
      title: 'Automatic Winner Selection & Instant Refunds',
      subtitle: 'No Middlemen Holding Your Money',
      description:
        'Once the bidding timer ends, all sealed envelopes are opened and verified automatically. The highest genuine bidder above the seller’s minimum price wins the car, and everyone else can withdraw 100% of their security deposit in one click.',
    },
  ];

  const comparisonRows = [
    {
      dimension: 'Who Can See Your Bid?',
      traditional: 'Visible to all buyers, sellers, and insiders right away',
      naiveBlockchain: 'Publicly visible in transaction records',
      auctionChain: 'Kept 100% private inside a sealed digital envelope until bidding ends',
    },
    {
      dimension: 'Last-Second Sniping Protection',
      traditional: 'Anyone can outbid you in the final second',
      naiveBlockchain: 'Automated bots can jump ahead of your transaction',
      auctionChain: 'Protected — everyone submits their best offer privately',
    },
    {
      dimension: 'Car Price Guidance',
      traditional: 'Rough dealer estimate or guesswork',
      naiveBlockchain: 'No price guidance at all',
      auctionChain: 'AI Indian market valuation in Rupees (₹) locked to the car’s details',
    },
    {
      dimension: 'Security Deposit Refunds',
      traditional: 'Held by a company bank account (3–10 business days)',
      naiveBlockchain: 'Can get stuck or delayed by network errors',
      auctionChain: 'Instant 1-click refund directly back to your wallet if you don’t win',
    },
    {
      dimension: 'How the Winner Is Chosen',
      traditional: 'Managed privately behind closed doors',
      naiveBlockchain: 'Automatic, but bids are exposed beforehand',
      auctionChain: '100% transparent, tamper-proof rules verified automatically',
    },
  ];

  return (
    <div className="space-y-20 pb-24">
      {/* ===================================================================
          SECTION 1: HERO STAGE — ABOUT THE PLATFORM (SCOPED 3D SCENE)
         =================================================================== */}
      <section className="relative border-b border-[#232730] pt-4 pb-14 lg:pt-8 lg:pb-20 overflow-hidden">
        {/* Scoped 3D SUV Background Animation (Top Hero Section Only) */}
        <InteractiveSuvScene />

        {/* Subtle Scoped Contrast Scrim */}
        <div
          className="absolute inset-0 pointer-events-none bg-gradient-to-r from-[#0B0C10]/90 via-[#0B0C10]/55 to-transparent z-[1]"
          aria-hidden="true"
        />

        <div className="relative z-10 w-full">
          <div className="max-w-2xl space-y-6">
            <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-[#8E95A5]">
              <span className="text-[#C5A46D]">About AuctionChain</span>
              <span aria-hidden="true">·</span>
              <span>Private Sealed-Bid Car Auctions</span>
            </div>

            <div className="space-y-4">
              <h1
                className="text-3xl sm:text-5xl lg:text-[3.15rem] font-display font-semibold tracking-tight text-[#F4F5F7] leading-[1.1]"
                style={{ textWrap: 'balance' }}
              >
                Fair, Private Car Auctions for the Indian Market with{' '}
                <span className="text-[#C5A46D]">Sealed-Envelope Bidding.</span>
              </h1>

              <p className="text-base sm:text-lg text-[#8E95A5] max-w-xl leading-relaxed">
                AuctionChain makes buying and selling pre-owned vehicles fair and simple. Every car gets an <strong className="text-[#F4F5F7] font-medium">AI-estimated fair market price in Indian Rupees (₹)</strong>, and every buyer submits their offer in a <strong className="text-[#F4F5F7] font-medium">private digital envelope</strong>—so nobody can see your bid, copy your price, or outbid you at the last second.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-6 pt-1">
              <button
                type="button"
                onClick={() => onNavigate('how-it-works')}
                className="px-6 py-3.5 rounded-md bg-[#C5A46D] hover:bg-[#D4B57E] text-[#0B0C10] font-semibold text-xs uppercase tracking-[0.12em] inline-flex items-center gap-2 transition-colors cursor-pointer"
              >
                <span>See How It Works</span>
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
            Why Regular Online Car Auctions Are Unfair to Buyers &amp; Sellers
          </h2>
          <p className="text-sm text-[#8E95A5] leading-relaxed">
            When everyone can see the current bid—or when nobody knows what a used car is genuinely worth—honest buyers end up overpaying and sellers struggle to get a fair deal.
          </p>
        </div>

        <div className="border-t border-[#232730] divide-y divide-[#232730]">
          {problemStatements.map((item) => (
            <article
              key={item.index}
              className="py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
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
                  What Goes Wrong
                </div>
                <p className="text-sm text-[#8E95A5] leading-relaxed">
                  {item.problem}
                </p>
              </div>

              <div className="lg:col-span-3 space-y-1.5">
                <div className="text-xs font-mono text-[#646C7E]">
                  Why It Matters
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
              Four Simple Protections Built Into Every Auction
            </h2>
            <p className="text-sm text-[#8E95A5] leading-relaxed">
              We combine private sealed-envelope bidding with AI price guidance so every buyer and seller gets a fair, transparent result.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('how-it-works')}
            className="text-xs font-mono uppercase tracking-[0.12em] text-[#C5A46D] hover:text-[#D4B57E] inline-flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <span>See Step-by-Step Guide</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="border-t border-b border-[#232730] grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#232730]">
          <div className="divide-y divide-[#232730]">
            {[solutions[0], solutions[2]].map((sol) => (
              <div key={sol.step} className="py-8 md:pr-10 space-y-3">
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
              <div key={sol.step} className="py-8 md:pl-10 space-y-3">
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
            03. Platform Comparison
          </div>
          <h2 className="text-2xl sm:text-3xl font-display font-semibold text-[#F4F5F7] tracking-tight">
            How AuctionChain Compares to Other Auction Platforms
          </h2>
        </div>

        <div className="bg-[#12141A] border border-[#232730] rounded-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-[#0B0C10] border-b border-[#232730] text-xs font-mono text-[#8E95A5]">
                  <th className="py-4 px-6 font-medium w-1/4">Feature</th>
                  <th className="py-4 px-6 font-medium w-1/4">Regular Online Auctions</th>
                  <th className="py-4 px-6 font-medium w-1/4">Basic Crypto Auctions</th>
                  <th className="py-4 px-6 font-medium w-1/4 text-[#C5A46D]">
                    AuctionChain
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
