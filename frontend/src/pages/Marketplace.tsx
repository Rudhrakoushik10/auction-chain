import React, { useState } from 'react';
import { AuctionItem, AuctionPhase } from '../types/auction';
import { AuctionCard } from '../components/auction/AuctionCard';
import { Search, SlidersHorizontal } from 'lucide-react';

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

  return (
    <div className="space-y-8 pb-16">
      {/* Editorial Header & Filter Console */}
      <div className="bg-[#12141A] border border-[#232730] rounded-md p-6 sm:p-8 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-[#232730] pb-6">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-[0.16em] text-[#C5A46D]">
              Verified Reserve Inventory
            </span>
            <h1 className="text-2xl sm:text-3xl font-display font-semibold text-[#F4F5F7] mt-1">
              Sealed-Bid Vehicle Exchange
            </h1>
            <p className="text-sm text-[#8E95A5] mt-1">
              Every lot carries an on-chain{' '}
              <code className="font-mono text-[#F4F5F7]">PriceOracle.sol</code>{' '}
              valuation certificate and enforces uniform deposit commitments.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono text-[#8E95A5]">
            <span>
              SHOWING <strong className="text-[#F4F5F7]">{filtered.length}</strong> OF{' '}
              {auctions.length} LOTS
            </span>
          </div>
        </div>

        {/* Search & Segmented Phase Controls */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#646C7E] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by make, model, lot ID, or provenance..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#0B0C10] border border-[#232730] focus:border-[#C5A46D] rounded-md text-xs text-[#F4F5F7] placeholder-[#646C7E] focus:outline-none transition-colors"
            />
          </div>

          {/* Phase Segmented Control */}
          <div className="flex flex-wrap items-center gap-1.5 bg-[#0B0C10] p-1 rounded-md border border-[#232730]">
            {(['ALL', 'Commit', 'Reveal', 'Sold'] as const).map((ph) => {
              const active = phaseFilter === ph;
              return (
                <button
                  key={ph}
                  type="button"
                  onClick={() => setPhaseFilter(ph)}
                  className={`px-3.5 py-1.5 rounded text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#C5A46D] text-[#0B0C10] font-semibold'
                      : 'text-[#8E95A5] hover:text-[#F4F5F7]'
                  }`}
                >
                  {ph === 'ALL' ? 'All Phases' : ph}
                </button>
              );
            })}
          </div>
        </div>

        {/* Make / Brand Strip */}
        <div className="flex items-center gap-2 overflow-x-auto pt-1">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#646C7E] flex items-center gap-1.5 mr-2 shrink-0">
            <SlidersHorizontal className="w-3 h-3 text-[#C5A46D]" />
            Manufacturer:
          </span>
          {brands.map((b) => {
            const active = brandFilter === b;
            return (
              <button
                key={b}
                type="button"
                onClick={() => setBrandFilter(b)}
                className={`px-3 py-1 rounded text-xs whitespace-nowrap border transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#171A22] text-[#C5A46D] border-[#C5A46D]/50 font-medium'
                    : 'bg-[#0B0C10] text-[#8E95A5] border-[#232730] hover:text-[#F4F5F7]'
                }`}
              >
                {b === 'ALL' ? 'All Makes' : b}
              </button>
            );
          })}
        </div>
      </div>

      {/* Vehicle Grid */}
      {filtered.length === 0 ? (
        <div className="bg-[#12141A] border border-[#232730] rounded-md p-14 text-center space-y-2">
          <p className="text-sm font-medium text-[#F4F5F7]">
            No vehicle lots match your active filter criteria.
          </p>
          <p className="text-xs text-[#8E95A5]">
            Clear your search query or switch phase filters to inspect all consigned
            vehicles.
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
