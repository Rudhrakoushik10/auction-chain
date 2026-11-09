import React, { useEffect, useState } from 'react';
import {
  X,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Cpu,
  Blocks,
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
  const [details, setDetails] = useState<LiveReceiptVerification | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    if (!txHash) {
      setDetails(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    verifyTransactionOnChain(txHash)
      .then((res: LiveReceiptVerification) => {
        if (!cancelled) {
          setDetails(res);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [txHash]);

  if (!txHash) return null;

  const copyToClipboard = (val: string, field: string) => {
    navigator.clipboard.writeText(val);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-xl bg-[#12141A] border border-[#232730] rounded-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-[#0B0C10] border-b border-[#232730] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Blocks className="w-4 h-4 text-[#C5A46D]" />
            <div>
              <h3 className="text-sm font-display font-semibold text-[#F4F5F7]">
                EVM Transaction Receipt Inspector
              </h3>
              <p className="text-[11px] font-mono text-[#8E95A5]">
                Hardhat JSON-RPC Verification · Chain ID 31337
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded text-[#8E95A5] hover:text-[#F4F5F7] hover:bg-[#171A22] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-xs">
          {loading ? (
            <div className="py-10 text-center text-[#8E95A5] font-mono">
              Querying eth_getTransactionReceipt...
            </div>
          ) : details ? (
            <>
              <div className="flex items-center justify-between p-3.5 rounded bg-[#0B0C10] border border-[#232730]">
                <span className="text-[#8E95A5] font-mono uppercase tracking-wider text-[10px]">
                  Execution Status
                </span>
                {details.verified ? (
                  <span className="inline-flex items-center gap-1.5 font-mono text-[#2E9B68] font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {details.status || 'CONFIRMED (0x1)'}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 font-mono text-[#C5A46D] font-medium">
                    <XCircle className="w-3.5 h-3.5" />
                    RECORDED IN SESSION LEDGER
                  </span>
                )}
              </div>

              <div className="space-y-2.5 bg-[#0B0C10] border border-[#232730] rounded p-4 font-mono">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[#8E95A5]">Transaction Hash</span>
                  <button
                    onClick={() => copyToClipboard(details.txHash, 'hash')}
                    className="text-[#C5A46D] hover:underline flex items-center gap-1 truncate max-w-[280px]"
                  >
                    <span className="truncate">{details.txHash}</span>
                    {copiedField === 'hash' ? (
                      <Check className="w-3 h-3 text-[#2E9B68] shrink-0" />
                    ) : (
                      <Copy className="w-3 h-3 shrink-0" />
                    )}
                  </button>
                </div>

                {details.verified ? (
                  <>
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#232730]">
                      <span className="text-[#8E95A5]">Block Number</span>
                      <span className="text-[#F4F5F7] tabular-nums">
                        #{details.blockNumber ?? 'Pending'} ({details.confirmations ?? 1}{' '}
                        confirmations)
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#232730]">
                      <span className="text-[#8E95A5]">From (Signer)</span>
                      <span className="text-[#F4F5F7] truncate max-w-[280px]">
                        {details.from}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#232730]">
                      <span className="text-[#8E95A5]">To (Contract)</span>
                      <span className="text-[#F4F5F7] truncate max-w-[280px]">
                        {details.to || 'Contract Deployment'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#232730]">
                      <span className="text-[#8E95A5] flex items-center gap-1">
                        <Cpu className="w-3 h-3" /> Gas Used / Nonce
                      </span>
                      <span className="text-[#F4F5F7] tabular-nums">
                        {details.gasUsed} gas ({Number(details.effectiveGasPriceGwei || 0).toFixed(1)} Gwei) · Nonce #{details.nonce}
                      </span>
                    </div>

                    {details.networkFeeEth && (
                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#232730]">
                        <span className="text-[#8E95A5]">Network Fee Consumed</span>
                        <span className="text-[#C5A46D] font-semibold tabular-nums">
                          -{Number(details.networkFeeEth).toFixed(6)} ETH
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="pt-2 border-t border-[#232730] text-[#8E95A5] font-sans leading-relaxed">
                    {details.error ||
                      'Transaction hash recorded in local session state.'}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="py-8 text-center text-[#8E95A5]">
              Transaction receipt recorded in deterministic state.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-[#0B0C10] border-t border-[#232730] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-[#C5A46D] hover:bg-[#D4B57E] text-[#0B0C10] text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
