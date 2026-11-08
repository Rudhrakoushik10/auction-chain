import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Lock,
  Eye,
  CheckCircle2,
  Download,
  Upload,
  ShieldAlert,
  Copy,
  Check,
  RefreshCw,
  Clock,
} from 'lucide-react';
import {
  AuctionItem,
  LocalRevealBackupSecret,
} from '../types/auction';
import { useWallet } from '../context/WalletContext';
import { PredictionWidget } from '../components/prediction/PredictionWidget';
import { useCountdown } from '../hooks/useCountdown';
import {
  computeCommitmentHash,
  generateRandomSalt,
  formatInr,
  formatEthToInr,
  ETH_TO_INR_RATE,
  shortenAddress,
} from '../lib/crypto';

type TxLifecycleState =
  | 'idle'
  | 'waiting_approval'
  | 'submitted'
  | 'pending'
  | 'confirmed'
  | 'failed';

interface AuctionDetailsProps {
  auction: AuctionItem;
  onBack: () => void;
  onCommitBid: (
    auctionId: string,
    commitmentHash: string,
    secretBackup: LocalRevealBackupSecret
  ) => Promise<{ success: boolean; message: string }>;
  onRevealBid: (
    auctionId: string,
    bidAmountEth: number,
    salt: string
  ) => Promise<{
    success: boolean;
    message: string;
  }>;
  onFinalizeAuction: (
    auctionId: string
  ) => Promise<{ success: boolean; message: string }>;
  onAdvancePhaseDemo: (auctionId: string) => void;
  onSettleWinner: (
    auctionId: string
  ) => Promise<{ success: boolean; message: string }>;
  onClaimRefund: (
    auctionId: string
  ) => Promise<{ success: boolean; message: string }>;
  onWithdrawProceeds: (
    auctionId: string
  ) => Promise<{ success: boolean; message: string }>;
  savedSecrets: LocalRevealBackupSecret[];
}

const ATTRIBUTE_LABELS: Record<string, string> = {
  brand: 'Make / Brand',
  model: 'Model Variant',
  year: 'Model Year',
  manufacturing_year: 'Manufacturing Year',
  mileage: 'Odometer (Miles)',
  mileage_km: 'Odometer Reading',
  fuel_type: 'Fuel / Drivetrain',
  engine_type: 'Engine Specification',
  transmission: 'Transmission',
  exterior_color: 'Exterior Color',
  interior_color: 'Interior Color',
  accident_history: 'Accident History',
  clean_title: 'Clean Title',
  condition: 'Cosmetic Condition',
  original_price_inr: 'Original Invoice Price',
};

