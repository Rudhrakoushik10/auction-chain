import React from 'react';
import { CheckCircle2 } from 'lucide-react';

export const SecurityTransparencyPage: React.FC = () => {
  return (
    <div className="space-y-12 pb-16">
      {/* Page Header */}
      <div className="border-b border-[#1E293B] pb-6 space-y-2">
        <div className="text-xs font-mono text-slate-400">
          Cryptographic Guarantees & Escrow Architecture
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Security & Transparency
        </h1>
        <p className="text-sm text-slate-400 max-w-3xl leading-relaxed">
          How AuctionChain prevents mempool front-running, enforces seller reserve thresholds, and anchors off-chain AI valuations on Hardhat Chain ID 31337.
        </p>
      </div>

      {/* 4 Core Security Guarantees */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="bg-[#0F172A] rounded-xl border border-[#1E293B] p-6 space-y-4">
          <div className="text-xs font-mono text-slate-400">01. Smart Contract Execution</div>
          <h2 className="text-base font-semibold text-white">
            Deterministic Escrow & Reentrancy Protection
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            All state transitions execute deterministically on <code className="text-slate-200">SealedAuction.sol</code>:
          </p>
          <ul className="space-y-2 text-xs text-slate-300">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong className="text-white">Pull-Over-Push Refunds:</strong> Losing bidders and sellers claim funds individually via pull calls, preventing fallback denial-of-service vectors.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong className="text-white">Self-Bid Prevention:</strong> Contract reverts with <code className="text-slate-200">SellerCannotBidOnOwnAuction()</code> if the listing creator attempts to submit a commitment.</span>
            </li>
          </ul>
        </section>

        <section className="bg-[#0F172A] rounded-xl border border-[#1E293B] p-6 space-y-4">
          <div className="text-xs font-mono text-slate-400">02. Sealed-Bid Confidentiality</div>
          <h2 className="text-base font-semibold text-white">
            Keccak-256 Commit-Reveal Protocol
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            During the commitment window, only a one-way 32-byte hash and uniform ETH deposit are transmitted on-chain:
          </p>
          <div className="p-3.5 rounded-lg bg-[#090D1A] border border-[#1E293B] font-mono text-xs text-slate-200 overflow-x-auto">
            commitment = keccak256(abi.encode(auctionId, bidder, bidAmountWei, salt));
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Because every participant locks the exact same fixed collateral deposit, observers cannot infer bid amounts from transaction value until the reveal window opens.
          </p>
        </section>

        <section className="bg-[#0F172A] rounded-xl border border-[#1E293B] p-6 space-y-4">
          <div className="text-xs font-mono text-slate-400">03. Oracle Attestation</div>
          <h2 className="text-base font-semibold text-white">
            Canonical Feature Hashing on PriceOracle.sol
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Smart contracts cannot execute gradient-boosted decision trees directly. Instead, the background Oracle service (Account 4) normalizes vehicle attributes into canonical JSON, computes a SHA-256 <code className="text-slate-200">product_data_hash</code>, and signs the integer USD cents valuation onto <code className="text-slate-200">PriceOracle.sol</code>.
          </p>
        </section>

        <section className="bg-[#0F172A] rounded-xl border border-[#1E293B] p-6 space-y-4">
          <div className="text-xs font-mono text-slate-400">04. Immutable Audit Trail</div>
          <h2 className="text-base font-semibold text-white">
            Verifiable On-Chain Event Logs
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Every prediction registration, lot deployment, sealed commitment, hash reveal, finalization, and refund emits an indexed Solidity event with block number and transaction hash for full auditability.
          </p>
        </section>
      </div>

      {/* On-Chain vs Off-Chain Data Storage Table */}
      <section className="bg-[#0F172A] rounded-xl border border-[#1E293B] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#1E293B]">
          <h2 className="text-base font-semibold text-white">
            On-Chain vs. Off-Chain Data Architecture
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#090D1A]/60 text-slate-400 border-b border-[#1E293B]">
              <tr>
                <th className="py-3 px-4 font-medium">Data Component</th>
                <th className="py-3 px-4 font-medium">Storage Location</th>
                <th className="py-3 px-4 font-medium">Visibility</th>
                <th className="py-3 px-4 font-medium">Integrity Mechanism</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E293B] text-slate-300">
              <tr>
                <td className="py-3 px-4 font-semibold text-white">Bid Amount & 32-Byte Salt</td>
                <td className="py-3 px-4 font-mono text-slate-400">Bidder Client / Local JSON</td>
                <td className="py-3 px-4 text-emerald-400 font-medium">Private until Reveal</td>
                <td className="py-3 px-4 text-slate-400">Never transmitted in plaintext during Commit phase</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-white">Commitment Hash</td>
                <td className="py-3 px-4 font-mono text-slate-400">SealedAuction.sol</td>
                <td className="py-3 px-4">Public 32-byte hash</td>
                <td className="py-3 px-4 text-slate-400">Verified against plaintext bid + salt on reveal</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-white">Collateral Deposit (ETH)</td>
                <td className="py-3 px-4 font-mono text-slate-400">SealedAuction.sol Escrow</td>
                <td className="py-3 px-4">Public uniform amount</td>
                <td className="py-3 px-4 text-slate-400">Credited to winner or refunded via pull claim</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-white">AI Valuation & Spec Hash</td>
                <td className="py-3 px-4 font-mono text-slate-400">PriceOracle.sol</td>
                <td className="py-3 px-4">Public on-chain record</td>
                <td className="py-3 px-4 text-slate-400">Restricted to authorized Oracle signer address</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
