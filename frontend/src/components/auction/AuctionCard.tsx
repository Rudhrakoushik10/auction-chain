import React from 'react';
import { AuctionItem } from '../../types/auction';
import { Clock, ArrowUpRight } from 'lucide-react';
import { formatEthToInr, formatInr } from '../../lib/crypto';

interface AuctionCardProps {
  auction: AuctionItem;
  onSelect: (auction: AuctionItem) => void;
}

export const AuctionCard: React.FC<AuctionCardProps> = ({ auction, onSelect }) => {
  const [timeLeft, setTimeLeft] = React.useState<string>('');

  React.useEffect(() => {
    const updateTimer = () => {
      const now = Date.now();
      const targetIso =
        auction.phase === 'Commit'
          ? auction.commitEndTime
          : auction.phase === 'Reveal'
          ? auction.revealEndTime
          : '';
      const target = targetIso ? new Date(targetIso).getTime() : 0;

      if (!target || now >= target) {
        setTimeLeft(
          auction.phase === 'Sold' || auction.phase === 'No Sale'
            ? 'FINALIZED'
            : 'CLOSING'
        );
        return;
      }

      const diff = Math.max(0, Math.floor((target - now) / 1000));
      const hrs = Math.floor(diff / 3600);
      const mins = Math.floor((diff % 3600) / 60);
      const secs = diff % 60;
      setTimeLeft(
        `${hrs.toString().padStart(2, '0')}:${mins
          .toString()
          .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
      );
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [auction.phase, auction.commitEndTime, auction.revealEndTime]);

  const phaseStyle =
    auction.phase === 'Commit'
      ? {
          label: 'COMMIT PHASE',
          textColor: 'text-[#C5A46D]',
          borderColor: 'border-[#C5A46D]/40',
        }
      : auction.phase === 'Reveal'
      ? {
          label: 'REVEAL WINDOW',
          textColor: 'text-[#D49B38]',
          borderColor: 'border-[#D49B38]/40',
        }
      : auction.phase === 'Sold'
      ? {
          label: 'SETTLED',
          textColor: 'text-[#2E9B68]',
          borderColor: 'border-[#2E9B68]/40',
        }
      : {
          label: auction.phase.toUpperCase(),
          textColor: 'text-[#8E95A5]',
          borderColor: 'border-[#232730]',
        };

  const year = auction.attributes.year ?? auction.attributes.manufacturing_year ?? '2021';
  const mileage = Number(
    auction.attributes.mileage ?? auction.attributes.mileage_km ?? 32000
  );
  const fuel = String(auction.attributes.fuel_type ?? 'Diesel');
  const transmission = String(auction.attributes.transmission ?? 'Automatic');
  const revealedCount = auction.commitments.filter((c) => c.revealed).length;
  const aiValuationInr =
    auction.aiPrediction.predicted_price ??
    auction.aiPrediction.predicted_price_inr ??
    350000;

  return (
    <div
      onClick={() => onSelect(auction)}
      className="group bg-[#12141A] border border-[#232730] hover:border-[#C5A46D]/50 rounded-md overflow-hidden transition-all duration-200 cursor-pointer flex flex-col justify-between"
    >
      <div>
        {/* 16:10 Editorial Vehicle Frame */}
        <div className="relative h-52 overflow-hidden bg-[#0B0C10]">
          <img
            src={auction.imageUrl}
            alt={auction.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B0C10] via-[#0B0C10]/20 to-transparent" />

          {/* Top Bar Over Image: Structured Phase & Lot Number (No pulsing dots) */}
          <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between gap-2">
            <span
              className={`px-2.5 py-1 rounded text-[10px] font-mono font-medium uppercase tracking-[0.14em] bg-[#0B0C10]/90 backdrop-blur-md border ${phaseStyle.borderColor} ${phaseStyle.textColor}`}
            >
              {phaseStyle.label}
            </span>
            <span className="px-2.5 py-1 rounded text-[10px] font-mono text-[#F4F5F7] bg-[#0B0C10]/90 backdrop-blur-md border border-[#232730]">
              LOT #{auction.numericId}
            </span>
          </div>

          {/* Bottom Bar Over Image: Countdown & Sealed Bid Count */}
          <div className="absolute bottom-3 left-3.5 right-3.5 flex items-center justify-between text-xs font-mono text-[#F4F5F7]">
            <span className="flex items-center gap-1.5 tabular-nums">
              <Clock className="w-3.5 h-3.5 text-[#C5A46D]" />
              {timeLeft}
            </span>
            <span className="text-[11px] text-[#8E95A5]">
              {auction.commitments.length} Sealed · {revealedCount} Revealed
            </span>
          </div>
        </div>

        {/* Editorial Lot Content */}
        <div className="p-5">
          <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-[#8E95A5] mb-1">
            {String(auction.attributes.brand || 'Consigned Vehicle')}
          </div>
          <h3 className="font-display font-semibold text-base text-[#F4F5F7] group-hover:text-[#C5A46D] transition-colors line-clamp-1">
            {auction.title}
          </h3>

          {/* Unboxed Vehicle Specification Row */}
          <div className="mt-2 text-xs text-[#8E95A5] font-mono flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-[#F4F5F7]">{String(year)}</span>
            <span className="text-[#232730]">·</span>
            <span>{mileage.toLocaleString('en-IN')} km</span>
            <span className="text-[#232730]">·</span>
            <span>{fuel}</span>
            <span className="text-[#232730]">·</span>
            <span className="truncate max-w-[110px]">{transmission}</span>
          </div>

          {/* Two-Column Financial & Valuation Readout */}
          <div className="mt-4 pt-4 border-t border-[#232730] grid grid-cols-2 gap-4">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-[0.12em] text-[#646C7E] block">
                AI Valuation (INR)
              </span>
              <span className="text-sm font-mono font-semibold text-[#F4F5F7] tabular-nums mt-0.5 block">
                {formatInr(aiValuationInr)}
              </span>
              <span className="text-[11px] font-mono text-[#8E95A5] tabular-nums block mt-0.5">
                Start {auction.startingBidEth.toFixed(2)} ETH
              </span>
            </div>

            <div className="border-l border-[#232730] pl-4">
              <span className="text-[10px] font-mono uppercase tracking-[0.12em] text-[#646C7E] block">
                Reserve / Deposit
              </span>
              <span className="text-sm font-mono font-semibold text-[#C5A46D] tabular-nums mt-0.5 block">
                {auction.reservePriceEth.toFixed(2)} ETH
              </span>
              <span className="text-[11px] font-mono text-[#8E95A5] tabular-nums block mt-0.5">
                {formatEthToInr(auction.reservePriceEth)} · Dep{' '}
                {auction.fixedDepositEth.toFixed(1)} ETH
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Subtle Bottom Action Strip */}
      <div className="px-5 py-3 bg-[#0B0C10]/60 border-t border-[#232730] flex items-center justify-between text-xs">
        <span className="font-mono text-[11px] text-[#646C7E] truncate">
          Oracle ID #{auction.aiPrediction.prediction_id}
        </span>
        <span className="font-medium text-[#F4F5F7] group-hover:text-[#C5A46D] flex items-center gap-1 transition-colors">
          {auction.phase === 'Commit'
            ? 'Submit Sealed Bid'
            : auction.phase === 'Reveal'
            ? 'Reveal Commitment'
            : 'Inspect Lot'}
          <ArrowUpRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </div>
  );
};
