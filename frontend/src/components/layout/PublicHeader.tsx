import React from 'react';
import {
  Gavel,
  BookOpen,
  Calculator,
  ShieldCheck,
  Info,
  Wallet,
  Home,
} from 'lucide-react';
import { useWallet } from '../../context/WalletContext';
import enhancedLogoUrl from '../../assets/images/auctionchain_logo.jpg';

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

export const PublicHeader: React.FC<PublicHeaderProps> = ({ activeTab, setActiveTab }) => {
  const { openAuthModal } = useWallet();

  const navItems: { id: PublicNavTab; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: 'Home', icon: <Home className="w-4 h-4" /> },
    { id: 'explore', label: 'Explore Auctions', icon: <Gavel className="w-4 h-4" /> },
    { id: 'how-it-works', label: 'How It Works', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'ai-estimator', label: 'AI Price Estimator', icon: <Calculator className="w-4 h-4" /> },
    { id: 'security', label: 'Security & Transparency', icon: <ShieldCheck className="w-4 h-4" /> },
    { id: 'about', label: 'About Us', icon: <Info className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-[#090D1A] text-white border-b border-[#1E293B] shadow-[0_4px_25px_rgba(0,0,0,0.5)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        {/* Left: Brand Logo & Name */}
        <button
          type="button"
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-3.5 text-left group focus:outline-none cursor-pointer shrink-0"
        >
          <div className="relative h-13 w-13 rounded-2xl bg-[#0F172A] p-1 shadow-[0_0_25px_rgba(6,182,212,0.45)] ring-2 ring-[#06B6D4] border border-[#2563EB]/40 flex items-center justify-center overflow-hidden transition-all duration-300 group-hover:scale-105 group-hover:shadow-[0_0_35px_rgba(6,182,212,0.7)] group-hover:ring-[#38BDF8]">
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
            <div className="flex items-center gap-2">
              <span className="text-xl font-extrabold tracking-tight text-white">
                Auction<span className="text-[#06B6D4]">Chain</span>
              </span>
            </div>
            <p className="text-[11px] font-mono tracking-widest uppercase text-[#06B6D4]">
              Predict · Bid · Verify
            </p>
          </div>
        </button>

        {/* Center: Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 bg-white/5 p-1.5 rounded-xl border border-white/10">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#2563EB] text-white shadow-sm'
                    : 'text-[#E2E8F0] hover:text-white hover:bg-white/10'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right: Connect Wallet Button (Strictly No Login / Register / Sign Up) */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={openAuthModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#2563EB] hover:bg-blue-600 transition-all shadow-md shadow-[#2563EB]/30 cursor-pointer"
          >
            <Wallet className="w-4 h-4" />
            <span>Connect Wallet</span>
          </button>
        </div>
      </div>

      {/* Mobile Center Navigation */}
      <div className="lg:hidden flex items-center gap-1 overflow-x-auto px-4 py-2 bg-[#101B3D]/95 border-t border-white/10">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer ${
                isActive ? 'bg-[#2563EB] text-white' : 'text-slate-300 hover:bg-white/10'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
