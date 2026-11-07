import React, { useEffect, useState } from 'react';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Copy,
  Check,
  ShieldCheck,
} from 'lucide-react';
import {
  verifyTransactionOnChain,
  LiveReceiptVerification,
} from '../../services/blockchain/walletService';

interface TransactionReceiptModalProps {
  txHash: string | null;
  onClose: () => void;
}

export const TransactionReceiptModal: React.FC<TransactionReceiptModalProps> = ({
  txHash,
  onClose,
}) => {
  const [verification, setVerification] = useState<LiveReceiptVerification | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const runVerification = async (hash: string) => {
    setLoading(true);
    const res = await verifyTransactionOnChain(hash);
    setVerification(res);
    setLoading(false);
  };

  useEffect(() => {
    if (txHash) {
      runVerification(txHash);
    } else {
      setVerification(null);
    }
  }, [txHash]);

  if (!txHash) return null;

  const handleCopy = (value: string, label: string) => {
    navigator.clipboard.writeText(value);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-xl rounded-xl bg-[#0F172A] border border-[#1E293B] shadow-2xl overflow-hidden text-white">
        {/* Header */}
        <div className="px-6 py-4 bg-[#090D1A] flex items-center justify-between border-b border-[#1E293B]">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-sm font-bold text-white">
                Live On-Chain Transaction Receipt Inspector
              </h3>
              <p className="text-xs font-mono text-slate-400">
                Direct JSON-RPC Verification · http://127.0.0.1:8545 (Chain ID 31337)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-[#1E293B] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
          {/* Transaction Hash Box */}
          <div className="bg-[#090D1A] border border-[#1E293B] rounded-lg p-3.5 space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span>Transaction Hash</span>
              <button
                type="button"
                onClick={() => handleCopy(txHash, 'txHash')}
                className="text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
              >
                {copiedField === 'txHash' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Hash</span>
                  </>
                )}
              </button>
            </div>
            <div className="font-mono text-white break-all">{txHash}</div>
          </div>

          {loading ? (
            <div className="py-8 text-center space-y-2 text-slate-300">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto text-blue-400" />
              <div>Querying eth_getTransactionReceipt on http://127.0.0.1:8545...</div>
            </div>
          ) : verification?.verified ? (
            <div className="space-y-4">
              <div className="rounded-lg bg-emerald-950/50 border border-emerald-500/40 p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-300 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Cryptographically Verified on Hardhat Blockchain</span>
                </div>
                <span className="font-mono text-emerald-300 font-semibold">
                  {verification.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-[#090D1A] border border-[#1E293B] rounded-lg p-4">
                <div>
                  <div className="text-slate-400">Block Number</div>
                  <div className="font-mono font-semibold text-white mt-0.5 tabular-nums">
                    #{verification.blockNumber} ({verification.confirmations} confirmation
                    {verification.confirmations === 1 ? '' : 's'})
                  </div>
                </div>
                <div>
                  <div className="text-slate-400">Sender Nonce</div>
                  <div className="font-mono font-semibold text-white mt-0.5 tabular-nums">
                    {verification.nonce}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400">Gas Used</div>
                  <div className="font-mono font-semibold text-white mt-0.5 tabular-nums">
                    {Number(verification.gasUsed || 0).toLocaleString()} gas
                  </div>
                </div>
                <div>
                  <div className="text-slate-400">Effective Gas Price</div>
                  <div className="font-mono font-semibold text-white mt-0.5 tabular-nums">
                    {verification.effectiveGasPriceGwei} Gwei
                  </div>
                </div>
                <div className="col-span-2 pt-2 border-t border-[#1E293B]">
                  <div className="text-slate-400">From (Signer Address)</div>
                  <div className="font-mono text-slate-200 break-all mt-0.5">
                    {verification.from}
                  </div>
                </div>
                <div className="col-span-2 pt-2 border-t border-[#1E293B]">
                  <div className="text-slate-400">To (Contract / Recipient Address)</div>
                  <div className="font-mono text-slate-200 break-all mt-0.5">
                    {verification.to}
                  </div>
                </div>
                <div className="col-span-2 pt-2 border-t border-[#1E293B]">
                  <div className="text-slate-400">Block Hash</div>
                  <div className="font-mono text-slate-300 break-all mt-0.5">
                    {verification.blockHash}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-lg bg-amber-950/50 border border-amber-500/40 p-4 space-y-2 text-amber-200">
              <div className="flex items-center gap-2 font-semibold text-white">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Receipt Not Found on Current Hardhat Session</span>
              </div>
              <p className="leading-relaxed">{verification?.error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-[#090D1A] border-t border-[#1E293B] flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={() => runVerification(txHash)}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg bg-[#1E293B] hover:bg-slate-700 text-slate-200 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Re-Verify on RPC</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#2563EB] hover:bg-blue-600 text-white font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
