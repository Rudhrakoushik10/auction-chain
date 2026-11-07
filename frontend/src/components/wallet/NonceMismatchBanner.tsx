import React, { useState } from 'react';
import { AlertTriangle, RefreshCw, CheckCircle2, Trash2 } from 'lucide-react';
import { NonceMismatchInfo } from '../../services/blockchain/walletService';
import { shortenAddress } from '../../lib/crypto';

interface NonceMismatchBannerProps {
  mismatch: NonceMismatchInfo;
  onAutoSyncNonce: () => Promise<boolean>;
  onConfirmManualClear: () => void;
}

export const NonceMismatchBanner: React.FC<NonceMismatchBannerProps> = ({
  mismatch,
  onAutoSyncNonce,
  onConfirmManualClear,
}) => {
  const [syncing, setSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);

  const handleAutoSync = async () => {
    setSyncing(true);
    const ok = await onAutoSyncNonce();
    setSyncing(false);
    if (ok) {
      setSyncSuccess(true);
      setTimeout(() => setSyncSuccess(false), 2500);
    }
  };

  return (
    <div className="rounded-xl bg-amber-950/75 border border-amber-500/50 p-4 text-xs text-amber-100 space-y-3 shadow-lg">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1.5 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-sm font-bold text-white">
              MetaMask Nonce Out of Sync (Hardhat Node Was Restarted)
            </h4>
            <span className="font-mono text-[11px] bg-black/40 border border-amber-500/40 px-2 py-0.5 rounded text-amber-300">
              Hardhat Nonce: {mismatch.hardhatNonce} · MetaMask Cached Nonce: {mismatch.cachedMetaMaskNonce}
            </span>
          </div>

          <p className="text-amber-200 leading-relaxed">
            <strong>Why this happened:</strong> Terminal 1 (Hardhat Node) was closed and reopened, which reset on-chain transaction nonces back to{' '}
            <code className="font-mono text-white">{mismatch.hardhatNonce}</code> for{' '}
            <strong className="text-white">{mismatch.accountLabel}</strong> (
            <span className="font-mono text-white">{shortenAddress(mismatch.address)}</span>), while MetaMask still caches Nonce{' '}
            <code className="font-mono text-white">{mismatch.cachedMetaMaskNonce}</code> from your previous run.
          </p>

          <div className="bg-black/35 border border-amber-500/30 rounded-lg p-3 space-y-1 text-slate-200">
            <div className="font-semibold text-amber-300">
              How to Fix in MetaMask (Standard Method):
            </div>
            <div>
              1. Open <strong>MetaMask</strong> → Go to <strong>Settings</strong> → <strong>Developer Tools</strong>.
            </div>
            <div>
              2. Click on <strong>"Delete activity and nonce data"</strong>, then click <strong>"I Deleted Activity & Nonce Data"</strong> below.
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2 border-t border-amber-500/25">
        <button
          type="button"
          onClick={onConfirmManualClear}
          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5 text-slate-300" />
          <span>I Deleted Activity & Nonce Data</span>
        </button>

        <button
          type="button"
          onClick={handleAutoSync}
          disabled={syncing}
          className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
        >
          {syncSuccess ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Nonce Synced!</span>
            </>
          ) : (
            <>
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              <span>
                {syncing
                  ? 'Syncing Hardhat Nonce...'
                  : `Auto-Sync Hardhat Nonce to ${mismatch.cachedMetaMaskNonce} (1-Click Fix)`}
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
