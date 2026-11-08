import React, { useState } from 'react';
import { AuctionItem, AuctionPhase } from '../types/auction';
import { AuctionCard } from '../components/auction/AuctionCard';
import { Search } from 'lucide-react';

interface MarketplaceProps {
  auctions: AuctionItem[];
  onSelectAuction: (auction: AuctionItem) => void;
}

export const Marketplace: React.FC<MarketplaceProps> = ({
  auctions,
  onSelectAuction,
}) => {
  const [search, setSearch] = useState('');
  const [phaseFilter, setPhaseFilter] = useState<AuctionPhase | 'ALL'>('ALL');
  const [brandFilter, setBrandFilter] = useState<string>('ALL');

  const brands = [
    'ALL',
    ...Array.from(
      new Set(
        auctions
          .map((a) => String(a.attributes.brand || 'Vehicle'))
          .filter(Boolean)
      )
    ),
  ];

  const filtered = auctions.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.subtitle.toLowerCase().includes(search.toLowerCase()) ||
      item.id.toLowerCase().includes(search.toLowerCase());
    const matchesPhase = phaseFilter === 'ALL' || item.phase === phaseFilter;
    const matchesBrand =
      brandFilter === 'ALL' ||
      String(item.attributes.brand || 'Vehicle') === brandFilter;
    return matchesSearch && matchesPhase && matchesBrand;
  });

  const phaseLabels: Record<'ALL' | 'Commit' | 'Reveal' | 'Sold', string> = {
    ALL: 'All Vehicles',
    Commit: 'Bidding Open',
    Reveal: 'Opening Envelopes',
    Sold: 'Sold',
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Unboxed Header & Search Filter Bar */}
      <div className="border-b border-[#232730] pb-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-semibold text-[#F4F5F7]">
              Available Vehicles
            </h1>
            <p className="text-xs text-[#8E95A5] mt-1">
              Every listed car includes an AI fair-market valuation in Rupees (₹) and private sealed-envelope bidding.
            </p>
          </div>

          <div className="text-xs font-mono text-[#8E95A5] tabular-nums">
            Showing <strong className="text-[#F4F5F7]">{filtered.length}</strong> of{' '}
            {auctions.length} vehicles
          </div>
        </div>

        {/* Search & Status Filter Controls */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#646C7E] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by brand, model, or year..."
              className="w-full pl-10 pr-4 py-2 bg-[#12141A] border border-[#232730] focus:border-[#C5A46D] rounded-md text-xs text-[#F4F5F7] placeholder-[#646C7E] focus:outline-none transition-colors"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1 bg-[#12141A] p-1 rounded-md border border-[#232730]">
            {(['ALL', 'Commit', 'Reveal', 'Sold'] as const).map((ph) => {
              const active = phaseFilter === ph;
              return (
                <button
                  key={ph}
                  type="button"
                  onClick={() => setPhaseFilter(ph)}
                  className={`px-3 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#C5A46D] text-[#0B0C10] font-semibold'
                      : 'text-[#8E95A5] hover:text-[#F4F5F7]'
                  }`}
                >
                  {phaseLabels[ph]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Brand Filter Strip (only shown if brands exist) */}
        {brands.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto pt-1">
            <span className="text-xs text-[#646C7E] mr-1 shrink-0">Brand:</span>
            {brands.map((b) => {
              const active = brandFilter === b;
              return (
                <button
                  key={b}
                  type="button"
                  onClick={() => setBrandFilter(b)}
                  className={`px-2.5 py-1 rounded text-xs whitespace-nowrap border transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#171A22] text-[#C5A46D] border-[#C5A46D]/50 font-medium'
                      : 'bg-transparent text-[#8E95A5] border-[#232730] hover:text-[#F4F5F7]'
                  }`}
                >
                  {b === 'ALL' ? 'All Brands' : b}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Vehicle Grid */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center space-y-2 border-b border-[#232730]">
          <p className="text-sm font-medium text-[#F4F5F7]">
            No vehicles match your search or filter.
          </p>
          <p className="text-xs text-[#8E95A5]">
            Clear your search filter or wait for a seller to list a new vehicle.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((auction) => (
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
