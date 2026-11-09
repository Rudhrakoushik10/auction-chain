import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  ChevronDown,
  LogOut,
  Check,
  Repeat,
  ArrowUpRight,
} from 'lucide-react';
import { OnChainEventRecord } from '../../types/auction';
import { useWallet } from '../../context/WalletContext';
import { shortenAddress, formatInr, formatEthToInr } from '../../lib/crypto';
import { Logo } from '../common/Logo';

interface AuthenticatedHeaderProps {
  events: OnChainEventRecord[];
  onLogoClick: () => void;
}

export const AuthenticatedHeader: React.FC<AuthenticatedHeaderProps> = ({
  events,
  onLogoClick,
}) => {
  const {
    wallet,
    humanWallets,
    liveEthInrRate,
    selectRoleDirect,
    openAuthModal,
    disconnectWallet,
    inspectTransaction,
  } = useWallet();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!wallet) return null;

  const roleTitle = {
    guest: 'Guest Session',
    seller: 'Seller Workspace',
    bidder: 'Bidder Workspace',
    admin: 'Admin Workspace',
    oracle: 'Price Feed Service',
  }[wallet.role];

  const recentEvents = [...events].reverse().slice(0, 6);

  return (
    <header className="sticky top-0 z-40 h-20 bg-[#0B0C10]/95 backdrop-blur-md border-b border-[#232730]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between gap-6">
        {/* Brand Identity & Workspace Context */}
        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={onLogoClick}
            className="flex items-center gap-3 text-left focus:outline-none cursor-pointer"
          >
            <Logo size="sm" subtitle={roleTitle} />
          </button>
        </div>

        {/* Live Exchange Rate, Activity & Account Switcher */}
        <div className="flex items-center gap-5">
          <div className="hidden lg:flex items-center gap-3 text-xs font-mono text-[#8E95A5]">
            <span>
              1 ETH ={' '}
              <strong className="text-[#F4F5F7] font-medium tabular-nums">
                {formatInr(liveEthInrRate)}
              </strong>
            </span>
            <span className="text-[#232730]">·</span>
            <span className="text-[#C5A46D]">
              {wallet.roleTitle}
            </span>
            <span className="text-[#232730]">·</span>
            <span className="text-[#F4F5F7] tabular-nums">
              {wallet.balanceEth.toFixed(2)} ETH ({formatEthToInr(wallet.balanceEth)})
            </span>
          </div>

          {/* Activity Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => setNotifOpen((prev) => !prev)}
              className="relative p-2.5 rounded-md bg-[#12141A] border border-[#232730] text-[#8E95A5] hover:text-[#F4F5F7] hover:border-[#363C4A] transition-colors cursor-pointer"
              title="Recent Activity"
            >
              <Bell className="w-4 h-4" />
              {recentEvents.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#C5A46D]" />
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-[#12141A] border border-[#232730] rounded-md shadow-2xl overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-[#232730] flex items-center justify-between bg-[#0B0C10]/60">
                  <span className="text-xs font-medium text-[#F4F5F7]">
                    Recent Activity
                  </span>
                  <span className="text-xs font-mono text-[#C5A46D]">
                    {recentEvents.length} Updates
                  </span>
                </div>
                <div className="divide-y divide-[#232730] max-h-72 overflow-y-auto">
                  {recentEvents.length === 0 ? (
                    <div className="px-4 py-6 text-center text-xs text-[#646C7E]">
                      No activity recorded in this session yet.
                    </div>
                  ) : (
                    recentEvents.map((ev) => (
                      <button
                        key={ev.id}
                        type="button"
                        onClick={() => {
                          setNotifOpen(false);
                          inspectTransaction(ev.txHash);
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-[#171A22] transition-colors flex items-start justify-between gap-3 cursor-pointer"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-mono font-medium text-[#C5A46D]">
                              {ev.eventName}
                            </span>
                            <span className="text-[10px] font-mono text-[#646C7E]">
                              #{ev.blockNumber}
                            </span>
                          </div>
                          <p className="text-xs text-[#F4F5F7] mt-0.5 line-clamp-2">
                            {ev.summary}
                          </p>
                        </div>
                        <ArrowUpRight className="w-3.5 h-3.5 text-[#8E95A5] shrink-0 mt-0.5" />
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Account Switcher */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen((prev) => !prev)}
              className="flex items-center gap-2.5 bg-[#12141A] hover:bg-[#171A22] border border-[#232730] hover:border-[#363C4A] px-3.5 py-2 rounded-md transition-colors text-xs cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full bg-[#C5A46D]" />
              <span className="font-medium text-[#F4F5F7]">
                {wallet.roleTitle}
              </span>
              <span className="font-mono text-[#8E95A5] hidden sm:inline">
                {shortenAddress(wallet.address)}
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-[#8E95A5] transition-transform ${
                  dropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-[#12141A] border border-[#232730] rounded-md shadow-2xl overflow-hidden z-50">
                <div className="px-4 py-3.5 border-b border-[#232730] bg-[#0B0C10]/60">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#8E95A5]">
                      Signed In Account
                    </span>
                    <span className="text-xs font-medium text-[#C5A46D]">
                      {wallet.roleTitle}
                    </span>
                  </div>
                  <p className="text-xs font-mono text-[#F4F5F7] mt-1 break-all">
                    {wallet.address}
                  </p>
                  <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-[#232730] text-xs font-mono">
                    <span className="text-[#8E95A5]">Wallet Balance</span>
                    <span className="text-[#F4F5F7] tabular-nums">
                      {wallet.balanceEth.toFixed(2)} ETH ({formatEthToInr(wallet.balanceEth)})
                    </span>
                  </div>
                </div>

                <div className="p-2 border-b border-[#232730]">
                  <div className="px-2.5 py-1.5 flex items-center justify-between text-xs text-[#8E95A5]">
                    <span className="flex items-center gap-1.5">
                      <Repeat className="w-3 h-3 text-[#C5A46D]" />
                      Switch Role Account (1-Click)
                    </span>
                  </div>
                  <div className="space-y-1 mt-1">
                    {humanWallets.map((acc) => {
                      const isCurrent =
                        acc.address.toLowerCase() === wallet.address.toLowerCase();
                      return (
                        <button
                          key={acc.address}
                          type="button"
                          onClick={() => {
                            selectRoleDirect(acc);
                            setDropdownOpen(false);
                          }}
                          className={`w-full text-left px-2.5 py-2 rounded flex items-center justify-between text-xs transition-colors cursor-pointer ${
                            isCurrent
                              ? 'bg-[#171A22] text-[#F4F5F7] border border-[#C5A46D]/40'
                              : 'text-[#8E95A5] hover:bg-[#171A22] hover:text-[#F4F5F7]'
                          }`}
                        >
                          <div>
                            <div className="font-medium text-[#F4F5F7] flex items-center gap-1.5">
                              <span>{acc.roleTitle}</span>
                              <span className="text-[11px] font-mono text-[#8E95A5]">
                                ({acc.label})
                              </span>
                            </div>
                            <div className="font-mono text-[11px] text-[#8E95A5] tabular-nums">
                              {shortenAddress(acc.address)} · {acc.balanceEth.toFixed(2)} ETH
                            </div>
                          </div>
                          {isCurrent && <Check className="w-3.5 h-3.5 text-[#C5A46D]" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="p-2 space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      setDropdownOpen(false);
                      openAuthModal();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded text-xs font-medium text-[#F4F5F7] hover:bg-[#171A22] transition-colors cursor-pointer"
                  >
                    <Repeat className="w-3.5 h-3.5 text-[#C5A46D]" />
                    <span>Wallet & Connection Settings</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDropdownOpen(false);
                      disconnectWallet();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded text-xs font-medium text-[#C94A4A] hover:bg-[#C94A4A]/10 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
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
