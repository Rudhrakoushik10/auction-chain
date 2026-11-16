import React, { useState } from 'react';
import {
  Gavel,
  Trophy,
  CheckCircle2,
  Clock,
  Wallet,
  Eye,
  AlertCircle,
} from 'lucide-react';
import { AuctionItem } from '../../types/auction';
import { useWallet } from '../../context/WalletContext';
import { formatInrFromEth } from '../../lib/crypto';
import { Marketplace } from '../Marketplace';

interface BidderDashboardProps {
  auctions: AuctionItem[];
  onSelectAuction: (auction: AuctionItem) => void;
  onPayWinningBid: (auctionId: string) => Promise<{ success: boolean; message: string }>;
}

type BidderTab = 'marketplace' | 'my-bids';

export const BidderDashboard: React.FC<BidderDashboardProps> = ({
  auctions,
  onSelectAuction,
  onPayWinningBid,
}) => {
  const { wallet } = useWallet();
  const [activeTab, setActiveTab] = useState<BidderTab>('marketplace');
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [isPayingId, setIsPayingId] = useState<string | null>(null);

  if (!wallet) return null;

  const myParticipatedAuctions = auctions.filter((a) =>
    a.commitments.some(
      (c) => c.bidderAddress.toLowerCase() === wallet.address.toLowerCase()
    )
  );

  const pendingPaymentAuctions = myParticipatedAuctions.filter(
    (a) =>
      a.phase === 'Sold' &&
      !a.winnerSettled &&
      a.winningBidderAddress?.toLowerCase() === wallet.address.toLowerCase()
  );

  const wonAuctions = myParticipatedAuctions.filter(
    (a) =>
      a.phase === 'Sold' &&
      a.winningBidderAddress?.toLowerCase() === wallet.address.toLowerCase()
  );

  const handlePay = async (auctionId: string) => {
    setFeedback(null);
    setIsPayingId(auctionId);
    try {
      const res = await onPayWinningBid(auctionId);
      setFeedback({
        type: res.success ? 'success' : 'error',
        text: res.message,
      });
    } finally {
      setIsPayingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
            {wallet.label} Workspace
          </span>
          <h1 className="text-2xl font-bold text-white mt-0.5">
            Vehicle Auctions & My Bids
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Place bids while the window is open, view revealed bids once it closes, and pay if the seller approves your bid.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('marketplace')}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'marketplace'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Browse Vehicles ({auctions.length})
          </button>
          <button
            onClick={() => setActiveTab('my-bids')}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'my-bids'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-950 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            <Gavel className="w-3.5 h-3.5" />
            My Bids ({myParticipatedAuctions.length})
            {pendingPaymentAuctions.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-bold">
                {pendingPaymentAuctions.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Prompt if Winner Payment is Pending */}
      {pendingPaymentAuctions.length > 0 && (
        <div className="p-4 rounded-2xl bg-emerald-950/35 border border-emerald-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Trophy className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <div className="text-sm font-bold text-white">
                Seller Approved Your Winning Bid!
              </div>
              <div className="text-xs text-emerald-200 mt-0.5">
                Complete your payment on {pendingPaymentAuctions[0].title} to finalize and close the auction.
              </div>
            </div>
          </div>
          <button
            onClick={() => handlePay(pendingPaymentAuctions[0].id)}
            disabled={isPayingId === pendingPaymentAuctions[0].id}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <Wallet className="w-3.5 h-3.5" />
            {isPayingId === pendingPaymentAuctions[0].id
              ? 'Confirming...'
              : `Pay ${(pendingPaymentAuctions[0].highestBidEth || 0).toFixed(4)} ETH Now`}
          </button>
        </div>
      )}

      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-xs ${
            feedback.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
              : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}

      {activeTab === 'marketplace' ? (
        <Marketplace
          auctions={auctions}
          onSelectAuction={onSelectAuction}
          onCreateClick={() => {}}
        />
      ) : myParticipatedAuctions.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center">
          <Gavel className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">You Haven't Placed Any Bids Yet</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 mb-5">
            Select an open vehicle auction from the marketplace to submit a bid.
          </p>
          <button
            onClick={() => setActiveTab('marketplace')}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer"
          >
            Browse Vehicles
          </button>
        </div>
      ) : (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>
              Participated in <strong className="text-white">{myParticipatedAuctions.length}</strong> auction(s) · Won{' '}
              <strong className="text-emerald-400">{wonAuctions.length}</strong>
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 bg-slate-950/60">
                  <th className="py-3.5 px-5">Vehicle</th>
                  <th className="py-3.5 px-4">Your Bid</th>
                  <th className="py-3.5 px-4">Highest Bid</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-xs">
                {myParticipatedAuctions.map((auc) => {
                  const myComm = auc.commitments.find(
                    (c) => c.bidderAddress.toLowerCase() === wallet.address.toLowerCase()
                  );
                  const myBidEth = myComm?.revealedAmountEth || 0;
                  const isWinner =
                    auc.winningBidderAddress?.toLowerCase() === wallet.address.toLowerCase();
                  const bidsRevealed = auc.phase !== 'Commit';

                  return (
                    <tr key={auc.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-4 px-5">
                        <div className="font-bold text-white text-sm">{auc.title}</div>
                        <div className="text-slate-400 text-[11px] mt-0.5">
                          Lot #{auc.numericId} · {auc.subtitle}
                        </div>
                      </td>

                      <td className="py-4 px-4 font-mono">
                        <div className="font-bold text-white">{myBidEth.toFixed(4)} ETH</div>
                        <div className="text-[11px] text-slate-400">
                          {formatInrFromEth(myBidEth)}
                        </div>
                      </td>

                      <td className="py-4 px-4 font-mono">
                        {!bidsRevealed ? (
                          <span className="text-amber-300/90 text-[11px]">
                            Hidden until window ends
                          </span>
                        ) : auc.highestBidEth ? (
                          <div>
                            <div className="font-bold text-emerald-400">
                              {auc.highestBidEth.toFixed(4)} ETH
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {isWinner ? 'You are highest bidder' : 'Outbid'}
                            </div>
                          </div>
                        ) : (
                          <span>—</span>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        {auc.phase === 'Commit' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-semibold">
                            <Clock className="w-3 h-3" />
                            Bidding Open
                          </span>
                        ) : auc.phase === 'Reveal' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold">
                            Bids Revealed · Seller Review
                          </span>
                        ) : auc.phase === 'Sold' && !auc.winnerSettled ? (
                          isWinner ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold">
                              Approved · Payment Due
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 text-slate-400 font-semibold">
                              Another Bid Selected
                            </span>
                          )
                        ) : auc.phase === 'Sold' && auc.winnerSettled ? (
                          isWinner ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold">
                              <CheckCircle2 className="w-3 h-3" />
                              Purchased & Closed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 text-slate-400 font-semibold">
                              Closed · Sold
                            </span>
                          )
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 text-slate-400 font-semibold">
                            Closed
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {auc.phase === 'Sold' && !auc.winnerSettled && isWinner && (
                            <button
                              type="button"
                              disabled={isPayingId === auc.id}
                              onClick={() => handlePay(auc.id)}
                              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer"
                            >
                              <Wallet className="w-3.5 h-3.5" />
                              {isPayingId === auc.id
                                ? 'Paying...'
                                : `Pay ${(auc.highestBidEth || 0).toFixed(2)} ETH`}
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => onSelectAuction(auc)}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
