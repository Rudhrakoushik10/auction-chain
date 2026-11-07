import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  LogOut,
  ChevronDown,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { useWallet } from '../../context/WalletContext';
import enhancedLogoUrl from '../../assets/images/auctionchain_logo.jpg';
import { shortenAddress } from '../../lib/crypto';
import { WalletAccount } from '../../types/auction';

interface AuthenticatedHeaderProps {
  onLogoClick?: () => void;
}

export const AuthenticatedHeader: React.FC<AuthenticatedHeaderProps> = ({ onLogoClick }) => {
  const {
    wallet,
    humanWallets,
    chainId,
    isCorrectNetwork,
    disconnectWallet,
    selectRoleDirect,
    switchNetworkToHardhat,
    requestAccountSwitchInMetaMask,
  } = useWallet();

  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const switcherRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (switcherRef.current && !switcherRef.current.contains(e.target as Node)) {
        setIsSwitcherOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  if (!wallet) return null;

  const mockNotifications = [
    {
      id: 'notif-1',
      title: 'Oracle Valuation Registered',
      desc: 'Vehicle-v1 registered on PriceOracle.sol with 91.8% R² confidence.',
      time: '12m ago',
      read: false,
    },
    {
      id: 'notif-2',
      title: 'Sealed Bidding Window Active',
      desc: '2024 BMW iX1 commitment phase ongoing. Commit before window closes.',
      time: '34m ago',
      read: false,
    },
    {
      id: 'notif-3',
      title: 'Hardhat Local Node Synced',
      desc: 'Connected to RPC http://127.0.0.1:8545 (Chain ID 31337).',
      time: '1h ago',
      read: true,
    },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-[#101B3D] text-white border-b border-white/10 shadow-lg">
      {/* Network Warning Banner if disconnected or wrong chain */}
      {!isCorrectNetwork && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>
              Network Mismatch Detected: Connected to Chain ID {chainId}. AuctionChain requires Local Hardhat Network (Chain ID 31337).
            </span>
          </div>
          <button
            onClick={switchNetworkToHardhat}
            className="px-3 py-1 rounded bg-slate-950 text-white hover:bg-slate-800 transition-colors font-mono text-[11px] cursor-pointer"
          >
            Switch to Hardhat (31337)
          </button>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <button
          type="button"
          onClick={onLogoClick}
          className="flex items-center gap-3 text-left group focus:outline-none cursor-pointer shrink-0"
        >
          <div className="relative h-12 w-12 rounded-xl bg-[#0F172A] p-1 shadow-[0_0_20px_rgba(6,182,212,0.45)] ring-2 ring-[#06B6D4] border border-[#2563EB]/40 flex items-center justify-center overflow-hidden transition-all duration-300 group-hover:scale-105 group-hover:shadow-[0_0_28px_rgba(6,182,212,0.65)]">
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
              <span className="text-lg font-extrabold tracking-tight text-white">
                Auction<span className="text-[#06B6D4]">Chain</span>
              </span>
              {/* Role Badge in Header */}
              <span
                className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded text-white shadow-sm"
                style={{ backgroundColor: wallet.badgeColor }}
              >
                {wallet.roleTitle}
              </span>
            </div>
            <p className="text-[10px] font-mono tracking-widest uppercase text-[#06B6D4]">
              {wallet.label}
            </p>
          </div>
        </button>

        {/* Global Authenticated Controls */}
        <div className="flex items-center gap-3">
          {/* Network Indicator (Hardhat Local, Chain ID 31337) */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-[#E2E8F0]">
            <span className="w-2 h-2 rounded-full bg-[#06B6D4] animate-pulse" />
            <span className="text-slate-300">Hardhat Local</span>
            <span className="text-[#06B6D4]">#31337</span>
          </div>

          {/* Notifications Drawer */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => setIsNotificationsOpen((prev) => !prev)}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-colors relative cursor-pointer"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#2563EB]" />
            </button>

            {isNotificationsOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl bg-white border border-[#E2E8F0] shadow-2xl text-[#101B3D] z-50 overflow-hidden animate-in fade-in">
                <div className="p-3.5 bg-[#101B3D] text-white flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#06B6D4]">
                    Notifications
                  </span>
                  <span className="text-[11px] font-mono text-slate-300">2 unread</span>
                </div>
                <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                  {mockNotifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-3 text-xs space-y-1 hover:bg-slate-50 transition-colors ${
                        !n.read ? 'bg-blue-50/50' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#101B3D]">{n.title}</span>
                        <span className="text-[10px] text-slate-400">{n.time}</span>
                      </div>
                      <p className="text-slate-600 text-[11px] leading-relaxed">{n.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Role & Wallet Switcher Button */}
          <div className="relative" ref={switcherRef}>
            <button
              type="button"
              onClick={() => setIsSwitcherOpen((prev) => !prev)}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white transition-all cursor-pointer"
            >
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: wallet.badgeColor }} />
              <div className="text-left">
                <div className="text-xs font-bold leading-none">{shortenAddress(wallet.address)}</div>
                <div className="text-[10px] font-mono text-[#06B6D4] mt-0.5">
                  {wallet.balanceEth.toFixed(2)} ETH
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-300" />
            </button>

            {/* Role & Wallet Popover */}
            {isSwitcherOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl bg-white border border-[#E2E8F0] shadow-2xl text-[#101B3D] z-50 overflow-hidden animate-in fade-in">
                <div className="p-3.5 bg-[#101B3D] text-white">
                  <div className="text-xs font-bold uppercase tracking-wider text-[#06B6D4]">
                    Switch Hardhat Role
                  </div>
                  <div className="text-[11px] text-slate-300 mt-0.5">
                    Select any of the 4 human accounts or switch in MetaMask
                  </div>
                </div>

                <div className="p-2 space-y-1 max-h-72 overflow-y-auto divide-y divide-slate-100">
                  {humanWallets.map((acct: WalletAccount) => {
                    const isActive = acct.address.toLowerCase() === wallet.address.toLowerCase();
                    return (
                      <button
                        key={acct.address}
                        type="button"
                        onClick={() => {
                          selectRoleDirect(acct);
                          setIsSwitcherOpen(false);
                        }}
                        className={`w-full text-left p-2.5 rounded-xl flex items-center justify-between transition-colors cursor-pointer ${
                          isActive ? 'bg-blue-50/90' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#101B3D]">
                              {acct.label}
                            </span>
                            <span
                              className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded text-white"
                              style={{ backgroundColor: acct.badgeColor }}
                            >
                              {acct.roleTitle}
                            </span>
                          </div>
                          <div className="text-[11px] font-mono text-slate-500">
                            {shortenAddress(acct.address)} · {acct.balanceEth.toFixed(1)} ETH
                          </div>
                        </div>
                        {isActive && <CheckCircle2 className="w-4 h-4 text-[#2563EB]" />}
                      </button>
                    );
                  })}
                </div>

                {/* MetaMask Account Chooser Trigger */}
                <div className="p-2.5 bg-slate-50 border-t border-slate-200 space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      requestAccountSwitchInMetaMask();
                      setIsSwitcherOpen(false);
                    }}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-[#2563EB] bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Trigger MetaMask Switcher</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      disconnectWallet();
                      setIsSwitcherOpen(false);
                    }}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Disconnect Wallet</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Disconnect Button */}
          <button
            type="button"
            onClick={disconnectWallet}
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Disconnect wallet and return to Public Landing Page"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Disconnect</span>
          </button>
        </div>
      </div>
    </header>
  );
};
