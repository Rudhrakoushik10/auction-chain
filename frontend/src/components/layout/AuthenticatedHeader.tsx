import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  LogOut,
  ChevronDown,
  RefreshCw,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react';
import { useWallet } from '../../context/WalletContext';
import { shortenAddress } from '../../lib/crypto';
import { WalletAccount, OnChainEventRecord } from '../../types/auction';

interface AuthenticatedHeaderProps {
  onLogoClick?: () => void;
  events?: OnChainEventRecord[];
}

export const AuthenticatedHeader: React.FC<AuthenticatedHeaderProps> = ({
  onLogoClick,
  events = [],
}) => {
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

  return (
    <header className="sticky top-0 z-40 w-full bg-[#090D1A]/95 backdrop-blur-sm text-white border-b border-[#1E293B]">
      {!isCorrectNetwork && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>
              Network Mismatch: Connected to Chain ID {chainId}. AuctionChain requires Hardhat Network (Chain ID 31337).
            </span>
          </div>
          <button
            onClick={switchNetworkToHardhat}
            className="px-3 py-1 rounded bg-slate-950 text-white hover:bg-slate-800 transition-colors font-mono text-[11px] whitespace-nowrap shrink-0 cursor-pointer"
          >
            Switch to 31337
          </button>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark + Contextual Breadcrumb */}
        <div className="flex items-center gap-3 whitespace-nowrap shrink-0">
          <button
            type="button"
            onClick={onLogoClick}
            className="text-lg font-bold tracking-tight text-white hover:text-slate-200 transition-colors cursor-pointer"
          >
            AuctionChain
          </button>
          <span className="text-slate-600" aria-hidden="true">/</span>
          <span className="text-xs font-medium text-slate-400">
            {wallet.roleTitle} Workspace
          </span>
        </div>

        {/* Zone 2: Quiet Unboxed Session Context */}
        <div className="hidden md:flex items-center gap-2 text-xs text-slate-400 font-mono tabular-nums">
          <span>Hardhat #31337</span>
          <span aria-hidden="true">·</span>
          <span>{wallet.label}</span>
          <span aria-hidden="true">·</span>
          <span className="text-slate-200 font-semibold">{wallet.balanceEth.toFixed(2)} ETH</span>
        </div>

        {/* Zone 3: Account Switcher & Notifications */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Notifications Drawer */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => setIsNotificationsOpen((prev) => !prev)}
              className="p-2 rounded-lg bg-[#0F172A] hover:bg-[#1E293B] border border-[#1E293B] text-slate-300 hover:text-white transition-colors relative cursor-pointer"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
            </button>

            {isNotificationsOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 rounded-xl bg-[#0F172A] border border-[#1E293B] shadow-2xl text-white z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-[#1E293B] flex items-center justify-between text-xs">
                  <span className="font-semibold text-white">On-Chain Activity</span>
                  <span className="font-mono text-slate-400 tabular-nums">{events.length} events</span>
                </div>
                {events.length === 0 ? (
                  <div className="p-4 text-xs text-slate-400">
                    No on-chain events recorded in this session yet.
                  </div>
                ) : (
                  <div className="divide-y divide-[#1E293B] max-h-72 overflow-y-auto">
                    {events.slice(-6).reverse().map((ev) => (
                      <div
                        key={ev.id}
                        className="p-3.5 text-xs space-y-1 hover:bg-[#131E3A] transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono font-semibold text-white">{ev.eventName}</span>
                          <span className="text-[11px] font-mono text-slate-500 tabular-nums">#{ev.blockNumber}</span>
                        </div>
                        <p className="text-slate-400 text-xs leading-relaxed">{ev.summary}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Role & Wallet Switcher Button */}
          <div className="relative" ref={switcherRef}>
            <button
              type="button"
              onClick={() => setIsSwitcherOpen((prev) => !prev)}
              className="flex items-center gap-2.5 px-3.5 py-2 rounded-lg bg-[#0F172A] hover:bg-[#1E293B] border border-[#1E293B] text-xs font-medium text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span className="font-mono tabular-nums">{shortenAddress(wallet.address)}</span>
              <span className="text-slate-500" aria-hidden="true">·</span>
              <span className="text-slate-300">{wallet.roleTitle}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {isSwitcherOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 rounded-xl bg-[#0F172A] border border-[#1E293B] shadow-2xl text-white z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-[#1E293B]">
                  <div className="text-xs font-semibold text-white">Switch Hardhat Account</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Select a preconfigured role or switch via MetaMask
                  </div>
                </div>

                <div className="divide-y divide-[#1E293B] max-h-72 overflow-y-auto">
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
                        className={`w-full text-left px-4 py-3 flex items-center justify-between transition-colors cursor-pointer ${
                          isActive ? 'bg-[#131E3A]' : 'hover:bg-[#131E3A]/60'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="text-xs font-semibold text-white">
                            {acct.label} <span className="text-slate-400 font-normal">· {acct.roleTitle}</span>
                          </div>
                          <div className="text-[11px] font-mono text-slate-400 tabular-nums">
                            {shortenAddress(acct.address)} · {acct.balanceEth.toFixed(1)} ETH
                          </div>
                        </div>
                        {isActive && <CheckCircle2 className="w-4 h-4 text-[#2563EB] shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                <div className="p-3 bg-[#090D1A] border-t border-[#1E293B] space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      requestAccountSwitchInMetaMask();
                      setIsSwitcherOpen(false);
                    }}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-white bg-[#131E3A] hover:bg-[#1E293B] border border-[#1E293B] transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Switch Account in MetaMask</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      disconnectWallet();
                      setIsSwitcherOpen(false);
                    }}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Disconnect Wallet</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
