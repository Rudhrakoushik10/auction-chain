import React from 'react';
import { AuctionItem } from '../../types/auction';
import { useCountdown } from '../../hooks/useCountdown';
import { formatUsd } from '../../lib/crypto';

interface AuctionCardProps {
  auction: AuctionItem;
  onSelect: (auction: AuctionItem) => void;
}

export const AuctionCard: React.FC<AuctionCardProps> = ({ auction, onSelect }) => {
  const activeDeadline =
    auction.phase === 'Commit' ? auction.commitEndTime : auction.revealEndTime;
  const countdown = useCountdown(activeDeadline);

  const mfgYear = String(auction.attributes.year ?? auction.attributes.manufacturing_year ?? '2023');
  const mileageMi = Number(auction.attributes.mileage ?? auction.attributes.mileage_km ?? 0);
  const fuelType = String(auction.attributes.fuel_type || 'Gasoline');
  const transmission = String(auction.attributes.transmission || 'Automatic');

  const phaseIndicator = {
    Commit: { label: 'Commit Phase', dot: 'bg-blue-400', text: 'text-blue-400' },
    Reveal: { label: 'Reveal Phase', dot: 'bg-amber-400', text: 'text-amber-400' },
    Sold: { label: 'Settled · Sold', dot: 'bg-emerald-400', text: 'text-emerald-400' },
    'No Sale': { label: 'Closed · No Sale', dot: 'bg-rose-400', text: 'text-rose-400' },
    Upcoming: { label: 'Upcoming', dot: 'bg-slate-400', text: 'text-slate-400' },
    Finalizable: { label: 'Finalizable', dot: 'bg-violet-400', text: 'text-violet-400' },
    Cancelled: { label: 'Cancelled', dot: 'bg-slate-500', text: 'text-slate-400' },
  }[auction.phase] || { label: auction.phase, dot: 'bg-slate-400', text: 'text-slate-400' };

  const primaryActionLabel =
    auction.phase === 'Commit'
      ? 'Place Sealed Bid'
      : auction.phase === 'Reveal'
      ? 'Reveal Bid'
      : 'View Settlement';

  const aiUsd = auction.aiPrediction.predicted_price ?? auction.aiPrediction.predicted_price_inr;

  return (
    <article
      onClick={() => onSelect(auction)}
      className="group bg-[#0F172A] rounded-xl border border-[#1E293B] hover:border-slate-700 transition-colors duration-150 overflow-hidden flex flex-col cursor-pointer"
    >
      {/* Clean 16:10 Vehicle Image */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#090D1A] border-b border-[#1E293B]">
        <img
          src={auction.imageUrl}
          alt={auction.title}
          loading="lazy"
          className="w-full h-full object-cover object-center group-hover:scale-[1.02] transition-transform duration-300"
        />
      </div>

      {/* Card Body */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          {/* Status & Countdown */}
          <div className="flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full ${phaseIndicator.dot}`} />
              <span className={`font-medium ${phaseIndicator.text}`}>
                {phaseIndicator.label}
              </span>
            </div>
            <span className="text-slate-400 tabular-nums">
              {auction.phase === 'Commit' || auction.phase === 'Reveal'
                ? countdown
                : `Lot #${auction.numericId}`}
            </span>
          </div>

          {/* Vehicle Title */}
          <h3 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-1">
            {auction.title}
          </h3>

          {/* Scannable Inline Specs (US miles) */}
          <p className="text-xs text-slate-400 font-mono tabular-nums truncate">
            {mfgYear} <span className="text-slate-600">·</span>{' '}
            {mileageMi.toLocaleString('en-US')} mi. <span className="text-slate-600">·</span>{' '}
            {fuelType} <span className="text-slate-600">·</span> {transmission}
          </p>
        </div>

        {/* Hairline-Divided Pricing & Action */}
        <div className="pt-3.5 border-t border-[#1E293B] space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-[11px] text-slate-400">AI Valuation (USD)</div>
              <div className="text-sm font-mono font-bold text-white tabular-nums mt-0.5">
                {formatUsd(aiUsd)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[11px] text-slate-400">
                {auction.phase === 'Sold' ? 'Winning Bid' : 'Reserve / Start'}
              </div>
              <div className="text-sm font-mono font-bold text-slate-200 tabular-nums mt-0.5">
                {auction.phase === 'Sold' && auction.highestBidEth
                  ? `${auction.highestBidEth.toFixed(2)} ETH`
                  : `${auction.reservePriceEth.toFixed(1)} / ${auction.startingBidEth.toFixed(1)} ETH`}
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-[#1E293B]/60 flex items-center justify-between text-xs">
            <span className="text-slate-400 font-mono tabular-nums">
              {auction.commitments.length} sealed {auction.commitments.length === 1 ? 'bid' : 'bids'} · Deposit {auction.fixedDepositEth.toFixed(1)} ETH
            </span>
            <span className="font-semibold text-blue-400 group-hover:text-blue-300 transition-colors">
              {primaryActionLabel} →
            </span>
          </div>
        </div>
      </div>
    </article>
  );
};
