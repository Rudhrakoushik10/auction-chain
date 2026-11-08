import React, { useState } from 'react';
import {
  LayoutDashboard,
  PlusCircle,
  Calculator,
  History,
  UserCheck,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  CheckCircle2,
} from 'lucide-react';
import { AuctionItem } from '../../types/auction';
import { useWallet } from '../../context/WalletContext';
import { formatInr, formatEthToInr, shortenAddress } from '../../lib/crypto';
import { CreateAuction } from '../CreateAuction';
import { AIPriceEstimatorPage } from '../public/AIPriceEstimatorPage';

export type SellerNavTab =
  | 'dashboard'
  | 'create'
  | 'estimator'
  | 'wallet'
  | 'account';

interface SellerDashboardProps {
  auctions: AuctionItem[];
  onSelectAuction: (auction: AuctionItem) => void;
  onCreateAuction: (newAuction: AuctionItem) => void;
  onFinalizeAuction: (auctionId: string) => Promise<{ success: boolean; message: string }>;
  onWithdrawProceeds: (auctionId: string) => Promise<{ success: boolean; message: string }>;
}

export const SellerDashboard: React.FC<SellerDashboardProps> = ({
  auctions,
  onSelectAuction,
  onCreateAuction,
  onFinalizeAuction,
  onWithdrawProceeds,
}) => {
  const { wallet, disconnectWallet } = useWallet();
  const [activeTab, setActiveTab] = useState<SellerNavTab>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const isDeskExpanded = !isSidebarCollapsed || isSidebarHovered;
  const [auctionFilter, setAuctionFilter] = useState<'all' | 'active' | 'upcoming' | 'completed'>('all');
  const [txNotice, setTxNotice] = useState<string | null>(null);

  React.useEffect(() => {
    setActiveTab('dashboard');
    setAuctionFilter('all');
  }, [wallet?.address]);

  React.useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [activeTab, wallet?.address]);

  if (!wallet) return null;

  const myAuctions = auctions.filter(
    (a) => a.sellerAddress.toLowerCase() === wallet.address.toLowerCase()
  );

  const activeAuctions = myAuctions.filter(
    (a) => a.phase === 'Commit' || a.phase === 'Reveal'
  );
  const upcomingAuctions = myAuctions.filter((a) => a.phase === 'Upcoming');
  const completedAuctions = myAuctions.filter(
    (a) => a.phase === 'Sold' || a.phase === 'No Sale'
  );

  const totalBidsReceived = myAuctions.reduce(
    (sum, a) => sum + (a.commitments?.length || 0),
    0
  );

  const sidebarItems: { id: SellerNavTab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'dashboard', label: 'My Vehicles', icon: <LayoutDashboard className="w-4 h-4 shrink-0" />, count: myAuctions.length },
    { id: 'create', label: 'List a Vehicle', icon: <PlusCircle className="w-4 h-4 shrink-0" /> },
    { id: 'estimator', label: 'AI Price Check', icon: <Calculator className="w-4 h-4 shrink-0" /> },
    { id: 'wallet', label: 'Activity Log', icon: <History className="w-4 h-4 shrink-0" /> },
    { id: 'account', label: 'My Account', icon: <UserCheck className="w-4 h-4 shrink-0" /> },
  ];

  const getFilteredList = () => {
    if (auctionFilter === 'active') return activeAuctions;
    if (auctionFilter === 'upcoming') return upcomingAuctions;
    if (auctionFilter === 'completed') return completedAuctions;
    return myAuctions;
  };

  const formatPhaseLabel = (phase: AuctionItem['phase']) => {
    if (phase === 'Commit') return 'Bidding Open (Sealed)';
    if (phase === 'Reveal') return 'Opening Envelopes';
    if (phase === 'Sold') return 'Sold';
    if (phase === 'No Sale') return 'Reserve Not Met';
    return phase;
  };

  const renderAuctionTable = (items: AuctionItem[]) => {
    if (items.length === 0) {
      return (
        <div className="py-14 text-center space-y-3 border-b border-[#232730]">
          <div className="text-sm font-medium text-[#F4F5F7]">
            No vehicles in this view yet.
          </div>
          <p className="text-xs text-[#8E95A5] max-w-md mx-auto">
            List a vehicle to get an instant AI fair-price estimate in Rupees (₹) and start accepting private sealed bids.
          </p>
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setActiveTab('create')}
              className="px-4 py-2 rounded-md bg-[#C5A46D] hover:bg-[#D4B57E] text-[#0B0C10] text-xs font-semibold transition-colors cursor-pointer"
            >
              List a Vehicle
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto border-b border-[#232730]">
        <table className="w-full text-xs text-left">
          <thead className="text-[#8E95A5] border-b border-[#232730]">
            <tr>
              <th className="py-3.5 px-4 font-medium">Vehicle</th>
              <th className="py-3.5 px-4 font-medium">Status</th>
              <th className="py-3.5 px-4 font-medium text-right">AI Fair Value (₹)</th>
              <th className="py-3.5 px-4 font-medium text-right">Start / Minimum Price</th>
              <th className="py-3.5 px-4 font-medium text-right">Bids & Top Offer</th>
              <th className="py-3.5 px-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#232730]">
            {items.map((auc) => {
              const revealedCount = auc.commitments.filter((c) => c.revealed).length;
              return (
                <tr key={auc.id} className="hover:bg-[#12141A] transition-colors">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={auc.imageUrl}
                        alt={auc.title}
                        referrerPolicy="no-referrer"
                        className="w-12 h-9 object-cover rounded border border-[#232730] shrink-0"
                      />
                      <div>
                        <div className="font-semibold text-[#F4F5F7] line-clamp-1">{auc.title}</div>
                        <div className="font-mono text-[11px] text-[#8E95A5] tabular-nums">
                          Lot #{auc.numericId} · {String(auc.attributes.year ?? auc.attributes.manufacturing_year)} · {Number(auc.attributes.mileage ?? auc.attributes.mileage_km ?? 0).toLocaleString('en-IN')} km
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 font-medium whitespace-nowrap">
                    <span
                      className={
                        auc.phase === 'Commit'
                          ? 'text-[#C5A46D]'
                          : auc.phase === 'Reveal'
                          ? 'text-[#D49B38]'
                          : auc.phase === 'Sold'
                          ? 'text-[#2E9B68]'
                          : 'text-[#8E95A5]'
                      }
                    >
                      {formatPhaseLabel(auc.phase)}
                    </span>
                  </td>
                  <td className="py-4 px-4 font-mono text-[#F4F5F7] text-right whitespace-nowrap tabular-nums">
                    {formatInr(auc.aiPrediction.predicted_price ?? auc.aiPrediction.predicted_price_inr)}
                  </td>
                  <td className="py-4 px-4 font-mono text-[#F4F5F7] text-right whitespace-nowrap tabular-nums">
                    <div>
                      {formatEthToInr(auc.startingBidEth)} / {formatEthToInr(auc.reservePriceEth)}
                    </div>
                    <div className="text-[11px] text-[#8E95A5]">
                      {auc.startingBidEth.toFixed(2)} / {auc.reservePriceEth.toFixed(2)} ETH
                    </div>
                  </td>
                  <td className="py-4 px-4 font-mono text-[#F4F5F7] text-right whitespace-nowrap tabular-nums">
                    <div>
                      {auc.commitments.length} bids ({revealedCount} opened)
                    </div>
                    <div className="text-[11px] text-[#8E95A5]">
                      {auc.phase === 'Commit'
                        ? 'Hidden inside envelopes'
                        : auc.highestBidEth
                        ? `Top: ${formatEthToInr(auc.highestBidEth)} (${auc.highestBidEth.toFixed(2)} ETH)`
                        : 'No opened bids yet'}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-right whitespace-nowrap">
                    <div className="inline-flex items-center justify-end gap-2">
                      {auc.phase === 'Reveal' && (
                        <button
                          type="button"
                          onClick={async () => {
                            const res = await onFinalizeAuction(auc.id);
                            setTxNotice(res.message);
                          }}
                          className="px-2.5 py-1.5 rounded bg-[#171A22] hover:bg-[#232730] border border-[#232730] text-[#F4F5F7] font-medium cursor-pointer"
                        >
                          Close & Pick Winner
                        </button>
                      )}
                      {auc.phase === 'Sold' && auc.winnerSettled && !auc.sellerWithdrawn && (
                        <button
                          type="button"
                          onClick={async () => {
                            const res = await onWithdrawProceeds(auc.id);
                            setTxNotice(res.message);
                          }}
                          className="px-2.5 py-1.5 rounded bg-[#C5A46D] hover:bg-[#D4B57E] text-[#0B0C10] font-semibold cursor-pointer"
                        >
                          Withdraw {formatEthToInr(auc.highestBidEth || 0)}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onSelectAuction(auc)}
                        className="px-2.5 py-1.5 rounded border border-[#232730] hover:border-[#C5A46D]/50 text-[#F4F5F7] hover:text-[#C5A46D] font-medium cursor-pointer"
                      >
                        View Details
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const sellerEvents = myAuctions.flatMap((a) => a.events);

  return (
    <div className="relative flex flex-row items-start gap-6 min-h-[calc(100vh-8rem)] pb-16">
      {/* Disappearing Left-Side Role Desk */}
      <aside
        onMouseEnter={() => setIsSidebarHovered(true)}
        onMouseLeave={() => setIsSidebarHovered(false)}
        className={`${
          isDeskExpanded ? 'w-56 shadow-2xl shadow-black/60' : 'w-14'
        } sticky top-24 left-0 z-30 bg-[#12141A]/95 backdrop-blur-md rounded-md border border-[#232730] p-2.5 flex flex-col justify-between shrink-0 h-fit transition-all duration-200 ease-out overflow-hidden`}
      >
        <div className="space-y-2">
          <div
            className={`flex items-center ${
              isDeskExpanded ? 'justify-between px-2' : 'justify-center'
            } py-1.5 border-b border-[#232730]`}
          >
            {isDeskExpanded && (
              <span className="text-xs font-mono text-[#C5A46D] whitespace-nowrap">
                Seller Menu
              </span>
            )}
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed((prev) => !prev)}
              className="inline-flex p-1.5 rounded text-[#8E95A5] hover:text-[#F4F5F7] hover:bg-[#171A22] transition-colors cursor-pointer"
              aria-label={isDeskExpanded ? 'Collapse menu' : 'Expand menu'}
              title={isSidebarCollapsed ? 'Pin menu open' : 'Auto-hide menu'}
            >
              {isDeskExpanded ? (
                <PanelLeftClose className="w-4 h-4" />
              ) : (
                <PanelLeftOpen className="w-4 h-4 text-[#C5A46D]" />
              )}
            </button>
          </div>

          <nav className="space-y-1">
            {sidebarItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsSidebarHovered(false);
                  }}
                  title={item.label}
                  className={`w-full flex items-center ${
                    isDeskExpanded ? 'justify-between px-3' : 'justify-center px-2'
                  } py-2 rounded text-xs font-medium transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#C5A46D] text-[#0B0C10] font-semibold'
                      : 'text-[#8E95A5] hover:text-[#F4F5F7] hover:bg-[#171A22]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {item.icon}
                    {isDeskExpanded && <span className="whitespace-nowrap">{item.label}</span>}
                  </div>
                  {isDeskExpanded && item.count !== undefined && (
                    <span className="font-mono text-[11px] tabular-nums opacity-80">
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="pt-3 border-t border-[#232730] mt-4">
          <button
            type="button"
            onClick={disconnectWallet}
            title="Sign Out"
            className="w-full flex items-center justify-center gap-2 px-2.5 py-2 rounded text-xs font-medium text-[#C94A4A] hover:bg-[#C94A4A]/10 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {isDeskExpanded && <span className="whitespace-nowrap">Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 space-y-8">
        {txNotice && (
          <div className="px-4 py-3 rounded-md bg-[#2E9B68]/10 border border-[#2E9B68]/40 text-xs text-[#F4F5F7] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#2E9B68] shrink-0" />
              <span>{txNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setTxNotice(null)}
              className="text-[#8E95A5] hover:text-[#F4F5F7] text-xs cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* 1. Unified Seller Workspace (KPIs + Filter + Vehicle Table) */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#232730] pb-5">
              <div>
                <h1 className="text-2xl font-display font-semibold text-[#F4F5F7]">
                  Seller Workspace
                </h1>
                <p className="text-xs text-[#8E95A5] mt-1">
                  List vehicles with an AI fair-price guide, track private sealed bids, and withdraw your sale proceeds.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('create')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md bg-[#C5A46D] hover:bg-[#D4B57E] text-[#0B0C10] text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer self-start sm:self-auto"
              >
                <PlusCircle className="w-4 h-4" />
                <span>List a Vehicle</span>
              </button>
            </div>

            {/* Clean Hairline KPI Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 border-b border-[#232730] pb-6 font-mono tabular-nums">
              <div>
                <div className="text-xs font-sans text-[#8E95A5]">Listed Vehicles</div>
                <div className="text-2xl font-semibold text-[#F4F5F7] mt-1">{myAuctions.length}</div>
              </div>
              <div>
                <div className="text-xs font-sans text-[#8E95A5]">Open for Bidding</div>
                <div className="text-2xl font-semibold text-[#C5A46D] mt-1">{activeAuctions.length}</div>
              </div>
              <div>
                <div className="text-xs font-sans text-[#8E95A5]">Completed Auctions</div>
                <div className="text-2xl font-semibold text-[#2E9B68] mt-1">{completedAuctions.length}</div>
              </div>
              <div>
                <div className="text-xs font-sans text-[#8E95A5]">Total Bids Received</div>
                <div className="text-2xl font-semibold text-[#F4F5F7] mt-1">{totalBidsReceived}</div>
              </div>
            </div>

            {/* Vehicle Listings Ledger */}
            <section className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h2 className="text-base font-display font-semibold text-[#F4F5F7]">
                  Your Vehicle Listings
                </h2>

                <div className="flex items-center gap-1 p-1 bg-[#12141A] rounded-md border border-[#232730] self-start sm:self-auto">
                  {(
                    [
                      { id: 'all', label: `All (${myAuctions.length})` },
                      { id: 'active', label: `Open (${activeAuctions.length})` },
                      { id: 'upcoming', label: `Upcoming (${upcomingAuctions.length})` },
                      { id: 'completed', label: `Completed (${completedAuctions.length})` },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setAuctionFilter(tab.id)}
                      className={`px-3 py-1 rounded text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                        auctionFilter === tab.id
                          ? 'bg-[#C5A46D] text-[#0B0C10] font-semibold'
                          : 'text-[#8E95A5] hover:text-[#F4F5F7]'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {renderAuctionTable(getFilteredList())}
            </section>
          </div>
        )}

        {/* 2. List a Vehicle Wizard */}
        {activeTab === 'create' && (
          <CreateAuction
            onCreateAuction={(newAuc) => {
              onCreateAuction(newAuc);
              setActiveTab('dashboard');
            }}
            nextNumericId={auctions.length + 1}
          />
        )}

        {/* 3. AI Price Check */}
        {activeTab === 'estimator' && <AIPriceEstimatorPage />}

        {/* 4. Activity Log */}
        {activeTab === 'wallet' && (
          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-[#232730] pb-4">
              <div>
                <h2 className="text-xl font-display font-semibold text-[#F4F5F7]">
                  Seller Activity Log
                </h2>
                <p className="text-xs text-[#8E95A5] mt-1">
                  History of vehicle listings, sealed bids received, and sale payouts for your account.
                </p>
              </div>
              <span className="text-xs font-mono text-[#8E95A5] tabular-nums">
                Balance: {wallet.balanceEth.toFixed(2)} ETH ({formatEthToInr(wallet.balanceEth)})
              </span>
            </div>

            {sellerEvents.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#8E95A5] border-b border-[#232730]">
                No activity recorded for your vehicles yet.
              </div>
            ) : (
              <div className="overflow-x-auto border-b border-[#232730]">
                <table className="w-full text-xs text-left">
                  <thead className="text-[#8E95A5] border-b border-[#232730]">
                    <tr>
                      <th className="py-3 px-4 font-medium">Action</th>
                      <th className="py-3 px-4 font-medium">Details</th>
                      <th className="py-3 px-4 font-medium text-right">Block</th>
                      <th className="py-3 px-4 font-medium text-right">Receipt ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#232730]">
                    {sellerEvents.map((evt) => (
                      <tr key={evt.id} className="hover:bg-[#12141A] transition-colors">
                        <td className="py-3.5 px-4 font-mono font-semibold text-[#C5A46D] whitespace-nowrap">
                          {evt.eventName}
                        </td>
                        <td className="py-3.5 px-4 text-[#F4F5F7]">{evt.summary}</td>
                        <td className="py-3.5 px-4 font-mono text-[#8E95A5] text-right tabular-nums">
                          #{evt.blockNumber}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[#8E95A5] text-right tabular-nums">
                          {shortenAddress(evt.txHash)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* 5. My Account */}
        {activeTab === 'account' && (
          <section className="max-w-2xl space-y-6">
            <div className="border-b border-[#232730] pb-4">
              <h2 className="text-xl font-display font-semibold text-[#F4F5F7]">
                Seller Account Details
              </h2>
              <p className="text-xs text-[#8E95A5] mt-1">
                Your connected seller wallet and permissions on AuctionChain.
              </p>
            </div>

            <dl className="divide-y divide-[#232730] border-b border-[#232730] text-xs">
              <div className="py-3.5 flex justify-between gap-4">
                <dt className="text-[#8E95A5]">Account Role</dt>
                <dd className="text-[#F4F5F7] font-semibold">{wallet.roleTitle} ({wallet.label})</dd>
              </div>
              <div className="py-3.5 flex justify-between gap-4">
                <dt className="text-[#8E95A5]">Wallet Address</dt>
                <dd className="text-[#F4F5F7] font-mono break-all">{wallet.address}</dd>
              </div>
              <div className="py-3.5 flex justify-between gap-4">
                <dt className="text-[#8E95A5]">Available Balance</dt>
                <dd className="text-[#C5A46D] font-mono tabular-nums">
                  {wallet.balanceEth.toFixed(4)} ETH ({formatEthToInr(wallet.balanceEth)})
                </dd>
              </div>
              <div className="py-3.5 flex justify-between gap-4">
                <dt className="text-[#8E95A5]">What You Can Do</dt>
                <dd className="text-[#F4F5F7] text-right">
                  List vehicles, set minimum reserve prices, close auctions, and withdraw sale proceeds
                </dd>
              </div>
            </dl>
          </section>
        )}
      </div>
    </div>
  );
};
