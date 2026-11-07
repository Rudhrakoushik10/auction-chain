import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useWallet } from '../../context/WalletContext';

export const HowItWorksPage: React.FC = () => {
  const { openAuthModal } = useWallet();

  return (
    <div className="space-y-12 pb-16">
      {/* Page Header */}
      <div className="border-b border-[#1E293B] pb-6 space-y-2">
        <div className="text-xs font-mono text-slate-400">
          Protocol Specification · Hardhat Chain ID 31337
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          How AuctionChain Works
        </h1>
        <p className="text-sm text-slate-400 max-w-3xl leading-relaxed">
          AuctionChain combines LightGBM machine-learning vehicle resale valuation in USD with two-phase Keccak-256 commit-reveal bidding in Test ETH, eliminating mempool front-running and bid sniping.
        </p>
      </div>

      {/* 1. Seller & Bidder Workflows */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="bg-[#0F172A] rounded-xl border border-[#1E293B] p-6 space-y-5">
          <div className="border-b border-[#1E293B] pb-4">
            <div className="text-xs font-mono text-slate-400">01. Seller Workflow (Account 1)</div>
            <h2 className="text-lg font-bold text-white mt-0.5">
              Valuation, Oracle Anchor & Lot Deployment
            </h2>
          </div>

          <div className="divide-y divide-[#1E293B] text-xs">
            <div className="py-3.5 space-y-1">
              <div className="font-semibold text-white">1. Canonicalize Vehicle Attributes</div>
              <p className="text-slate-400 leading-relaxed">
                Seller enters brand, model, year, odometer mileage in miles, fuel type, engine specification, transmission, colors, and accident history. Attributes are sorted into canonical JSON and hashed with SHA-256.
              </p>
            </div>
            <div className="py-3.5 space-y-1">
              <div className="font-semibold text-white">2. Compute Off-Chain Valuation & Anchor on Oracle</div>
              <p className="text-slate-400 leading-relaxed">
                The <code className="text-slate-200">LightGBM v1.0.0</code> model estimates fair market value in USD (cents). The Oracle relayer anchors the prediction ID, cents integer, and SHA-256 data hash on <code className="text-slate-200">PriceOracle.sol</code>.
              </p>
            </div>
            <div className="py-3.5 space-y-1">
              <div className="font-semibold text-white">3. Configure Test ETH Escrow Parameters</div>
              <p className="text-slate-400 leading-relaxed">
                Seller sets the starting bid, reserve threshold, uniform participation deposit, and commit/reveal window durations on <code className="text-slate-200">SealedAuction.sol</code>.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-[#0F172A] rounded-xl border border-[#1E293B] p-6 space-y-5">
          <div className="border-b border-[#1E293B] pb-4">
            <div className="text-xs font-mono text-slate-400">02. Bidder Workflow (Accounts 2 & 3)</div>
            <h2 className="text-lg font-bold text-white mt-0.5">
              Commit, Reveal & Pull Settlement
            </h2>
          </div>

          <div className="divide-y divide-[#1E293B] text-xs">
            <div className="py-3.5 space-y-1">
              <div className="font-semibold text-white">1. Submit Sealed Commitment Hash</div>
              <p className="text-slate-400 leading-relaxed">
                Bidder computes <code className="text-slate-200">keccak256(abi.encode(auctionId, bidder, bidAmountWei, salt))</code> locally, exports a JSON backup of the secret salt, and locks the uniform fixed ETH collateral deposit.
              </p>
            </div>
            <div className="py-3.5 space-y-1">
              <div className="font-semibold text-white">2. Verify Hash in Reveal Window</div>
              <p className="text-slate-400 leading-relaxed">
                After the commit window closes, bidders submit their plaintext ETH bid and 32-byte salt. The smart contract recomputes the Keccak-256 hash to verify authenticity and evaluates the highest valid bid against the seller&apos;s reserve.
              </p>
            </div>
            <div className="py-3.5 space-y-1">
              <div className="font-semibold text-white">3. Settle Balance or Claim Pull Refund</div>
              <p className="text-slate-400 leading-relaxed">
                The winning bidder settles the remaining difference (<code className="text-slate-200">winningBid - fixedDeposit</code>). Losing revealed bidders withdraw 100% of their locked deposit via pull-based claims.
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* 2. On-Chain Event Audit Trail Specification */}
      <section className="bg-[#0F172A] rounded-xl border border-[#1E293B] p-6 space-y-4">
        <div className="border-b border-[#1E293B] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="text-xs font-mono text-slate-400">03. Deterministic EVM Audit Trail</div>
            <h2 className="text-lg font-bold text-white mt-0.5">
              Smart Contract Events & State Transitions
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-400">Solidity ^0.8.24</span>
        </div>

        <div className="p-4 rounded-lg bg-[#090D1A] border border-[#1E293B] font-mono text-xs text-slate-300 space-y-1.5 overflow-x-auto">
          <div>event PredictionRegistered(uint256 indexed predictionId, bytes32 indexed productDataHash, uint256 predictedPricePaise);</div>
          <div>event AuctionCreated(uint256 indexed auctionId, address indexed seller, uint256 startingBid, uint256 reservePrice);</div>
          <div>event BidCommitted(uint256 indexed auctionId, address indexed bidder, bytes32 commitmentHash, uint256 depositWei);</div>
          <div>event BidRevealed(uint256 indexed auctionId, address indexed bidder, uint256 revealedBidWei);</div>
          <div>event AuctionFinalized(uint256 indexed auctionId, bool sold, address winningBidder, uint256 highestBidWei);</div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="rounded-xl bg-[#0F172A] border border-[#1E293B] p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-white">Ready to Inspect or Participate?</h2>
          <p className="text-xs text-slate-400 max-w-xl">
            Connect with any preconfigured Hardhat account to test vehicle auction creation, Oracle anchoring, or sealed commit-reveal bidding.
          </p>
        </div>
        <button
          type="button"
          onClick={openAuthModal}
          className="px-5 py-2.5 rounded-lg bg-[#2563EB] hover:bg-blue-600 text-white font-semibold text-xs transition-colors inline-flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <span>Connect Wallet</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </section>
    </div>
  );
};
