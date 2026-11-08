import React from 'react';
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
  Zap,
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
    devBypassLogin,
    selectRoleDirect,
    switchNetworkToHardhat,
    refreshHardhatNode,
  } = useWallet();

  const [copiedKey, setCopiedKey] = React.useState<string | null>(null);
  const [showPrivateKeys, setShowPrivateKeys] = React.useState<boolean>(false);

  if (!isAuthModalOpen) return null;

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-[#12141A] border border-[#232730] rounded-md shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#232730] bg-[#0B0C10]">
          <div className="flex items-center gap-3">
            <Logo size="sm" showText={false} />
            <div>
              <h2 className="text-base font-display font-semibold text-[#F4F5F7]">
                Authenticate Signer Session
              </h2>
              <p className="text-xs text-[#8E95A5]">
                EVM Chain ID {HARDHAT_CHAIN_ID} · Role-Mapped Cryptographic Access
              </p>
            </div>
          </div>
          <button
            onClick={closeAuthModal}
            className="p-2 rounded text-[#8E95A5] hover:text-[#F4F5F7] hover:bg-[#171A22] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* 1-Click Instant Bypass Login Panel (Champagne-Gold Executive Highlight) */}
          <div className="p-4 rounded-md bg-[#171A22] border border-[#C5A46D]/35 space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-[#C5A46D]" />
                  <span className="text-xs font-mono font-semibold text-[#C5A46D] uppercase tracking-[0.12em]">
                    Instant Bypass Login · All Roles Unlocked
                  </span>
                </div>
                <p className="text-xs text-[#8E95A5] leading-relaxed">
                  Enter immediately as <strong className="text-[#F4F5F7]">Seller (Account #1)</strong> or pick any role below with 10,000 ETH test liquidity—no MetaMask popup required.
                </p>
              </div>
              <button
                type="button"
                onClick={() => devBypassLogin()}
                className="shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-[#C5A46D] hover:bg-[#D4B57E] text-[#0B0C10] text-xs font-semibold uppercase tracking-[0.1em] transition-colors cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>⚡ Bypass Login (Seller)</span>
              </button>
            </div>

            {/* Direct 1-Click Bypass Role Switcher */}
            <div className="pt-3 border-t border-[#232730] flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-mono text-[#8E95A5] mr-1">
                Quick Bypass As:
              </span>
              {humanWallets.map((acc) => {
                const isCurrent =
                  isConnected &&
                  wallet?.address.toLowerCase() === acc.address.toLowerCase();
                return (
                  <button
                    key={acc.address}
                    type="button"
                    onClick={() => devBypassLogin(acc.address)}
                    className={`px-3 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer ${
                      isCurrent
                        ? 'bg-[#C5A46D] text-[#0B0C10] font-semibold'
                        : 'bg-[#0B0C10] hover:bg-[#12141A] text-[#F4F5F7] border border-[#232730] hover:border-[#C5A46D]/50'
                    }`}
                  >
                    {acc.label} ({acc.roleTitle})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Hardhat RPC Telemetry Bar */}
          <div
            className={`p-3.5 rounded-md border flex flex-wrap items-center justify-between gap-3 ${
              isNodeOnline
                ? 'bg-[#0B0C10] border-[#232730]'
                : 'bg-[#0B0C10] border-[#D49B38]/40'
            }`}
          >
            <div className="flex items-center gap-3">
              <span
                className={`w-2 h-2 rounded-full ${
                  isNodeOnline ? 'bg-[#2E9B68]' : 'bg-[#D49B38]'
                }`}
              />
              <div>
                <div className="text-xs font-medium text-[#F4F5F7] flex items-center gap-2">
                  <span>{HARDHAT_NETWORK_NAME}</span>
                  <span className="font-mono text-[11px] text-[#8E95A5]">
                    ({HARDHAT_RPC_URL})
                  </span>
                </div>
                <p className="text-[11px] text-[#8E95A5] font-mono mt-0.5">
                  {isNodeOnline
                    ? `RPC Synchronized · Chain ID ${chainId} · Block #${latestBlock ?? 0}`
                    : 'Local Hardhat RPC not detected — Bypass Login & Role Switching active'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => refreshHardhatNode()}
              className="px-3 py-1.5 rounded bg-[#12141A] hover:bg-[#171A22] text-xs font-mono text-[#F4F5F7] border border-[#232730] flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3 text-[#C5A46D]" />
              Refresh RPC
            </button>
          </div>

          {/* Wrong Chain Warning */}
          {isNodeOnline && !isCorrectNetwork && (
            <div className="p-4 rounded-md bg-[#D49B38]/10 border border-[#D49B38]/40 flex items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-[#D49B38] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-semibold text-[#F4F5F7]">
                    Network Mismatch (Connected to Chain {chainId})
                  </h4>
                  <p className="text-xs text-[#8E95A5] mt-0.5">
                    AuctionChain contracts require Hardhat Localhost (Chain ID{' '}
                    {HARDHAT_CHAIN_ID}).
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={switchNetworkToHardhat}
                className="px-3.5 py-2 rounded bg-[#D49B38] hover:bg-[#D49B38]/90 text-[#0B0C10] text-xs font-semibold shrink-0 cursor-pointer"
              >
                Switch Network
              </button>
            </div>
          )}

          {/* Error Alert */}
          {errorMessage && (
            <div className="p-4 rounded-md bg-[#C94A4A]/10 border border-[#C94A4A]/30 flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-[#C94A4A] shrink-0 mt-0.5" />
              <div className="text-xs text-[#F4F5F7] leading-relaxed">
                {errorMessage}
              </div>
            </div>
          )}

          {/* Primary MetaMask Action */}
          <div className="p-5 rounded-md bg-[#0B0C10] border border-[#232730] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Wallet className="w-4 h-4 text-[#C5A46D]" />
                <span className="text-sm font-semibold text-[#F4F5F7]">
                  Connect with MetaMask (Web3 Provider)
                </span>
              </div>
              <span className="text-[10px] font-mono uppercase tracking-[0.12em] px-2 py-0.5 rounded bg-[#12141A] text-[#8E95A5] border border-[#232730]">
                {isMetaMaskAvailable ? 'Provider Ready' : 'Simulation Mode'}
              </span>
            </div>
            <p className="text-xs text-[#8E95A5] leading-relaxed">
              Authenticates your active EVM signer via <code className="font-mono text-[#F4F5F7]">eth_requestAccounts</code>{' '}
              and maps it to its designated platform role.
            </p>
            <button
              type="button"
              onClick={connectMetaMask}
              disabled={isConnecting}
              className="w-full py-2.5 px-4 rounded-md bg-[#171A22] hover:bg-[#1E222D] border border-[#C5A46D]/40 disabled:opacity-50 text-[#F4F5F7] font-semibold text-xs uppercase tracking-[0.12em] flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Wallet className="w-3.5 h-3.5 text-[#C5A46D]" />
              {isConnecting
                ? 'Requesting Signer Handshake...'
                : 'Connect MetaMask Wallet'}
              <ArrowRight className="w-3.5 h-3.5 text-[#C5A46D]" />
            </button>
          </div>

          {/* Role-Mapped Hardhat Signers */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-mono uppercase tracking-[0.14em] text-[#F4F5F7]">
                  Select Role-Mapped Signer Account
                </h3>
                <p className="text-[11px] text-[#8E95A5] mt-0.5">
                  Switch between Seller, Qualified Bidders, and Protocol Auditor roles at any time:
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPrivateKeys(!showPrivateKeys)}
                className="text-[11px] font-mono text-[#C5A46D] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <KeyRound className="w-3 h-3" />
                {showPrivateKeys ? 'Hide Signer Info' : 'Show Signer Info'}
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {humanWallets.map((acc) => {
                const isSelected =
                  isConnected &&
                  wallet?.address.toLowerCase() === acc.address.toLowerCase();

                return (
                  <div
                    key={acc.address}
                    className={`p-3.5 rounded-md border transition-colors ${
                      isSelected
                        ? 'bg-[#171A22] border-[#C5A46D]'
                        : 'bg-[#0B0C10] border-[#232730] hover:border-[#363C4A]'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-[#F4F5F7]">
                            {acc.label}
                          </span>
                          <span className="text-[10px] font-mono uppercase tracking-wider text-[#C5A46D]">
                            · {acc.roleTitle}
                          </span>
                          <span className="text-[11px] font-mono text-[#8E95A5]">
                            (Account #{acc.accountIndex})
                          </span>
                        </div>
                        <div className="text-xs font-mono text-[#8E95A5] flex items-center gap-2">
                          <span>{acc.address}</span>
                          <button
                            type="button"
                            onClick={() => copyText(acc.address, `addr-${acc.accountIndex}`)}
                            className="text-[#646C7E] hover:text-[#F4F5F7]"
                            title="Copy Address"
                          >
                            {copiedKey === `addr-${acc.accountIndex}` ? (
                              <Check className="w-3 h-3 text-[#2E9B68]" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-xs font-mono font-semibold text-[#F4F5F7] tabular-nums">
                            {acc.balanceEth.toFixed(2)} ETH
                          </div>
                          <div className="text-[10px] text-[#646C7E] font-mono">
                            Hardhat Funded
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => selectRoleDirect(acc)}
                          className={`px-3.5 py-2 rounded text-xs font-semibold transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-[#2E9B68]/20 text-[#2E9B68] border border-[#2E9B68]/40'
                              : 'bg-[#C5A46D] hover:bg-[#D4B57E] text-[#0B0C10]'
                          }`}
                        >
                          {isSelected ? 'Active Role' : acc.connectButtonText}
                        </button>
                      </div>
                    </div>

                    {showPrivateKeys && (
                      <div className="mt-3 pt-2.5 border-t border-[#232730] flex items-center justify-between gap-2 text-[11px] font-mono">
                        <span className="text-[#8E95A5] truncate">
                          Signer Index: <span className="text-[#F4F5F7]">Hardhat Account #{acc.accountIndex}</span>
                        </span>
                        <button
                          onClick={() => copyText(acc.address, `pk-${acc.accountIndex}`)}
                          className="px-2 py-1 rounded bg-[#12141A] hover:bg-[#171A22] text-[#C5A46D] border border-[#232730] flex items-center gap-1 shrink-0"
                        >
                          {copiedKey === `pk-${acc.accountIndex}` ? (
                            <>
                              <Check className="w-3 h-3 text-[#2E9B68]" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              Copy Address
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Oracle Account #19 Footnote */}
          <div className="p-3.5 rounded-md bg-[#0B0C10] border border-[#232730] flex items-start gap-3">
            <Cpu className="w-4 h-4 text-[#C5A46D] shrink-0 mt-0.5" />
            <div className="text-[11px] text-[#8E95A5] leading-relaxed">
              <strong className="text-[#F4F5F7]">
                Automated Oracle Signer (Hardhat Account #19):
              </strong>{' '}
              Address{' '}
              <span className="font-mono text-[#F4F5F7]">
                {ORACLE_BACKGROUND_ACCOUNT.address.slice(0, 12)}...
              </span>{' '}
              operates as an automated background service signing AI valuation records into{' '}
              <code className="font-mono text-[#C5A46D]">PriceOracle.sol</code>.
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-[#0B0C10] border-t border-[#232730] flex items-center justify-between text-xs text-[#646C7E]">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#2E9B68]" />
            EIP-1193 Provider · Deterministic Commit-Reveal Escrow
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
