import React, { useState } from 'react';
import {
  Wallet,
  X,
  ArrowRight,
  AlertTriangle,
  RefreshCw,
  Wifi,
  WifiOff,
  Copy,
  Check,
} from 'lucide-react';
import { useWallet } from '../../context/WalletContext';
import { shortenAddress, formatEthToInr } from '../../lib/crypto';
import { WalletAccount } from '../../types/auction';
import { NonceMismatchBanner } from './NonceMismatchBanner';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    closeAuthModal,
    humanWallets,
    connectMetaMask,
    selectRoleDirect,
    isConnecting,
    errorMessage,
    nonceMismatch,
    autoSyncNonce,
    confirmManualNonceClear,
    switchNetworkToHardhat,
    isCorrectNetwork,
    chainId,
    isNodeOnline,
    latestBlock,
    refreshHardhatNode,
  } = useWallet();

  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [checkingNode, setCheckingNode] = useState<boolean>(false);

  if (!isAuthModalOpen) return null;

  const handleCopy = (address: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const handleRetryNode = async () => {
    setCheckingNode(true);
    await refreshHardhatNode();
    setCheckingNode(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-2xl rounded-xl bg-[#0F172A] border border-[#1E293B] shadow-2xl overflow-hidden text-white">
        {/* Header */}
        <div className="px-6 py-4 bg-[#090D1A] flex items-center justify-between border-b border-[#1E293B]">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-base font-bold text-white">
                Connect Wallet to AuctionChain
              </h2>
              {isNodeOnline ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-950/90 border border-emerald-500/40 text-emerald-300 text-[11px] font-mono font-semibold">
                  <Wifi className="w-3 h-3 text-emerald-400" />
                  Hardhat RPC Online · Block #{latestBlock ?? 0}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-rose-950/90 border border-rose-500/40 text-rose-300 text-[11px] font-mono font-semibold">
                  <WifiOff className="w-3 h-3 text-rose-400" />
                  Hardhat RPC Offline (127.0.0.1:8545 Closed)
                </span>
              )}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              Connect via MetaMask or select one of the 4 dedicated Hardhat role accounts.
            </div>
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
          {/* Hardhat RPC Offline Warning */}
          {!isNodeOnline && (
            <div className="rounded-lg bg-rose-950/60 border border-rose-500/40 p-4 space-y-2 text-xs text-rose-200">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 font-semibold text-rose-300">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Hardhat RPC Server Disconnected (http://127.0.0.1:8545 is Closed)</span>
                </div>
                <button
                  type="button"
                  onClick={handleRetryNode}
                  disabled={checkingNode}
                  className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${checkingNode ? 'animate-spin' : ''}`} />
                  <span>{checkingNode ? 'Checking...' : 'Retry Connection'}</span>
                </button>
              </div>
              <p className="text-xs text-rose-200/90 leading-relaxed">
                Make sure <strong>Terminal 1 (Hardhat Node)</strong> is running on{' '}
                <code className="font-mono text-white">http://127.0.0.1:8545</code>, then click{' '}
                <strong>Retry Connection</strong>.
              </p>
            </div>
          )}

          {/* MetaMask Nonce Mismatch Warning (When Hardhat Terminal was closed & reopened) */}
          {isNodeOnline && nonceMismatch && (
            <NonceMismatchBanner
              mismatch={nonceMismatch}
              onAutoSyncNonce={autoSyncNonce}
              onConfirmManualClear={confirmManualNonceClear}
            />
          )}

          {/* Network Mismatch Warning */}
          {isNodeOnline && !isCorrectNetwork && (
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

          {errorMessage && (
            <div className="rounded-lg bg-rose-950/60 border border-rose-500/40 p-3.5 text-xs text-rose-200 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>{errorMessage}</div>
            </div>
          )}

          {/* Primary Action: Connect MetaMask */}
          <div className="bg-[#090D1A] rounded-xl border border-[#1E293B] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-0.5">
              <div className="text-sm font-semibold text-white flex items-center gap-2">
                <span>Connect Browser Extension (MetaMask)</span>
                <span className="text-[11px] font-mono font-normal bg-[#1E293B] text-slate-300 px-2 py-0.5 rounded">
                  Chain ID: 31337
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Connect MetaMask on <code className="font-mono text-emerald-400">http://127.0.0.1:8545</code> for live browser popup signing.
              </p>
            </div>

            <button
              type="button"
              onClick={() => connectMetaMask()}
              disabled={isConnecting || !isNodeOnline}
              className="w-full sm:w-auto px-4 py-2.5 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
            >
              <Wallet className="w-4 h-4" />
              <span>
                {isConnecting
                  ? 'Connecting...'
                  : isNodeOnline
                  ? 'Connect MetaMask'
                  : 'Hardhat Offline'}
              </span>
            </button>
          </div>

          {/* Role-Based Account Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300">
                Dedicated Single-Role Hardhat Accounts
              </span>
              <span className="font-mono text-slate-400">4 Human Accounts + 1 Oracle</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {humanWallets.map((acct: WalletAccount) => (
                <div
                  key={acct.address}
                  onClick={() => {
                    if (!isConnecting && isNodeOnline) {
                      selectRoleDirect(acct);
                    }
                  }}
                  className={`bg-[#090D1A] rounded-xl p-4 border transition-colors flex flex-col justify-between gap-3 ${
                    isNodeOnline
                      ? 'border-[#1E293B] hover:border-blue-500/50 cursor-pointer'
                      : 'border-[#1E293B]/60 opacity-75 cursor-not-allowed'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-white">{acct.label}</span>
                      <div className="flex items-center gap-1 font-mono text-slate-400 tabular-nums">
                        <span>{shortenAddress(acct.address)}</span>
                        <button
                          type="button"
                          onClick={(e) => handleCopy(acct.address, e)}
                          className="text-slate-400 hover:text-white p-0.5 transition-colors cursor-pointer"
                          title="Copy full address"
                        >
                          {copiedAddress === acct.address ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="text-xs text-slate-400 font-mono">
                      Role: <span className="text-slate-200 font-sans font-medium">{acct.roleTitle}</span> · Account #{acct.accountIndex}
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed pt-1">
                      {acct.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[#1E293B] flex items-center justify-between">
                    <span className="font-mono text-xs text-slate-300 tabular-nums">
                      {isNodeOnline
                        ? `${acct.balanceEth.toFixed(2)} ETH (${formatEthToInr(acct.balanceEth)})`
                        : '— ETH'}
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        selectRoleDirect(acct);
                      }}
                      disabled={isConnecting || !isNodeOnline}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#2563EB] hover:bg-blue-600 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <span>{acct.connectButtonText}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Note */}
          <div className="text-xs text-slate-400 border-t border-[#1E293B] pt-4 flex items-center justify-between">
            <span>
              {isNodeOnline
                ? `Connected to Hardhat RPC http://127.0.0.1:8545 (Chain ID ${chainId}).`
                : 'Disconnected: Hardhat RPC http://127.0.0.1:8545 is currently closed.'}
            </span>
            <span className="font-mono text-slate-400">
              Oracle Signer: Account #4 (0x15d34...6A65)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
