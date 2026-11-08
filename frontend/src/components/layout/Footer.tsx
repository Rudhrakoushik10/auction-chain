import React from 'react';
import { PublicNavTab } from './PublicHeader';
import {
  HARDHAT_CHAIN_ID,
  PRICE_ORACLE_CONTRACT_ADDRESS,
  SEALED_AUCTION_CONTRACT_ADDRESS,
} from '../../lib/hardhatConfig';
import { Logo } from '../common/Logo';

interface FooterProps {
  onNavigatePublic?: (tab: PublicNavTab) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigatePublic }) => {
  return (
    <footer className="bg-[#0B0C10] border-t border-[#232730] mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-[#232730]">
          {/* Col 1: Brand & Institutional Statement */}
          <div className="md:col-span-8 space-y-4">
            <Logo size="md" subtitle="Institutional Vehicle Reserve Exchange" />
            <p className="text-sm text-[#8E95A5] max-w-md leading-relaxed">
              AuctionChain combines luxury and commercial automotive remarketing with
              cryptographic commit-reveal smart contracts and AI-calibrated Indian market
              valuation.
            </p>
            <div className="pt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-mono text-[#646C7E]">
              <span>EVM Chain ID: {HARDHAT_CHAIN_ID}</span>
              <span>·</span>
              <span>Solidity 0.8.20</span>
              <span>·</span>
              <span>Keccak-256 Sealed Bids</span>
            </div>
          </div>

          {/* Col 2: On-Chain Registry */}
          <div className="md:col-span-4 space-y-3">
            <h4 className="text-[11px] font-mono uppercase tracking-[0.16em] text-[#F4F5F7]">
              Verified Contract Registry
            </h4>
            <div className="bg-[#12141A] border border-[#232730] rounded-md p-4 space-y-2.5 text-xs font-mono">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[#8E95A5]">PriceOracle.sol</span>
                <span className="text-[#F4F5F7] truncate max-w-[190px]">
                  {PRICE_ORACLE_CONTRACT_ADDRESS}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#232730]">
                <span className="text-[#8E95A5]">SealedAuction.sol</span>
                <span className="text-[#F4F5F7] truncate max-w-[190px]">
                  {SEALED_AUCTION_CONTRACT_ADDRESS}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#646C7E]">
          <p>© {new Date().getFullYear()} AuctionChain Institutional Remarketing. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => onNavigatePublic?.('home')}
              className="hover:text-[#F4F5F7] transition-colors cursor-pointer"
            >
              Overview
            </button>
            <button
              type="button"
              onClick={() => onNavigatePublic?.('how-it-works')}
              className="hover:text-[#F4F5F7] transition-colors cursor-pointer"
            >
              How It Works
            </button>
            <button
              type="button"
              onClick={() => onNavigatePublic?.('architecture')}
              className="hover:text-[#F4F5F7] transition-colors cursor-pointer"
            >
              Architecture
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
