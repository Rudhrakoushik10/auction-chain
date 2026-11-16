import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertCircle,
  Trophy,
  Gavel,
  Sparkles,
  Car,
  Wallet,
  Eye,
  EyeOff,
  ExternalLink,
} from 'lucide-react';
import { AuctionItem } from '../types/auction';
import {
  shortenAddress,
  formatInr,
  formatInrFromEth,
  inrToEth,
} from '../lib/crypto';
import { useWallet } from '../context/WalletContext';
import { findRoleAccountByAddress } from '../lib/hardhatConfig';

interface AuctionDetailsProps {
  auction: AuctionItem;
  onBack: () => void;
  onPlaceBid: (
    auctionId: string,
    bidAmountEth: number
  ) => Promise<{ success: boolean; message: string }>;
  onCloseBiddingWindow: (auctionId: string) => void;
  onApproveHighestBid: (
    auctionId: string
  ) => Promise<{ success: boolean; message: string }>;
  onPayWinningBid: (
    auctionId: string
  ) => Promise<{ success: boolean; message: string }>;
}

function resolveParticipantLabel(address?: string, fallbackEns?: string): string {
  if (!address) return '—';
  const account = findRoleAccountByAddress(address);
  if (account) {
    return `${account.label} (${shortenAddress(address)})`;
  }
  return fallbackEns ? `${fallbackEns} (${shortenAddress(address)})` : shortenAddress(address);
}

function formatCountdown(targetIso: string, nowMs: number): { text: string; expired: boolean } {
  const targetMs = new Date(targetIso).getTime();
  if (!Number.isFinite(targetMs)) return { text: '00:00', expired: true };
  const diffSec = Math.max(0, Math.floor((targetMs - nowMs) / 1000));
  if (diffSec <= 0) return { text: '00:00', expired: true };
  const mins = Math.floor(diffSec / 60);
  const secs = diffSec % 60;
  return {
    text: `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`,
    expired: false,
  };
}

