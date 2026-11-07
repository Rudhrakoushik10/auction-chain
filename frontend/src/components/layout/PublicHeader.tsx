import React from 'react';
import { useWallet } from '../../context/WalletContext';

export type PublicNavTab =
  | 'home'
  | 'explore'
  | 'how-it-works'
  | 'ai-estimator'
  | 'security'
  | 'about';

interface PublicHeaderProps {
  activeTab: PublicNavTab;
  setActiveTab: (tab: PublicNavTab) => void;
  onOpenDashboard?: () => void;
}

export const PublicHeader: React.FC<PublicHeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenDashboard,
}) => {
  const { isConnected, wallet, openAuthModal } = useWallet();

  const navItems: { id: PublicNavTab; label: string }[] = [
    { id: 'home', label: 'Home' },
    { id: 'explore', label: 'Explore Auctions' },
    { id: 'how-it-works', label: 'How It Works' },
    { id: 'ai-estimator', label: 'AI Price Estimator' },
    { id: 'security', label: 'Security & Transparency' },
    { id: 'about', label: 'About Us' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-[#090D1A]/95 backdrop-blur-sm border-b border-[#1E293B]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
        {/* Zone 1: Single-line Brand Wordmark */}
        <button
          type="button"
          onClick={() => setActiveTab('home')}
          className="text-lg font-bold tracking-tight text-white hover:text-slate-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] rounded"
        >
          AuctionChain
        </button>

        {/* Zone 2: Clean single-line typography navigation links */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`py-5 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive
                    ? 'border-[#2563EB] text-white font-semibold'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Single Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          {isConnected && wallet && onOpenDashboard ? (
            <button
              type="button"
              onClick={onOpenDashboard}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-[#2563EB] hover:bg-blue-600 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {wallet.roleTitle} Dashboard
            </button>
          ) : (
            <button
              type="button"
              onClick={openAuthModal}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-[#2563EB] hover:bg-blue-600 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Connect Wallet
            </button>
          )}
        </div>
      </div>

      {/* Mobile / Tablet Navigation Bar */}
      <div className="lg:hidden flex items-center gap-5 overflow-x-auto px-4 py-2.5 bg-[#090D1A] border-t border-[#1E293B]">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                isActive
                  ? 'text-white font-semibold underline underline-offset-4 decoration-[#2563EB]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </header>
  );
};
