import React from 'react';
import { useWallet } from '../../context/WalletContext';
import {
  PRICE_ORACLE_CONTRACT_ADDRESS,
  SEALED_AUCTION_CONTRACT_ADDRESS,
} from '../../lib/hardhatConfig';
import { shortenAddress } from '../../lib/crypto';

interface FooterProps {
  onNavigatePublic: (tab: 'home' | 'explore' | 'how-it-works' | 'ai-estimator' | 'security' | 'about') => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigatePublic }) => {
  const { isConnected, openAuthModal } = useWallet();

  return (
    <footer className="bg-[#090D1A] text-slate-400 border-t border-[#1E293B] mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        <div className="space-y-1.5">
          <button
            type="button"
            onClick={() => onNavigatePublic('home')}
            className="text-base font-bold text-white hover:text-slate-200 transition-colors cursor-pointer"
          >
            AuctionChain
          </button>
          <p className="text-xs text-slate-400 max-w-md leading-relaxed">
            Sealed-bid vehicle auction protocol on Hardhat Local (Chain ID 31337). Keccak-256 commit-reveal smart contracts with on-chain PriceOracle.sol verification.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-6 text-xs font-medium text-slate-400">
          <button
            type="button"
            onClick={() => onNavigatePublic('home')}
            className="hover:text-white transition-colors cursor-pointer whitespace-nowrap"
          >
            Home
          </button>
          <button
            type="button"
            onClick={() => onNavigatePublic('explore')}
            className="hover:text-white transition-colors cursor-pointer whitespace-nowrap"
          >
            Auctions
          </button>
          <button
            type="button"
            onClick={() => onNavigatePublic('how-it-works')}
            className="hover:text-white transition-colors cursor-pointer whitespace-nowrap"
          >
            Architecture
          </button>
          <button
            type="button"
            onClick={() => onNavigatePublic('ai-estimator')}
            className="hover:text-white transition-colors cursor-pointer whitespace-nowrap"
          >
            Valuation
          </button>
          <button
            type="button"
            onClick={() => onNavigatePublic('security')}
            className="hover:text-white transition-colors cursor-pointer whitespace-nowrap"
          >
            Security
          </button>
          <button
            type="button"
            onClick={() => onNavigatePublic('about')}
            className="hover:text-white transition-colors cursor-pointer whitespace-nowrap"
          >
            About
          </button>

          {!isConnected && (
            <button
              type="button"
              onClick={openAuthModal}
              className="text-white font-semibold hover:underline cursor-pointer whitespace-nowrap"
            >
              Connect Wallet
            </button>
          )}
        </div>

        <div className="text-xs font-mono text-slate-500 tabular-nums">
          <span>Hardhat #31337</span>
          <span className="mx-2" aria-hidden="true">·</span>
          <span>Auction: {shortenAddress(SEALED_AUCTION_CONTRACT_ADDRESS)}</span>
          <span className="mx-2" aria-hidden="true">·</span>
          <span>Oracle: {shortenAddress(PRICE_ORACLE_CONTRACT_ADDRESS)}</span>
        </div>
      </div>
    </footer>
  );
};
