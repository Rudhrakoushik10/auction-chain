import React from 'react';
import {
  Shield,
  Wallet,
  X,
  ArrowRight,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  Cpu,
} from 'lucide-react';
import { useWallet } from '../../context/WalletContext';
import enhancedLogoUrl from '../../assets/images/auctionchain_logo.jpg';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#090D1A]/85 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white border border-[#E2E8F0] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-[#090D1A] px-6 py-5 text-white flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-12 rounded-xl bg-[#0F172A] p-1 shadow-md ring-2 ring-[#06B6D4] border border-[#2563EB]/40 flex items-center justify-center overflow-hidden shrink-0">
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
                <h2 className="text-lg font-bold tracking-tight text-white">
                  Connect to AuctionChain
                </h2>
                <span className="px-2 py-0.5 text-[11px] font-mono font-semibold uppercase tracking-wider bg-[#06B6D4]/20 text-[#06B6D4] rounded border border-[#06B6D4]/30">
                  Chain ID 31337
                </span>
              </div>
              <p className="text-xs text-[#E2E8F0]/80 mt-0.5">
                Hardhat Localhost · Preconfigured Role-Based Access
              </p>
            </div>
          </div>
          <button
            onClick={closeAuthModal}
            className="rounded-lg p-1.5 text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 bg-[#F8FAFC] space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Wrong Network Notice if chain mismatch */}
          {!isCorrectNetwork && (
            <div className="rounded-xl bg-amber-50 border border-amber-300 p-4 flex items-start justify-between gap-3 text-xs text-amber-900">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Network Mismatch: </span>
                  Connected to Chain ID {chainId}. AuctionChain requires Hardhat Local (Chain ID 31337).
                </div>
              </div>
              <button
                onClick={switchNetworkToHardhat}
                className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold transition-colors shrink-0 cursor-pointer"
              >
                Switch to 31337
              </button>
            </div>
          )}

          {/* Account Mismatch State Display (Section 4 requirements) */}
          {mismatchInfo && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 space-y-3 animate-in fade-in">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-rose-900">
                    Wallet Account Mismatch
                  </h4>
                  <p className="text-xs text-rose-700 leading-relaxed">
                    You selected <span className="font-semibold">{mismatchInfo.expectedLabel}</span> ({mismatchInfo.expectedRole}), which expects address{' '}
                    <span className="font-mono font-bold">{shortenAddress(mismatchInfo.expectedAddress)}</span>.
                    However, MetaMask is currently active with address{' '}
                    <span className="font-mono font-bold">{shortenAddress(mismatchInfo.connectedAddress)}</span>.
                  </p>
                </div>
              </div>

              <div className="bg-white/80 rounded-lg p-3 text-xs text-slate-700 border border-rose-200/60 space-y-1.5">
                <div className="font-semibold text-[#101B3D]">How to proceed:</div>
                <ul className="list-disc list-inside space-y-1 text-slate-600">
                  <li>Open your MetaMask browser extension.</li>
                  <li>Switch your active account to the account matching <span className="font-mono font-bold">{shortenAddress(mismatchInfo.expectedAddress)}</span>.</li>
                  <li>AuctionChain will automatically detect the account change via MetaMask's <span className="font-mono text-[11px]">accountsChanged</span> event and load the dashboard.</li>
                </ul>
              </div>

              <div className="flex items-center justify-between gap-3 pt-1">
                <button
                  type="button"
                  onClick={clearMismatch}
                  className="text-xs text-slate-500 hover:text-slate-800 underline cursor-pointer"
                >
                  Dismiss Warning
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={requestAccountSwitchInMetaMask}
                    className="px-3 py-2 rounded-lg text-xs font-semibold bg-[#2563EB] text-white hover:bg-blue-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Prompt MetaMask Account Switch</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* General Error Message */}
          {errorMessage && !mismatchInfo && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3.5 text-xs text-amber-800 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>{errorMessage}</div>
            </div>
          )}

          {/* Primary Action: Connect MetaMask Button (Section 3) */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center shrink-0">
                <svg className="w-6 h-6" viewBox="0 0 318.6 318.6" fill="none">
                  <path fill="#E2761B" stroke="#E2761B" strokeMiterlimit="10" d="M274.1 35.5l-99.5 73.9L194 65.4z"/>
                  <path fill="#E4761B" stroke="#E4761B" strokeMiterlimit="10" d="M44.4 35.5l98.7 74.6-18.4-44.7z"/>
                  <path fill="#E4761B" stroke="#E4761B" strokeMiterlimit="10" d="M238.3 206.8l-29.6 45.4 68.3 18.8 19.6-63.5z"/>
                  <path fill="#E4761B" stroke="#E4761B" strokeMiterlimit="10" d="M22.1 207.5l19.5 63.5 68.3-18.8-29.5-45.4z"/>
                  <path fill="#D7C1B3" stroke="#D7C1B3" strokeMiterlimit="10" d="M106.9 146.5l-23.7-11.5 15.6-21.7z"/>
                  <path fill="#D7C1B3" stroke="#D7C1B3" strokeMiterlimit="10" d="M211.7 146.5l8.1-33.2 15.6 21.7z"/>
                  <path fill="#233447" stroke="#233447" strokeMiterlimit="10" d="M106.9 146.5l-24.8 48.6 40.7 3.3-15.9-51.9z"/>
                  <path fill="#233447" stroke="#233447" strokeMiterlimit="10" d="M211.7 146.5l-15.9 51.9 40.7-3.3z"/>
                  <path fill="#CD6116" stroke="#CD6116" strokeMiterlimit="10" d="M122.8 198.4l36.5 49.3 36.5-49.3-36.5-12.7z"/>
                  <path fill="#E4751F" stroke="#E4751F" strokeMiterlimit="10" d="M276.5 110.1l-2.4-74.6-99.5 73.9 66.8 45.5z"/>
                  <path fill="#E4751F" stroke="#E4751F" strokeMiterlimit="10" d="M44.4 35.5l-2.3 74.6 35.1 44.8 66.8-45.5z"/>
                </svg>
              </div>
              <div>
                <div className="text-sm font-bold text-[#101B3D] flex items-center gap-2">
                  <span>MetaMask Web3 Provider</span>
                  {isMetaMaskAvailable ? (
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Detected
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      Local Sim Ready
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-500">
                  Requests Ethers.js v6 account access & validates Chain ID 31337
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => connectMetaMask()}
              disabled={isConnecting}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#2563EB] hover:bg-blue-600 transition-all shadow-md shadow-[#2563EB]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 shrink-0"
            >
              <Wallet className="w-4 h-4" />
              <span>{isConnecting ? 'Requesting MetaMask...' : 'Connect MetaMask'}</span>
            </button>
          </div>

          {/* Direct Role Selection Section (Section 4) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Direct Role-Based Wallet Selection
                </h3>
                <p className="text-xs text-slate-500">
                  Preconfigured Hardhat accounts matching specific auction roles
                </p>
              </div>
              <span className="text-[11px] font-mono text-[#2563EB] bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-medium">
                4 Human Roles
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {humanWallets.map((acct: WalletAccount) => (
                <div
                  key={acct.address}
                  className="bg-white rounded-xl p-4 border border-[#E2E8F0] hover:border-[#2563EB]/50 hover:shadow-md transition-all flex flex-col justify-between gap-3 group"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#101B3D] group-hover:text-[#2563EB] transition-colors">
                        {acct.label}
                      </span>
                      <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {shortenAddress(acct.address)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded text-white"
                        style={{ backgroundColor: acct.badgeColor }}
                      >
                        {acct.roleTitle}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500">
                        Hardhat Account #{acct.accountIndex}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {acct.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="font-mono text-xs font-semibold text-slate-700">
                      {acct.balanceEth.toFixed(1)} Test ETH
                    </span>

                    <button
                      type="button"
                      onClick={() => selectRoleDirect(acct)}
                      disabled={isConnecting}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-white transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      style={{ backgroundColor: acct.badgeColor }}
                    >
                      <span>{acct.connectButtonText}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Background Oracle Clarification Note (Section 5) */}
          <div className="rounded-xl bg-slate-100/90 border border-slate-200 p-3.5 flex items-start gap-3 text-xs text-slate-600">
            <Cpu className="w-4 h-4 text-[#059669] shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-800">
                Account 4 (Oracle — 0x15d34...6A65):{' '}
              </span>
              Operating as an autonomous background service (<span className="font-mono text-[11px]">oracle/</span> Server 3) that listens for auction events and relays verified AI valuations directly to <span className="font-mono text-[11px]">PriceOracle.sol</span>. It has no user-facing wallet role or dashboard.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-[#E2E8F0] flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-[#2563EB]" />
            <span>Zero-Password, Cryptographic Web3 Access</span>
          </div>
          <button
            type="button"
            onClick={closeAuthModal}
            className="hover:text-slate-800 underline font-medium cursor-pointer"
          >
            Continue as Guest
          </button>
        </div>
      </div>
    </div>
  );
};
