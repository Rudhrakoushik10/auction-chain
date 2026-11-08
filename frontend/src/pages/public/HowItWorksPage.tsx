import React from 'react';
import {
  Scale,
  Lock,
  Eye,
  Award,
  ArrowRight,
  Wallet,
  FileCode2,
} from 'lucide-react';
import { useWallet } from '../../context/WalletContext';

export const HowItWorksPage: React.FC = () => {
  const { openAuthModal } = useWallet();

  const stages = [
    {
      step: '01',
      icon: Scale,
      title: 'AI Vehicle Valuation & Oracle Registration',
      subtitle: 'Off-Chain Gemini AI Valuation → PriceOracle.sol',
      description:
        'Before a vehicle is listed, 13 structured specification attributes (year, manufacturer, model, odometer, condition, fuel, transmission, drivetrain, title status) are evaluated to establish an advisory Indian Rupee (INR) valuation. A canonical SHA-256 hash of the attributes and integer paise valuation is committed to PriceOracle.sol by the authorized Oracle signer.',
      codeSnippet: `// PriceOracle.sol
function storePrediction(
    uint256 _predictedPrice, // Valuation in paise (INR * 100)
    bytes32 _dataHash        // Canonical SHA-256 vehicle spec hash
) external onlyOracle returns (uint256 predictionId)`,
    },
    {
      step: '02',
      icon: Lock,
      title: 'Sealed Bid Commitment (Commit Phase)',
      subtitle: 'Keccak-256 Salted Hash + Uniform Collateral Deposit',
      description:
        'During the Commit window, bidders compute a local Keccak-256 commitment hash combining their true bid (in wei) and a 32-byte cryptographic salt. Every bidder locks the exact same fixed collateral deposit in ETH so that transaction value on the public ledger never leaks the underlying bid amount.',
      codeSnippet: `// SealedAuction.sol
bytes32 commitment = keccak256(abi.encodePacked(uint256(bidWei), bytes32(salt)));
auction.commitBid{value: fixedDepositWei}(auctionId, commitment);`,
    },
    {
      step: '03',
      icon: Eye,
      title: 'Cryptographic Verification (Reveal Phase)',
      subtitle: 'On-Chain Hash Matching & Reserve Price Enforcement',
      description:
        'Once the Commit deadline expires, bidders submit their plaintext bid amount and secret salt. SealedAuction.sol recomputes keccak256(abi.encodePacked(_bidAmount, _salt)) on-chain, verifies equality against the stored commitment, and updates the highest verified bid if it meets the seller reserve threshold.',
      codeSnippet: `// SealedAuction.sol
bytes32 computed = keccak256(abi.encodePacked(_bidAmount, _salt));
if (computed != c.commitmentHash) revert HashMismatch();`,
    },
    {
      step: '04',
      icon: Award,
      title: 'Deterministic Finalization & Pull-Based Escrow',
      subtitle: 'Winner Settlement, Deposit Refunds & Seller Proceeds',
      description:
        'After the Reveal window closes, finalizeAuction() locks the winning bidder. Non-winning revealed bidders reclaim 100% of their collateral deposit via pull-based claimRefund(), while the winning bidder settles any remaining balance above their deposit and the seller withdraws proceeds.',
      codeSnippet: `// Pull-over-Push Settlement Pattern
auction.finalizeAuction(auctionId);
auction.claimRefund(auctionId);            // Losing revealed bidders
auction.withdrawSellerProceeds(auctionId); // Consigning seller`,
    },
  ];

  return (
    <div className="space-y-12 pb-16">
      {/* Header */}
      <div className="bg-[#12141A] border border-[#232730] rounded-md p-8 sm:p-10">
        <span className="text-[11px] font-mono uppercase tracking-[0.16em] text-[#C5A46D]">
          Protocol Specification
        </span>
        <h1 className="text-2xl sm:text-4xl font-display font-semibold text-[#F4F5F7] mt-2">
          How the Commit-Reveal Reserve Protocol Operates
        </h1>
        <p className="text-sm sm:text-base text-[#8E95A5] mt-3 max-w-3xl leading-relaxed">
          Traditional open-outcry and transparent blockchain auctions expose bidders
          to mempool front-running, shill bidding, and last-second sniping.
          AuctionChain eliminates information asymmetry through a four-stage
          cryptographic state machine.
        </p>
      </div>

      {/* Stages */}
      <div className="space-y-6">
        {stages.map((st) => {
          const Icon = st.icon;
          return (
            <div
              key={st.step}
              className="bg-[#12141A] border border-[#232730] rounded-md p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
            >
              <div className="lg:col-span-7 space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded bg-[#0B0C10] border border-[#C5A46D]/40 text-[#C5A46D]">
                    STAGE {st.step}
                  </span>
                  <span className="text-xs font-mono text-[#8E95A5]">
                    {st.subtitle}
                  </span>
                </div>
                <h2 className="text-xl font-display font-semibold text-[#F4F5F7] flex items-center gap-2.5">
                  <Icon className="w-5 h-5 text-[#C5A46D]" />
                  <span>{st.title}</span>
                </h2>
                <p className="text-xs sm:text-sm text-[#8E95A5] leading-relaxed">
                  {st.description}
                </p>
              </div>

              <div className="lg:col-span-5 bg-[#0B0C10] border border-[#232730] rounded-md p-4">
                <div className="flex items-center justify-between text-[10px] font-mono text-[#646C7E] pb-2 mb-2 border-b border-[#232730]">
                  <span className="flex items-center gap-1.5 text-[#8E95A5]">
                    <FileCode2 className="w-3.5 h-3.5 text-[#C5A46D]" />
                    SOLIDITY 0.8.20 VERIFICATION
                  </span>
                  <span>EVM</span>
                </div>
                <pre className="text-[11px] font-mono text-[#F4F5F7] overflow-x-auto leading-relaxed">
                  {st.codeSnippet}
                </pre>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom CTA */}
      <div className="bg-[#12141A] border border-[#232730] rounded-md p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="text-lg font-display font-semibold text-[#F4F5F7]">
            Ready to Execute a Full Commit-Reveal Cycle?
          </h3>
          <p className="text-xs text-[#8E95A5] mt-1">
            Connect with any role-mapped Hardhat signer or use the 1-click Seller
            evaluation bypass.
          </p>
        </div>
        <button
          onClick={openAuthModal}
          className="px-6 py-3 rounded-md bg-[#C5A46D] hover:bg-[#D4B57E] text-[#0B0C10] font-semibold text-xs uppercase tracking-[0.12em] flex items-center gap-2 shrink-0 transition-colors cursor-pointer"
        >
          <Wallet className="w-4 h-4" />
          <span>Connect Wallet</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
