import React from 'react';
import {
  Wallet,
  X,
  ArrowRight,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { useWallet } from '../../context/WalletContext';
import { shortenAddress } from '../../lib/crypto';
import { WalletAccount } from '../../types/auction';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    closeAuthModal,
    humanWallets,
    connectMetaMask,
    selectRoleDirect,
    isConnecting,
    mismatchInfo,
    errorMessage,
    clearMismatch,
    requestAccountSwitchInMetaMask,
    switchNetworkToHardhat,
    isCorrectNetwork,
    chainId,
    isMetaMaskAvailable,
  } = useWallet();

  if (!isAuthModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-2xl rounded-xl bg-[#0F172A] border border-[#1E293B] shadow-2xl overflow-hidden text-white">
        {/* Header */}
        <div className="px-6 py-4 bg-[#090D1A] flex items-center justify-between border-b border-[#1E293B]">
          <div>
            <div className="text-xs font-mono text-slate-400">
              Hardhat Local Network · Chain ID 31337
            </div>
            <h2 className="text-base font-bold text-white mt-0.5">
              Connect Wallet to AuctionChain
            </h2>
          </div>
          <button
            type="button"
            onClick={closeAuthModal}
            className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-[#1E293B] transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Network Mismatch Warning */}
          {!isCorrectNetwork && (
            <div className="rounded-lg bg-amber-950/40 border border-amber-500/40 p-4 flex items-center justify-between gap-3 text-xs text-amber-200">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-white">Network Mismatch: </span>
                  Connected to Chain ID {chainId}. Please switch to Hardhat Local (31337).
                </div>
              </div>
              <button
                type="button"
                onClick={switchNetworkToHardhat}
                className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold transition-colors shrink-0 cursor-pointer"
              >
                Switch to 31337
              </button>
            </div>
          )}

          {/* Account Mismatch Warning (Verifies actual connected MetaMask address) */}
          {mismatchInfo && (
            <div className="rounded-lg bg-rose-950/40 border border-rose-500/40 p-4 space-y-3 text-xs">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-semibold text-white">
                    MetaMask Account Mismatch
                  </h4>
                  <p className="text-rose-200 leading-relaxed">
                    You selected <strong className="text-white">{mismatchInfo.expectedLabel}</strong> ({mismatchInfo.expectedRole}), which requires address{' '}
                    <span className="font-mono text-white">{shortenAddress(mismatchInfo.expectedAddress)}</span>. However, MetaMask is currently active on{' '}
                    <span className="font-mono text-white">{shortenAddress(mismatchInfo.connectedAddress)}</span>.
                  </p>
                  <p className="text-slate-300 pt-1">
                    Switch your active account in MetaMask to <span className="font-mono">{shortenAddress(mismatchInfo.expectedAddress)}</span> to access this role.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 pt-2 border-t border-rose-500/20">
                <button
                  type="button"
                  onClick={clearMismatch}
                  className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
                >
                  Dismiss
                </button>
                <button
                  type="button"
                  onClick={requestAccountSwitchInMetaMask}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#2563EB] text-white hover:bg-blue-600 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Prompt MetaMask Account Switch</span>
                </button>
              </div>
            </div>
          )}

          {errorMessage && !mismatchInfo && (
            <div className="rounded-lg bg-amber-950/40 border border-amber-500/40 p-3.5 text-xs text-amber-200 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>{errorMessage}</div>
            </div>
          )}

          {/* Primary Action: Connect MetaMask */}
          <div className="bg-[#090D1A] rounded-xl border border-[#1E293B] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-0.5">
              <div className="text-sm font-semibold text-white flex items-center gap-2">
                <span>MetaMask Browser Wallet</span>
                <span className="text-xs font-mono font-normal text-slate-400">
                  · {isMetaMaskAvailable ? 'Extension Detected' : 'Local Hardhat Signer Ready'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Connects via Ethers.js v6 and maps your active address to its assigned Hardhat role.
              </p>
            </div>

            <button
              type="button"
              onClick={() => connectMetaMask()}
              disabled={isConnecting}
              className="w-full sm:w-auto px-4 py-2.5 rounded-lg text-xs font-semibold text-white bg-[#2563EB] hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
            >
              <Wallet className="w-4 h-4" />
              <span>{isConnecting ? 'Requesting Connection...' : 'Connect MetaMask'}</span>
            </button>
          </div>

          {/* Role-Based Account Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300">
                Preconfigured Hardhat Role Accounts
              </span>
              <span className="font-mono text-slate-400">4 Human Accounts + 1 Oracle</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {humanWallets.map((acct: WalletAccount) => (
                <div
                  key={acct.address}
                  className="bg-[#090D1A] rounded-xl p-4 border border-[#1E293B] hover:border-slate-700 transition-colors flex flex-col justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-white">{acct.label}</span>
                      <span className="font-mono text-slate-400 tabular-nums">
                        {shortenAddress(acct.address)}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 font-mono">
                      Role: <span className="text-slate-200 font-sans font-medium">{acct.roleTitle}</span> · Signer #{acct.accountIndex}
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed pt-1">
                      {acct.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[#1E293B] flex items-center justify-between">
                    <span className="font-mono text-xs text-slate-300 tabular-nums">
                      {acct.balanceEth.toFixed(1)} ETH
                    </span>

                    <button
                      type="button"
                      onClick={() => selectRoleDirect(acct)}
                      disabled={isConnecting}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#1E293B] hover:bg-[#2563EB] transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <span>{acct.connectButtonText}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Background Oracle Note */}
          <div className="text-xs text-slate-400 border-t border-[#1E293B] pt-4 leading-relaxed">
            <strong className="text-slate-200 font-mono">Account 4 (Oracle — 0x15d34...6A65):</strong>{' '}
            Reserved for the background Oracle relayer daemon that signs AI valuations onto <code className="text-slate-200">PriceOracle.sol</code>.
          </div>
        </div>
      </div>
    </div>
  );
};