export const AuctionDetails: React.FC<AuctionDetailsProps> = ({
  auction,
  onBack,
  onCommitBid,
  onRevealBid,
  onFinalizeAuction,
  onAdvancePhaseDemo,
  onSettleWinner,
  onClaimRefund,
  onWithdrawProceeds,
  savedSecrets,
}) => {
  const {
    isConnected,
    wallet,
    isCorrectNetwork,
    openAuthModal,
    switchNetworkToHardhat,
    inspectTransaction,
  } = useWallet();

  const targetDeadline =
    auction.phase === 'Commit' ? auction.commitEndTime : auction.revealEndTime;
  const countdown = useCountdown(targetDeadline);

  // Commit Phase State
  const [bidAmountEth, setBidAmountEth] = useState<string>(
    (auction.startingBidEth + 0.5).toFixed(2)
  );
  const [salt, setSalt] = useState<string>(() => generateRandomSalt());
  const [computedHash, setComputedHash] = useState<string>('');
  const [backupSavedAck, setBackupSavedAck] = useState<boolean>(false);
  const [copiedSalt, setCopiedSalt] = useState<boolean>(false);

  // Transaction Lifecycle State
  const [txState, setTxState] = useState<TxLifecycleState>('idle');
  const [actionFeedback, setActionFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Reveal Phase State
  const [revealBidInput, setRevealBidInput] = useState<string>('');
  const [revealSaltInput, setRevealSaltInput] = useState<string>('');

  useEffect(() => {
    let active = true;
    const addr = wallet?.address || '0x0000000000000000000000000000000000000000';
    computeCommitmentHash(auction.numericId, addr, bidAmountEth || '0', salt).then((hash) => {
      if (active) setComputedHash(hash);
    });
    return () => {
      active = false;
    };
  }, [auction.numericId, wallet?.address, bidAmountEth, salt]);

  useEffect(() => {
    if (!wallet) return;
    const match = savedSecrets.find(
      (s) =>
        s.auctionId === auction.id &&
        s.bidderAddress.toLowerCase() === wallet.address.toLowerCase()
    );
    if (match) {
      setRevealBidInput(match.bidAmountEth);
      setRevealSaltInput(match.salt);
    }
  }, [auction.id, wallet, savedSecrets]);

  const isSeller =
    isConnected &&
    wallet &&
    wallet.address.toLowerCase() === auction.sellerAddress.toLowerCase();

  const myCommitment =
    isConnected && wallet
      ? auction.commitments.find(
          (c) => c.bidderAddress.toLowerCase() === wallet.address.toLowerCase()
        )
      : undefined;

  const runSimulatedTxLifecycle = async (
    onComplete: () => Promise<{ ok: boolean; msg: string }> | { ok: boolean; msg: string }
  ) => {
    setActionFeedback(null);
    setTxState('waiting_approval');
    await new Promise((r) => setTimeout(r, 120));
    setTxState('submitted');
    await new Promise((r) => setTimeout(r, 120));
    setTxState('pending');
    const res = await onComplete();
    if (res.ok) {
      setTxState('confirmed');
      setActionFeedback({ type: 'success', text: res.msg });
    } else {
      setTxState('failed');
      setActionFeedback({ type: 'error', text: res.msg });
    }
  };

  const handleDownloadRevealJson = () => {
    if (!wallet) return;
    const payload: LocalRevealBackupSecret = {
      platform: 'AuctionChain',
      chainId: 31337,
      auctionId: auction.id,
      numericAuctionId: auction.numericId,
      auctionTitle: auction.title,
      bidderAddress: wallet.address,
      bidAmountEth: bidAmountEth,
      salt: salt,
      commitmentHash: computedHash,
      fixedDepositEth: auction.fixedDepositEth,
      createdAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `auctionchain-reveal-backup-${auction.id}-${wallet.address.slice(0, 6)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setBackupSavedAck(true);
  };

  const handleImportRevealJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    setActionFeedback(null);
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(String(evt.target?.result || '{}')) as LocalRevealBackupSecret;
        if (parsed.auctionId && parsed.auctionId !== auction.id) {
          setActionFeedback({
            type: 'error',
            text: `Auction ID Mismatch: Backup file is for ${parsed.auctionId}, but you are viewing ${auction.id}.`,
          });
          return;
        }
        if (
          wallet &&
          parsed.bidderAddress &&
          parsed.bidderAddress.toLowerCase() !== wallet.address.toLowerCase()
        ) {
          setActionFeedback({
            type: 'error',
            text: `Wallet Mismatch: Backup belongs to ${shortenAddress(
              parsed.bidderAddress
            )}, but active wallet is ${shortenAddress(wallet.address)}. Switch wallets in the header first.`,
          });
          return;
        }
        setRevealBidInput(String(parsed.bidAmountEth || ''));
        setRevealSaltInput(String(parsed.salt || ''));
        setActionFeedback({
          type: 'success',
          text: 'Reveal backup JSON loaded. Submit below to verify hash and reveal your bid on-chain.',
        });
      } catch {
        setActionFeedback({
          type: 'error',
          text: 'Invalid JSON reveal backup file format.',
        });
      }
    };
    reader.readAsText(file);
  };

  const handleCommitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallet) return;

    if (isSeller) {
      setTxState('failed');
      setActionFeedback({
        type: 'error',
        text: 'Smart Contract Revert: SellerCannotBidOnOwnAuction(). Switch to Bidder 1 or Bidder 2 in the header.',
      });
      return;
    }

    const numericBid = Number(bidAmountEth);
    if (Number.isNaN(numericBid) || numericBid < auction.startingBidEth) {
      setTxState('failed');
      setActionFeedback({
        type: 'error',
        text: `Bid amount must be at least the starting bid of ${auction.startingBidEth.toFixed(2)} ETH.`,
      });
      return;
    }

    if (!backupSavedAck) {
      setTxState('failed');
      setActionFeedback({
        type: 'error',
        text: 'Please download or acknowledge saving your secret salt before committing.',
      });
      return;
    }

    await runSimulatedTxLifecycle(async () => {
      const secretObj: LocalRevealBackupSecret = {
        platform: 'AuctionChain',
        chainId: 31337,
        auctionId: auction.id,
        numericAuctionId: auction.numericId,
        auctionTitle: auction.title,
        bidderAddress: wallet.address,
        bidAmountEth: bidAmountEth,
        salt: salt,
        commitmentHash: computedHash,
        fixedDepositEth: auction.fixedDepositEth,
        createdAt: new Date().toISOString(),
      };

      const res = await onCommitBid(auction.id, computedHash, secretObj);
      return {
        ok: res.success,
        msg: res.message,
      };
    });
  };

  const handleRevealSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numBid = Number(revealBidInput);
    if (Number.isNaN(numBid) || numBid <= 0 || !revealSaltInput.trim()) {
      setTxState('failed');
      setActionFeedback({
        type: 'error',
        text: 'Please provide both your original ETH bid amount and 32-byte hex salt.',
      });
      return;
    }

    await runSimulatedTxLifecycle(async () => {
      const result = await onRevealBid(auction.id, numBid, revealSaltInput.trim());
      return { ok: result.success, msg: result.message };
    });
  };

  const getTxStatusLabel = (state: TxLifecycleState) => {
    switch (state) {
      case 'waiting_approval':
        return '1/4 Waiting for wallet approval...';
      case 'submitted':
        return '2/4 Transaction submitted to Hardhat RPC...';
      case 'pending':
        return '3/4 Transaction pending block inclusion...';
      case 'confirmed':
        return '4/4 Transaction confirmed on-chain';
      case 'failed':
        return 'Transaction reverted or validation failed';
      default:
        return null;
    }
  };

  const txStatusLabel = getTxStatusLabel(txState);

  return (
    <div className="space-y-8 pb-16">
      {/* Top Bar: Navigation & Phase Transition Control */}
      <div className="flex items-center justify-between flex-wrap gap-3 border-b border-[#232730] pb-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#8E95A5] hover:text-[#F4F5F7] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Auctions</span>
        </button>

        <div className="flex items-center gap-4">
          <div className="text-xs font-mono text-[#8E95A5] tabular-nums">
            <span>Lot #{auction.numericId} ({auction.id})</span>
            <span className="mx-2 text-[#646C7E]" aria-hidden="true">·</span>
            <span>Seller: {shortenAddress(auction.sellerAddress)}</span>
          </div>

          {(auction.phase === 'Commit' || auction.phase === 'Reveal') && (
            <button
              type="button"
              onClick={() => onAdvancePhaseDemo(auction.id)}
              className="px-3.5 py-1.5 rounded-md bg-[#12141A] hover:bg-[#171A22] border border-[#232730] text-[#F4F5F7] text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {auction.phase === 'Commit'
                ? 'Advance to Reveal Phase'
                : 'Finalize Auction Window'}
            </button>
          )}
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (7 cols): Vehicle Gallery, Specifications, AI Valuation, Event Log */}
        <div className="lg:col-span-7 space-y-8">
          {/* Vehicle Gallery & Structured Spec Sheet */}
          <section className="bg-[#12141A] rounded-lg border border-[#232730] overflow-hidden">
            <div className="relative h-80 sm:h-96 bg-[#0B0C10] border-b border-[#232730]">
              <img
                src={auction.imageUrl}
                alt={auction.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="p-6 space-y-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono text-[#8E95A5] tabular-nums">
                  <span>{String(auction.attributes.manufacturing_year || '2024')}</span>
                  <span className="text-[#646C7E]" aria-hidden="true">·</span>
                  <span>{String(auction.attributes.fuel_type || 'Electric')}</span>
                  <span className="text-[#646C7E]" aria-hidden="true">·</span>
                  <span>{Number(auction.attributes.mileage_km || 0).toLocaleString('en-IN')} km</span>
                  <span className="text-[#646C7E]" aria-hidden="true">·</span>
                  <span>{String(auction.attributes.condition || 'Excellent')}</span>
                </div>
                <h1 className="text-2xl font-semibold text-[#F4F5F7] tracking-tight">{auction.title}</h1>
                <p className="text-sm text-[#8E95A5] leading-relaxed">{auction.subtitle}</p>
              </div>

              {/* Structured Specifications Table */}
              <div className="pt-5 border-t border-[#232730] space-y-3">
                <h2 className="text-[11px] font-mono uppercase tracking-[0.14em] text-[#8E95A5]">
                  Vehicle Dossier Specifications
                </h2>
                <dl className="grid grid-cols-2 sm:grid-cols-4 gap-y-4 gap-x-6 pt-2 text-xs">
                  {Object.entries(auction.attributes).map(([key, val]) => (
                    <div key={key} className="space-y-0.5">
                      <dt className="text-[#646C7E]">
                        {ATTRIBUTE_LABELS[key] || key}
                      </dt>
                      <dd className="font-mono font-semibold text-[#F4F5F7] tabular-nums">
                        {key === 'original_price_inr'
                          ? formatInr(Number(val))
                          : key === 'mileage_km'
                          ? `${Number(val).toLocaleString('en-IN')} km`
                          : String(val)}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </section>

          {/* AI Valuation & PriceOracle Record */}
          <PredictionWidget prediction={auction.aiPrediction} />

          {/* On-Chain Event Audit Trail Table */}
          <section className="bg-[#12141A] rounded-lg border border-[#232730] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#232730] flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[#F4F5F7]">
                On-Chain Event Audit Ledger
              </h2>
              <span className="text-xs font-mono text-[#8E95A5] tabular-nums">
                {auction.events.length} events recorded
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#0B0C10] text-[#8E95A5] border-b border-[#232730]">
                  <tr>
                    <th className="py-2.5 px-4 font-medium">Event</th>
                    <th className="py-2.5 px-4 font-medium">Summary</th>
                    <th className="py-2.5 px-4 font-medium text-right">Block / Tx</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#232730]">
                  {auction.events.map((ev) => (
                    <tr key={ev.id} className="hover:bg-[#171A22]/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-[#F4F5F7] whitespace-nowrap align-top">
                        {ev.eventName}
                      </td>
                      <td className="py-3 px-4 text-[#8E95A5] leading-relaxed align-top">
                        {ev.summary}
                      </td>
                      <td className="py-3 px-4 font-mono text-[#8E95A5] text-right whitespace-nowrap tabular-nums align-top">
                        <div>#{ev.blockNumber}</div>
                        <button
                          type="button"
                          onClick={() => inspectTransaction(ev.txHash)}
                          className="text-[11px] text-[#C5A46D] hover:text-[#D4B57E] underline cursor-pointer"
                          title="Inspect live transaction receipt on Hardhat RPC"
                        >
                          {shortenAddress(ev.txHash)}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* Right Column (5 cols): Contiguous Auction Terms & Bidding / Settlement Module */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
          {/* Auction Terms & Price Comparison Module */}
          <section className="bg-[#12141A] text-[#F4F5F7] rounded-lg border border-[#232730] overflow-hidden">
            <div className="p-6 border-b border-[#232730] flex items-center justify-between gap-4">
              <div>
                <div className="text-[11px] font-mono uppercase tracking-[0.14em] text-[#C5A46D]">
                  SealedAuction.sol Escrow
                </div>
                <h2 className="text-base font-semibold text-[#F4F5F7] mt-0.5">
                  Phase: {auction.phase}
                </h2>
              </div>

              {(auction.phase === 'Commit' || auction.phase === 'Reveal') && (
                <div className="text-right font-mono tabular-nums">
                  <div className="text-[11px] text-[#8E95A5] flex items-center justify-end gap-1">
                    <Clock className="w-3 h-3 text-[#C5A46D]" />
                    <span>{auction.phase} Window</span>
                  </div>
                  <div className="text-sm font-semibold text-[#F4F5F7] mt-0.5">
                    {countdown}
                  </div>
                </div>
              )}
            </div>

            {/* Price Distinction: Advisory AI Estimate (INR) vs Seller Reserve & Bidding (ETH) */}
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-3 gap-4 font-mono tabular-nums">
                <div>
                  <div className="text-[11px] font-sans uppercase tracking-wider text-[#8E95A5]">Starting Bid</div>
                  <div className="text-base font-semibold text-[#F4F5F7] mt-1">
                    {auction.startingBidEth.toFixed(2)} ETH
                  </div>
                  <div className="text-[11px] text-[#8E95A5] mt-0.5">
                    {formatEthToInr(auction.startingBidEth)}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] font-sans uppercase tracking-wider text-[#8E95A5]">Seller Reserve</div>
                  <div className="text-base font-semibold text-[#C5A46D] mt-1">
                    {auction.reservePriceEth.toFixed(2)} ETH
                  </div>
                  <div className="text-[11px] text-[#8E95A5] mt-0.5">
                    {formatEthToInr(auction.reservePriceEth)}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] font-sans uppercase tracking-wider text-[#8E95A5]">Fixed Deposit</div>
                  <div className="text-base font-semibold text-[#F4F5F7] mt-1">
                    {auction.fixedDepositEth.toFixed(2)} ETH
                  </div>
                  <div className="text-[11px] text-[#8E95A5] mt-0.5">
                    {formatEthToInr(auction.fixedDepositEth)}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#232730] flex items-center justify-between text-xs">
                <span className="text-[#8E95A5]">Advisory AI Valuation (INR)</span>
                <span className="font-mono font-semibold text-[#F4F5F7] tabular-nums">
                  {formatInr(auction.aiPrediction.predicted_price ?? auction.aiPrediction.predicted_price_inr)}
                </span>
              </div>

              <div className="pt-3 border-t border-[#232730] flex items-center justify-between text-xs">
                <span className="text-[#8E95A5]">Highest Revealed Bid</span>
                <span className="font-mono font-semibold text-[#F4F5F7] tabular-nums">
                  {auction.phase === 'Commit'
                    ? 'Concealed until Reveal Phase'
                    : auction.highestBidEth
                    ? `${auction.highestBidEth.toFixed(2)} ETH (${formatEthToInr(auction.highestBidEth)})`
                    : 'No revealed bids yet'}
                </span>
              </div>
            </div>
          </section>

          {/* Transaction Lifecycle Status Bar */}
          {txStatusLabel && (
            <div
              className={`px-4 py-3 rounded-lg border text-xs font-mono flex items-center justify-between ${
                txState === 'confirmed'
                  ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                  : txState === 'failed'
                  ? 'bg-rose-950/40 border-rose-500/30 text-rose-300'
                  : 'bg-[#12141A] border-[#C5A46D]/50 text-[#F4F5F7]'
              }`}
            >
              <span>{txStatusLabel}</span>
              <span className="text-[11px] text-[#8E95A5]">Chain 31337</span>
            </div>
          )}

          {actionFeedback && (
            <div
              className={`p-4 rounded-lg border text-xs flex items-start gap-2.5 ${
                actionFeedback.type === 'success'
                  ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200'
                  : 'bg-rose-950/30 border-rose-500/30 text-rose-200'
              }`}
            >
              {actionFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              )}
              <span className="leading-relaxed">{actionFeedback.text}</span>
            </div>
          )}

          {/* CASE 1: GUEST VIEW */}
          {!isConnected && (
            <section className="bg-[#12141A] rounded-lg border border-[#232730] p-6 space-y-4">
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-[#F4F5F7]">
                  Connect Wallet to Participate
                </h3>
                <p className="text-xs text-[#8E95A5] leading-relaxed">
                  Connect MetaMask or select a preconfigured Hardhat role (Seller, Bidder 1, Bidder 2, or Admin) to submit sealed commitments or reveal bids.
                </p>
              </div>
              <button
                type="button"
                onClick={openAuthModal}
                className="w-full py-2.5 px-4 rounded-md bg-[#C5A46D] hover:bg-[#D4B57E] text-[#0B0C10] text-xs font-semibold transition-colors cursor-pointer"
              >
                Connect Wallet
              </button>
            </section>
          )}

          {/* CASE 2: COMMIT PHASE PANEL */}
          {isConnected && auction.phase === 'Commit' && (
            <section className="bg-[#12141A] rounded-lg border border-[#232730] p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-[#232730] pb-4">
                <h3 className="text-base font-semibold text-[#F4F5F7] flex items-center gap-2">
                  <Lock className="w-4 h-4 text-[#C5A46D]" />
                  <span>Submit Sealed Commitment</span>
                </h3>
                <span className="text-xs font-mono text-[#8E95A5] tabular-nums">
                  Deposit: {auction.fixedDepositEth.toFixed(2)} ETH ({formatEthToInr(auction.fixedDepositEth)})
                </span>
              </div>

              {isSeller && (
                <div className="p-3.5 rounded-md bg-amber-950/30 border border-amber-500/30 text-xs text-amber-200 leading-relaxed">
                  <strong>Seller Restriction:</strong> You are connected as the seller of this vehicle. Switch to <strong>Bidder 1</strong> or <strong>Bidder 2</strong> in the top header to place a sealed bid.
                </div>
              )}

              {myCommitment ? (
                <div className="p-4 rounded-md bg-emerald-950/30 border border-emerald-500/30 space-y-2 text-xs">
                  <div className="font-semibold text-[#F4F5F7] flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Sealed Commitment Recorded On-Chain</span>
                  </div>
                  <div className="font-mono text-[11px] text-[#8E95A5] break-all">
                    Hash: {myCommitment.commitmentHash}
                  </div>
                  <div className="text-[#8E95A5] font-mono tabular-nums">
                    Locked Deposit: <strong className="text-[#F4F5F7]">{myCommitment.depositEth.toFixed(2)} ETH ({formatEthToInr(myCommitment.depositEth)})</strong> · Bid value remains concealed until Reveal phase.
                  </div>
                </div>
              ) : (
                <form onSubmit={handleCommitSubmit} className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-[11px] font-medium uppercase tracking-wider text-[#8E95A5]">
                        Confidential Bid (min {auction.startingBidEth.toFixed(2)} ETH / {formatEthToInr(auction.startingBidEth)})
                      </label>
                      <span className="text-xs font-mono font-semibold text-[#C5A46D] tabular-nums">
                        ≈ {formatEthToInr(bidAmountEth)}
                      </span>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      value={bidAmountEth}
                      onChange={(e) => setBidAmountEth(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-md border border-[#232730] bg-[#0B0C10] font-mono text-sm font-semibold text-[#F4F5F7] tabular-nums focus:outline-none focus:border-[#C5A46D]"
                    />
                    <div className="mt-1.5 flex items-center justify-between text-[11px] font-mono text-[#8E95A5] tabular-nums">
                      <span>
                        Indian Rupee Equivalent: <strong className="text-[#F4F5F7]">{formatEthToInr(bidAmountEth)}</strong>
                      </span>
                      <span>Rate: 1 ETH = {formatEthToInr(1)}</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[11px] font-medium uppercase tracking-wider text-[#8E95A5]">
                        32-Byte Secret Salt
                      </label>
                      <button
                        type="button"
                        onClick={() => setSalt(generateRandomSalt())}
                        className="text-xs font-medium text-[#C5A46D] hover:text-[#D4B57E] flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3" /> Regenerate
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        readOnly
                        value={salt}
                        className="flex-1 px-3 py-2 rounded-md bg-[#0B0C10] border border-[#232730] font-mono text-xs text-[#8E95A5]"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(salt);
                          setCopiedSalt(true);
                          setTimeout(() => setCopiedSalt(false), 1500);
                        }}
                        className="px-3 py-2 rounded-md border border-[#232730] bg-[#0B0C10] hover:bg-[#171A22] text-xs text-[#F4F5F7] transition-colors cursor-pointer"
                        aria-label="Copy salt"
                      >
                        {copiedSalt ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="p-3 rounded-md bg-[#0B0C10] border border-[#232730] font-mono text-[11px] space-y-1">
                    <div className="text-[#646C7E]">
                      keccak256(auctionId, bidder, bidAmountWei, salt)
                    </div>
                    <div className="break-all text-[#F4F5F7]">{computedHash}</div>
                  </div>

                  {/* Salt Backup Export & Acknowledgement */}
                  <div className="p-4 rounded-md bg-[#0B0C10] border border-[#232730] space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-[#F4F5F7]">
                        Reveal Key Backup (.json)
                      </span>
                      <button
                        type="button"
                        onClick={handleDownloadRevealJson}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#12141A] border border-[#232730] hover:border-[#C5A46D]/40 text-[#F4F5F7] text-xs font-medium transition-colors cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5 text-[#C5A46D]" />
                        <span>Download Backup</span>
                      </button>
                    </div>

                    <label className="flex items-start gap-2.5 text-xs text-[#8E95A5] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={backupSavedAck}
                        onChange={(e) => setBackupSavedAck(e.target.checked)}
                        className="mt-0.5 rounded border-[#232730] bg-[#0B0C10]"
                      />
                      <span className="leading-relaxed">
                        I have saved my bid amount and secret salt. Unrevealed commitments forfeit the{' '}
                        <strong className="text-[#F4F5F7] font-mono">{auction.fixedDepositEth.toFixed(2)} ETH ({formatEthToInr(auction.fixedDepositEth)})</strong> deposit.
                      </span>
                    </label>
                  </div>

                  {!isCorrectNetwork ? (
                    <button
                      type="button"
                      onClick={switchNetworkToHardhat}
                      className="w-full py-2.5 px-4 rounded-md bg-[#C5A46D] text-[#0B0C10] text-xs font-semibold cursor-pointer"
                    >
                      Switch to Hardhat Chain ID 31337
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={!backupSavedAck || Boolean(isSeller) || txState === 'waiting_approval' || txState === 'pending'}
                      className="w-full py-2.5 px-4 rounded-md bg-[#C5A46D] hover:bg-[#D4B57E] disabled:opacity-50 text-[#0B0C10] text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Commit Sealed Hash & Lock {auction.fixedDepositEth.toFixed(2)} ETH ({formatEthToInr(auction.fixedDepositEth)})
                    </button>
                  )}
                </form>
              )}
            </section>
          )}

          {/* CASE 3: REVEAL PHASE PANEL */}
          {isConnected && auction.phase === 'Reveal' && (
            <section className="bg-[#12141A] rounded-lg border border-[#232730] p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-[#232730] pb-4">
                <h3 className="text-base font-semibold text-[#F4F5F7] flex items-center gap-2">
                  <Eye className="w-4 h-4 text-[#C5A46D]" />
                  <span>Reveal Sealed Bid</span>
                </h3>
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#0B0C10] border border-[#232730] text-[#F4F5F7] text-xs font-medium cursor-pointer hover:border-[#C5A46D]/40 transition-colors">
                  <Upload className="w-3.5 h-3.5 text-[#C5A46D]" />
                  <span>Import Backup JSON</span>
                  <input
                    type="file"
                    accept=".json,application/json"
                    onChange={handleImportRevealJson}
                    className="hidden"
                  />
                </label>
              </div>

              {myCommitment?.revealed ? (
                <div className="p-4 rounded-md bg-emerald-950/30 border border-emerald-500/30 text-xs space-y-1.5">
                  <div className="font-semibold text-[#F4F5F7] flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Bid Verified & Revealed On-Chain</span>
                  </div>
                  <div className="font-mono text-emerald-300 tabular-nums">
                    Revealed Bid: <strong>{myCommitment.revealedAmountEth?.toFixed(2)} ETH ({formatEthToInr(myCommitment.revealedAmountEth || 0)})</strong>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleRevealSubmit} className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-[11px] font-medium uppercase tracking-wider text-[#8E95A5]">
                        Original Committed Bid Amount (Test ETH)
                      </label>
                      <span className="text-xs font-mono font-semibold text-[#C5A46D] tabular-nums">
                        ≈ {formatEthToInr(revealBidInput)}
                      </span>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      value={revealBidInput}
                      onChange={(e) => setRevealBidInput(e.target.value)}
                      placeholder="e.g., 15.00"
                      className="w-full px-3.5 py-2.5 rounded-md border border-[#232730] bg-[#0B0C10] font-mono text-sm font-semibold text-[#F4F5F7] tabular-nums focus:outline-none focus:border-[#C5A46D]"
                    />
                    <div className="mt-1.5 flex items-center justify-between text-[11px] font-mono text-[#8E95A5] tabular-nums">
                      <span>
                        Indian Rupee Equivalent: <strong className="text-[#F4F5F7]">{formatEthToInr(revealBidInput)}</strong>
                      </span>
                      <span>1 ETH = ₹{ETH_TO_INR_RATE.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium uppercase tracking-wider text-[#8E95A5] mb-1.5">
                      Original 32-Byte Secret Salt (0x...)
                    </label>
                    <input
                      type="text"
                      value={revealSaltInput}
                      onChange={(e) => setRevealSaltInput(e.target.value)}
                      placeholder="0x..."
                      className="w-full px-3.5 py-2.5 rounded-md border border-[#232730] bg-[#0B0C10] font-mono text-xs text-[#F4F5F7] focus:outline-none focus:border-[#C5A46D]"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 rounded-md bg-[#C5A46D] hover:bg-[#D4B57E] text-[#0B0C10] text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Verify Hash & Reveal Bid
                  </button>
                </form>
              )}

              <div className="pt-4 border-t border-[#232730]">
                <button
                  type="button"
                  onClick={() =>
                    runSimulatedTxLifecycle(async () => {
                      const res = await onFinalizeAuction(auction.id);
                      return {
                        ok: res.success,
                        msg: res.message,
                      };
                    })
                  }
                  className="w-full py-2.5 px-4 rounded-md bg-[#0B0C10] border border-[#232730] hover:border-[#C5A46D]/40 text-[#F4F5F7] text-xs font-medium transition-colors cursor-pointer"
                >
                  Execute finalizeAuction() & Resolve Reserve Check
                </button>
              </div>
            </section>
          )}

          {/* CASE 4: FINALIZED OUTCOME & PULL-BASED SETTLEMENT */}
          {(auction.phase === 'Sold' || auction.phase === 'No Sale') && (
            <section className="bg-[#12141A] rounded-lg border border-[#232730] p-6 space-y-5">
              <div className="border-b border-[#232730] pb-4">
                <div className="text-[11px] font-mono uppercase tracking-[0.14em] text-[#C5A46D]">Finalized Settlement</div>
                <h3 className="text-base font-semibold text-[#F4F5F7] mt-0.5">
                  Outcome: {auction.phase === 'Sold' ? 'Sold (Reserve Met)' : 'No Sale (Below Reserve)'}
                </h3>
              </div>

              {auction.phase === 'Sold' ? (
                <dl className="space-y-2 text-xs font-mono tabular-nums">
                  <div className="flex justify-between">
                    <dt className="font-sans text-[#8E95A5]">Winning Bidder</dt>
                    <dd className="text-[#F4F5F7] font-semibold">
                      {shortenAddress(auction.winningBidderAddress || '')} ({auction.winningBidderEns})
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-sans text-[#8E95A5]">Winning Bid</dt>
                    <dd className="text-[#C5A46D] font-semibold">
                      {auction.highestBidEth?.toFixed(2)} ETH ({formatEthToInr(auction.highestBidEth || 0)}) · Reserve {auction.reservePriceEth.toFixed(2)} ETH ({formatEthToInr(auction.reservePriceEth)})
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-sans text-[#8E95A5]">Escrow Status</dt>
                    <dd className="text-[#F4F5F7] font-sans font-medium">
                      {auction.winnerSettled ? 'Winner Balance Settled' : 'Awaiting Winner Settlement'}
                    </dd>
                  </div>
                </dl>
              ) : (
                <p className="text-xs text-[#8E95A5] leading-relaxed">
                  Highest revealed bid ({auction.highestBidEth?.toFixed(2) || '0.00'} ETH / {formatEthToInr(auction.highestBidEth || 0)}) did not meet the seller&apos;s reserve price of{' '}
                  <strong className="text-[#F4F5F7] font-mono">{auction.reservePriceEth.toFixed(2)} ETH ({formatEthToInr(auction.reservePriceEth)})</strong>. All revealed bidders may claim a full pull-based deposit refund.
                </p>
              )}

              {isConnected && wallet && (
                <div className="space-y-2.5 pt-2">
                  {auction.phase === 'Sold' &&
                    !auction.winnerSettled &&
                    auction.winningBidderAddress?.toLowerCase() ===
                      wallet.address.toLowerCase() && (
                      <button
                        type="button"
                        onClick={() =>
                          runSimulatedTxLifecycle(async () => {
                            const res = await onSettleWinner(auction.id);
                            return {
                              ok: res.success,
                              msg: res.message,
                            };
                          })
                        }
                        className="w-full py-2.5 px-4 rounded-md bg-[#C5A46D] hover:bg-[#D4B57E] text-[#0B0C10] text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Settle Remaining Balance (
                        {((auction.highestBidEth || 0) - auction.fixedDepositEth).toFixed(2)} ETH /{' '}
                        {formatEthToInr((auction.highestBidEth || 0) - auction.fixedDepositEth)})
                      </button>
                    )}

                  {auction.phase === 'Sold' &&
                    auction.winnerSettled &&
                    !auction.sellerWithdrawn &&
                    isSeller && (
                      <button
                        type="button"
                        onClick={() =>
                          runSimulatedTxLifecycle(async () => {
                            const res = await onWithdrawProceeds(auction.id);
                            return {
                              ok: res.success,
                              msg: res.message,
                            };
                          })
                        }
                        className="w-full py-2.5 px-4 rounded-md bg-[#C5A46D] hover:bg-[#D4B57E] text-[#0B0C10] text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Withdraw Sale Proceeds ({auction.highestBidEth?.toFixed(2)} ETH /{' '}
                        {formatEthToInr(auction.highestBidEth || 0)})
                      </button>
                    )}

                  {myCommitment &&
                    myCommitment.revealed &&
                    !myCommitment.depositRefunded &&
                    (auction.phase === 'No Sale' ||
                      auction.winningBidderAddress?.toLowerCase() !==
                        wallet.address.toLowerCase()) && (
                      <button
                        type="button"
                        onClick={() =>
                          runSimulatedTxLifecycle(async () => {
                            const res = await onClaimRefund(auction.id);
                            return {
                              ok: res.success,
                              msg: res.message,
                            };
                          })
                        }
                        className="w-full py-2.5 px-4 rounded-md bg-[#C5A46D] hover:bg-[#D4B57E] text-[#0B0C10] text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Claim Deposit Refund ({myCommitment.depositEth.toFixed(2)} ETH /{' '}
                        {formatEthToInr(myCommitment.depositEth)})
                      </button>
                    )}
                </div>
              )}
            </section>
          )}

          {/* Recorded Commitments Table (Strict Confidentiality in Commit Phase) */}
          <section className="bg-[#12141A] rounded-lg border border-[#232730] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#232730] flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#F4F5F7]">
                Commitments ({auction.commitments.length})
              </h3>
              <span className="text-xs text-[#8E95A5]">
                {auction.phase === 'Commit' ? 'Values Sealed' : 'Reveal Verification'}
              </span>
            </div>

            {auction.commitments.length === 0 ? (
              <div className="p-6 text-xs text-[#8E95A5]">
                No sealed commitments submitted for this lot yet.
              </div>
            ) : (
              <div className="divide-y divide-[#232730]">
                {auction.commitments.map((c) => (
                  <div
                    key={c.id}
                    className="px-6 py-3.5 flex items-center justify-between gap-4 text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="font-medium text-[#F4F5F7]">
                        {c.bidderEns} <span className="font-mono text-[#8E95A5]">({shortenAddress(c.bidderAddress)})</span>
                      </div>
                      <div className="font-mono text-[11px] text-[#646C7E]">
                        Hash: {c.commitmentHash.slice(0, 16)}...
                      </div>
                    </div>

                    <div className="text-right font-mono tabular-nums shrink-0">
                      {c.revealed && auction.phase !== 'Commit' ? (
                        <span className="text-emerald-400 font-semibold">
                          Revealed: {c.revealedAmountEth?.toFixed(2)} ETH ({formatEthToInr(c.revealedAmountEth || 0)})
                        </span>
                      ) : (
                        <span className="text-[#8E95A5]">
                          Sealed · {c.depositEth.toFixed(2)} ETH ({formatEthToInr(c.depositEth)}) locked
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};
