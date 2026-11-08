import React from 'react';
import { AuctionItem } from '../types/auction';
import { AuctionCard } from '../components/auction/AuctionCard';
import {
  Wallet,
  ArrowRight,
  Car,
  ShieldCheck,
  Scale,
  Lock,
  CheckCircle2,
} from 'lucide-react';
import { useWallet } from '../context/WalletContext';
import { formatEthToInr, formatInr } from '../lib/crypto';
import heroSuvImg from '../assets/images/vehicle-suv.jpg';
import coupeImg from '../assets/images/vehicle-coupe.jpg';
import sedanImg from '../assets/images/vehicle-sedan.jpg';

interface HomeProps {
  auctions: AuctionItem[];
  onSelectAuction: (auction: AuctionItem) => void;
  onNavigate: (
    tab: 'explore' | 'how-it-works' | 'ai-estimator' | 'security' | 'about'
  ) => void;
}

export const Home: React.FC<HomeProps> = ({
  auctions,
  onSelectAuction,
  onNavigate,
}) => {
  const { openAuthModal, liveEthInrRate } = useWallet();

  const liveCount = auctions.filter(
    (a) => a.phase === 'Commit' || a.phase === 'Reveal'
  ).length;
  const featuredAuctions = auctions.slice(0, 3);

  return (
    <div className="space-y-16 pb-16">
      {/* SECTION 1: Editorial Luxury Automotive Fintech Hero */}
      <section className="relative rounded-md bg-[#12141A] border border-[#232730] overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12">
          {/* Left Editorial Column (7 cols) */}
          <div className="lg:col-span-7 p-8 sm:p-12 lg:p-14 flex flex-col justify-between space-y-8">
            <div className="space-y-6">
              {/* Unboxed Institutional Kicker */}
              <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono uppercase tracking-[0.16em] text-[#C5A46D]">
                <span>Institutional Vehicle Exchange</span>
                <span className="text-[#232730]">·</span>
                <span className="text-[#8E95A5]">Keccak-256 Sealed Reserve</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-display font-semibold tracking-tight text-[#F4F5F7] leading-[1.08]">
                Precision Vehicle Remarketing.{' '}
                <span className="text-[#C5A46D]">
                  Cryptographic Settlement.
                </span>
              </h1>

              <p className="text-sm sm:text-base text-[#8E95A5] leading-relaxed max-w-xl">
                AuctionChain pairs independent AI Indian market valuation with
                two-phase sealed-bid smart contracts. Every vehicle lot is anchored
                to an immutable <code className="font-mono text-[#F4F5F7]">PriceOracle.sol</code>{' '}
                valuation certificate while uniform collateral deposits prevent bid
                sniping and price signalling.
              </p>
            </div>

            {/* Action Bar */}
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={openAuthModal}
                  className="px-6 py-3.5 rounded-md bg-[#C5A46D] hover:bg-[#D4B57E] text-[#0B0C10] font-semibold text-xs uppercase tracking-[0.12em] flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <Wallet className="w-4 h-4" />
                  <span>Connect Wallet</span>
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate('explore')}
                  className="px-6 py-3.5 rounded-md bg-[#0B0C10] hover:bg-[#171A22] text-[#F4F5F7] font-semibold text-xs uppercase tracking-[0.12em] border border-[#232730] flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <span>Inspect Live Catalog ({liveCount})</span>
                  <ArrowRight className="w-4 h-4 text-[#C5A46D]" />
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate('ai-estimator')}
                  className="px-4 py-3.5 text-xs font-mono uppercase tracking-[0.12em] text-[#8E95A5] hover:text-[#C5A46D] transition-colors cursor-pointer"
                >
                  Valuation Desk →
                </button>
              </div>

              {/* Clean Institutional Pillar Strip (No fake statistics) */}
              <div className="pt-6 border-t border-[#232730] grid grid-cols-2 sm:grid-cols-4 gap-6">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-[#646C7E] block">
                    Valuation Standard
                  </span>
                  <span className="text-sm font-mono font-semibold text-[#F4F5F7] mt-1 block">
                    INR Benchmark
                  </span>
                  <span className="text-[11px] text-[#8E95A5] mt-0.5 block">
                    AI Advisory + SHA-256
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-[#646C7E] block">
                    Bidding Protocol
                  </span>
                  <span className="text-sm font-mono font-semibold text-[#F4F5F7] mt-1 block">
                    Commit-Reveal
                  </span>
                  <span className="text-[11px] text-[#8E95A5] mt-0.5 block">
                    Keccak-256 Sealed Bids
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-[#646C7E] block">
                    Escrow Collateral
                  </span>
                  <span className="text-sm font-mono font-semibold text-[#C5A46D] mt-1 block">
                    Uniform Deposit
                  </span>
                  <span className="text-[11px] text-[#8E95A5] mt-0.5 block">
                    Zero Value Signalling
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-[#646C7E] block">
                    Oracle ETH/INR
                  </span>
                  <span className="text-sm font-mono font-semibold text-[#F4F5F7] tabular-nums mt-1 block">
                    {formatInr(liveEthInrRate)}
                  </span>
                  <span className="text-[11px] text-[#8E95A5] mt-0.5 block">
                    Chain ID 31337
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Automotive Showcase Column (5 cols) */}
          <div className="lg:col-span-5 bg-[#0B0C10] border-t lg:border-t-0 lg:border-l border-[#232730] p-6 sm:p-8 flex flex-col justify-between gap-4">
            {/* Primary Featured Lot Frame */}
            <div
              onClick={() => onNavigate('explore')}
              className="relative rounded-md overflow-hidden border border-[#232730] bg-[#12141A] h-64 group cursor-pointer"
            >
              <img
                src={heroSuvImg}
                alt="2021 Hyundai Creta SX(O)"
                className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B0C10] via-[#0B0C10]/30 to-transparent" />
              <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between">
                <span className="px-2.5 py-1 rounded bg-[#0B0C10]/90 border border-[#C5A46D]/40 text-[10px] font-mono font-medium text-[#C5A46D] uppercase tracking-[0.14em]">
                  LOT #1 · COMMIT PHASE
                </span>
                <span className="px-2.5 py-1 rounded bg-[#0B0C10]/90 border border-[#232730] text-[10px] font-mono text-[#F4F5F7]">
                  AI VALUED: ₹4,45,000
                </span>
              </div>
              <div className="absolute bottom-3.5 left-3.5 right-3.5 flex items-end justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-[#8E95A5] block">
                    2021 · 28,500 KM · DIESEL · AUTOMATIC
                  </span>
                  <h3 className="text-base font-display font-semibold text-[#F4F5F7]">
                    2021 Hyundai Creta SX (O) 1.5 Diesel
                  </h3>
                </div>
                <div className="text-right font-mono">
                  <span className="text-[10px] text-[#8E95A5] block">RESERVE</span>
                  <span className="text-sm font-semibold text-[#C5A46D] tabular-nums">
                    1.75 ETH
                  </span>
                  <span className="text-[10px] text-[#8E95A5] block tabular-nums">
                    ({formatEthToInr(1.75)})
                  </span>
                </div>
              </div>
            </div>

            {/* Secondary Lot Pair */}
            <div className="grid grid-cols-2 gap-4">
              <div
                onClick={() => onNavigate('explore')}
                className="relative rounded-md overflow-hidden border border-[#232730] bg-[#12141A] h-36 group cursor-pointer"
              >
                <img
                  src={coupeImg}
                  alt="2020 Honda City ZX CVT"
                  className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B0C10] via-[#0B0C10]/30 to-transparent" />
                <div className="absolute top-2.5 left-2.5">
                  <span className="px-2 py-0.5 rounded bg-[#0B0C10]/90 border border-[#D49B38]/40 text-[9px] font-mono text-[#D49B38] uppercase tracking-wider">
                    REVEAL WINDOW
                  </span>
                </div>
                <div className="absolute bottom-2.5 left-2.5 right-2.5">
                  <div className="text-xs font-display font-semibold text-[#F4F5F7] truncate">
                    2020 Honda City ZX CVT
                  </div>
                  <div className="text-[11px] font-mono text-[#C5A46D] tabular-nums">
                    AI Est: ₹3,85,000
                  </div>
                </div>
              </div>

              <div
                onClick={() => onNavigate('explore')}
                className="relative rounded-md overflow-hidden border border-[#232730] bg-[#12141A] h-36 group cursor-pointer"
              >
                <img
                  src={sedanImg}
                  alt="2022 Maruti Suzuki Swift ZXi"
                  className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B0C10] via-[#0B0C10]/30 to-transparent" />
                <div className="absolute top-2.5 left-2.5">
                  <span className="px-2 py-0.5 rounded bg-[#0B0C10]/90 border border-[#C5A46D]/40 text-[9px] font-mono text-[#C5A46D] uppercase tracking-wider">
                    COMMIT PHASE
                  </span>
                </div>
                <div className="absolute bottom-2.5 left-2.5 right-2.5">
                  <div className="text-xs font-display font-semibold text-[#F4F5F7] truncate">
                    2022 Maruti Swift ZXi AMT
                  </div>
                  <div className="text-[11px] font-mono text-[#C5A46D] tabular-nums">
                    AI Est: ₹3,20,000
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: Featured Vehicle Reserve Catalog */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#232730] pb-4">
          <div>
            <div className="flex items-center gap-2 text-[#C5A46D] text-[11px] font-mono uppercase tracking-[0.16em]">
              <Car className="w-3.5 h-3.5" />
              <span>Active Consignments</span>
            </div>
            <h2 className="text-2xl font-display font-semibold text-[#F4F5F7] mt-1">
              Verified Vehicle Reserve Lots
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('explore')}
            className="text-xs font-mono uppercase tracking-[0.12em] text-[#C5A46D] hover:text-[#D4B57E] flex items-center gap-1.5 cursor-pointer"
          >
            <span>View All {auctions.length} Consigned Lots</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredAuctions.map((auction) => (
            <AuctionCard
              key={auction.id}
              auction={auction}
              onSelect={onSelectAuction}
            />
          ))}
        </div>
      </section>

      {/* SECTION 3: Three-Stage Institutional Execution Protocol */}
      <section className="bg-[#12141A] border border-[#232730] rounded-md p-8 sm:p-10 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#232730] pb-6">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-[0.16em] text-[#C5A46D]">
              Execution Architecture
            </span>
            <h2 className="text-2xl font-display font-semibold text-[#F4F5F7] mt-1">
              Three-Stage Cryptographic Auction Lifecycle
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('how-it-works')}
            className="text-xs font-mono uppercase tracking-[0.12em] text-[#8E95A5] hover:text-[#F4F5F7] flex items-center gap-1.5 cursor-pointer"
          >
            <span>Inspect Protocol Specification</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#C5A46D]" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-md bg-[#0B0C10] border border-[#232730] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-semibold text-[#C5A46D]">
                STAGE 01 · VALUATION
              </span>
              <Scale className="w-4 h-4 text-[#8E95A5]" />
            </div>
            <h3 className="text-base font-display font-semibold text-[#F4F5F7]">
              AI Market Valuation & Oracle Anchor
            </h3>
            <p className="text-xs text-[#8E95A5] leading-relaxed">
              Structured vehicle attributes (make, model, year, odometer, fuel,
              transmission, title status) are evaluated in Indian Rupees (INR),
              canonicalized into a deterministic SHA-256 hash, and committed to{' '}
              <code className="font-mono text-[#F4F5F7]">PriceOracle.sol</code>.
            </p>
          </div>

          <div className="p-6 rounded-md bg-[#0B0C10] border border-[#232730] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-semibold text-[#C5A46D]">
                STAGE 02 · SEALED COMMIT
              </span>
              <Lock className="w-4 h-4 text-[#8E95A5]" />
            </div>
            <h3 className="text-base font-display font-semibold text-[#F4F5F7]">
              Keccak-256 Sealed Commitment
            </h3>
            <p className="text-xs text-[#8E95A5] leading-relaxed">
              Bidders compute{' '}
              <code className="font-mono text-[#F4F5F7]">
                keccak256(abi.encodePacked(bidWei, salt))
              </code>{' '}
              locally and lock a uniform collateral deposit. Competing participants
              cannot observe or front-run your true valuation.
            </p>
          </div>

          <div className="p-6 rounded-md bg-[#0B0C10] border border-[#232730] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-semibold text-[#C5A46D]">
                STAGE 03 · SETTLEMENT
              </span>
              <ShieldCheck className="w-4 h-4 text-[#8E95A5]" />
            </div>
            <h3 className="text-base font-display font-semibold text-[#F4F5F7]">
              Deterministic Reveal & Escrow Release
            </h3>
            <p className="text-xs text-[#8E95A5] leading-relaxed">
              During the reveal window, smart contracts verify each bidder&apos;s
              plaintext amount and salt against their stored hash, enforce reserve
              thresholds, and enable pull-based refunds and seller payouts.
            </p>
          </div>
        </div>

        {/* Bottom Guarantee Bar */}
        <div className="pt-4 border-t border-[#232730] flex flex-wrap items-center justify-between gap-4 text-xs text-[#8E95A5]">
          <div className="flex flex-wrap items-center gap-6">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#2E9B68]" />
              ReentrancyGuard Pull-Over-Push Escrow
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#2E9B68]" />
              Zero Mempool Bid Sniping
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#2E9B68]" />
              Immutable Oracle Valuation Audit Trail
            </span>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('security')}
            className="font-mono text-[11px] text-[#C5A46D] hover:underline cursor-pointer"
          >
            View Smart Contract Audit Matrix →
          </button>
        </div>
      </section>
    </div>
  );
};
