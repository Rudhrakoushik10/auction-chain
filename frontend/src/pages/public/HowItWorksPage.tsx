import React from 'react';
import {
  ShieldCheck,
  Cpu,
  Lock,
  Gavel,
  FileCheck,
  ArrowRight,
  Database,
  Terminal,
  Zap,
} from 'lucide-react';
import { useWallet } from '../../context/WalletContext';

export const HowItWorksPage: React.FC = () => {
  const { openAuthModal } = useWallet();

  return (
    <div className="space-y-12 pb-16 animate-in fade-in duration-200">
      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4 pt-4">
        <span className="text-xs font-mono font-bold tracking-widest uppercase px-3 py-1 rounded bg-[#2563EB]/10 text-[#2563EB] border border-[#2563EB]/20">
          Architecture & Protocols
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#101B3D] tracking-tight">
          How AuctionChain Works
        </h1>
        <p className="text-base text-slate-600 leading-relaxed">
          AuctionChain combines sealed-bid cryptographic commitments with machine-learning vehicle valuation and decentralized oracle verification on Hardhat Local (Chain ID 31337).
        </p>
      </div>

      {/* 5 Key Pillars matching PRD and Navigation Specification */}
      <div className="space-y-8">
        {/* Pillar 1: Seller Workflow */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center">
              <Gavel className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-mono font-bold text-[#2563EB] uppercase">Step 1</span>
              <h2 className="text-xl font-bold text-[#101B3D]">Seller Workflow</h2>
            </div>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed mb-4">
            Vehicle sellers (Account 2) list certified automobiles by supplying model specifications, odometer readings, and condition history. Before deploying to the blockchain:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="bg-[#F8FAFC] rounded-xl p-4 border border-[#E2E8F0] space-y-1.5">
              <span className="font-bold text-[#101B3D]">1. Input Vehicle Specs</span>
              <p className="text-slate-600">Standardized parameters (brand, year, mileage, drivetrain, condition) are collected.</p>
            </div>
            <div className="bg-[#F8FAFC] rounded-xl p-4 border border-[#E2E8F0] space-y-1.5">
              <span className="font-bold text-[#101B3D]">2. AI Valuation & Oracle Seal</span>
              <p className="text-slate-600">Off-chain ML model calculates fair valuation in INR; Oracle worker records verification hash on-chain.</p>
            </div>
            <div className="bg-[#F8FAFC] rounded-xl p-4 border border-[#E2E8F0] space-y-1.5">
              <span className="font-bold text-[#101B3D]">3. Configure Reserve & Timers</span>
              <p className="text-slate-600">Seller defines starting price, secret reserve, commit window duration, and required bidder deposit.</p>
            </div>
          </div>
        </div>

        {/* Pillar 2: Bidder Workflow */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#6D28D9] flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-mono font-bold text-[#6D28D9] uppercase">Step 2</span>
              <h2 className="text-xl font-bold text-[#101B3D]">Bidder Workflow</h2>
            </div>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed mb-4">
            Bidders (Account 3 and Account 4) compete under a strict two-stage blind auction protocol. Neither bidder can inspect competing bids before the reveal phase:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="bg-[#F8FAFC] rounded-xl p-4 border border-[#E2E8F0] space-y-1.5">
              <span className="font-bold text-[#101B3D]">1. Commit Secret Hash</span>
              <p className="text-slate-600">Bidder enters private bid amount + random salt. Client computes <span className="font-mono font-semibold">keccak256(bid, salt)</span> and submits with fixed ETH collateral deposit.</p>
            </div>
            <div className="bg-[#F8FAFC] rounded-xl p-4 border border-[#E2E8F0] space-y-1.5">
              <span className="font-bold text-[#101B3D]">2. Reveal Phase</span>
              <p className="text-slate-600">Once commitment window closes, bidders submit plain text bid and salt. The smart contract recomputes hash to verify integrity.</p>
            </div>
            <div className="bg-[#F8FAFC] rounded-xl p-4 border border-[#E2E8F0] space-y-1.5">
              <span className="font-bold text-[#101B3D]">3. Settlement & Pull Refunds</span>
              <p className="text-slate-600">Winner settles remainder balance. Losing bidders withdraw 100% of collateral deposits via pull-based claims.</p>
            </div>
          </div>
        </div>

        {/* Pillar 3: Sealed-Bid Auction Mechanics */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-cyan-50 text-[#06B6D4] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-mono font-bold text-[#06B6D4] uppercase">Protocol</span>
              <h2 className="text-xl font-bold text-[#101B3D]">Sealed-Bid Cryptographic Integrity</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-slate-600">
            <div className="space-y-2">
              <h3 className="font-bold text-[#101B3D]">Eliminating Front-Running & MEV</h3>
              <p className="leading-relaxed">
                In public open-cry auctions, bots and rival bidders read the mempool and snipe bids at the final second. In AuctionChain, commitments reveal zero pricing information on-chain during the active bidding window.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-bold text-[#101B3D]">Collateralized Participation</h3>
              <p className="leading-relaxed">
                To prevent spam and uncommitted commitments, each bidder deposits a fixed collateral amount (e.g. 0.50 ETH). Unrevealed bids forfeit collateral to protect the integrity of the auction.
              </p>
            </div>
          </div>
        </div>

        {/* Pillar 4: Blockchain Transaction Verification */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-[#101B3D] flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-mono font-bold text-slate-500 uppercase">Verification</span>
              <h2 className="text-xl font-bold text-[#101B3D]">Blockchain Transaction Verification</h2>
            </div>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed mb-4">
            Every state transition is published as an EVM smart contract event on Hardhat Local (Chain ID 31337):
          </p>
          <div className="bg-[#101B3D] text-slate-200 rounded-xl p-4 font-mono text-xs space-y-2 overflow-x-auto">
            <div className="text-[#06B6D4]"># SealedAuction.sol Event Audit Trail</div>
            <div>event PredictionRegistered(uint256 indexed auctionId, uint256 pricePaise, bytes32 dataHash);</div>
            <div>event AuctionCreated(uint256 indexed auctionId, address indexed seller, uint256 commitEndTime);</div>
            <div>event BidCommitted(uint256 indexed auctionId, address indexed bidder, bytes32 commitmentHash);</div>
            <div>event BidRevealed(uint256 indexed auctionId, address indexed bidder, uint256 amount);</div>
            <div>event AuctionFinalized(uint256 indexed auctionId, address winner, uint256 winningBid);</div>
          </div>
        </div>

        {/* Pillar 5: AI Price Estimation & Oracle Workflow */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-mono font-bold text-emerald-600 uppercase">Oracle</span>
              <h2 className="text-xl font-bold text-[#101B3D]">AI Price Estimation & Oracle Relayer</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-slate-600">
            <p className="leading-relaxed">
              Resale valuations are predicted using our trained <span className="font-semibold text-[#101B3D]">vehicle-v1</span> machine learning pipeline. The model parses vehicle age, odometer mileage, brand retention, drivetrain, and condition into an estimated price in Indian Rupees (INR).
            </p>
            <p className="leading-relaxed">
              The autonomous <span className="font-semibold text-[#101B3D]">oracle server (Account 4 — 0x15d34...6A65)</span> hashes the canonical feature JSON and signs the valuation onto <span className="font-mono text-xs text-[#2563EB]">PriceOracle.sol</span>, ensuring sellers and buyers receive authentic, tamper-proof baseline guidance.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Card */}
      <div className="rounded-2xl bg-[#101B3D] text-white p-8 text-center space-y-4">
        <h2 className="text-2xl font-bold">Ready to Experience AuctionChain?</h2>
        <p className="text-sm text-slate-300 max-w-xl mx-auto">
          Connect with one of our preconfigured Hardhat accounts to test seller auction creation or competitive sealed bidding.
        </p>
        <button
          type="button"
          onClick={openAuthModal}
          className="px-6 py-3 rounded-xl bg-[#2563EB] hover:bg-blue-600 text-white font-bold text-sm transition-all shadow-lg shadow-[#2563EB]/40 inline-flex items-center gap-2 cursor-pointer"
        >
          <span>Connect Wallet</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
