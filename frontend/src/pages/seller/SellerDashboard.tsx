import React, { useState } from 'react';
import {
  PlusCircle,
  CheckCircle2,
  Clock,
  Gavel,
  Eye,
  AlertCircle,
  Trophy,
} from 'lucide-react';
import { AuctionItem } from '../../types/auction';
import { useWallet } from '../../context/WalletContext';
import { shortenAddress, formatInr, formatInrFromEth } from '../../lib/crypto';
import { CreateAuction } from '../CreateAuction';
import { findRoleAccountByAddress } from '../../lib/hardhatConfig';

interface SellerDashboardProps {
  auctions: AuctionItem[];
  onSelectAuction: (auction: AuctionItem) => void;
  onCreateAuction: (newAuction: AuctionItem) => void;
  onCloseBiddingWindow: (auctionId: string) => void;
  onApproveHighestBid: (auctionId: string) => Promise<{ success: boolean; message: string }>;
}

type SellerTab = 'listings' | 'create';

export const SellerDashboard: React.FC<SellerDashboardProps> = ({
  auctions,
  onSelectAuction,
  onCreateAuction,
  onCloseBiddingWindow,
  onApproveHighestBid,
}) => {
  const { wallet } = useWallet();
  const [activeTab, setActiveTab] = useState<SellerTab>(() =>
    auctions.length === 0 ? 'create' : 'listings'
  );
  const [actionMessage, setActionMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [isProcessingId, setIsProcessingId] = useState<string | null>(null);

  if (!wallet) return null;

  const myAuctions = auctions.filter(
    (a) => a.sellerAddress.toLowerCase() === wallet.address.toLowerCase()
  );

  const openCount = myAuctions.filter((a) => a.phase === 'Commit').length;
  const awaitingApprovalCount = myAuctions.filter((a) => a.phase === 'Reveal').length;
  const soldCount = myAuctions.filter((a) => a.phase === 'Sold' && a.winnerSettled).length;
  const totalProceedsEth = myAuctions
    .filter((a) => a.phase === 'Sold' && a.winnerSettled)
    .reduce((sum, a) => sum + (a.highestBidEth || 0), 0);

  const handleApprove = async (auctionId: string) => {
    setActionMessage(null);
    setIsProcessingId(auctionId);
    try {
      const res = await onApproveHighestBid(auctionId);
      setActionMessage({
        type: res.success ? 'success' : 'error',
        text: res.message,
      });
    } finally {
      setIsProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Navigation */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
            Vehicle Seller Workspace
          </span>
          <h1 className="text-2xl font-bold text-white mt-0.5">
            Manage Vehicle Auctions
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            List a vehicle, reveal participant bids after the bidding window, and approve the highest bid.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('listings')}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'listings'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            My Auctions ({myAuctions.length})
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'create'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-950 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            New Auction
          </button>
        </div>
      </div>

      {/* KPI Summary Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs text-slate-400">Bidding Open</div>
          <div className="text-2xl font-bold text-white font-mono mt-1">{openCount}</div>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs text-slate-400">Ready for Approval</div>
          <div className="text-2xl font-bold text-amber-400 font-mono mt-1">
            {awaitingApprovalCount}
          </div>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs text-slate-400">Completed Sales</div>
          <div className="text-2xl font-bold text-emerald-400 font-mono mt-1">{soldCount}</div>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs text-slate-400">Total Received</div>
          <div className="text-xl font-bold text-white font-mono mt-1">
            {totalProceedsEth.toFixed(2)} ETH
          </div>
          <div className="text-[11px] text-emerald-400 font-mono">
            {formatInrFromEth(totalProceedsEth)}
          </div>
        </div>
      </div>

      {actionMessage && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-xs ${
            actionMessage.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
              : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{actionMessage.text}</span>
          </div>
          <button
            onClick={() => setActionMessage(null)}
            className="text-slate-400 hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}

      {activeTab === 'create' ? (
        <CreateAuction
          existingCount={auctions.length}
          onCreated={(newAuc) => {
            onCreateAuction(newAuc);
            setActiveTab('listings');
          }}
          onCancel={() => setActiveTab('listings')}
        />
      ) : myAuctions.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center">
          <Gavel className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">No Vehicle Auctions Created Yet</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 mb-5">
            Create your first vehicle auction to receive bids from participants.
          </p>
          <button
            onClick={() => setActiveTab('create')}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold inline-flex items-center gap-2 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            Create Vehicle Auction
          </button>
        </div>
      ) : (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 bg-slate-950/60">
                  <th className="py-3.5 px-5">Vehicle</th>
                  <th className="py-3.5 px-4">AI Fair Value</th>
                  <th className="py-3.5 px-4">Start Price</th>
                  <th className="py-3.5 px-4">Bids / Highest Bid</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-5 text-right">Seller Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-xs">
                {myAuctions.map((auc) => {
                  const bidsRevealed = auc.phase !== 'Commit';
                  const winnerAcct = auc.winningBidderAddress
                    ? findRoleAccountByAddress(auc.winningBidderAddress)
                    : null;
                  const winnerName = winnerAcct
                    ? winnerAcct.label
                    : auc.winningBidderAddress
                    ? shortenAddress(auc.winningBidderAddress)
                    : '—';

                  return (
                    <tr key={auc.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-4 px-5">
                        <div className="font-bold text-white text-sm">{auc.title}</div>
                        <div className="text-slate-400 text-[11px] mt-0.5">
                          Lot #{auc.numericId} · {auc.subtitle}
                        </div>
                      </td>

                      <td className="py-4 px-4 font-mono text-indigo-300 font-semibold">
                        {formatInr(
                          auc.aiPrediction.predicted_price_inr ||
                            auc.aiPrediction.predicted_price
                        )}
                      </td>

                      <td className="py-4 px-4 font-mono text-white">
                        <div>{auc.startingBidEth.toFixed(2)} ETH</div>
                        <div className="text-[11px] text-slate-400">
                          {formatInrFromEth(auc.startingBidEth)}
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        {!bidsRevealed ? (
                          <div>
                            <span className="font-semibold text-white">
                              {auc.commitments.length} bid(s) placed
                            </span>
                            <div className="text-[11px] text-amber-300/90">
                              Hidden until window ends
                            </div>
                          </div>
                        ) : auc.highestBidEth ? (
                          <div>
                            <div className="font-bold text-emerald-400 font-mono flex items-center gap-1">
                              <Trophy className="w-3.5 h-3.5" />
                              {auc.highestBidEth.toFixed(4)} ETH
                            </div>
                            <div className="text-[11px] text-slate-300">
                              by {winnerName} ({auc.commitments.length} total)
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-500">0 bids</span>
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
                            Bids Revealed
                          </span>
                        ) : auc.phase === 'Sold' && !auc.winnerSettled ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold">
                            Approved · Payment Due
                          </span>
                        ) : auc.phase === 'Sold' && auc.winnerSettled ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold">
                            <CheckCircle2 className="w-3 h-3" />
                            Paid & Closed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 text-slate-400 font-semibold">
                            Closed (No Sale)
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {auc.phase === 'Commit' && (
                            <button
                              type="button"
                              onClick={() => onCloseBiddingWindow(auc.id)}
                              className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs cursor-pointer"
                            >
                              Close Window & Reveal
                            </button>
                          )}

                          {auc.phase === 'Reveal' && (
                            <button
                              type="button"
                              disabled={isProcessingId === auc.id}
                              onClick={() => handleApprove(auc.id)}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs cursor-pointer"
                            >
                              {isProcessingId === auc.id
                                ? 'Approving...'
                                : auc.highestBidEth
                                ? 'Approve Highest Bid'
                                : 'Close Auction'}
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
