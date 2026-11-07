import React from 'react';
import { useWallet } from '../../context/WalletContext';
import {
  PRICE_ORACLE_CONTRACT_ADDRESS,
  SEALED_AUCTION_CONTRACT_ADDRESS,
} from '../../lib/mockData';
import { shortenAddress } from '../../lib/crypto';
import enhancedLogoUrl from '../../assets/images/auctionchain_logo.jpg';

interface FooterProps {
  onNavigatePublic: (tab: 'home' | 'explore' | 'how-it-works' | 'ai-estimator' | 'security' | 'about') => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigatePublic }) => {
  const { isConnected, wallet, openAuthModal } = useWallet();

  return (
    <footer className="bg-[#090D1A] text-slate-300 border-t border-[#1E293B] mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        <div className="space-y-2.5">
          <button
            type="button"
            onClick={() => onNavigatePublic('home')}
            className="flex items-center gap-3 text-left cursor-pointer group"
          >
            <div className="h-11 w-11 rounded-xl bg-[#0F172A] p-1 ring-2 ring-[#06B6D4] shadow-[0_0_15px_rgba(6,182,212,0.4)] flex items-center justify-center overflow-hidden transition-transform group-hover:scale-105">
              <img
                src={enhancedLogoUrl}
                alt="AuctionChain Logo"
                className="h-full w-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    '/public/assets/aistudio/240_F_1121784514_Q6OwYEhb7qcBUqrLWLBNtkmP8TiX12Jx_3c2efe6e.jpg';
                }}
              />
            </div>
            <div>
              <div className="text-lg font-extrabold text-white">
                Auction<span className="text-[#06B6D4]">Chain</span>
              </div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-[#06B6D4]">
                Predict · Bid · Verify
              </div>
            </div>
          </button>
          <p className="text-xs text-slate-400 max-w-md leading-relaxed">
            AI-powered sealed-bid vehicle auction protocol running on Hardhat Local (Chain ID 31337). Secured by Keccak-256 commit-reveal smart contracts and on-chain PriceOracle.sol verification.
          </p>
        </div>

        {/* Navigation Links (Section 2 Pre-login) */}
        <div className="flex flex-wrap items-center gap-5 text-xs font-semibold text-slate-300">
          <button
            type="button"
            onClick={() => onNavigatePublic('home')}
            className="hover:text-[#06B6D4] transition-colors cursor-pointer"
          >
            Home
          </button>
          <button
            type="button"
            onClick={() => onNavigatePublic('explore')}
            className="hover:text-[#06B6D4] transition-colors cursor-pointer"
          >
            Explore Auctions
          </button>
          <button
            type="button"
            onClick={() => onNavigatePublic('how-it-works')}
            className="hover:text-[#06B6D4] transition-colors cursor-pointer"
          >
            How It Works
          </button>
          <button
            type="button"
            onClick={() => onNavigatePublic('ai-estimator')}
            className="hover:text-[#06B6D4] transition-colors cursor-pointer"
          >
            AI Price Estimator
          </button>
          <button
            type="button"
            onClick={() => onNavigatePublic('security')}
            className="hover:text-[#06B6D4] transition-colors cursor-pointer"
          >
            Security & Transparency
          </button>
          <button
            type="button"
            onClick={() => onNavigatePublic('about')}
            className="hover:text-[#06B6D4] transition-colors cursor-pointer"
          >
            About Us
          </button>

          {!isConnected && (
            <button
              type="button"
              onClick={openAuthModal}
              className="text-[#06B6D4] font-bold hover:underline cursor-pointer"
            >
              Connect Wallet
            </button>
          )}
        </div>

        {/* Contract & Network Footnote */}
        <div className="text-xs font-mono text-slate-400 space-y-1">
          <div>
            Network: <span className="text-[#06B6D4]">Hardhat Local (#31337)</span>
          </div>
          <div>
            SealedAuction.sol:{' '}
            <span className="text-[#06B6D4]">{shortenAddress(SEALED_AUCTION_CONTRACT_ADDRESS)}</span>
          </div>
          <div>
            PriceOracle.sol:{' '}
            <span className="text-[#06B6D4]">{shortenAddress(PRICE_ORACLE_CONTRACT_ADDRESS)}</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
