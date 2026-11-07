import React from 'react';
import {
  ShieldCheck,
  Cpu,
  Lock,
  Globe,
  Terminal,
  Layers,
  Award,
  ArrowRight,
  Database,
  Code2,
} from 'lucide-react';
import { useWallet } from '../../context/WalletContext';

export const AboutUsPage: React.FC = () => {
  const { openAuthModal } = useWallet();

  return (
    <div className="space-y-12 pb-16 animate-in fade-in duration-200">
      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4 pt-4">
        <span className="text-xs font-mono font-bold tracking-widest uppercase px-3 py-1 rounded bg-[#06B6D4]/10 text-[#06B6D4] border border-[#06B6D4]/30">
          Decentralized Automotive Protocol
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          About AuctionChain
        </h1>
        <p className="text-base text-slate-400 leading-relaxed">
          AuctionChain is an AI-powered sealed-bid vehicle auction protocol engineered to eliminate information asymmetry, bid-sniping, and market manipulation in high-value automobile transactions.
        </p>
      </div>

      {/* Purpose & Mission */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-[#0F172A] rounded-2xl border border-[#1E293B] p-6 sm:p-8 space-y-4">
          <div className="w-10 h-10 rounded-xl bg-[#2563EB]/15 text-[#3B82F6] flex items-center justify-center border border-[#2563EB]/30">
            <Globe className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-white">Our Mission</h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Traditional vehicle auctions suffer from predatory MEV front-running, fake shill bidding, and opaque dealer pricing. AuctionChain replaces human intermediaries with deterministic EVM smart contracts, mathematical sealed-bid proofs, and empirical machine learning valuations.
          </p>
        </div>

        <div className="bg-[#0F172A] rounded-2xl border border-[#1E293B] p-6 sm:p-8 space-y-4">
          <div className="w-10 h-10 rounded-xl bg-[#7C3AED]/15 text-[#A78BFA] flex items-center justify-center border border-[#7C3AED]/30">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-white">The Sealed-Bid Advantage</h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            By enforcing a two-phase <span className="font-mono text-[#06B6D4]">keccak256</span> commit-reveal cycle, no participant can observe competing bid values before the reveal deadline. This forces rational, true-valuation bidding and guarantees complete privacy for market participants.
          </p>
        </div>
      </div>

      {/* Technology Stack Grid */}
      <div className="bg-[#0F172A] rounded-2xl border border-[#1E293B] p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-[#1E293B] pb-4">
          <div>
            <h2 className="text-xl font-bold text-white">Technical Architecture</h2>
            <p className="text-xs text-slate-400">Integrated Web3, AI inference, and autonomous Oracle pipelines</p>
          </div>
          <span className="text-xs font-mono text-[#06B6D4] bg-[#06B6D4]/10 px-2.5 py-1 rounded border border-[#06B6D4]/20">
            Chain ID 31337
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="bg-[#131E3A] p-4 rounded-xl border border-[#1E293B] space-y-2">
            <div className="flex items-center gap-2 text-[#3B82F6] font-bold">
              <Database className="w-4 h-4" />
              <span>Smart Contracts</span>
            </div>
            <p className="text-slate-300">Solidity 0.8.20 SealedAuction & PriceOracle contracts with ReentrancyGuard and pull-based payments.</p>
          </div>

          <div className="bg-[#131E3A] p-4 rounded-xl border border-[#1E293B] space-y-2">
            <div className="flex items-center gap-2 text-[#06B6D4] font-bold">
              <Cpu className="w-4 h-4" />
              <span>Machine Learning</span>
            </div>
            <p className="text-slate-300">Trained vehicle-v1 regression model computing fair INR resale prices based on multi-factor regression.</p>
          </div>

          <div className="bg-[#131E3A] p-4 rounded-xl border border-[#1E293B] space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <Terminal className="w-4 h-4" />
              <span>Oracle Worker</span>
            </div>
            <p className="text-slate-300">Dedicated background service (Account 5) signing canonical hashes and recording valuations on-chain.</p>
          </div>

          <div className="bg-[#131E3A] p-4 rounded-xl border border-[#1E293B] space-y-2">
            <div className="flex items-center gap-2 text-[#A78BFA] font-bold">
              <Code2 className="w-4 h-4" />
              <span>Web3 Interface</span>
            </div>
            <p className="text-slate-300">React 19 + TypeScript + Vite + Tailwind CSS + Ethers.js v6 with native MetaMask connection.</p>
          </div>
        </div>
      </div>

      {/* Predefined Account Roles Table */}
      <div className="bg-[#0F172A] rounded-2xl border border-[#1E293B] p-6 sm:p-8 space-y-4">
        <h2 className="text-xl font-bold text-white">Predefined Hardhat Roles</h2>
        <p className="text-xs text-slate-400">
          AuctionChain runs on the local Hardhat network with predefined accounts for seamless demonstration:
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#131E3A] text-slate-300 border-b border-[#1E293B]">
              <tr>
                <th className="p-3">Role</th>
                <th className="p-3">Hardhat Account</th>
                <th className="p-3">Address</th>
                <th className="p-3">Responsibility</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E293B] text-slate-300">
              <tr>
                <td className="p-3 font-bold text-amber-400">Admin</td>
                <td className="p-3 font-mono">Account 0</td>
                <td className="p-3 font-mono text-slate-400">0xf39Fd6...2266</td>
                <td className="p-3">Deploy contracts and configure the platform</td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-blue-400">Seller</td>
                <td className="p-3 font-mono">Account 1</td>
                <td className="p-3 font-mono text-slate-400">0x70997...79C8</td>
                <td className="p-3">Create and manage vehicle auctions</td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-purple-400">Bidder 1</td>
                <td className="p-3 font-mono">Account 2</td>
                <td className="p-3 font-mono text-slate-400">0x3C44C...93BC</td>
                <td className="p-3">Participate in vehicle auctions as first bidder</td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-cyan-400">Bidder 2</td>
                <td className="p-3 font-mono">Account 3</td>
                <td className="p-3 font-mono text-slate-400">0x90F79...9b906</td>
                <td className="p-3">Participate in vehicle auctions as second bidder</td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-emerald-400">Oracle</td>
                <td className="p-3 font-mono">Account 4</td>
                <td className="p-3 font-mono text-slate-400">0x15d34...6A65</td>
                <td className="p-3">Background service only (submits AI predictions on-chain)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* CTA Card */}
      <div className="rounded-2xl bg-gradient-to-r from-[#101B3D] via-[#131E3A] to-[#0F172A] border border-[#2563EB]/40 p-8 text-center space-y-4">
        <h2 className="text-2xl font-bold text-white">Join the Decentralized Automotive Marketplace</h2>
        <p className="text-sm text-slate-300 max-w-xl mx-auto">
          Experience zero-sniping sealed bidding on the Hardhat local network.
        </p>
        <button
          type="button"
          onClick={openAuthModal}
          className="px-6 py-3 rounded-xl bg-[#2563EB] hover:bg-blue-600 text-white font-bold text-sm transition-all shadow-lg shadow-[#2563EB]/40 inline-flex items-center gap-2 cursor-pointer"
        >
          <span>Connect MetaMask</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
