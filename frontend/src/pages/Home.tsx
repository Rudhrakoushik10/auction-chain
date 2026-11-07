import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { AuctionItem } from '../types/auction';
import { useWallet } from '../context/WalletContext';
import { AuctionCard } from '../components/auction/AuctionCard';
import { PRICE_ORACLE_SOL, SEALED_AUCTION_SOL } from '../lib/solidityCode';
import { formatInr } from '../lib/crypto';
import heroVehicleImg from '../assets/images/vehicle-suv.jpg';

interface HomeProps {
  auctions: AuctionItem[];
  onSelectAuction: (auction: AuctionItem) => void;
  onNavigate: (
    tab: 'home' | 'how-it-works' | 'explore' | 'ai-estimator' | 'security' | 'about'
  ) => void;
  focusArchitecture?: boolean;
}

export const Home: React.FC<HomeProps> = ({
  auctions,
  onSelectAuction,
  onNavigate,
}) => {
  const { openAuthModal } = useWallet();
  const [selectedContractTab, setSelectedContractTab] = useState<'oracle' | 'auction'>('auction');

  const featuredVehicle = auctions[0];

  return (
    <div className="space-y-16 pb-16">
      {/* Section 1: Storefront Hero + Full-Width Quantitative Strip */}
      <section className="rounded-2xl bg-[#0F172A] border border-[#1E293B] overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
          {/* Left Column: Editorial Headline & Primary Route */}
          <div className="lg:col-span-7 p-8 sm:p-12 lg:p-14 flex flex-col justify-between space-y-8">
            <div className="space-y-5">
              <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                <span>Automotive Sealed-Bid Protocol</span>
                <span aria-hidden="true">·</span>
                <span>Hardhat Chain ID 31337</span>
                <span aria-hidden="true">·</span>
                <span>LightGBM v1.0.0</span>
              </div>

              <h1
                className="text-3xl sm:text-5xl font-bold tracking-tight text-white leading-[1.12] max-w-2xl"
                style={{ textWrap: 'balance' }}
              >
                Cryptographic Sealed Bidding for Verified Vehicles
              </h1>

              <p className="text-base text-slate-300 leading-relaxed max-w-xl">
                AuctionChain pairs LightGBM machine-learning resale valuation in US Dollars (USD) with two-phase Keccak-256 commit-reveal settlement in Test ETH—eliminating mempool front-running, bid sniping, and price anchoring bias.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                type="button"
                onClick={openAuthModal}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold text-white bg-[#2563EB] hover:bg-blue-600 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>Connect Wallet</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => onNavigate('explore')}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-medium text-slate-200 hover:text-white bg-[#090D1A] hover:bg-[#131E3A] border border-[#1E293B] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>Browse Live Auctions</span>
              </button>
            </div>
          </div>

          {/* Right Column: Featured Vehicle Showcase */}
          <div className="lg:col-span-5 relative min-h-[320px] bg-[#090D1A] border-t lg:border-t-0 lg:border-l border-[#1E293B]">
            <img
              src={featuredVehicle?.imageUrl || heroVehicleImg}
              alt={featuredVehicle?.title || 'Vehicle Sealed-Bid Escrow'}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#090D1A] via-[#090D1A]/40 to-transparent" />
            {featuredVehicle ? (
              <div className="absolute bottom-0 inset-x-0 p-6 sm:p-8 flex items-end justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-xs font-mono text-slate-300 tabular-nums">
                    Featured Lot #{featuredVehicle.numericId} · {featuredVehicle.phase} Phase
                  </div>
                  <div className="text-lg font-semibold text-white line-clamp-1">
                    {featuredVehicle.title}
                  </div>
                  <div className="text-xs font-mono text-slate-300 tabular-nums">
                    AI Estimate: {formatInr(featuredVehicle.aiPrediction.predicted_price ?? featuredVehicle.aiPrediction.predicted_price_inr)} · Reserve: {featuredVehicle.reservePriceEth.toFixed(2)} ETH
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onSelectAuction(featuredVehicle)}
                  className="px-3.5 py-2 rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur-sm text-xs font-semibold text-white whitespace-nowrap shrink-0 transition-colors cursor-pointer"
                >
                  Inspect Lot
                </button>
              </div>
            ) : (
              <div className="absolute bottom-0 inset-x-0 p-6 sm:p-8 flex items-end justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-xs font-mono text-slate-300">
                    PriceOracle.sol · SealedAuction.sol
                  </div>
                  <div className="text-lg font-semibold text-white">
                    Ready for Seller Lot Deployment
                  </div>
                  <div className="text-xs font-mono text-slate-300">
                    Connect as Seller (Account 1) to deploy your first vehicle auction
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('ai-estimator')}
                  className="px-3.5 py-2 rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur-sm text-xs font-semibold text-white whitespace-nowrap shrink-0 transition-colors cursor-pointer"
                >
                  AI Estimator
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Full-Width Quantitative Evidence Strip Below Hero Split */}
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#1E293B] border-t border-[#1E293B] bg-[#090D1A]/60">
          <div className="p-6">
            <div className="text-xs text-slate-400">Valuation Accuracy (R²)</div>
            <div className="text-xl font-mono font-bold text-white mt-1 tabular-nums">
              0.7615 (0.8571 trimmed)
            </div>
            <div className="text-xs text-slate-500 mt-0.5 font-mono tabular-nums">
              MAE ±$9,484.57 · LightGBM v1.0.0 (4,009 cars)
            </div>
          </div>
          <div className="p-6">
            <div className="text-xs text-slate-400">Currency Separation</div>
            <div className="text-xl font-mono font-bold text-white mt-1 tabular-nums">
              USD Advisory · ETH Escrow
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Zero automatic currency conversion
            </div>
          </div>
          <div className="p-6">
            <div className="text-xs text-slate-400">Bid Confidentiality</div>
            <div className="text-xl font-mono font-bold text-white mt-1 tabular-nums">
              Keccak-256 Sealed Hash
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Uniform collateral deposit in Commit phase
            </div>
          </div>
          <div className="p-6">
            <div className="text-xs text-slate-400">On-Chain Settlement</div>
            <div className="text-xl font-mono font-bold text-white mt-1 tabular-nums">
              Pull-Over-Push Escrow
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Reentrancy-protected refunds & payouts
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Active Vehicle Auctions */}
      <section className="space-y-6">
        <div className="flex items-end justify-between gap-4 border-b border-[#1E293B] pb-4">
          <div>
            <div className="text-xs text-slate-400 font-mono">
              On-Chain Lot Registry · Read-Only Guest Inspection Enabled
            </div>
            <h2 className="text-2xl font-bold text-white mt-1">
              Verified Vehicle Auctions
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('explore')}
            className="text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <span>View Marketplace ({auctions.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {auctions.length === 0 ? (
          <div className="bg-[#0F172A] rounded-xl border border-[#1E293B] p-8 text-center space-y-3">
            <div className="text-sm font-semibold text-white">
              No Vehicle Auctions Deployed Yet
            </div>
            <p className="text-xs text-slate-400 max-w-lg mx-auto leading-relaxed">
              No active vehicle auctions are currently listed on <code className="text-slate-200">SealedAuction.sol</code>. Connect with <strong>Account 1 (Seller)</strong> to run the LightGBM v1.0.0 valuation model, anchor the proof on <code className="text-slate-200">PriceOracle.sol</code>, and deploy a vehicle auction.
            </p>
            <div className="pt-1 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={openAuthModal}
                className="px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-blue-600 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Connect as Seller to Create Auction
              </button>
              <button
                type="button"
                onClick={() => onNavigate('ai-estimator')}
                className="px-4 py-2 rounded-lg border border-[#1E293B] hover:border-slate-600 text-slate-200 hover:text-white text-xs font-medium transition-colors cursor-pointer"
              >
                Open AI Price Estimator
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {auctions.slice(0, 3).map((auction) => (
              <AuctionCard key={auction.id} auction={auction} onSelect={onSelectAuction} />
            ))}
          </div>
        )}
      </section>

      {/* Section 3: Protocol Architecture & Three-Stage Lifecycle */}
      <section className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#1E293B] pb-4">
          <div>
            <div className="text-xs text-slate-400 font-mono">
              Mechanism-to-Outcome Architecture
            </div>
            <h2 className="text-2xl font-bold text-white mt-1">
              Three-Stage Cryptographic Lifecycle
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('ai-estimator')}
            className="text-xs font-semibold text-[#3B82F6] hover:underline flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <span>Test Vehicle Valuation Engine</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#0F172A] rounded-xl border border-[#1E293B] p-6 space-y-3">
            <div className="text-xs font-mono text-slate-400">01. Off-Chain Valuation & Oracle Anchor</div>
            <h3 className="text-base font-semibold text-white">
              Canonical Vehicle Hashing
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Vehicle attributes—brand, model, year, odometer mileage in miles, fuel type, engine specification, transmission, colors, and accident history—are normalized into canonical JSON, hashed with SHA-256, and scored in USD by the <code className="text-slate-200">LightGBM v1.0.0</code> model before the Oracle records the integer cents proof on <code className="text-slate-200">PriceOracle.sol</code>.
            </p>
          </div>

          <div className="bg-[#0F172A] rounded-xl border border-[#1E293B] p-6 space-y-3">
            <div className="text-xs font-mono text-slate-400">02. Blind Commitment Window</div>
            <h3 className="text-base font-semibold text-white">
              Zero-Leakage Sealed Bids
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Bidders compute <code className="text-slate-200">keccak256(abi.encode(auctionId, bidder, bidAmountWei, salt))</code> locally in the browser and lock a uniform ETH participation deposit. Because every bidder locks the exact same collateral, observers cannot infer bid size from transaction value.
            </p>
          </div>

          <div className="bg-[#0F172A] rounded-xl border border-[#1E293B] p-6 space-y-3">
            <div className="text-xs font-mono text-slate-400">03. Reveal Verification & Pull Settlement</div>
            <h3 className="text-base font-semibold text-white">
              Deterministic Escrow Finalization
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              During the reveal phase, <code className="text-slate-200">SealedAuction.sol</code> verifies each revealed bid and 32-byte salt against its stored commitment hash, checks the seller&apos;s reserve threshold, credits the winner&apos;s deposit toward settlement, and opens pull-based refunds for non-winning participants.
            </p>
          </div>
        </div>
      </section>

      {/* Section 4: Smart Contract Source Inspector */}
      <section className="rounded-2xl bg-[#0F172A] text-white p-6 sm:p-8 border border-[#1E293B] space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1E293B] pb-5">
          <div>
            <div className="text-xs font-mono text-slate-400">
              Solidity ^0.8.24 · Hardhat Local Network (Chain ID 31337)
            </div>
            <h2 className="text-xl font-bold mt-1 text-white">
              Verified Smart Contract Source
            </h2>
          </div>

          <div className="flex items-center gap-1 bg-[#090D1A] p-1 rounded-lg border border-[#1E293B] self-start">
            <button
              type="button"
              onClick={() => setSelectedContractTab('auction')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                selectedContractTab === 'auction'
                  ? 'bg-[#2563EB] text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              SealedAuction.sol
            </button>
            <button
              type="button"
              onClick={() => setSelectedContractTab('oracle')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                selectedContractTab === 'oracle'
                  ? 'bg-[#2563EB] text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              PriceOracle.sol
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <pre className="font-mono text-xs text-slate-300 leading-relaxed">
            {selectedContractTab === 'auction' ? SEALED_AUCTION_SOL : PRICE_ORACLE_SOL}
          </pre>
        </div>
      </section>
    </div>
  );
};