export const AuctionDetails: React.FC<AuctionDetailsProps> = ({
  auction,
  onBack,
  onPlaceBid,
  onCloseBiddingWindow,
  onApproveHighestBid,
  onPayWinningBid,
}) => {
  const { wallet, openAuthModal, inspectTransaction } = useWallet();

  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const [bidAmountInput, setBidAmountInput] = useState<string>(() =>
    (auction.startingBidEth + 0.05).toFixed(2)
  );
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const countdown = formatCountdown(auction.commitEndTime, nowMs);

  // Auto-trigger window close if countdown expires while viewing
  useEffect(() => {
    if (auction.phase === 'Commit' && countdown.expired) {
      onCloseBiddingWindow(auction.id);
    }
  }, [auction.phase, countdown.expired, auction.id, onCloseBiddingWindow]);

  const myBid = wallet
    ? auction.commitments.find(
        (c) => c.bidderAddress.toLowerCase() === wallet.address.toLowerCase()
      )
    : undefined;

  const isSeller = wallet?.role === 'seller';
  const isBidder = wallet?.role === 'bidder';
  const isWinner =
    Boolean(wallet) &&
    Boolean(auction.winningBidderAddress) &&
    wallet!.address.toLowerCase() === auction.winningBidderAddress!.toLowerCase();

  const bidsAreRevealed = auction.phase !== 'Commit';

  // Ranked bids (sorted highest to lowest once revealed)
  const rankedBids = [...auction.commitments].sort((a, b) => {
    const diff = (b.revealedAmountEth || 0) - (a.revealedAmountEth || 0);
    if (diff !== 0) return diff;
    return a.committedTimestamp - b.committedTimestamp;
  });

  const currentStageIndex =
    auction.phase === 'Commit'
      ? 1
      : auction.phase === 'Reveal'
      ? 2
      : auction.phase === 'Sold' && !auction.winnerSettled
      ? 3
      : 4;

  const handleBidSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    const parsed = parseFloat(bidAmountInput);
    if (isNaN(parsed) || parsed < auction.startingBidEth) {
      setFeedback({
        type: 'error',
        message: `Please enter a bid of at least ${auction.startingBidEth.toFixed(2)} ETH.`,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await onPlaceBid(auction.id, parsed);
      setFeedback({
        type: res.success ? 'success' : 'error',
        message: res.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSellerApprove = async () => {
    setFeedback(null);
    setIsSubmitting(true);
    try {
      const res = await onApproveHighestBid(auction.id);
      setFeedback({
        type: res.success ? 'success' : 'error',
        message: res.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWinnerPay = async () => {
    setFeedback(null);
    setIsSubmitting(true);
    try {
      const res = await onPayWinningBid(auction.id);
      setFeedback({
        type: res.success ? 'success' : 'error',
        message: res.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const aiInr = auction.aiPrediction.predicted_price_inr || auction.aiPrediction.predicted_price;

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 border border-slate-800 px-3.5 py-2 rounded-xl self-start cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        {/* 4-Step Progress Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full sm:w-auto">
          {[
            { step: 1, label: '1. Bidding Open' },
            { step: 2, label: '2. Bids Revealed' },
            { step: 3, label: '3. Seller Approval' },
            { step: 4, label: '4. Paid & Closed' },
          ].map((item) => {
            const active = currentStageIndex === item.step;
            const done = currentStageIndex > item.step || (currentStageIndex === 4 && item.step === 4);
            return (
              <div
                key={item.step}
                className={`px-3 py-1.5 rounded-lg border text-[11px] font-semibold flex items-center gap-1.5 ${
                  done
                    ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                    : active
                    ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-200'
                    : 'bg-slate-900/60 border-slate-800 text-slate-500'
                }`}
              >
                {done && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                <span>{item.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN (7 cols): Vehicle Overview, AI Valuation, & Bids Table */}
        <div className="lg:col-span-7 space-y-6">
          {/* Vehicle Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden">
            {auction.imageUrl ? (
              <div className="relative h-64 sm:h-72 bg-slate-950">
                <img
                  src={auction.imageUrl}
                  alt={auction.title}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="h-44 bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950/40 flex flex-col items-center justify-center border-b border-slate-800/80">
                <Car className="w-12 h-12 text-indigo-400/70 mb-2" />
                <span className="text-xs text-slate-400 font-medium">{auction.title}</span>
              </div>
            )}

            <div className="p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <span className="text-xs font-mono text-slate-400">
                    Lot #{auction.numericId} · Seller {shortenAddress(auction.sellerAddress)}
                  </span>
                  <h1 className="text-2xl font-bold text-white mt-1">{auction.title}</h1>
                  <p className="text-xs text-slate-400 mt-1">{auction.subtitle}</p>
                </div>

                <div className="text-right">
                  <div className="text-[11px] text-slate-400">Starting Price</div>
                  <div className="text-xl font-bold text-white font-mono">
                    {auction.startingBidEth.toFixed(2)} ETH
                  </div>
                  <div className="text-xs text-slate-400 font-mono">
                    {formatInrFromEth(auction.startingBidEth)}
                  </div>
                </div>
              </div>

              {/* Clean Vehicle Specs Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800/80">
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/70">
                  <div className="text-[11px] text-slate-400">Year</div>
                  <div className="text-sm font-semibold text-white mt-0.5">
                    {String(auction.attributes.year || '—')}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/70">
                  <div className="text-[11px] text-slate-400">Mileage</div>
                  <div className="text-sm font-semibold text-white mt-0.5">
                    {auction.attributes.mileage_km
                      ? `${Number(auction.attributes.mileage_km).toLocaleString('en-IN')} km`
                      : `${Number(auction.attributes.mileage || 0).toLocaleString()} mi`}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/70">
                  <div className="text-[11px] text-slate-400">Fuel & Gear</div>
                  <div className="text-sm font-semibold text-white mt-0.5 truncate">
                    {String(auction.attributes.fuel_type || 'Petrol')} ·{' '}
                    {String(auction.attributes.transmission || 'Auto')}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/70">
                  <div className="text-[11px] text-slate-400">Condition</div>
                  <div className="text-sm font-semibold text-emerald-400 mt-0.5">
                    {String(auction.attributes.condition || 'Clean Title')}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* AI Fair Valuation Summary */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <div className="text-xs font-semibold text-indigo-300">
                  AI Fair Market Valuation
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {auction.aiPrediction.valuation_summary ||
                    `Evaluated using ${auction.aiPrediction.model_version}`}
                </p>
              </div>
            </div>
            <div className="sm:text-right shrink-0">
              <div className="text-xl font-extrabold text-white font-mono">
                {formatInr(aiInr)}
              </div>
              <div className="text-xs text-indigo-300 font-mono">
                ≈ {inrToEth(aiInr).toFixed(4)} ETH
              </div>
            </div>
          </div>

          {/* Bids Section: Hidden during window, Revealed to everyone once window closes */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {bidsAreRevealed ? (
                  <Eye className="w-4 h-4 text-emerald-400" />
                ) : (
                  <EyeOff className="w-4 h-4 text-amber-400" />
                )}
                <h2 className="text-base font-bold text-white">
                  {bidsAreRevealed
                    ? `Revealed Bids (${auction.commitments.length})`
                    : `Participant Bids (${auction.commitments.length})`}
                </h2>
              </div>
              <span className="text-xs text-slate-400">
                {bidsAreRevealed
                  ? 'Visible to seller and all participants'
                  : 'Amounts hidden until bidding window ends'}
              </span>
            </div>

            {auction.commitments.length === 0 ? (
              <div className="p-8 rounded-xl bg-slate-950/60 border border-slate-800/80 text-center">
                <p className="text-sm text-slate-400">
                  {auction.phase === 'Commit'
                    ? 'No bids placed yet. Bidders can submit their bid while the timer is open.'
                    : 'No bids were submitted during the bidding window.'}
                </p>
              </div>
            ) : !bidsAreRevealed ? (
              /* During Open Bidding Window: Show participants who bid, keep amounts hidden from others */
              <div className="space-y-2.5">
                {auction.commitments.map((c, idx) => {
                  const isMine =
                    Boolean(wallet) &&
                    c.bidderAddress.toLowerCase() === wallet!.address.toLowerCase();
                  return (
                    <div
                      key={c.id}
                      className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-slate-300 flex items-center justify-center">
                          #{idx + 1}
                        </span>
                        <div>
                          <div className="text-xs font-semibold text-white">
                            {resolveParticipantLabel(c.bidderAddress, c.bidderEns)}
                            {isMine && (
                              <span className="ml-2 text-[11px] text-indigo-400 font-normal">
                                (You)
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Submitted {new Date(c.committedAt).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        {isMine && c.revealedAmountEth ? (
                          <div>
                            <div className="text-xs font-bold text-indigo-300 font-mono">
                              Your Bid: {c.revealedAmountEth.toFixed(4)} ETH
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              {formatInrFromEth(c.revealedAmountEth)}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs font-mono text-amber-300/90 bg-amber-950/30 border border-amber-500/30 px-2.5 py-1 rounded-lg">
                            Hidden until window ends
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* After Bidding Window Closes: Reveal all bids to seller & participants, highlight highest bid */
              <div className="space-y-3">
                {rankedBids.map((c, idx) => {
                  const isHighest = idx === 0 && (c.revealedAmountEth || 0) >= auction.startingBidEth;
                  const isMine =
                    Boolean(wallet) &&
                    c.bidderAddress.toLowerCase() === wallet!.address.toLowerCase();
                  const amountEth = c.revealedAmountEth || 0;

                  return (
                    <div
                      key={c.id}
                      className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isHighest
                          ? 'bg-emerald-950/25 border-emerald-500/50'
                          : 'bg-slate-950/70 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold font-mono shrink-0 ${
                            isHighest
                              ? 'bg-emerald-500 text-slate-950'
                              : 'bg-slate-900 border border-slate-700 text-slate-300'
                          }`}
                        >
                          {isHighest ? <Trophy className="w-4 h-4" /> : `#${idx + 1}`}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white flex items-center gap-2">
                            <span>{resolveParticipantLabel(c.bidderAddress, c.bidderEns)}</span>
                            {isMine && (
                              <span className="text-xs font-normal text-indigo-400">(You)</span>
                            )}
                            {isHighest && (
                              <span className="text-[11px] font-semibold text-emerald-300 bg-emerald-950/60 border border-emerald-500/40 px-2 py-0.5 rounded-md">
                                Highest Bid
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                            <span>Bid placed {new Date(c.committedAt).toLocaleTimeString()}</span>
                            <button
                              type="button"
                              onClick={() => inspectTransaction(c.txHash)}
                              className="text-indigo-400 hover:text-indigo-300 font-mono inline-flex items-center gap-0.5"
                            >
                              {c.txHash.slice(0, 10)}...
                              <ExternalLink className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="sm:text-right">
                        <div className="text-lg font-extrabold text-white font-mono">
                          {amountEth.toFixed(4)} ETH
                        </div>
                        <div className="text-xs text-emerald-400 font-mono">
                          {formatInrFromEth(amountEth)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN (5 cols): Focused Action Panel */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
            {/* Feedback Banner */}
            {feedback && (
              <div
                className={`mb-5 p-3.5 rounded-xl border flex items-start gap-2.5 text-xs ${
                  feedback.type === 'success'
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                    : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                }`}
              >
                {feedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                )}
                <span>{feedback.message}</span>
              </div>
            )}

            {/* ================= STAGE 1: BIDDING WINDOW OPEN ================= */}
            {auction.phase === 'Commit' && (
              <div className="space-y-5">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div>
                    <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                      Step 1 of 4 · Bidding Open
                    </span>
                    <h2 className="text-lg font-bold text-white mt-0.5">
                      Submit Your Bid
                    </h2>
                  </div>
                  <div className="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-right">
                    <div className="text-[10px] text-slate-400 uppercase flex items-center justify-end gap-1">
                      <Clock className="w-3 h-3 text-indigo-400" />
                      Time Left
                    </div>
                    <div className="text-base font-extrabold text-white font-mono">
                      {countdown.text}
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Bids remain private while the window is open. When the timer finishes, all bids are revealed to the seller and participants. No upfront deposit is required.
                </p>

                {!wallet ? (
                  <button
                    onClick={openAuthModal}
                    className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Wallet className="w-4 h-4" />
                    Connect Wallet to Bid
                  </button>
                ) : isBidder ? (
                  <form onSubmit={handleBidSubmit} className="space-y-4">
                    {myBid && myBid.revealedAmountEth && (
                      <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/30 flex items-center justify-between">
                        <span className="text-xs text-indigo-200">Your current bid:</span>
                        <span className="text-sm font-bold text-white font-mono">
                          {myBid.revealedAmountEth.toFixed(4)} ETH ({formatInrFromEth(myBid.revealedAmountEth)})
                        </span>
                      </div>
                    )}

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-semibold text-slate-200">
                          {myBid ? 'Increase Your Bid (ETH)' : 'Your Bid Amount (ETH)'}
                        </label>
                        <span className="text-[11px] text-slate-400 font-mono">
                          Min: {auction.startingBidEth.toFixed(2)} ETH
                        </span>
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        min={auction.startingBidEth}
                        value={bidAmountInput}
                        onChange={(e) => setBidAmountInput(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-lg text-white font-mono focus:outline-none focus:border-indigo-500"
                      />
                      <div className="mt-1.5 text-xs text-emerald-400 font-mono">
                        ≈ {formatInrFromEth(parseFloat(bidAmountInput) || 0)}
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <Gavel className="w-4 h-4" />
                      {isSubmitting
                        ? 'Confirming in MetaMask...'
                        : myBid
                        ? 'Update Bid'
                        : 'Submit Bid'}
                    </button>
                  </form>
                ) : isSeller ? (
                  <div className="space-y-4 pt-1">
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                      <span className="text-xs text-slate-400">Bids Received So Far</span>
                      <span className="text-lg font-bold text-white font-mono">
                        {auction.commitments.length}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onCloseBiddingWindow(auction.id)}
                      className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <Clock className="w-4 h-4" />
                      Close Bidding Window & Reveal Bids
                    </button>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400">
                    Switch to Bidder 1 or Bidder 2 in the header to place a bid.
                  </div>
                )}
              </div>
            )}

            {/* ================= STAGE 2: BIDS REVEALED · SELLER APPROVAL ================= */}
            {auction.phase === 'Reveal' && (
              <div className="space-y-5">
                <div className="pb-4 border-b border-slate-800">
                  <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                    Step 2 of 4 · Bidding Window Closed
                  </span>
                  <h2 className="text-lg font-bold text-white mt-0.5">
                    Bids Revealed · Awaiting Seller Approval
                  </h2>
                </div>

                {auction.highestBidEth && auction.winningBidderAddress ? (
                  <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
                        <Trophy className="w-4 h-4 text-emerald-400" />
                        Highest Bid for Seller
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        {auction.commitments.length} total bid(s)
                      </span>
                    </div>
                    <div className="text-2xl font-extrabold text-white font-mono">
                      {auction.highestBidEth.toFixed(4)} ETH
                    </div>
                    <div className="text-xs text-emerald-400 font-mono">
                      {formatInrFromEth(auction.highestBidEth)}
                    </div>
                    <div className="pt-2 border-t border-emerald-500/20 text-xs text-slate-300">
                      Top Bidder:{' '}
                      <span className="font-semibold text-white">
                        {resolveParticipantLabel(
                          auction.winningBidderAddress,
                          auction.winningBidderEns
                        )}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400">
                    No bids were placed during the bidding window.
                  </div>
                )}

                {isSeller ? (
                  <button
                    type="button"
                    onClick={handleSellerApprove}
                    disabled={isSubmitting}
                    className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {isSubmitting
                      ? 'Confirming in MetaMask...'
                      : auction.highestBidEth
                      ? `Approve Highest Bid (${auction.highestBidEth.toFixed(4)} ETH)`
                      : 'Close Auction (No Bids)'}
                  </button>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                    All bids are now visible on the left. Waiting for the{' '}
                    <span className="font-semibold text-white">Vehicle Seller</span> to approve the highest bid.
                  </div>
                )}
              </div>
            )}

            {/* ================= STAGE 3: SELLER APPROVED · WINNER PAYS ================= */}
            {auction.phase === 'Sold' && !auction.winnerSettled && (
              <div className="space-y-5">
                <div className="pb-4 border-b border-slate-800">
                  <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                    Step 3 of 4 · Bid Approved by Seller
                  </span>
                  <h2 className="text-lg font-bold text-white mt-0.5">
                    Winner Payment Required
                  </h2>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Approved Winning Bid</span>
                    <span>Payable to Seller</span>
                  </div>
                  <div className="text-2xl font-extrabold text-white font-mono">
                    {(auction.highestBidEth || auction.startingBidEth).toFixed(4)} ETH
                  </div>
                  <div className="text-xs text-emerald-400 font-mono">
                    {formatInrFromEth(auction.highestBidEth || auction.startingBidEth)}
                  </div>
                  <div className="pt-2 border-t border-slate-800 text-xs text-slate-300">
                    Approved Winner:{' '}
                    <span className="font-semibold text-white">
                      {resolveParticipantLabel(
                        auction.winningBidderAddress,
                        auction.winningBidderEns
                      )}
                    </span>
                  </div>
                </div>

                {isWinner ? (
                  <button
                    type="button"
                    onClick={handleWinnerPay}
                    disabled={isSubmitting}
                    className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Wallet className="w-4 h-4" />
                    {isSubmitting
                      ? 'Confirming Payment in MetaMask...'
                      : `Pay ${(auction.highestBidEth || auction.startingBidEth).toFixed(4)} ETH & Complete Purchase`}
                  </button>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                    The Seller has approved the highest bid. Switch to the winning bidder account (
                    <span className="font-semibold text-white">
                      {resolveParticipantLabel(
                        auction.winningBidderAddress,
                        auction.winningBidderEns
                      )}
                    </span>
                    ) to pay and close the auction.
                  </div>
                )}
              </div>
            )}

            {/* ================= STAGE 4: TRANSACTION COMPLETE & AUCTION CLOSED ================= */}
            {((auction.phase === 'Sold' && auction.winnerSettled) ||
              auction.phase === 'No Sale') && (
              <div className="space-y-5">
                <div className="pb-4 border-b border-slate-800">
                  <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                    Step 4 of 4 · Auction Closed
                  </span>
                  <h2 className="text-lg font-bold text-white mt-0.5">
                    {auction.phase === 'Sold'
                      ? 'Payment Complete · Vehicle Sold'
                      : 'Auction Closed (No Sale)'}
                  </h2>
                </div>

                {auction.phase === 'Sold' ? (
                  <div className="p-5 rounded-xl bg-emerald-950/30 border border-emerald-500/40 space-y-3">
                    <div className="flex items-center gap-2 text-emerald-300 text-xs font-semibold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Full Payment Transferred to Seller</span>
                    </div>
                    <div>
                      <div className="text-2xl font-extrabold text-white font-mono">
                        {(auction.highestBidEth || 0).toFixed(4)} ETH
                      </div>
                      <div className="text-xs text-emerald-400 font-mono">
                        {formatInrFromEth(auction.highestBidEth || 0)}
                      </div>
                    </div>
                    <div className="pt-3 border-t border-emerald-500/20 space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Buyer</span>
                        <span className="text-white font-semibold">
                          {resolveParticipantLabel(
                            auction.winningBidderAddress,
                            auction.winningBidderEns
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Seller</span>
                        <span className="text-white font-semibold">
                          {resolveParticipantLabel(auction.sellerAddress, auction.sellerEns)}
                        </span>
                      </div>
                      {auction.settlementTxHash && (
                        <div className="flex justify-between items-center pt-1">
                          <span className="text-slate-400">Settlement Tx</span>
                          <button
                            type="button"
                            onClick={() => inspectTransaction(auction.settlementTxHash!)}
                            className="text-indigo-400 hover:text-indigo-300 font-mono inline-flex items-center gap-1"
                          >
                            {auction.settlementTxHash.slice(0, 12)}...
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400">
                    This auction closed without any qualifying bids.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Compact On-Chain Activity Log */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
              On-Chain Activity ({auction.events.length})
            </h3>
            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {auction.events.map((evt) => (
                <div
                  key={evt.id}
                  className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs flex items-start justify-between gap-2"
                >
                  <div>
                    <div className="font-medium text-slate-200">{evt.summary}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Block #{evt.blockNumber} · {new Date(evt.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => inspectTransaction(evt.txHash)}
                    className="text-[11px] font-mono text-indigo-400 hover:text-indigo-300 shrink-0"
                  >
                    {evt.txHash.slice(0, 8)}...
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
