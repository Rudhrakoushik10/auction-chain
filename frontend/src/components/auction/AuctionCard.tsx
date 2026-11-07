import React from 'react';
import {
  Clock,
  Lock,
  Eye,
  CheckCircle2,
  XCircle,
  Cpu,
  ShieldCheck,
  ArrowUpRight,
  Car,
} from 'lucide-react';
import { AuctionItem } from '../../types/auction';
import { formatInr } from '../../lib/crypto';

interface AuctionCardProps {
  auction: AuctionItem;
  onSelect: (auction: AuctionItem) => void;
}

export const AuctionCard: React.FC<AuctionCardProps> = ({ auction, onSelect }) => {
  const getPhaseBadge = (phase: AuctionItem['phase']) => {
    switch (phase) {
      case 'Commit':
        return {
          label: 'Commit Phase Open',
          icon: <Lock className="w-3.5 h-3.5" />,
          classes: 'bg-[#2563EB]/90 text-white border border-[#3B82F6]/50',
        };
      case 'Reveal':
        return {
          label: 'Reveal Phase Active',
          icon: <Eye className="w-3.5 h-3.5" />,
          classes: 'bg-[#7C3AED]/90 text-white border border-[#8B5CF6]/50',
        };
      case 'Sold':
        return {
          label: 'Finalized · SOLD',
          icon: <CheckCircle2 className="w-3.5 h-3.5" />,
          classes: 'bg-emerald-600/90 text-white border border-emerald-400/50',
        };
      case 'No Sale':
        return {
          label: 'Finalized · NO SALE',
          icon: <XCircle className="w-3.5 h-3.5" />,
          classes: 'bg-amber-600/90 text-white border border-amber-400/50',
        };
      default:
        return {
          label: phase,
          icon: <Clock className="w-3.5 h-3.5" />,
          classes: 'bg-slate-800 text-slate-300 border border-slate-700',
        };
    }
  };

  const phaseBadge = getPhaseBadge(auction.phase);
  const fuelType = String(auction.attributes.fuel_type || 'Electric');
  const mfgYear = String(auction.attributes.manufacturing_year || '2024');
  const mileageKm = Number(auction.attributes.mileage_km || 0);

  return (
    <div
      onClick={() => onSelect(auction)}
      className="group bg-[#0F172A] rounded-2xl border border-[#1E293B] hover:border-[#2563EB] shadow-lg hover:shadow-2xl hover:shadow-[#2563EB]/15 transition-all duration-200 overflow-hidden flex flex-col cursor-pointer"
    >
      {/* Vehicle Image Header */}
      <div className="relative h-52 w-full bg-[#090D1A] overflow-hidden">
        <img
          src={auction.imageUrl}
          alt={auction.title}
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-[#0F172A]/40 to-transparent" />

        {/* Top Left Vehicle Badge + ID */}
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-[#090D1A]/90 text-white border border-[#1E293B] shadow-sm">
            <Car className="w-3.5 h-3.5 text-[#3B82F6]" />
            <span>{mfgYear} · {fuelType}</span>
          </span>
          <span className="px-2 py-1 rounded-lg text-[11px] font-mono font-bold bg-[#090D1A]/90 text-[#06B6D4] border border-[#1E293B]">
            #{auction.numericId}
          </span>
        </div>

        {/* Top Right Phase Badge */}
        <div className="absolute top-3 right-3">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold shadow-md backdrop-blur-md ${phaseBadge.classes}`}
          >
            {phaseBadge.icon}
            <span>{phaseBadge.label}</span>
          </span>
        </div>

        {/* Bottom Overlay: AI Reference Estimate in INR */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
          <div className="flex items-center gap-2 bg-[#090D1A]/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#1E293B]">
            <Cpu className="w-4 h-4 text-[#06B6D4]" />
            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">
                AI Vehicle Estimate
              </div>
              <div className="text-sm font-mono font-bold text-[#06B6D4]">
                {formatInr(auction.aiPrediction.predicted_price_inr)}
              </div>
            </div>
          </div>

          <div className="bg-[#131E3A]/90 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-[#1E293B] text-right">
            <div className="text-[10px] font-mono text-purple-300">
              {auction.aiPrediction.model_version}
            </div>
            <div className="text-[11px] font-semibold text-slate-200 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#06B6D4]" />
              <span>Oracle Verified</span>
            </div>
          </div>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
            <span>{mileageKm.toLocaleString('en-IN')} km odometer</span>
            <span>Condition: {String(auction.attributes.condition || 'Excellent')}</span>
          </div>
          <h3 className="text-base font-bold text-white group-hover:text-[#3B82F6] transition-colors line-clamp-1">
            {auction.title}
          </h3>
          <p className="text-xs text-slate-400 mt-1 line-clamp-2">{auction.subtitle}</p>
        </div>

        {/* Currency Separation Grid: ETH Bidding Parameters */}
        <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-[#131E3A] border border-[#1E293B]">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
              Start Bid
            </div>
            <div className="text-xs font-mono font-bold text-white mt-0.5">
              {auction.startingBidEth.toFixed(2)} ETH
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
              Reserve
            </div>
            <div className="text-xs font-mono font-bold text-[#3B82F6] mt-0.5">
              {auction.reservePriceEth.toFixed(2)} ETH
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
              Collateral
            </div>
            <div className="text-xs font-mono font-bold text-[#A78BFA] mt-0.5">
              {auction.fixedDepositEth.toFixed(2)} ETH
            </div>
          </div>
        </div>

        {/* Footer Meta */}
        <div className="pt-2 border-t border-[#1E293B] flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <span>
              Commits: <strong className="text-white">{auction.commitments.length}</strong>
            </span>
            <span>·</span>
            <span>
              Reveals:{' '}
              <strong className="text-white">
                {auction.commitments.filter((c) => c.revealed).length}
              </strong>
            </span>
          </div>

          <span className="inline-flex items-center gap-1 font-semibold text-[#3B82F6] group-hover:translate-x-0.5 transition-transform">
            <span>Inspect Vehicle</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </div>
  );
};
