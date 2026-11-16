import React from 'react';
import {
  Wallet,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Eye,
  ShieldCheck,
  ArrowRight,
  HelpCircle,
  TrendingUp,
  Clock,
} from 'lucide-react';
import { useWallet } from '../context/WalletContext';
import { PublicNavTab } from '../components/layout/PublicHeader';
import { InteractiveSuvScene } from '../components/common/InteractiveSuvScene';

interface HomeProps {
  onNavigate?: (tab: PublicNavTab) => void;
}

export const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  const { openAuthModal } = useWallet();

  return (
    <div className="space-y-12 pb-8">
      {/* 1. HERO SECTION WITH INTERACTIVE 3D HONDA CITY SEDAN (MAINTAINED IDENTICAL) */}
      <section className="relative overflow-hidden rounded-3xl bg-[#0D1017] border border-white/[0.08] px-6 py-10 sm:px-10 sm:py-14 shadow-2xl min-h-[420px] flex items-center">
        <InteractiveSuvScene />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'linear-gradient(90deg, rgba(11,12,16,0.92) 0%, rgba(11,12,16,0.72) 48%, rgba(11,12,16,0.18) 100%)',
          }}
        />

        <div className="relative z-10 max-w-xl space-y-5 pointer-events-none">
          <div className="text-xs font-semibold uppercase tracking-widest text-[#D4B47E]">
            AI-Valued Blockchain Vehicle Auctions
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#F4F5F7] tracking-tight leading-[1.12]">
            Fair Vehicle Auctions.{' '}
            <span className="text-[#D4B47E]">Transparent Settlement.</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Sellers list a vehicle with an AI fair market valuation in ₹ INR. Bidders place bids during a timed window. Once the window closes, all bids are revealed to everyone, the seller approves the highest bid, and the winning bidder completes payment on-chain.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2 pointer-events-auto">
            <button
              onClick={openAuthModal}
              className="px-6 py-3 rounded-xl bg-[#C5A46D] hover:bg-[#D4B47E] text-[#0B0C10] font-bold text-sm transition-all flex items-center gap-2 cursor-pointer"
            >
              <Wallet className="w-4 h-4" />
              Connect Wallet
            </button>

            {onNavigate && (
              <button
                onClick={() => onNavigate('how-it-works')}
                className="px-5 py-3 rounded-xl bg-slate-900/85 hover:bg-slate-800/90 text-slate-200 font-semibold text-sm border border-white/10 transition-all cursor-pointer"
              >
                How It Works
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 2. THE PROBLEM STATEMENT */}
      <section className="bg-[#12151E] border border-white/[0.07] rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="max-w-2xl">
          <span className="text-xs font-semibold uppercase tracking-widest text-rose-400">
            The Problem
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Why Traditional Used Car Auctions Are Broken
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1.5 leading-relaxed">
            Buying or selling a vehicle through traditional online classifieds or standard auctions creates three major problems for both sellers and buyers:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="p-5 rounded-xl bg-[#0B0C10] border border-rose-500/20 space-y-2.5">
            <div className="w-9 h-9 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center">
              <HelpCircle className="w-4 h-4 text-rose-400" />
            </div>
            <h3 className="text-base font-bold text-white">
              1. Guesswork on Car Value
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Sellers often overprice or underprice their car, and buyers have no neutral way to know the real market value of the vehicle before placing a bid.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-[#0B0C10] border border-rose-500/20 space-y-2.5">
            <div className="w-9 h-9 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-rose-400" />
            </div>
            <h3 className="text-base font-bold text-white">
              2. Unfair Bidding Wars
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              In open auctions, participants copy or outbid each other at the last second, or fake bids are used to push the price up artificially.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-[#0B0C10] border border-rose-500/20 space-y-2.5">
            <div className="w-9 h-9 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            </div>
            <h3 className="text-base font-bold text-white">
              3. Slow & Unclear Closing
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              After an auction ends, there is no clear record of all offers or proof of payment, leading to disputes between the seller and the buyer.
            </p>
          </div>
        </div>
      </section>

      {/* 3. HOW THIS PLATFORM SOLVES IT */}
      <section className="bg-[#12151E] border border-white/[0.07] rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="max-w-2xl">
            <span className="text-xs font-semibold uppercase tracking-widest text-emerald-400">
              Our Solution
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
              How AuctionChain Solves It Simply
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1.5 leading-relaxed">
              We combine an AI price check with a fair timed bidding window and one-click blockchain payment so everyone gets a fair deal:
            </p>
          </div>

          {onNavigate && (
            <button
              onClick={() => onNavigate('how-it-works')}
              className="px-4 py-2.5 rounded-xl bg-[#0B0C10] hover:bg-slate-900 text-[#D4B47E] border border-white/10 text-xs font-semibold inline-flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
            >
              See Visual Workflow
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="p-5 rounded-xl bg-[#0B0C10] border border-emerald-500/20 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-indigo-400" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">
                AI Fair Price Estimate in ₹ INR
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Before an auction starts, our AI checks the car's brand, model, year, mileage, and condition to show an honest market price in Indian Rupees (₹). Both the seller and bidders see this benchmark.
              </p>
            </div>
          </div>

          <div className="p-5 rounded-xl bg-[#0B0C10] border border-emerald-500/20 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">
                Private Bids During the Time Window
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                While the countdown timer is running, bidders submit their best offer without paying any upfront deposit. Bids stay hidden from others while the window is open, preventing last-second copying.
              </p>
            </div>
          </div>

          <div className="p-5 rounded-xl bg-[#0B0C10] border border-emerald-500/20 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <Eye className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">
                Open Reveal & Highest Bid Selection
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                As soon as the timer finishes, all bids are revealed to the seller and every participant at the same time. The highest bid is highlighted at the top for the seller to approve.
              </p>
            </div>
          </div>

          <div className="p-5 rounded-xl bg-[#0B0C10] border border-emerald-500/20 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#C5A46D]/10 border border-[#C5A46D]/30 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-[#D4B47E]" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">
                Instant Payment & Verified Record
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Once the seller approves the highest bid, the selected winner clicks Pay. The money goes directly from the winner's wallet to the seller's wallet, and the auction closes with a permanent receipt.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
