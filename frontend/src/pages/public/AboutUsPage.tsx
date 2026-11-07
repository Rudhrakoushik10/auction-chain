import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useWallet } from '../../context/WalletContext';

export const AboutUsPage: React.FC = () => {
  const { openAuthModal } = useWallet();

  return (
    <div className="space-y-12 pb-16">
      {/* Page Header */}
      <div className="border-b border-[#1E293B] pb-6 space-y-2">
        <div className="text-xs font-mono text-slate-400">
          Platform Overview · Hardhat Local Network (Chain ID 31337)
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          About AuctionChain
        </h1>
        <p className="text-sm text-slate-400 max-w-3xl leading-relaxed">
          AuctionChain is a decentralized sealed-bid vehicle auction platform engineered to eliminate price manipulation, mempool front-running, and valuation opacity in automotive resale markets.
        </p>
      </div>

      {/* Mission & Architecture */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="bg-[#0F172A] rounded-xl border border-[#1E293B] p-6 space-y-3">
          <div className="text-xs font-mono text-slate-400">01. Problem & Solution</div>
          <h2 className="text-base font-semibold text-white">Why Sealed Bidding Matters</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Open ascending auctions expose bid increments in real time, enabling last-second sniping and shill bidding. By requiring participants to lock a Keccak-256 commitment hash with a uniform deposit before revealing their true valuation, AuctionChain enforces independent, fair-value price discovery.
          </p>
        </section>

        <section className="bg-[#0F172A] rounded-xl border border-[#1E293B] p-6 space-y-3">
          <div className="text-xs font-mono text-slate-400">02. Empirical Valuation Guidance</div>
          <h2 className="text-base font-semibold text-white">Advisory ML Reference in INR (₹)</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Our <code className="text-slate-200">LightGBM v1.0.0</code> model evaluates brand, model, year, odometer mileage in miles, powertrain specifications, transmission, colors, and accident history across 4,009 vehicle listings to provide an objective benchmark converted and displayed in Indian Rupees (INR / ₹) and anchored on <code className="text-slate-200">PriceOracle.sol</code>.
          </p>
        </section>
      </div>

      {/* Predefined Hardhat Accounts Table */}
      <section className="bg-[#0F172A] rounded-xl border border-[#1E293B] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#1E293B] flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-white">Preconfigured Hardhat Roles</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Deterministic accounts on Chain ID 31337 for role-based evaluation
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">5 Signers</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#090D1A]/60 text-slate-400 border-b border-[#1E293B]">
              <tr>
                <th className="py-3 px-4 font-medium">Role</th>
                <th className="py-3 px-4 font-medium">Hardhat Account</th>
                <th className="py-3 px-4 font-medium">Address</th>
                <th className="py-3 px-4 font-medium">Responsibilities</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E293B] text-slate-300">
              <tr>
                <td className="py-3 px-4 font-semibold text-white">Administrator</td>
                <td className="py-3 px-4 font-mono tabular-nums">Account 0</td>
                <td className="py-3 px-4 font-mono text-slate-400">0xf39Fd6...2266</td>
                <td className="py-3 px-4 text-slate-400">Deploy contracts, configure authorized Oracle signer, monitor system state</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-white">Vehicle Seller</td>
                <td className="py-3 px-4 font-mono tabular-nums">Account 1</td>
                <td className="py-3 px-4 font-mono text-slate-400">0x709979...79C8</td>
                <td className="py-3 px-4 text-slate-400">Create vehicle auctions, set ETH reserve price, finalize & withdraw proceeds</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-white">Bidder 1</td>
                <td className="py-3 px-4 font-mono tabular-nums">Account 2</td>
                <td className="py-3 px-4 font-mono text-slate-400">0x3C44Cd...93BC</td>
                <td className="py-3 px-4 text-slate-400">Commit sealed bid hashes, reveal secret salts, settle or claim refunds</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-white">Bidder 2</td>
                <td className="py-3 px-4 font-mono tabular-nums">Account 3</td>
                <td className="py-3 px-4 font-mono text-slate-400">0x90F79b...b906</td>
                <td className="py-3 px-4 text-slate-400">Compete in sealed-bid auctions as independent second bidder</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-slate-400">Oracle Relayer</td>
                <td className="py-3 px-4 font-mono tabular-nums text-slate-400">Account 4</td>
                <td className="py-3 px-4 font-mono text-slate-500">0x15d34A...6A65</td>
                <td className="py-3 px-4 text-slate-500">Autonomous background service signing AI valuations onto PriceOracle.sol</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="rounded-xl bg-[#0F172A] border border-[#1E293B] p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-white">Explore the Marketplace</h2>
          <p className="text-xs text-slate-400">
            Connect MetaMask or select a preconfigured Hardhat account to begin.
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
