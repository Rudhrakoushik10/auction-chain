import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Gavel,
  Coins,
  History,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  RefreshCw,
  CheckCircle2,
  Globe,
  Trash2,
  RotateCcw,
} from 'lucide-react';
import { AuctionItem } from '../../types/auction';
import { useWallet } from '../../context/WalletContext';
import { formatInr, formatEthToInr, shortenAddress } from '../../lib/crypto';

export type AdminNavTab =
  | 'dashboard'
  | 'oracle'
  | 'auctions'
  | 'roles'
  | 'blockchain';

interface AdminDashboardProps {
  auctions: AuctionItem[];
  onSelectAuction: (auction: AuctionItem) => void;
  onDeleteAuction?: (auctionId: string) => void;
  onResetAllData?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  auctions,
  onSelectAuction,
  onDeleteAuction,
  onResetAllData,
}) => {
  const {
    wallet,
    humanWallets,
    disconnectWallet,
    oracleContractAddress,
    auctionContractAddress,
    liveEthInrRate,
    oracleRoundId,
    updateLivePriceFeed,
    isFetchingMarketRate,
    marketRateSource,
    lastMarketFetchTime,
    isAutoMarketSync,
    fetchRealMarketEthRate,
    toggleAutoMarketSync,
  } = useWallet();

  const [activeTab, setActiveTab] = useState<AdminNavTab>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const isDeskExpanded = !isSidebarCollapsed || isSidebarHovered;
  const [rateInput, setRateInput] = useState<string>(liveEthInrRate.toString());
  const [isUpdatingFeed, setIsUpdatingFeed] = useState<boolean>(false);
  const [feedFeedback, setFeedFeedback] = useState<string | null>(null);
  const [confirmingResetAll, setConfirmingResetAll] = useState<boolean>(false);
  const [adminNotice, setAdminNotice] = useState<string | null>(null);

  React.useEffect(() => {
    setActiveTab('dashboard');
    setConfirmingResetAll(false);
  }, [wallet?.address]);

  React.useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [activeTab, wallet?.address]);

  if (!wallet) return null;

  const handleUpdatePriceFeed = async (newVal?: number) => {
    const val = newVal ?? Number(rateInput);
    if (!val || isNaN(val) || val <= 0) return;
    setIsUpdatingFeed(true);
    setFeedFeedback(null);
    try {
      await updateLivePriceFeed(val);
      setRateInput(val.toString());
      setFeedFeedback(`Updated exchange rate (Round #${oracleRoundId + 1}): 1 ETH = ₹${val.toLocaleString('en-IN')}`);
      setTimeout(() => setFeedFeedback(null), 4000);
    } catch {
      setFeedFeedback('Could not update the Rupee exchange rate.');
    } finally {
      setIsUpdatingFeed(false);
    }
  };

  const handleFetchMarketPrice = async () => {
    setFeedFeedback(null);
    const newPrice = await fetchRealMarketEthRate();
    if (newPrice) {
      setRateInput(newPrice.toString());
      setFeedFeedback(`Fetched live market rate: 1 ETH = ₹${newPrice.toLocaleString('en-IN')} (${marketRateSource || 'CoinGecko'})`);
      setTimeout(() => setFeedFeedback(null), 5000);
    } else {
      setFeedFeedback('Could not reach external price service. Keeping current rate.');
    }
  };

  const activeAuctions = auctions.filter((a) => a.phase === 'Commit' || a.phase === 'Reveal');
  const allEvents = auctions.flatMap((a) => a.events);

  const sidebarItems: { id: AdminNavTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4 shrink-0" /> },
    { id: 'oracle', label: 'Rupee Rate (ETH / ₹)', icon: <Coins className="w-4 h-4 shrink-0" /> },
    { id: 'auctions', label: 'All Auctions', icon: <Gavel className="w-4 h-4 shrink-0" /> },
    { id: 'roles', label: 'User Accounts', icon: <Users className="w-4 h-4 shrink-0" /> },
    { id: 'blockchain', label: 'Activity Log', icon: <History className="w-4 h-4 shrink-0" /> },
  ];

  const formatPhaseLabel = (phase: AuctionItem['phase']) => {
    if (phase === 'Commit') return 'Bidding Open (Sealed)';
    if (phase === 'Reveal') return 'Opening Envelopes';
    if (phase === 'Sold') return 'Sold';
    if (phase === 'No Sale') return 'Reserve Not Met';
    return phase;
  };

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
                Admin Menu
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
                    isDeskExpanded ? 'gap-2.5 px-3' : 'justify-center px-2'
                  } py-2 rounded text-xs font-medium transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#C5A46D] text-[#0B0C10] font-semibold'
                      : 'text-[#8E95A5] hover:text-[#F4F5F7] hover:bg-[#171A22]'
                  }`}
                >
                  {item.icon}
                  {isDeskExpanded && <span className="whitespace-nowrap">{item.label}</span>}
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
        {adminNotice && (
          <div className="p-3.5 rounded-md bg-emerald-950/30 border border-emerald-500/30 text-emerald-200 text-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{adminNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setAdminNotice(null)}
              className="text-[11px] text-[#8E95A5] hover:text-[#F4F5F7] cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Inline Confirmation Bar for Data Reset */}
        {confirmingResetAll && (
          <div className="p-4 rounded-md bg-rose-950/30 border border-rose-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-0.5">
              <div className="text-xs font-semibold text-rose-200">
                Confirm Platform Data Reset
              </div>
              <p className="text-xs text-rose-300/80">
                This will delete all registered and completed vehicle auctions ({auctions.length}), clear saved bid secrets, and reset account balances for a clean demo.
              </p>
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setConfirmingResetAll(false)}
                className="px-3 py-1.5 rounded border border-[#232730] bg-[#12141A] text-xs text-[#8E95A5] hover:text-[#F4F5F7] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onResetAllData?.();
                  setConfirmingResetAll(false);
                  setAdminNotice('Platform data reset complete: All registered and completed auctions have been cleared.');
                  setTimeout(() => setAdminNotice(null), 5000);
                }}
                className="px-3.5 py-1.5 rounded bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold cursor-pointer"
              >
                Yes, Reset All Data
              </button>
            </div>
          </div>
        )}

        {/* 1. Platform Overview */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#232730] pb-5">
              <div>
                <h1 className="text-2xl font-display font-semibold text-[#F4F5F7]">
                  Platform Overview
                </h1>
                <p className="text-xs text-[#8E95A5] mt-1">
                  Monitor active vehicle auctions, live Indian Rupee (₹) exchange rates, and platform data.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setConfirmingResetAll(true)}
                  className="px-3.5 py-2.5 rounded-md bg-[#12141A] hover:bg-rose-950/40 border border-[#232730] hover:border-rose-500/40 text-rose-400 text-xs font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset All Data</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('oracle')}
                  className="px-4 py-2.5 rounded-md bg-[#C5A46D] hover:bg-[#D4B57E] text-[#0B0C10] text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Manage Rupee Rate (ETH / ₹)
                </button>
              </div>
            </div>

            {/* Clean Hairline KPI Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 border-b border-[#232730] pb-6 font-mono tabular-nums">
              <div>
                <div className="text-xs font-sans text-[#8E95A5]">Listed Vehicles</div>
                <div className="text-2xl font-semibold text-[#F4F5F7] mt-1">{auctions.length}</div>
              </div>
              <div>
                <div className="text-xs font-sans text-[#8E95A5]">Open Auctions</div>
                <div className="text-2xl font-semibold text-[#C5A46D] mt-1">{activeAuctions.length}</div>
              </div>
              <div>
                <div className="text-xs font-sans text-[#8E95A5]">Live ETH / ₹ Rate</div>
                <div className="text-2xl font-semibold text-[#F4F5F7] mt-1">
                  ₹{liveEthInrRate.toLocaleString('en-IN')}
                </div>
              </div>
              <div>
                <div className="text-xs font-sans text-[#8E95A5]">Recorded Actions</div>
                <div className="text-2xl font-semibold text-[#2E9B68] mt-1">{allEvents.length}</div>
              </div>
            </div>

            {/* Platform Services Ledger */}
            <section className="space-y-4">
              <div>
                <h2 className="text-base font-display font-semibold text-[#F4F5F7]">
                  Core Platform Services
                </h2>
                <p className="text-xs text-[#8E95A5] mt-0.5">
                  The four services running behind AuctionChain.
                </p>
              </div>

              <div className="overflow-x-auto border-t border-b border-[#232730]">
                <table className="w-full text-xs text-left">
                  <thead className="text-[#8E95A5] border-b border-[#232730]">
                    <tr>
                      <th className="py-3.5 px-4 font-medium">Service</th>
                      <th className="py-3.5 px-4 font-medium">What It Does</th>
                      <th className="py-3.5 px-4 font-medium">Location / Address</th>
                      <th className="py-3.5 px-4 font-medium text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#232730]">
                    <tr>
                      <td className="py-4 px-4 font-semibold text-[#F4F5F7]">01. Web Application</td>
                      <td className="py-4 px-4 text-[#8E95A5]">
                        Buyer, seller, and admin dashboards with private browser-side bid sealing
                      </td>
                      <td className="py-4 px-4 font-mono text-[#8E95A5]">Port 3000</td>
                      <td className="py-4 px-4 text-right text-[#2E9B68] font-medium">Running</td>
                    </tr>
                    <tr>
                      <td className="py-4 px-4 font-semibold text-[#F4F5F7]">02. AI Car Valuation Service</td>
                      <td className="py-4 px-4 text-[#8E95A5]">
                        Estimates fair market prices in Indian Rupees (₹) before cars are listed
                      </td>
                      <td className="py-4 px-4 font-mono text-[#8E95A5]">/api/predict-price</td>
                      <td className="py-4 px-4 text-right text-[#2E9B68] font-medium">Ready</td>
                    </tr>
                    <tr>
                      <td className="py-4 px-4 font-semibold text-[#F4F5F7]">03. Sealed-Bid Auction Vault</td>
                      <td className="py-4 px-4 text-[#8E95A5]">
                        Holds refundable security deposits, verifies sealed envelopes, and pays the seller
                      </td>
                      <td className="py-4 px-4 font-mono text-[#C5A46D]">{shortenAddress(auctionContractAddress)}</td>
                      <td className="py-4 px-4 text-right text-[#2E9B68] font-medium">Active</td>
                    </tr>
                    <tr>
                      <td className="py-4 px-4 font-semibold text-[#F4F5F7]">04. Live Rupee Price Feed</td>
                      <td className="py-4 px-4 text-[#8E95A5]">
                        Converts all ETH deposits and bids into Indian Rupees (₹) in real time
                      </td>
                      <td className="py-4 px-4 font-mono text-[#C5A46D]">{shortenAddress(oracleContractAddress)}</td>
                      <td className="py-4 px-4 text-right text-[#2E9B68] font-medium">Synced</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {/* 2. Rupee Rate (ETH / ₹) */}
        {activeTab === 'oracle' && (
          <div className="space-y-8">
            <div className="border-b border-[#232730] pb-5">
              <h2 className="text-2xl font-display font-semibold text-[#F4F5F7]">
                Live Rupee Exchange Rate (ETH / ₹)
              </h2>
              <p className="text-xs text-[#8E95A5] mt-1">
                Keeps Indian Rupee (₹) prices and ETH bids in sync across every auction on the platform.
              </p>
            </div>

            {/* Clean Hairline Metric Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 border-b border-[#232730] pb-6 font-mono tabular-nums">
              <div>
                <div className="text-xs font-sans text-[#8E95A5]">Current Exchange Rate</div>
                <div className="text-2xl font-semibold text-[#C5A46D] mt-1">
                  ₹{liveEthInrRate.toLocaleString('en-IN')}
                </div>
                <div className="text-[11px] font-sans text-[#8E95A5] mt-0.5">per 1 ETH</div>
              </div>
              <div>
                <div className="text-xs font-sans text-[#8E95A5]">Update Number</div>
                <div className="text-2xl font-semibold text-[#F4F5F7] mt-1">#{oracleRoundId}</div>
              </div>
              <div>
                <div className="text-xs font-sans text-[#8E95A5]">Rate Source</div>
                <div className="text-base font-sans font-semibold text-[#F4F5F7] mt-2">
                  {marketRateSource || 'Default Rate'}
                </div>
                {lastMarketFetchTime && (
                  <div className="text-[11px] font-sans text-[#8E95A5] mt-0.5">
                    Synced at {new Date(lastMarketFetchTime).toLocaleTimeString()}
                  </div>
                )}
              </div>
              <div>
                <div className="text-xs font-sans text-[#8E95A5]">Auto-Update</div>
                <div className="mt-2 font-sans">
                  <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isAutoMarketSync}
                      onChange={(e) => toggleAutoMarketSync(e.target.checked)}
                      className="w-4 h-4 rounded accent-[#C5A46D] cursor-pointer"
                    />
                    <span className="text-xs text-[#F4F5F7] font-medium">
                      Sync every 60 seconds
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {feedFeedback && (
              <div className="p-3.5 rounded-md bg-[#2E9B68]/10 border border-[#2E9B68]/40 text-[#F4F5F7] text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#2E9B68] shrink-0" />
                <span>{feedFeedback}</span>
              </div>
            )}

            {/* Clean Two-Column Rate Controls Divided by 1px Hairline */}
            <div className="grid grid-cols-1 lg:grid-cols-2 border-b border-[#232730] divide-y lg:divide-y-0 lg:divide-x divide-[#232730]">
              {/* Left Column: Live Market Rate */}
              <div className="py-6 lg:pr-10 space-y-4">
                <div className="space-y-1">
                  <div className="text-xs font-mono text-[#C5A46D]">Option 01 · Live Market</div>
                  <h3 className="text-base font-display font-semibold text-[#F4F5F7]">
                    Sync with Real-World Market Rate
                  </h3>
                  <p className="text-xs text-[#8E95A5] leading-relaxed">
                    Fetch the current live Ethereum-to-Rupee (ETH/₹) market price from CoinGecko or Binance and apply it across all vehicle listings immediately.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleFetchMarketPrice}
                  disabled={isFetchingMarketRate}
                  className="px-4 py-2.5 rounded-md bg-[#C5A46D] hover:bg-[#D4B57E] disabled:opacity-50 text-[#0B0C10] text-xs font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer"
                >
                  {isFetchingMarketRate ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Fetching Live Rate...</span>
                    </>
                  ) : (
                    <>
                      <Globe className="w-3.5 h-3.5" />
                      <span>Fetch Live ETH / ₹ Price</span>
                    </>
                  )}
                </button>
              </div>

              {/* Right Column: Custom Rate Override */}
              <div className="py-6 lg:pl-10 space-y-4">
                <div className="space-y-1">
                  <div className="text-xs font-mono text-[#C5A46D]">Option 02 · Manual Override</div>
                  <h3 className="text-base font-display font-semibold text-[#F4F5F7]">
                    Set a Custom Exchange Rate
                  </h3>
                  <p className="text-xs text-[#8E95A5] leading-relaxed">
                    Test how vehicle reserve prices and buyer bids adjust when the ETH / ₹ exchange rate moves up or down.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-[#8E95A5]">Presets:</span>
                  {[240000, 250000, 260000, 275000, 290000].map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => handleUpdatePriceFeed(rate)}
                      disabled={isUpdatingFeed}
                      className="px-2.5 py-1 rounded bg-[#12141A] hover:bg-[#171A22] border border-[#232730] text-[#F4F5F7] hover:border-[#C5A46D]/50 text-xs font-mono transition-colors cursor-pointer"
                    >
                      ₹{(rate / 100000).toFixed(2)}L
                    </button>
                  ))}
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleUpdatePriceFeed();
                  }}
                  className="flex flex-col sm:flex-row gap-3"
                >
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8E95A5] font-mono text-sm">
                      ₹
                    </div>
                    <input
                      type="number"
                      min="1000"
                      step="500"
                      value={rateInput}
                      onChange={(e) => setRateInput(e.target.value)}
                      placeholder="Enter ETH rate in INR (e.g. 260000)"
                      className="w-full pl-8 pr-4 py-2 bg-[#12141A] border border-[#232730] focus:border-[#C5A46D] rounded-md text-[#F4F5F7] font-mono text-sm outline-none transition-colors"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isUpdatingFeed || !rateInput}
                    className="px-4 py-2 rounded-md bg-[#171A22] hover:bg-[#C5A46D] text-[#F4F5F7] hover:text-[#0B0C10] border border-[#C5A46D]/40 disabled:opacity-50 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    {isUpdatingFeed ? 'Updating...' : 'Apply Custom Rate'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* 3. All Vehicle Auctions */}
        {activeTab === 'auctions' && (
          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#232730] pb-4">
              <div>
                <h2 className="text-xl font-display font-semibold text-[#F4F5F7]">
                  All Vehicle Auctions
                </h2>
                <p className="text-xs text-[#8E95A5] mt-1">
                  Manage, inspect, or delete registered and completed vehicle auctions across the platform.
                </p>
              </div>
              {auctions.length > 0 && (
                <button
                  type="button"
                  onClick={() => setConfirmingResetAll(true)}
                  className="px-3.5 py-2 rounded-md bg-[#12141A] hover:bg-rose-950/40 border border-[#232730] hover:border-rose-500/40 text-rose-400 text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Delete All &amp; Reset Platform</span>
                </button>
              )}
            </div>

            {auctions.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#8E95A5] border-b border-[#232730]">
                No vehicle auctions are currently registered. Switch to the Seller account to list a vehicle.
              </div>
            ) : (
              <div className="overflow-x-auto border-b border-[#232730]">
                <table className="w-full text-xs text-left">
                  <thead className="text-[#8E95A5] border-b border-[#232730]">
                    <tr>
                      <th className="py-3.5 px-4 font-medium">Vehicle</th>
                      <th className="py-3.5 px-4 font-medium">Seller</th>
                      <th className="py-3.5 px-4 font-medium">Status</th>
                      <th className="py-3.5 px-4 font-medium text-right">AI Fair Value (₹)</th>
                      <th className="py-3.5 px-4 font-medium text-right">Minimum Price</th>
                      <th className="py-3.5 px-4 font-medium text-right">Sealed Bids</th>
                      <th className="py-3.5 px-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#232730] font-mono tabular-nums">
                    {auctions.map((auc) => (
                      <tr key={auc.id} className="hover:bg-[#12141A] transition-colors">
                        <td className="py-4 px-4 font-sans font-semibold text-[#F4F5F7]">
                          Lot #{auc.numericId} · {auc.title}
                        </td>
                        <td className="py-4 px-4 text-[#8E95A5]">
                          {shortenAddress(auc.sellerAddress)}
                        </td>
                        <td className="py-4 px-4 font-sans font-medium text-[#C5A46D]">
                          {formatPhaseLabel(auc.phase)}
                        </td>
                        <td className="py-4 px-4 text-right text-[#F4F5F7]">
                          {formatInr(auc.aiPrediction.predicted_price ?? auc.aiPrediction.predicted_price_inr)}
                        </td>
                        <td className="py-4 px-4 text-right text-[#F4F5F7]">
                          <div>{formatEthToInr(auc.reservePriceEth)}</div>
                          <div className="text-[11px] text-[#8E95A5]">{auc.reservePriceEth.toFixed(2)} ETH</div>
                        </td>
                        <td className="py-4 px-4 text-right text-[#F4F5F7]">
                          {auc.commitments.length}
                        </td>
                        <td className="py-4 px-4 text-right font-sans">
                          <div className="inline-flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => onSelectAuction(auc)}
                              className="px-2.5 py-1.5 rounded border border-[#232730] hover:border-[#C5A46D]/50 text-[#F4F5F7] hover:text-[#C5A46D] cursor-pointer"
                            >
                              View Details
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                onDeleteAuction?.(auc.id);
                                setAdminNotice(`Deleted Lot #${auc.numericId} (${auc.title}) from platform registry.`);
                                setTimeout(() => setAdminNotice(null), 4000);
                              }}
                              title="Delete this auction"
                              className="px-2.5 py-1.5 rounded border border-[#232730] hover:border-rose-500/50 text-rose-400 hover:bg-rose-950/30 inline-flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* 4. User Accounts */}
        {activeTab === 'roles' && (
          <section className="space-y-4">
            <div className="border-b border-[#232730] pb-4">
              <h2 className="text-xl font-display font-semibold text-[#F4F5F7]">
                Platform User Accounts
              </h2>
              <p className="text-xs text-[#8E95A5] mt-1">
                Pre-configured accounts available for testing each role on AuctionChain.
              </p>
            </div>

            <div className="overflow-x-auto border-b border-[#232730]">
              <table className="w-full text-xs text-left">
                <thead className="text-[#8E95A5] border-b border-[#232730]">
                  <tr>
                    <th className="py-3.5 px-4 font-medium">Account</th>
                    <th className="py-3.5 px-4 font-medium">Role</th>
                    <th className="py-3.5 px-4 font-medium">Wallet Address</th>
                    <th className="py-3.5 px-4 font-medium text-right">Balance</th>
                    <th className="py-3.5 px-4 font-medium">What This Account Does</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#232730]">
                  {humanWallets.map((acct) => (
                    <tr key={acct.address}>
                      <td className="py-4 px-4 font-semibold text-[#F4F5F7]">{acct.label}</td>
                      <td className="py-4 px-4 text-[#C5A46D] font-medium">{acct.roleTitle}</td>
                      <td className="py-4 px-4 font-mono text-[#8E95A5]">{shortenAddress(acct.address)}</td>
                      <td className="py-4 px-4 font-mono text-[#F4F5F7] text-right tabular-nums">
                        {acct.balanceEth.toFixed(2)} ETH
                      </td>
                      <td className="py-4 px-4 text-[#8E95A5]">{acct.description}</td>
                    </tr>
                  ))}
                  <tr>
                    <td className="py-4 px-4 font-semibold text-[#F4F5F7]">
                      Account 4
                    </td>
                    <td className="py-4 px-4 text-[#2E9B68] font-medium">Rupee Price Service</td>
                    <td className="py-4 px-4 font-mono text-[#8E95A5]">
                      {shortenAddress('0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65')}
                    </td>
                    <td className="py-4 px-4 font-mono text-[#F4F5F7] text-right tabular-nums">
                      10000.0 ETH
                    </td>
                    <td className="py-4 px-4 text-[#8E95A5]">
                      Automatically updates the live ETH / ₹ exchange rate and records AI car valuations
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* 5. Activity Log */}
        {activeTab === 'blockchain' && (
          <section className="space-y-4">
            <div className="border-b border-[#232730] pb-4">
              <h2 className="text-xl font-display font-semibold text-[#F4F5F7]">
                Platform Activity Log
              </h2>
              <p className="text-xs text-[#8E95A5] mt-1">
                Complete chronological record of listings, sealed bids, opened envelopes, and payouts.
              </p>
            </div>

            {allEvents.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#8E95A5] border-b border-[#232730]">
                No platform activity has been recorded in this session yet.
              </div>
            ) : (
              <div className="overflow-x-auto border-b border-[#232730]">
                <table className="w-full text-xs text-left">
                  <thead className="text-[#8E95A5] border-b border-[#232730]">
                    <tr>
                      <th className="py-3.5 px-4 font-medium">Action</th>
                      <th className="py-3.5 px-4 font-medium">Summary</th>
                      <th className="py-3.5 px-4 font-medium text-right">Block</th>
                      <th className="py-3.5 px-4 font-medium text-right">Receipt ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#232730]">
                    {allEvents.map((evt) => (
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
      </div>
    </div>
  );
};
