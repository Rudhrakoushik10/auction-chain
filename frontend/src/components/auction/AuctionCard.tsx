import React from 'react';
import {
  Clock,
  CheckCircle2,
  ArrowUpRight,
  Sparkles,
  Car,
  Users,
} from 'lucide-react';
import { AuctionItem } from '../../types/auction';
import { formatInr, formatInrFromEth } from '../../lib/crypto';

interface AuctionCardProps {
  auction: AuctionItem;
  onSelect: (auction: AuctionItem) => void;
}

export const AuctionCard: React.FC<AuctionCardProps> = ({ auction, onSelect }) => {
  const getPhaseBadge = () => {
    if (auction.phase === 'Commit') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
          <Clock className="w-3.5 h-3.5 text-indigo-400" />
          Bidding Open
        </span>
      );
    }
    if (auction.phase === 'Reveal') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40">
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          Bids Revealed · Seller Review
        </span>
      );
    }
    if (auction.phase === 'Sold' && !auction.winnerSettled) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40">
          <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
          Approved · Awaiting Payment
        </span>
      );
    }
    if (auction.phase === 'Sold' && auction.winnerSettled) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          Sold & Closed
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
        Closed (No Sale)
      </span>
    );
  };

  const aiInr =
    auction.aiPrediction.predicted_price_inr || auction.aiPrediction.predicted_price;
  const bidsRevealed = auction.phase !== 'Commit';

  return (
    <div
      onClick={() => onSelect(auction)}
      className="group bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-2xl overflow-hidden transition-all duration-200 cursor-pointer flex flex-col justify-between shadow-lg"
    >
      <div>
        <div className="relative h-48 overflow-hidden bg-slate-950">
          {auction.imageUrl ? (
            <img
              src={auction.imageUrl}
              alt={auction.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950/60 flex flex-col items-center justify-center p-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center mb-2">
                <Car className="w-6 h-6 text-indigo-400" />
              </div>
              <span className="text-xs font-semibold text-slate-300 line-clamp-1">
                {auction.title}
              </span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

          <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
            {getPhaseBadge()}
            <span className="px-2.5 py-1 rounded-lg text-xs font-mono bg-slate-950/80 text-slate-300 border border-slate-700/80">
              Lot #{auction.numericId}
            </span>
          </div>

          <div className="absolute bottom-3 left-3 right-3">
            <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-1">
              {auction.title}
            </h3>
            <p className="text-xs text-slate-400 line-clamp-1">{auction.subtitle}</p>
          </div>
        </div>

        <div className="p-4 space-y-3">
          {/* AI Fair Price */}
          <div className="p-3 rounded-xl bg-indigo-950/25 border border-indigo-500/25 flex items-center justify-between">
            <span className="text-xs text-indigo-300 flex items-center gap-1.5 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              AI Valuation
            </span>
            <span className="text-sm font-bold text-white font-mono">
              {formatInr(aiInr)}
            </span>
          </div>

          {/* Starting / Highest Bid & Bid Count */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
              <div className="text-[11px] text-slate-400">
                {bidsRevealed && auction.highestBidEth ? 'Highest Bid' : 'Starting Price'}
              </div>
              <div className="text-sm font-bold text-white font-mono mt-0.5">
                {bidsRevealed && auction.highestBidEth
                  ? `${auction.highestBidEth.toFixed(2)} ETH`
                  : `${auction.startingBidEth.toFixed(2)} ETH`}
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                {formatInrFromEth(
                  bidsRevealed && auction.highestBidEth
                    ? auction.highestBidEth
                    : auction.startingBidEth
                )}
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
              <div className="text-[11px] text-slate-400 flex items-center gap-1">
                <Users className="w-3 h-3 text-indigo-400" />
                Bids Placed
              </div>
              <div className="text-sm font-bold text-white font-mono mt-0.5">
                {auction.commitments.length} Bid{auction.commitments.length === 1 ? '' : 's'}
              </div>
              <div className="text-[10px] text-slate-400">
                {auction.phase === 'Commit' ? 'Hidden until window ends' : 'Revealed'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-3 bg-slate-950/60 border-t border-slate-800/80 flex items-center justify-between text-xs">
        <span className="text-slate-400">
          {auction.phase === 'Commit'
            ? 'Place Bid (No upfront deposit)'
            : auction.phase === 'Reveal'
            ? 'Bids revealed to all'
            : auction.phase === 'Sold' && !auction.winnerSettled
            ? 'Approved · Winner payment due'
            : 'Auction closed'}
        </span>
        <span className="font-semibold text-indigo-400 group-hover:text-indigo-300 inline-flex items-center gap-1">
          Open
          <ArrowUpRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </div>
  );
};
