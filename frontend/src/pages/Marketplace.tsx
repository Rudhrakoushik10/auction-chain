import React, { useState } from 'react';
import {
  Search,
  Filter,
  Gavel,
} from 'lucide-react';
import { AuctionItem } from '../types/auction';
import { AuctionCard } from '../components/auction/AuctionCard';

interface MarketplaceProps {
  auctions: AuctionItem[];
  onSelectAuction: (auction: AuctionItem) => void;
  onCreateClick: () => void;
}

type FilterStatus = 'All' | 'Open' | 'Revealed' | 'Closed';

export const Marketplace: React.FC<MarketplaceProps> = ({
  auctions,
  onSelectAuction,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<FilterStatus>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAuctions = auctions.filter((auc) => {
    const matchesStatus =
      selectedStatus === 'All' ||
      (selectedStatus === 'Open' && auc.phase === 'Commit') ||
      (selectedStatus === 'Revealed' &&
        (auc.phase === 'Reveal' || (auc.phase === 'Sold' && !auc.winnerSettled))) ||
      (selectedStatus === 'Closed' &&
        ((auc.phase === 'Sold' && auc.winnerSettled) || auc.phase === 'No Sale'));

    const matchesSearch =
      searchQuery.trim() === '' ||
      auc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      auc.subtitle.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  const statusTabs: { id: FilterStatus; label: string }[] = [
    { id: 'All', label: 'All Vehicles' },
    { id: 'Open', label: 'Bidding Open' },
    { id: 'Revealed', label: 'Bids Revealed' },
    { id: 'Closed', label: 'Closed' },
  ];

  return (
    <div className="space-y-5">
      {/* Search & Status Filter */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by brand, model, or year..."
            className="w-full bg-slate-950/90 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/60"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs text-slate-400 flex items-center gap-1 mr-1 shrink-0">
            <Filter className="w-3.5 h-3.5" />
            Status:
          </span>
          {statusTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedStatus(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 cursor-pointer ${
                selectedStatus === tab.id
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40'
                  : 'text-slate-400 hover:text-white bg-slate-950/60 border border-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Auction Grid */}
      {filteredAuctions.length === 0 ? (
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-12 text-center">
          <Gavel className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">
            {auctions.length === 0
              ? 'No Vehicle Auctions Listed Yet'
              : 'No Matching Vehicles Found'}
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {auctions.length === 0
              ? 'Switch to the Seller account to list a vehicle and open a bidding window.'
              : 'Try clearing your search filter to view all vehicle auctions.'}
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
