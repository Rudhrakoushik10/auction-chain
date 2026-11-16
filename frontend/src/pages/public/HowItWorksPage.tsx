import React from 'react';
import {
  Sparkles,
  Gavel,
  Eye,
  CheckCircle2,
  Wallet,
  ArrowRight,
  Clock,
  Trophy,
  Car,
  EyeOff,
} from 'lucide-react';
import { useWallet } from '../../context/WalletContext';

export const HowItWorksPage: React.FC = () => {
  const { openAuthModal } = useWallet();

  return (
    <div className="space-y-8 pb-8">
      {/* Page Header */}
      <div className="bg-[#12151E] border border-white/[0.07] rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="max-w-2xl">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#D4B47E]">
            Visual Guide
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            How AuctionChain Works (Start to Finish)
          </h1>
          <p className="text-sm text-slate-300 mt-2 leading-relaxed">
            Follow the simple 4-step journey from listing a car to completing the sale. Everything is designed to be fast, fair, and easy to understand.
          </p>
        </div>

        <button
          onClick={openAuthModal}
          className="px-5 py-3 rounded-xl bg-[#C5A46D] hover:bg-[#D4B47E] text-[#0B0C10] font-bold text-xs uppercase tracking-wider flex items-center gap-2 shrink-0 self-start md:self-auto cursor-pointer"
        >
          <Wallet className="w-4 h-4" />
          Connect Wallet
        </button>
      </div>

      {/* Top Visual End-to-End Flow Banner */}
      <div className="bg-[#12151E] border border-white/[0.07] rounded-2xl p-6">
        <div className="text-xs font-semibold uppercase tracking-widest text-[#D4B47E] mb-4">
          End-to-End Workflow Overview
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
          {[
            {
              step: 'Step 1',
              title: 'Seller Lists Car',
              sub: 'AI estimates fair ₹ price & Seller starts timer',
              icon: Sparkles,
              color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
            },
            {
              step: 'Step 2',
              title: 'Bidders Place Bids',
              sub: 'No upfront deposit · Bids hidden during timer',
              icon: Gavel,
              color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
            },
            {
              step: 'Step 3',
              title: 'Bids Revealed',
              sub: 'Timer ends, everyone sees bids & Seller approves top bid',
              icon: Eye,
              color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
            },
            {
              step: 'Step 4',
              title: 'Winner Pays & Closes',
              sub: 'Selected bidder pays Seller & sale is complete',
              icon: CheckCircle2,
              color: 'text-[#D4B47E] bg-[#C5A46D]/10 border-[#C5A46D]/30',
            },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className="p-4 rounded-xl bg-[#0B0C10] border border-white/[0.07] flex flex-col justify-between relative"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-[#D4B47E]">
                      {item.step}
                    </span>
                    <div
                      className={`w-8 h-8 rounded-lg border flex items-center justify-center ${item.color}`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-sm font-bold text-white">{item.title}</div>
                  <p className="text-xs text-slate-400 leading-relaxed">{item.sub}</p>
                </div>

                {idx < 3 && (
                  <div className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-[#12151E] border border-white/15 items-center justify-center">
                    <ArrowRight className="w-3.5 h-3.5 text-[#D4B47E]" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Detailed Step-by-Step Visual Walkthrough */}
      <div className="space-y-6">
        {/* STEP 1 VISUAL */}
        <div className="bg-[#12151E] border border-white/[0.07] rounded-2xl p-6 sm:p-7 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-6 space-y-3">
            <span className="px-2.5 py-1 rounded-md bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-bold font-mono">
              STEP 1 · SELLER
            </span>
            <h2 className="text-xl font-bold text-white">
              Seller Lists the Car & Checks the AI Fair Price
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              The Seller enters basic details about the car (Brand, Model, Year, Mileage driven, Fuel type, and Condition).
            </p>
            <ul className="space-y-2 text-xs text-slate-400 pt-1">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>AI immediately calculates a fair market value in Indian Rupees (₹).</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Seller sets the minimum starting price and how many minutes the bidding window will stay open.</span>
              </li>
            </ul>
          </div>

          {/* Visual Mockup for Step 1 */}
          <div className="lg:col-span-6 bg-[#0B0C10] border border-white/[0.08] rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <Car className="w-5 h-5 text-indigo-400" />
                <div>
                  <div className="text-sm font-bold text-white">2022 Honda City ZX CVT</div>
                  <div className="text-[11px] text-slate-400">18,000 km · Petrol · Excellent</div>
                </div>
              </div>
              <span className="text-xs font-mono text-indigo-300 bg-indigo-950/50 border border-indigo-500/30 px-2.5 py-1 rounded-md">
                AI Checked
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2.5 text-xs">
              <div className="p-3 rounded-lg bg-[#12151E] border border-white/[0.05]">
                <div className="text-[10px] text-slate-400">AI Fair Value</div>
                <div className="text-sm font-bold text-emerald-400 font-mono mt-0.5">
                  ₹11,50,000
                </div>
              </div>
              <div className="p-3 rounded-lg bg-[#12151E] border border-white/[0.05]">
                <div className="text-[10px] text-slate-400">Starting Price</div>
                <div className="text-sm font-bold text-white font-mono mt-0.5">0.40 ETH</div>
              </div>
              <div className="p-3 rounded-lg bg-[#12151E] border border-white/[0.05]">
                <div className="text-[10px] text-slate-400">Bidding Timer</div>
                <div className="text-sm font-bold text-amber-300 font-mono mt-0.5">5 Mins</div>
              </div>
            </div>
          </div>
        </div>

        {/* STEP 2 VISUAL */}
        <div className="bg-[#12151E] border border-white/[0.07] rounded-2xl p-6 sm:p-7 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-6 space-y-3">
            <span className="px-2.5 py-1 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold font-mono">
              STEP 2 · BIDDERS
            </span>
            <h2 className="text-xl font-bold text-white">
              Bidders Place Their Bids During the Time Window
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              While the countdown timer is running, interested buyers (Bidder 1, Bidder 2, etc.) enter the amount they want to bid and click <strong>Submit Bid</strong>.
            </p>
            <ul className="space-y-2 text-xs text-slate-400 pt-1">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span><strong>No upfront money required:</strong> Bidders do not pay any deposit when placing a bid.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span><strong>Kept private during the timer:</strong> Other bidders and the seller cannot see the bid amounts until the timer ends.</span>
              </li>
            </ul>
          </div>

          {/* Visual Mockup for Step 2 */}
          <div className="lg:col-span-6 bg-[#0B0C10] border border-white/[0.08] rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <EyeOff className="w-4 h-4 text-amber-400" />
                Bidding Window Open
              </span>
              <span className="text-xs font-mono font-bold text-amber-300 bg-amber-950/40 border border-amber-500/30 px-2.5 py-1 rounded-md flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                03:42 Left
              </span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-lg bg-[#12151E] border border-white/[0.05] flex items-center justify-between">
                <span className="font-semibold text-white">Bidder 1</span>
                <span className="font-mono text-amber-300/90 bg-amber-950/30 border border-amber-500/30 px-2 py-0.5 rounded">
                  Hidden until window ends
                </span>
              </div>
              <div className="p-3 rounded-lg bg-[#12151E] border border-white/[0.05] flex items-center justify-between">
                <span className="font-semibold text-white">Bidder 2</span>
                <span className="font-mono text-amber-300/90 bg-amber-950/30 border border-amber-500/30 px-2 py-0.5 rounded">
                  Hidden until window ends
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* STEP 3 VISUAL */}
        <div className="bg-[#12151E] border border-white/[0.07] rounded-2xl p-6 sm:p-7 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-6 space-y-3">
            <span className="px-2.5 py-1 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold font-mono">
              STEP 3 · REVEAL & SELLER APPROVAL
            </span>
            <h2 className="text-xl font-bold text-white">
              Bids Are Revealed to Everyone & Seller Approves the Highest Bid
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Once the timer reaches zero (or if the Seller clicks <strong>Close Bidding Window</strong> early), all bids are automatically revealed on screen to the seller and every participant.
            </p>
            <ul className="space-y-2 text-xs text-slate-400 pt-1">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Every participant can see all bids ranked from highest to lowest.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>The highest bid is highlighted at the top for the Seller to click <strong>Approve Highest Bid</strong>.</span>
              </li>
            </ul>
          </div>

          {/* Visual Mockup for Step 3 */}
          <div className="lg:col-span-6 bg-[#0B0C10] border border-white/[0.08] rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-emerald-400" />
                All Bids Revealed
              </span>
              <span className="text-[11px] text-slate-400">Visible to all participants</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/40 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-white">Bidder 2 (Highest Bid)</span>
                </div>
                <span className="font-mono font-bold text-emerald-400">
                  0.52 ETH (₹1,30,000)
                </span>
              </div>
              <div className="p-3 rounded-lg bg-[#12151E] border border-white/[0.05] flex items-center justify-between">
                <span className="text-slate-300">#2 · Bidder 1</span>
                <span className="font-mono text-slate-300">0.45 ETH (₹1,12,500)</span>
              </div>
            </div>
            <div className="pt-1">
              <div className="w-full py-2 rounded-lg bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 font-bold text-xs text-center">
                Seller Action: Approve Highest Bid (0.52 ETH)
              </div>
            </div>
          </div>
        </div>

        {/* STEP 4 VISUAL */}
        <div className="bg-[#12151E] border border-white/[0.07] rounded-2xl p-6 sm:p-7 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-6 space-y-3">
            <span className="px-2.5 py-1 rounded-md bg-[#C5A46D]/15 border border-[#C5A46D]/30 text-[#D4B47E] text-xs font-bold font-mono">
              STEP 4 · WINNER PAYMENT & CLOSING
            </span>
            <h2 className="text-xl font-bold text-white">
              Selected Winner Pays & the Auction Closes
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              As soon as the Seller approves the highest bid, the winning bidder sees a <strong>Pay Winning Bid</strong> button on their screen.
            </p>
            <ul className="space-y-2 text-xs text-slate-400 pt-1">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>The winning bidder confirms the payment in their wallet.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>The money is transferred directly to the Seller's wallet, and the auction is marked <strong>Closed & Sold</strong>.</span>
              </li>
            </ul>
          </div>

          {/* Visual Mockup for Step 4 */}
          <div className="lg:col-span-6 bg-[#0B0C10] border border-white/[0.08] rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Transaction Complete · Auction Closed
              </span>
              <span className="text-xs font-mono text-slate-400">Sold</span>
            </div>
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="p-3 rounded-lg bg-[#12151E] border border-white/[0.05]">
                <div className="text-[10px] text-slate-400">Winning Buyer (Bidder 2)</div>
                <div className="text-sm font-bold text-rose-300 font-mono mt-0.5">
                  -0.52 ETH Paid
                </div>
              </div>
              <div className="p-3 rounded-lg bg-[#12151E] border border-white/[0.05]">
                <div className="text-[10px] text-slate-400">Vehicle Seller</div>
                <div className="text-sm font-bold text-emerald-400 font-mono mt-0.5">
                  +0.52 ETH Received
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
