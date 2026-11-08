import React from 'react';
import {
  ShieldCheck,
  Lock,
  FileCode2,
  CheckCircle2,
  Cpu,
  AlertTriangle,
} from 'lucide-react';
import {
  PRICE_ORACLE_CONTRACT_ADDRESS,
  SEALED_AUCTION_CONTRACT_ADDRESS,
  HARDHAT_CHAIN_ID,
} from '../../lib/hardhatConfig';

export const SecurityTransparencyPage: React.FC = () => {
  const securityInvariants = [
    {
      rule: 'Uniform Collateral Deposit (Zero Value Leakage)',
      contract: 'SealedAuction.sol :: commitBid()',
      detail:
        'During the Commit Phase, every participant sends the identical fixedDeposit amount in msg.value. Observers inspecting pending or mined transactions cannot infer a bidder’s valuation from the ETH transferred.',
    },
    {
      rule: 'Salted Keccak-256 Preimage Resistance',
      contract: 'SealedAuction.sol :: revealBid()',
      detail:
        'Each bid is combined with a 256-bit cryptographically random salt prior to hashing. Brute-forcing or dictionary-attacking commitment hashes over the finite bid space is computationally infeasible.',
    },
    {
      rule: 'Strict Oracle Existence Check on Listing',
      contract: 'SealedAuction.sol :: createAuction()',
      detail:
        'Every auction listing must pass a valid predictionId that exists inside PriceOracle.sol, ensuring an immutable AI valuation and SHA-256 vehicle specification hash precede bidding.',
    },
    {
      rule: 'Pull-Over-Push Escrow & Reentrancy Protection',
      contract: 'SealedAuction.sol :: claimRefund() / withdrawSellerProceeds()',
      detail:
        'State variables (refunded flags and pending balances) are zeroed before external ETH transfers, eliminating reentrancy vectors and denial-of-service griefing.',
    },
  ];

  return (
    <div className="space-y-10 pb-16">
      {/* Header */}
      <div className="bg-[#12141A] border border-[#232730] rounded-md p-8 sm:p-10">
        <div className="flex items-center gap-2 text-[#C5A46D] text-[11px] font-mono uppercase tracking-[0.16em] mb-2">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Smart Contract Audit & Security Architecture</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-display font-semibold text-[#F4F5F7]">
          Cryptographic Guarantees & On-Chain Invariants
        </h1>
        <p className="text-sm sm:text-base text-[#8E95A5] mt-3 max-w-3xl leading-relaxed">
          AuctionChain enforces financial integrity at the EVM bytecode level.
          Review our deployed contract registry, security invariants, and non-revealer
          slashing mechanics below.
        </p>
      </div>

      {/* Contract Registry Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#12141A] border border-[#232730] rounded-md p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-[0.14em] text-[#C5A46D]">
              Contract 01 · Valuation Registry
            </span>
            <FileCode2 className="w-4 h-4 text-[#8E95A5]" />
          </div>
          <h3 className="text-lg font-display font-semibold text-[#F4F5F7]">
            PriceOracle.sol
          </h3>
          <div className="p-3 rounded bg-[#0B0C10] border border-[#232730] font-mono text-xs text-[#F4F5F7] break-all">
            {PRICE_ORACLE_CONTRACT_ADDRESS}
          </div>
          <p className="text-xs text-[#8E95A5] leading-relaxed">
            Stores AI-generated vehicle valuations in integer paise alongside the
            canonical SHA-256 hash of the 13 vehicle specification fields. Restricted
            via <code className="font-mono text-[#F4F5F7]">onlyOracle</code> and{' '}
            <code className="font-mono text-[#F4F5F7]">onlyAdmin</code> modifiers.
          </p>
        </div>

        <div className="bg-[#12141A] border border-[#232730] rounded-md p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-[0.14em] text-[#C5A46D]">
              Contract 02 · Commit-Reveal Escrow
            </span>
            <Lock className="w-4 h-4 text-[#8E95A5]" />
          </div>
          <h3 className="text-lg font-display font-semibold text-[#F4F5F7]">
            SealedAuction.sol
          </h3>
          <div className="p-3 rounded bg-[#0B0C10] border border-[#232730] font-mono text-xs text-[#F4F5F7] break-all">
            {SEALED_AUCTION_CONTRACT_ADDRESS}
          </div>
          <p className="text-xs text-[#8E95A5] leading-relaxed">
            Manages auction creation, uniform collateral deposits, Keccak-256
            commitment storage, on-chain reveal verification, reserve price checks,
            and pull-based ETH settlement on Chain ID {HARDHAT_CHAIN_ID}.
          </p>
        </div>
      </div>

      {/* Security Invariants Matrix */}
      <div className="bg-[#12141A] border border-[#232730] rounded-md p-6 sm:p-8 space-y-6">
        <div className="border-b border-[#232730] pb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-display font-semibold text-[#F4F5F7]">
              Verified Smart Contract Security Invariants
            </h2>
            <p className="text-xs text-[#8E95A5] mt-0.5">
              Enforced deterministically across every transaction on SealedAuction.sol
            </p>
          </div>
          <Cpu className="w-5 h-5 text-[#C5A46D]" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {securityInvariants.map((item) => (
            <div
              key={item.rule}
              className="p-5 rounded-md bg-[#0B0C10] border border-[#232730] space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-[#F4F5F7] flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#2E9B68] shrink-0" />
                  {item.rule}
                </span>
              </div>
              <div className="text-[11px] font-mono text-[#C5A46D]">
                {item.contract}
              </div>
              <p className="text-xs text-[#8E95A5] leading-relaxed pt-1">
                {item.detail}
              </p>
            </div>
          ))}
        </div>

        {/* Non-Revealer Policy Note */}
        <div className="p-4 rounded-md bg-[#0B0C10] border border-[#D49B38]/40 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-[#D49B38] shrink-0 mt-0.5" />
          <div className="text-xs text-[#8E95A5] leading-relaxed">
            <strong className="text-[#F4F5F7]">
              Anti-Griefing Deposit Policy:
            </strong>{' '}
            Bidders who commit a sealed hash during the Commit Phase but fail to
            reveal their bid before the Reveal deadline are ineligible for automated
            collateral refunds—deterring tactical option-value bidding.
          </div>
        </div>
      </div>
    </div>
  );
};
