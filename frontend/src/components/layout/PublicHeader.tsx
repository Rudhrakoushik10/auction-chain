import React from 'react';
import { Wallet } from 'lucide-react';
import { useWallet } from '../../context/WalletContext';
import { Logo } from '../common/Logo';

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
}

export const PublicHeader: React.FC<PublicHeaderProps> = ({
  activeTab,
  setActiveTab,
}) => {
  const { openAuthModal } = useWallet();

  const navItems: { id: PublicNavTab; label: string }[] = [
    { id: 'home', label: 'Overview' },
    { id: 'explore', label: 'Live Auctions' },
    { id: 'how-it-works', label: 'How It Works' },
    { id: 'ai-estimator', label: 'AI Valuation' },
    { id: 'security', label: 'Security & Audit' },
    { id: 'about', label: 'Institution' },
  ];

  return (
    <header className="sticky top-0 z-40 h-20 bg-[#0B0C10]/95 backdrop-blur-md border-b border-[#232730]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between gap-6">
        {/* Zone 1: Brand Identity */}
        <button
          type="button"
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-3 text-left group focus:outline-none shrink-0 cursor-pointer"
        >
          <Logo size="md" subtitle="Automotive Sealed-Bid Exchange" />
        </button>

        {/* Zone 2: Primary Editorial Navigation */}
        <nav className="hidden lg:flex items-center gap-7">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`relative py-2 text-sm font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  isActive
                    ? 'text-[#F4F5F7]'
                    : 'text-[#8E95A5] hover:text-[#F4F5F7]'
                }`}
              >
                {item.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#C5A46D]" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Single Restrained Champagne-Gold Action */}
        <div className="flex items-center gap-4 shrink-0">
          <button
            type="button"
            onClick={openAuthModal}
            className="flex items-center gap-2.5 bg-[#C5A46D] hover:bg-[#D4B57E] text-[#0B0C10] px-5 py-2.5 rounded-md text-xs font-semibold uppercase tracking-[0.12em] transition-colors cursor-pointer"
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>Connect Wallet</span>
          </button>
        </div>
      </div>
    </header>
  );
};
