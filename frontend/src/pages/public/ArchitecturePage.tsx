import React from 'react';
import {
  Cpu,
  Database,
  Globe,
  Server,
  Wallet,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { useWallet } from '../../context/WalletContext';

const FOUR_SERVERS = [
  {
    num: 'Server 1 (Terminal 1)',
    name: 'Hardhat Blockchain Node & Contract Auto-Deploy',
    port: 'Port 8545',
    icon: Database,
    badgeColor: 'text-amber-300 bg-amber-500/10 border-amber-500/30',
    whatItIs: 'The local blockchain ledger that stores all car listings, bids, and wallet balances.',
    howItIsUsed:
      'Runs the local Ethereum network on Port 8545, automatically deploys Auction.sol & PriceOracle.sol, and provides pre-funded wallets for Seller, Bidder 1, Bidder 2, and Admin.',
  },
  {
    num: 'Server 2 (Terminal 2)',
    name: 'AI Vehicle Valuation Engine (Backend API)',
    port: 'Port 8000',
    icon: Cpu,
    badgeColor: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30',
    whatItIs: 'Calculates the fair market price of any car in Indian Rupees (₹ INR).',
    howItIsUsed:
      'Reads the car brand, model, year, mileage driven, fuel type, and condition entered by the Seller and returns an AI market price estimate before bidding begins.',
  },
  {
    num: 'Server 3 (Terminal 3)',
    name: 'Autonomous ETH / ₹ INR Price Oracle',
    port: 'Background Service (Account #4)',
    icon: Server,
    badgeColor: 'text-purple-300 bg-purple-500/10 border-purple-500/30',
    whatItIs: 'Keeps the live ETH to Indian Rupee (₹ INR) exchange rate updated on the blockchain.',
    howItIsUsed:
      'Runs in the background using Account #4 to feed live ETH/INR conversion rates into PriceOracle.sol so all ETH bids show accurate ₹ INR values.',
  },
  {
    num: 'Server 4 (Terminal 4)',
    name: 'Web3 Frontend & Gateway Server (React + Express)',
    port: 'Port 3000',
    icon: Globe,
    badgeColor: 'text-indigo-300 bg-indigo-500/10 border-indigo-500/30',
    whatItIs: 'The website where Sellers and Bidders log in, place bids, and complete payment.',
    howItIsUsed:
      'Serves the web interface on http://localhost:3000, connects the user’s MetaMask wallet to Server 1 (Port 8545), and requests car valuations from Server 2 (Port 8000).',
  },
];

export const ArchitecturePage: React.FC = () => {
  const { openAuthModal } = useWallet();

  return (
    <div className="space-y-8 pb-8">
      {/* Page Header */}
      <div className="bg-[#12151E] border border-white/[0.07] rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="max-w-2xl">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#D4B47E]">
            System Architecture
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            How the 4 System Servers Work Together
          </h1>
          <p className="text-sm text-slate-300 mt-2 leading-relaxed">
            A simple visual look at the 4 servers launched by <code className="text-[#D4B47E] font-mono">start-all.bat</code>, and how they communicate to value a car, run the bidding window, and complete payment.
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

      {/* SECTION 1: VISUAL ARCHITECTURE DIAGRAM */}
      <div className="bg-[#12151E] border border-white/[0.07] rounded-2xl p-6 sm:p-8 space-y-6">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-[#D4B47E]">
            Visual Architecture Diagram
          </span>
          <h2 className="text-xl font-bold text-white mt-1">
            How Data Flows Across the 4 Servers
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Every action you take in the browser flows cleanly between the Web App (Port 3000), the AI Valuation Server (Port 8000), the Price Oracle, and the Blockchain Network (Port 8545):
          </p>
        </div>

        {/* Simple 4-Step Visual Diagram Box */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#0B0C10] border border-white/[0.08]">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
            {/* Step 1: Server 4 (Website) */}
            <div className="p-4 rounded-xl bg-[#12151E] border border-indigo-500/30 flex flex-col justify-between relative">
              <div className="space-y-2">
                <span className="inline-block px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 font-mono text-[11px] font-bold">
                  1. Website (Port 3000)
                </span>
                <div className="text-sm font-bold text-white">
                  Frontend Server
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Seller enters car details, and Bidders place their bids using MetaMask.
                </p>
              </div>
              <div className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-[#0B0C10] border border-white/20 items-center justify-center">
                <ArrowRight className="w-3.5 h-3.5 text-[#D4B47E]" />
              </div>
            </div>

            {/* Step 2: Server 2 (AI Valuation) */}
            <div className="p-4 rounded-xl bg-[#12151E] border border-emerald-500/30 flex flex-col justify-between relative">
              <div className="space-y-2">
                <span className="inline-block px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 font-mono text-[11px] font-bold">
                  2. AI Server (Port 8000)
                </span>
                <div className="text-sm font-bold text-white">
                  AI Price Check
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Checks the car's brand, year, and mileage to estimate a fair price in ₹ INR.
                </p>
              </div>
              <div className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-[#0B0C10] border border-white/20 items-center justify-center">
                <ArrowRight className="w-3.5 h-3.5 text-[#D4B47E]" />
              </div>
            </div>

            {/* Step 3: Server 3 (Price Oracle) */}
            <div className="p-4 rounded-xl bg-[#12151E] border border-purple-500/30 flex flex-col justify-between relative">
              <div className="space-y-2">
                <span className="inline-block px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 font-mono text-[11px] font-bold">
                  3. Price Oracle
                </span>
                <div className="text-sm font-bold text-white">
                  ETH ↔ ₹ INR Rate
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Automatically converts ₹ INR car prices into ETH for bidding.
                </p>
              </div>
              <div className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-[#0B0C10] border border-white/20 items-center justify-center">
                <ArrowRight className="w-3.5 h-3.5 text-[#D4B47E]" />
              </div>
            </div>

            {/* Step 4: Server 1 (Blockchain) */}
            <div className="p-4 rounded-xl bg-[#12151E] border border-amber-500/30 flex flex-col justify-between">
              <div className="space-y-2">
                <span className="inline-block px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 font-mono text-[11px] font-bold">
                  4. Blockchain (Port 8545)
                </span>
                <div className="text-sm font-bold text-white">
                  Hardhat Ledger
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Records all bids, lets Seller approve the highest bid, and transfers payment.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: THE 4 SERVERS EXPLAINED SIMPLY */}
      <div className="space-y-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-[#D4B47E]">
            What Runs When You Start the System
          </span>
          <h2 className="text-xl font-bold text-white mt-1">
            The 4 Servers & Services Explained
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {FOUR_SERVERS.map((srv) => {
            const Icon = srv.icon;
            return (
              <div
                key={srv.num}
                className="bg-[#12151E] border border-white/[0.07] rounded-2xl p-6 space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`px-2.5 py-1 rounded-md border text-xs font-mono font-bold ${srv.badgeColor}`}
                  >
                    {srv.num} · {srv.port}
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-[#0B0C10] border border-white/[0.08] flex items-center justify-center">
                    <Icon className="w-4 h-4 text-[#D4B47E]" />
                  </div>
                </div>

                <h3 className="text-lg font-bold text-white">{srv.name}</h3>

                <div className="p-3 rounded-xl bg-[#0B0C10] border border-white/[0.05] text-xs text-slate-300">
                  <strong className="text-white">Role: </strong>
                  {srv.whatItIs}
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  {srv.howItIsUsed}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 3: SUMMARY OF TECHNOLOGIES USED */}
      <div className="bg-[#12151E] border border-white/[0.07] rounded-2xl p-6 sm:p-7 space-y-4">
        <h2 className="text-lg font-bold text-white">
          Key Technologies Used (At a Glance)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-[#0B0C10] border border-white/[0.06] space-y-1.5">
            <div className="font-bold text-white flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-indigo-400" />
              Frontend (React & Ethers.js)
            </div>
            <p className="text-slate-400 leading-relaxed">
              Provides the clean dashboard for Sellers and Bidders, live countdown timer, and connects to MetaMask.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#0B0C10] border border-white/[0.06] space-y-1.5">
            <div className="font-bold text-white flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              AI Valuation (Gemini 2.5 Flash)
            </div>
            <p className="text-slate-400 leading-relaxed">
              Predicts the fair Indian market price (₹ INR) of the car based on its real specifications and condition.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#0B0C10] border border-white/[0.06] space-y-1.5">
            <div className="font-bold text-white flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-amber-400" />
              Blockchain (Hardhat & Solidity)
            </div>
            <p className="text-slate-400 leading-relaxed">
              Records every bid fairly, lets the seller approve the highest bid, and transfers the winning payment directly to the seller.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
