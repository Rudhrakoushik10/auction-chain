import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { AuctionItem, AuctionPhase } from '../types/auction';
import { AuctionCard } from '../components/auction/AuctionCard';
import { useWallet } from '../context/WalletContext';

interface MarketplaceProps {
  auctions: AuctionItem[];
  onSelectAuction: (auction: AuctionItem) => void;
}

export const Marketplace: React.FC<MarketplaceProps> = ({ auctions, onSelectAuction }) => {
  const { isConnected, openAuthModal } = useWallet();
  const [selectedFuelFilter, setSelectedFuelFilter] = useState<'all' | 'Gasoline' | 'Electric' | 'Hybrid' | 'Diesel'>('all');
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
          return (
            (b.aiPrediction.predicted_price ?? b.aiPrediction.predicted_price_inr) -
            (a.aiPrediction.predicted_price ?? a.aiPrediction.predicted_price_inr)
          );
        }
        if (sortBy === 'reserve-low') {
          return a.reservePriceEth - b.reservePriceEth;
        }
        return b.numericId - a.numericId;
      });
  }, [auctions, selectedFuelFilter, selectedPhase, searchQuery, sortBy]);

  return (
    <div className="space-y-8 pb-16">
      {/* Clean Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#1E293B] pb-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400 tabular-nums">
            <span>Vehicle Sealed-Bid Marketplace</span>
            <span aria-hidden="true">·</span>
            <span>{filteredAuctions.length} of {auctions.length} Lots Shown</span>
            <span aria-hidden="true">·</span>
            <span>Hardhat #31337</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            Verified Vehicle Auctions
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
            Every vehicle lot includes an advisory USD resale valuation anchored on{' '}
            <code className="text-slate-200">PriceOracle.sol</code> and settles via commit-reveal in Test ETH.
          </p>
        </div>

        {!isConnected && (
          <button
            type="button"
            onClick={openAuthModal}
            className="px-4 py-2.5 rounded-lg bg-[#2563EB] hover:bg-blue-600 text-white font-semibold text-xs whitespace-nowrap shrink-0 cursor-pointer self-start md:self-auto"
          >
            Connect Wallet to Bid
          </button>
        )}
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-[#0F172A] rounded-xl border border-[#1E293B] p-4 space-y-4">
        <div className="flex flex-col lg:flex-row gap-4 justify-between">
          {/* Segmented Drivetrain Filter */}
          <div className="flex items-center gap-1 p-1 bg-[#090D1A] rounded-lg border border-[#1E293B] overflow-x-auto">
            {(['all', 'Gasoline', 'Electric', 'Hybrid', 'Diesel'] as const).map((fuel) => (
              <button
                key={fuel}
                type="button"
                onClick={() => setSelectedFuelFilter(fuel)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  selectedFuelFilter === fuel
                    ? 'bg-[#2563EB] text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {fuel === 'all' ? `All Vehicles (${auctions.length})` : fuel}
              </button>
            ))}
          </div>

          {/* Segmented Phase Filter */}
          <div className="flex items-center gap-1 p-1 bg-[#090D1A] rounded-lg border border-[#1E293B] overflow-x-auto">
            {(['all', 'Commit', 'Reveal', 'Sold'] as const).map((phase) => (
              <button
                key={phase}
                type="button"
                onClick={() => setSelectedPhase(phase)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  selectedPhase === phase
                    ? 'bg-[#1E293B] text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {phase === 'all' ? 'All Phases' : phase}
              </button>
            ))}
          </div>
        </div>

        {/* Search Input & Sort Selector */}
        <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-[#1E293B]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by make, model, variant, or lot ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-[#1E293B] bg-[#090D1A] text-xs font-medium text-white placeholder-slate-500 focus:outline-none focus:border-[#2563EB]"
            />
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="marketplace-sort" className="text-xs text-slate-400 whitespace-nowrap">
              Sort by:
            </label>
            <select
              id="marketplace-sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 rounded-lg border border-[#1E293B] bg-[#090D1A] text-xs font-medium text-white focus:outline-none focus:border-[#2563EB]"
            >
              <option value="newest">Newest First</option>
              <option value="ai-high">Highest AI Valuation (USD)</option>
              <option value="reserve-low">Lowest Reserve (ETH)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Vehicle Auction Cards Grid */}
      {filteredAuctions.length === 0 ? (
        <div className="text-center py-16 bg-[#0F172A] rounded-xl border border-[#1E293B] p-8 space-y-3">
          <h3 className="text-base font-semibold text-white">
            {auctions.length === 0 ? 'No Vehicle Auctions Deployed Yet' : 'No Vehicle Lots Match Your Filters'}
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {auctions.length === 0
              ? 'Connect as Seller (Account 1) to create a new vehicle auction lot.'
              : 'Try clearing your search query or switching the drivetrain and phase filters.'}
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedFuelFilter('all');
              setSelectedPhase('all');
              setSearchQuery('');
            }}
            className="px-4 py-2 rounded-lg bg-[#1E293B] hover:bg-slate-700 text-xs font-medium text-white transition-colors cursor-pointer"
          >
            Reset Filters
          </button>
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
