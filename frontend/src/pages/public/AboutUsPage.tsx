import React from 'react';
import { Layers, Cpu, Shield, Database } from 'lucide-react';

export const AboutUsPage: React.FC = () => {
  return (
    <div className="space-y-10 pb-16">
      {/* Editorial Intro */}
      <div className="bg-[#12141A] border border-[#232730] rounded-md p-8 sm:p-10 space-y-4">
        <span className="text-[11px] font-mono uppercase tracking-[0.16em] text-[#C5A46D]">
          Institutional Overview
        </span>
        <h1 className="text-2xl sm:text-4xl font-display font-semibold text-[#F4F5F7]">
          AuctionChain — Automotive Fintech & Cryptographic Exchange
        </h1>
        <p className="text-sm sm:text-base text-[#8E95A5] max-w-3xl leading-relaxed">
          AuctionChain is an institutional vehicle remarketing and sealed-bid
          auction platform engineered to eliminate price manipulation, mempool bid
          sniping, and valuation opacity in high-value pre-owned automotive markets.
        </p>
      </div>

      {/* Four Architectural Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#12141A] border border-[#232730] rounded-md p-6 space-y-3">
          <div className="flex items-center gap-2.5 text-xs font-mono uppercase tracking-[0.14em] text-[#C5A46D]">
            <Cpu className="w-4 h-4" />
            <span>01 · Intelligent Valuation Layer</span>
          </div>
          <h3 className="text-lg font-display font-semibold text-[#F4F5F7]">
            AI-Calibrated Indian Vehicle Appraisal
          </h3>
          <p className="text-xs sm:text-sm text-[#8E95A5] leading-relaxed">
            Our valuation service evaluates 13 structured vehicle attributes—including
            registration year, odometer reading, powertrain, transmission, and
            condition grade—to produce fair market appraisals in Indian Rupees (INR)
            prior to consignment.
          </p>
        </div>

        <div className="bg-[#12141A] border border-[#232730] rounded-md p-6 space-y-3">
          <div className="flex items-center gap-2.5 text-xs font-mono uppercase tracking-[0.14em] text-[#C5A46D]">
            <Database className="w-4 h-4" />
            <span>02 · On-Chain Oracle Registry</span>
          </div>
          <h3 className="text-lg font-display font-semibold text-[#F4F5F7]">
            PriceOracle.sol Attestation
          </h3>
          <p className="text-xs sm:text-sm text-[#8E95A5] leading-relaxed">
            Each vehicle appraisal is serialized into a canonical JSON payload,
            hashed with SHA-256, and written to <code className="font-mono text-[#F4F5F7]">PriceOracle.sol</code>{' '}
            by an isolated Oracle signer account (#19), establishing a tamper-proof
            valuation benchmark.
          </p>
        </div>

        <div className="bg-[#12141A] border border-[#232730] rounded-md p-6 space-y-3">
          <div className="flex items-center gap-2.5 text-xs font-mono uppercase tracking-[0.14em] text-[#C5A46D]">
            <Shield className="w-4 h-4" />
            <span>03 · Sealed Commit-Reveal Bidding</span>
          </div>
          <h3 className="text-lg font-display font-semibold text-[#F4F5F7]">
            Information-Symmetric Price Discovery
          </h3>
          <p className="text-xs sm:text-sm text-[#8E95A5] leading-relaxed">
            By separating bid submission (salted Keccak-256 hash + uniform ETH
            deposit) from bid revelation, AuctionChain guarantees that every
            participant submits their true independent valuation without signaling
            competitors.
          </p>
        </div>

        <div className="bg-[#12141A] border border-[#232730] rounded-md p-6 space-y-3">
          <div className="flex items-center gap-2.5 text-xs font-mono uppercase tracking-[0.14em] text-[#C5A46D]">
            <Layers className="w-4 h-4" />
            <span>04 · Role-Segregated Workspaces</span>
          </div>
          <h3 className="text-lg font-display font-semibold text-[#F4F5F7]">
            Dedicated Seller, Bidder & Auditor Consoles
          </h3>
          <p className="text-xs sm:text-sm text-[#8E95A5] leading-relaxed">
            Authenticated signers are routed to specialized institutional workspaces:
            Sellers manage consignments and proceeds, Bidders manage sealed salts
            and collateral refunds, and Protocol Auditors oversee oracle feeds and
            contract telemetry.
          </p>
        </div>
      </div>
    </div>
  );
};
