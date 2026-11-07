import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Car,
  Layers,
  Cpu,
  Zap,
  Fuel,
  Wallet,
} from 'lucide-react';
import { AuctionItem, AuctionPhase } from '../types/auction';
import { AuctionCard } from '../components/auction/AuctionCard';
import { useWallet } from '../context/WalletContext';

interface MarketplaceProps {
  auctions: AuctionItem[];
  onSelectAuction: (auction: AuctionItem) => void;
}

export const Marketplace: React.FC<MarketplaceProps> = ({ auctions, onSelectAuction }) => {
  const { isConnected, openAuthModal } = useWallet();
  const [selectedFuelFilter, setSelectedFuelFilter] = useState<'all' | 'Electric' | 'Hybrid' | 'Diesel' | 'Petrol'>('all');
  const [selectedPhase, setSelectedPhase] = useState<'all' | AuctionPhase>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'ai-high' | 'reserve-low'>('newest');

  const filteredAuctions = useMemo(() => {
    return auctions
      .filter((item) => {
        if (
          selectedFuelFilter !== 'all' &&
          String(item.attributes.fuel_type || '').toLowerCase() !== selectedFuelFilter.toLowerCase()
        ) {
          return false;
        }
        if (selectedPhase !== 'all' && item.phase !== selectedPhase) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = item.title.toLowerCase().includes(q);
          const matchSub = item.subtitle.toLowerCase().includes(q);
          const matchId = item.id.toLowerCase().includes(q);
          const matchBrand = String(item.attributes.brand || '').toLowerCase().includes(q);
          const matchModel = String(item.attributes.model || '').toLowerCase().includes(q);
          if (!matchTitle && !matchSub && !matchId && !matchBrand && !matchModel) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'ai-high') {
          return b.aiPrediction.predicted_price_inr - a.aiPrediction.predicted_price_inr;
        }
        if (sortBy === 'reserve-low') {
          return a.reservePriceEth - b.reservePriceEth;
        }
        return b.numericId - a.numericId;
      });
  }, [auctions, selectedFuelFilter, selectedPhase, searchQuery, sortBy]);

  return (
    <div className="space-y-8 pb-16 animate-in fade-in">
      {/* Header Banner */}
      <div className="rounded-2xl bg-[#0F172A] text-white p-6 sm:p-8 border border-[#1E293B] shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-[#06B6D4]">
            Vehicle Sealed-Bid Marketplace · Model: vehicle-v1
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-1 text-white">
            Explore Verified Vehicle Auctions
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Every vehicle listing includes an advisory INR resale price prediction anchored on{' '}
            <code className="text-[#06B6D4]">PriceOracle.sol</code> and settles via commit-reveal in Test ETH on Hardhat Chain ID 31337.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-[#131E3A] px-4 py-3 rounded-xl border border-[#1E293B] shrink-0">
          <Cpu className="w-5 h-5 text-[#06B6D4]" />
          <div className="text-xs">
            <div className="font-bold text-white">{filteredAuctions.length} Vehicle Listings</div>
            <div className="text-slate-400 font-mono text-[11px]">Hardhat #31337 Verified</div>
          </div>
        </div>
      </div>

      {/* Guest Mode Callout */}
      {!isConnected && (
        <div className="rounded-xl bg-[#131E3A] border border-[#2563EB]/40 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Wallet className="w-4 h-4 text-[#3B82F6] shrink-0" />
            <span>
              Browsing in Guest View: You can freely inspect vehicle specs, AI valuations, and auction countdowns. Connect your MetaMask wallet to submit sealed bids or list a vehicle.
            </span>
          </div>
          <button
            type="button"
            onClick={openAuthModal}
            className="px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-blue-600 text-white font-bold text-xs shrink-0 cursor-pointer shadow-sm"
          >
            Connect Wallet
          </button>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-[#0F172A] rounded-2xl border border-[#1E293B] p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row gap-4 justify-between">
          {/* Drivetrain / Fuel Filter Tabs */}
          <div className="flex items-center gap-2 flex-wrap">
            {(['all', 'Electric', 'Hybrid', 'Diesel', 'Petrol'] as const).map((fuel) => (
              <button
                key={fuel}
                type="button"
                onClick={() => setSelectedFuelFilter(fuel)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedFuelFilter === fuel
                    ? 'bg-[#2563EB] text-white shadow-md shadow-[#2563EB]/25'
                    : 'bg-[#131E3A] text-slate-400 hover:text-white border border-[#1E293B]'
                }`}
              >
                <Car className="w-3.5 h-3.5" />
                <span>{fuel === 'all' ? `All Vehicles (${auctions.length})` : `${fuel} Vehicles`}</span>
              </button>
            ))}
          </div>

          {/* Phase Filter Tabs */}
          <div className="flex items-center gap-2 flex-wrap">
            {(['all', 'Commit', 'Reveal', 'Sold'] as const).map((phase) => (
              <button
                key={phase}
                type="button"
                onClick={() => setSelectedPhase(phase)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  selectedPhase === phase
                    ? 'bg-[#7C3AED] text-white shadow-sm'
                    : 'bg-[#131E3A] text-slate-400 hover:text-white border border-[#1E293B]'
                }`}
              >
                {phase === 'all' ? 'All Phases' : phase}
              </button>
            ))}
          </div>
        </div>

        {/* Search Input & Sort Selector */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-[#1E293B]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by brand, model, variant, or auction ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#1E293B] bg-[#131E3A] text-xs font-medium text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/40"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 whitespace-nowrap">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 rounded-xl border border-[#1E293B] bg-[#131E3A] text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]/40"
            >
              <option value="newest">Newest First</option>
              <option value="ai-high">Highest AI Valuation (INR)</option>
              <option value="reserve-low">Lowest Reserve (ETH)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Vehicle Auction Cards Grid */}
      {filteredAuctions.length === 0 ? (
        <div className="text-center py-16 bg-[#0F172A] rounded-2xl border border-dashed border-[#1E293B] p-8 space-y-3">
          <Car className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No Vehicle Auctions Match Your Filters</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Try adjusting your search criteria, drivetrain filter, or auction phase.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAuctions.map((auction) => (
            <AuctionCard
              key={auction.id}
              auction={auction}
              onSelect={onSelectAuction}
            />
          ))}
        </div>
      )}
    </div>
  );
};
