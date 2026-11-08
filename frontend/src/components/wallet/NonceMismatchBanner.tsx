import React, { useState } from 'react';
import { AlertTriangle, RefreshCw, CheckCircle2, Wrench } from 'lucide-react';
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
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const handleAutoSync = async () => {
    setIsSyncing(true);
    setSyncError(null);
    try {
      const ok = await onAutoSyncNonce();
      if (!ok) {
        setSyncError(
          'Could not auto-advance Hardhat nonce. Use "Clear Activity Tab Data" in MetaMask settings.'
        );
      }
    } catch (err: any) {
      setSyncError(err?.message || 'Failed to resync nonce.');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="bg-[#12141A] border border-[#D49B38]/50 rounded-md p-4 text-xs text-[#F4F5F7]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-[#D49B38] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-[#F4F5F7]">
                MetaMask Nonce Desynchronization Detected
              </span>
              <span className="font-mono text-[11px] text-[#C5A46D]">
                Signer {shortenAddress(mismatch.address)}
              </span>
            </div>
            <p className="text-[#8E95A5] leading-relaxed">
              Hardhat chain nonce is{' '}
              <strong className="font-mono text-[#F4F5F7]">
                {mismatch.hardhatNonce}
              </strong>
              , while cached client state expects{' '}
              <strong className="font-mono text-[#D49B38]">
                {mismatch.cachedMetaMaskNonce}
              </strong>
              . Resynchronize the local RPC nonce before broadcasting transactions.
            </p>
            {syncError && (
              <p className="text-[#C94A4A] font-mono text-[11px] pt-1">{syncError}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={handleAutoSync}
            disabled={isSyncing}
            className="px-3.5 py-2 rounded bg-[#C5A46D] hover:bg-[#D4B57E] text-[#0B0C10] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {isSyncing ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Wrench className="w-3.5 h-3.5" />
            )}
            <span>{isSyncing ? 'Resyncing RPC...' : 'Auto-Sync Nonce'}</span>
          </button>

          <button
            onClick={onConfirmManualClear}
            className="px-3 py-2 rounded bg-[#0B0C10] hover:bg-[#171A22] text-[#8E95A5] hover:text-[#F4F5F7] border border-[#232730] flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-[#2E9B68]" />
            <span>Dismiss</span>
          </button>
        </div>
      </div>
    </div>
  );
};
