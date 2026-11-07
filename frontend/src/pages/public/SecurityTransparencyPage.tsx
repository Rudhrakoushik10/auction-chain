import React from 'react';
import {
  ShieldCheck,
  Lock,
  Database,
  Cpu,
  CheckCircle2,
  AlertCircle,
  FileCode,
  ArrowRight,
} from 'lucide-react';
import { useWallet } from '../../context/WalletContext';

export const SecurityTransparencyPage: React.FC = () => {
  const { openAuthModal } = useWallet();

  return (
    <div className="space-y-12 pb-16 animate-in fade-in duration-200">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4 pt-4">
        <span className="text-xs font-mono font-bold tracking-widest uppercase px-3 py-1 rounded bg-[#2563EB]/10 text-[#2563EB] border border-[#2563EB]/20">
          Trust & Cryptographic Proofs
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#101B3D] tracking-tight">
          Security & Transparency
        </h1>
        <p className="text-base text-slate-600 leading-relaxed">
          How AuctionChain protects bidders from front-running, safeguards seller reserves, and ensures verifiable mathematical fairness through Solidity smart contracts and decentralized oracle proofs.
        </p>
      </div>

      {/* Grid of Security Architecture */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Smart-Contract Execution */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 sm:p-8 space-y-4 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center">
            <FileCode className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-[#101B3D]">1. Smart-Contract Execution</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            All auction operations are executed deterministically on-chain by <span className="font-mono text-xs font-bold text-[#2563EB]">SealedAuction.sol</span>. Built with Solidity 0.8.20 and OpenZeppelin security standards:
          </p>
          <ul className="space-y-2 text-xs text-slate-700">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong className="text-[#101B3D]">ReentrancyGuard:</strong> Prevents recursive state manipulation during bidder deposit refunds and seller proceeds withdrawal.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong className="text-[#101B3D]">Pull-over-Push Payments:</strong> Winning bids and refund deposits are claimed via pull requests, preventing denial-of-service fallback attacks.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong className="text-[#101B3D]">Strict Role-to-Address Access Control:</strong> Deployer, Seller, and Oracle privileges are cryptographically validated on every state transition.</span>
            </li>
          </ul>
        </div>

        {/* Sealed-Bid Confidentiality */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 sm:p-8 space-y-4 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#6D28D9] flex items-center justify-center">
            <Lock className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-[#101B3D]">2. Sealed-Bid Confidentiality</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Unlike public English auctions where bids are exposed in real time, AuctionChain implements an immutable two-phase commit-reveal protocol:
          </p>
          <div className="bg-[#101B3D] text-slate-200 p-4 rounded-xl font-mono text-xs space-y-1">
            <div className="text-[#06B6D4]">// Cryptographic Commitment Hash</div>
            <div>commitment = keccak256(abi.encodePacked(auctionId, bidder, bidAmount, salt));</div>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            During the commitment window, miners, sellers, and competitors can only observe the 32-byte hash and fixed collateral. Bid values remain 100% mathematically hidden until the reveal phase opens.
          </p>
        </div>

        {/* Blockchain Transaction Records */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 sm:p-8 space-y-4 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-cyan-50 text-[#06B6D4] flex items-center justify-center">
            <Database className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-[#101B3D]">3. Blockchain Transaction Records</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Every step in an auction’s lifecycle emits an immutable EVM event with full transaction receipt, block timestamp, and cryptographic proof:
          </p>
          <div className="space-y-1.5 text-xs">
            <div className="p-2.5 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] flex items-center justify-between">
              <span className="font-mono font-semibold text-[#101B3D]">AuctionCreated</span>
              <span className="text-slate-500">Seller address, starting bid, commit & reveal deadlines</span>
            </div>
            <div className="p-2.5 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] flex items-center justify-between">
              <span className="font-mono font-semibold text-[#101B3D]">BidCommitted</span>
              <span className="text-slate-500">Bidder address, 32-byte hash, deposited collateral</span>
            </div>
            <div className="p-2.5 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] flex items-center justify-between">
              <span className="font-mono font-semibold text-[#101B3D]">BidRevealed</span>
              <span className="text-slate-500">Decrypted bid amount, hash verification confirmation</span>
            </div>
          </div>
        </div>

        {/* Oracle's Role */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 sm:p-8 space-y-4 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Cpu className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-[#101B3D]">4. The Oracle’s Role</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Smart contracts cannot directly call off-chain Python ML models without compromising blockchain consensus. AuctionChain solves this via an authorized Oracle worker:
          </p>
          <ul className="space-y-2 text-xs text-slate-700">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>The Oracle runs as an isolated background server (<span className="font-mono">oracle/</span>, Account 4).</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>It canonicalizes vehicle attributes into standard sorted JSON and computes a SHA-256 data hash.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>Only the authorized address (`0x15d34...6A65`) can write verified valuations to <span className="font-mono">PriceOracle.sol</span>.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* On-Chain vs Off-Chain Data Storage Breakdown Table */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 sm:p-8 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-[#101B3D]">
          What Information is Stored On-Chain vs. Off-Chain?
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#101B3D] text-white">
              <tr>
                <th className="p-3 rounded-l-lg">Data Component</th>
                <th className="p-3">Storage Location</th>
                <th className="p-3">Privacy / Visibility</th>
                <th className="p-3 rounded-r-lg">Security Guarantee</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="p-3 font-semibold text-[#101B3D]">Bid Value & Secret Salt</td>
                <td className="p-3 font-mono text-slate-600">Client Local / Memory</td>
                <td className="p-3 text-emerald-700 font-semibold">100% Confidential until Reveal</td>
                <td className="p-3 text-slate-600">Known only to the bidder; never leaves the browser in commit phase</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-[#101B3D]">Commitment Hash</td>
                <td className="p-3 font-mono text-slate-600">SealedAuction.sol (On-Chain)</td>
                <td className="p-3 text-blue-700 font-semibold">Public (One-Way Hash)</td>
                <td className="p-3 text-slate-600">Mathematically irreversible without the secret salt</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-[#101B3D]">Collateral Deposit (ETH)</td>
                <td className="p-3 font-mono text-slate-600">Smart Contract Escrow</td>
                <td className="p-3 text-slate-700">Public balance</td>
                <td className="p-3 text-slate-600">Locked in contract; refunded to losing bidders automatically</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-[#101B3D]">Vehicle Images & Heavy Specs</td>
                <td className="p-3 font-mono text-slate-600">IPFS / Decentralized Storage</td>
                <td className="p-3 text-slate-700">Public metadata</td>
                <td className="p-3 text-slate-600">Content-addressed via IPFS CID hash</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-[#101B3D]">AI Prediction & Proof</td>
                <td className="p-3 font-mono text-slate-600">PriceOracle.sol (On-Chain)</td>
                <td className="p-3 text-slate-700">Public on-chain record</td>
                <td className="p-3 text-slate-600">Signed with ECDSA by authorized Oracle private key</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
