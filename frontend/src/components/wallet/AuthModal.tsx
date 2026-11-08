import React, { useState } from 'react';
import {
  X,
  Wallet,
  ShieldCheck,
  AlertTriangle,
  Copy,
  Check,
  RefreshCw,
  ArrowRight,
  Cpu,
  KeyRound,
  CheckCircle2,
} from 'lucide-react';
import { useWallet } from '../../context/WalletContext';
import {
  HARDHAT_CHAIN_ID,
  HARDHAT_NETWORK_NAME,
  HARDHAT_RPC_URL,
  ORACLE_BACKGROUND_ACCOUNT,
} from '../../lib/hardhatConfig';
import { Logo } from '../common/Logo';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    closeAuthModal,
    humanWallets,
    wallet,
    isConnected,
    chainId,
    isCorrectNetwork,
    isNodeOnline,
    latestBlock,
    isMetaMaskAvailable,
    errorMessage,
    isConnecting,
    connectMetaMask,
    selectRoleDirect,
    switchNetworkToHardhat,
    refreshHardhatNode,
  } = useWallet();

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showSignerDetails, setShowSignerDetails] = useState<boolean>(false);

  if (!isAuthModalOpen) return null;

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-xl bg-[#12141A] border border-[#232730] rounded-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-[#232730] bg-[#0B0C10]">
          <div className="flex items-center gap-3">
            <Logo size="sm" showText={false} />
            <div>
              <h2 className="text-base font-display font-semibold text-[#F4F5F7]">
                Connect Wallet &amp; Select Role
              </h2>
              <p className="text-xs text-[#8E95A5]">
                Hardhat Localhost (Chain ID {HARDHAT_CHAIN_ID})
              </p>
            </div>
          </div>
          <button
            onClick={closeAuthModal}
            className="p-1.5 rounded-md text-[#8E95A5] hover:text-[#F4F5F7] hover:bg-[#171A22] transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Node Status Indicator */}
          <div className="flex items-center justify-between p-3 rounded-md bg-[#0B0C10] border border-[#232730] text-xs">
            <div className="flex items-center gap-2.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  isNodeOnline ? 'bg-[#2E9B68]' : 'bg-[#D49B38]'
                }`}
              />
              <span className="text-[#F4F5F7] font-medium">
                {isNodeOnline ? HARDHAT_NETWORK_NAME : 'Hardhat Node Offline'}
              </span>
              <span className="font-mono text-[11px] text-[#8E95A5]">
                {HARDHAT_RPC_URL}
              </span>
            </div>
            <button
              type="button"
              onClick={() => refreshHardhatNode()}
              className="text-[#8E95A5] hover:text-[#F4F5F7] flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Refresh connection"
            >
              <RefreshCw className="w-3 h-3 text-[#C5A46D]" />
              <span>Refresh</span>
            </button>
          </div>

          {/* Network Mismatch Warning */}
          {isNodeOnline && !isCorrectNetwork && (
            <div className="p-3.5 rounded-md bg-[#D49B38]/10 border border-[#D49B38]/40 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-[#D49B38]">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>MetaMask is on Chain {chainId}. Switch to Hardhat ({HARDHAT_CHAIN_ID}).</span>
              </div>
              <button
                type="button"
                onClick={switchNetworkToHardhat}
                className="px-3 py-1.5 rounded bg-[#D49B38] hover:bg-[#D49B38]/90 text-[#0B0C10] font-semibold shrink-0 cursor-pointer"
              >
                Switch Network
              </button>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3.5 rounded-md bg-[#C94A4A]/10 border border-[#C94A4A]/30 flex items-start gap-2.5 text-xs text-[#F4F5F7]">
              <AlertTriangle className="w-4 h-4 text-[#C94A4A] shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Connect MetaMask Primary Button */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={connectMetaMask}
              disabled={isConnecting}
              className="w-full py-2.5 px-4 rounded-md bg-[#C5A46D] hover:bg-[#D4B57E] disabled:opacity-50 text-[#0B0C10] font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Wallet className="w-4 h-4" />
              <span>{isConnecting ? 'Connecting MetaMask...' : 'Connect MetaMask Wallet'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <p className="text-[11px] text-[#8E95A5] text-center">
              Requests your active account in MetaMask and synchronizes it with the local Hardhat chain.
            </p>
          </div>

          {/* Account Role Selector */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between border-b border-[#232730] pb-2">
              <span className="text-xs font-mono uppercase tracking-wider text-[#C5A46D]">
                Platform Accounts &amp; Roles
              </span>
              <button
                type="button"
                onClick={() => setShowSignerDetails(!showSignerDetails)}
                className="text-[11px] font-mono text-[#8E95A5] hover:text-[#F4F5F7] flex items-center gap-1 cursor-pointer"
              >
                <KeyRound className="w-3 h-3 text-[#C5A46D]" />
                <span>{showSignerDetails ? 'Hide Addresses' : 'Show Addresses'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {humanWallets.map((acc) => {
                const isSelected =
                  isConnected &&
                  wallet?.address.toLowerCase() === acc.address.toLowerCase();

                return (
                  <div
                    key={acc.address}
                    className={`p-3 rounded-md border transition-colors ${
                      isSelected
                        ? 'bg-[#171A22] border-[#C5A46D]'
                        : 'bg-[#0B0C10] border-[#232730] hover:border-[#363C4A]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-[#F4F5F7]">
                            {acc.label}
                          </span>
                          <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-[#12141A] text-[#C5A46D] border border-[#232730]">
                            {acc.roleTitle}
                          </span>
                        </div>
                        {showSignerDetails ? (
                          <div className="text-[11px] font-mono text-[#8E95A5] flex items-center gap-1.5 truncate">
                            <span className="truncate">{acc.address}</span>
                            <button
                              type="button"
                              onClick={() => copyText(acc.address, `addr-${acc.accountIndex}`)}
                              className="text-[#646C7E] hover:text-[#F4F5F7] shrink-0"
                              title="Copy Address"
                            >
                              {copiedKey === `addr-${acc.accountIndex}` ? (
                                <Check className="w-3 h-3 text-[#2E9B68]" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <p className="text-[11px] text-[#8E95A5] truncate">
                            {acc.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        <span className="text-xs font-mono font-semibold text-[#F4F5F7] tabular-nums">
                          {acc.balanceEth.toFixed(1)} ETH
                        </span>
                        <button
                          type="button"
                          onClick={() => selectRoleDirect(acc)}
                          className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-[#2E9B68]/20 text-[#2E9B68] border border-[#2E9B68]/40'
                              : 'bg-[#171A22] hover:bg-[#232730] text-[#F4F5F7] border border-[#232730] hover:border-[#C5A46D]'
                          }`}
                        >
                          {isSelected ? (
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Active
                            </span>
                          ) : (
                            'Switch'
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Autonomous Oracle Dedicated Card */}
          <div className="p-3.5 rounded-md bg-[#0B0C10] border border-[#232730] space-y-2 text-xs">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-[#059669] shrink-0" />
                <span className="font-semibold text-[#F4F5F7]">
                  Account 4 — Price Oracle (Background Daemon)
                </span>
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-[#059669]/15 text-[#059669] border border-[#059669]/30">
                  Autonomous Service
                </span>
              </div>
              <span className="text-xs font-mono font-semibold text-[#F4F5F7] tabular-nums shrink-0">
                {ORACLE_BACKGROUND_ACCOUNT.balanceEth.toFixed(1)} ETH
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-[#1C2029]">
              <div className="flex items-center gap-2 font-mono text-[11px] text-[#A6ADB8] flex-1 min-w-0">
                <span className="text-[#8E95A5] shrink-0">Signer Address:</span>
                <span className="text-[#F4F5F7] font-mono break-all select-all">
                  {ORACLE_BACKGROUND_ACCOUNT.address}
                </span>
                <button
                  type="button"
                  onClick={() => copyText(ORACLE_BACKGROUND_ACCOUNT.address, 'oracle-addr')}
                  className="text-[#8E95A5] hover:text-[#C5A46D] transition-colors p-0.5 shrink-0"
                  title="Copy Oracle Address"
                >
                  {copiedKey === 'oracle-addr' ? (
                    <Check className="w-3.5 h-3.5 text-[#2E9B68]" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            <p className="text-[11px] text-[#8E95A5] leading-relaxed pt-0.5">
              Runs as an autonomous background oracle daemon feeding live ETH/INR exchange rates and signing AI vehicle valuation hashes directly into <code className="font-mono text-[#C5A46D]">PriceOracle.sol</code>.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-[#0B0C10] border-t border-[#232730] flex items-center justify-between text-xs text-[#646C7E]">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#2E9B68]" />
            Hardhat Localhost (Chain ID {HARDHAT_CHAIN_ID})
          </span>
          <button
            onClick={closeAuthModal}
            className="text-[#8E95A5] hover:text-[#F4F5F7] font-medium cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
