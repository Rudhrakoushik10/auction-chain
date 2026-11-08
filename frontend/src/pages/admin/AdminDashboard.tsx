import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Gavel,
  Cpu,
  Database,
  FileCode,
  Activity,
  UserCheck,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  ShieldCheck,
  TrendingUp,
  RefreshCw,
  CheckCircle2,
  Coins,
  Globe,
} from 'lucide-react';
import { AuctionItem } from '../../types/auction';
import { useWallet } from '../../context/WalletContext';
import { formatInr, formatEthToInr, shortenAddress } from '../../lib/crypto';

export type AdminNavTab =
  | 'dashboard'
  | 'roles'
  | 'auctions'
  | 'oracle'
  | 'blockchain'
  | 'model'
  | 'system'
  | 'account';

interface AdminDashboardProps {
  auctions: AuctionItem[];
  onSelectAuction: (auction: AuctionItem) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  auctions,
  onSelectAuction,
}) => {
  const {
    wallet,
    humanWallets,
    chainId,
    disconnectWallet,
    authorizedOracleAddress,
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

  if (!wallet) return null;

  const handleUpdatePriceFeed = async (newVal?: number) => {
    const val = newVal ?? Number(rateInput);
    if (!val || isNaN(val) || val <= 0) return;
    setIsUpdatingFeed(true);
    setFeedFeedback(null);
    try {
      await updateLivePriceFeed(val);
      setRateInput(val.toString());
      setFeedFeedback(`Successfully broadcast Round #${oracleRoundId + 1}: 1 ETH = ₹${val.toLocaleString('en-IN')}`);
      setTimeout(() => setFeedFeedback(null), 4000);
    } catch {
      setFeedFeedback('Failed to update price feed');
    } finally {
      setIsUpdatingFeed(false);
    }
  };

  const handleFetchMarketPrice = async () => {
    setFeedFeedback(null);
    const newPrice = await fetchRealMarketEthRate();
    if (newPrice) {
      setRateInput(newPrice.toString());
      setFeedFeedback(`Live spot market price fetched: 1 ETH = ₹${newPrice.toLocaleString('en-IN')} via ${marketRateSource || 'CoinGecko'}`);
      setTimeout(() => setFeedFeedback(null), 5000);
    } else {
      setFeedFeedback('Could not fetch market price. Using previous oracle round.');
    }
  };

  const activeAuctions = auctions.filter((a) => a.phase === 'Commit' || a.phase === 'Reveal');
  const allEvents = auctions.flatMap((a) => a.events);

  const sidebarItems: { id: AdminNavTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Platform Overview', icon: <LayoutDashboard className="w-4 h-4 shrink-0" /> },
    { id: 'oracle', label: 'Price Oracle', icon: <Cpu className="w-4 h-4 shrink-0" /> },
    { id: 'auctions', label: 'Auction Registry', icon: <Gavel className="w-4 h-4 shrink-0" /> },
    { id: 'roles', label: 'Role Accounts', icon: <Users className="w-4 h-4 shrink-0" /> },
    { id: 'blockchain', label: 'Event Audit Log', icon: <Database className="w-4 h-4 shrink-0" /> },
    { id: 'model', label: 'ML Model Spec', icon: <FileCode className="w-4 h-4 shrink-0" /> },
    { id: 'system', label: 'Service Topology', icon: <Activity className="w-4 h-4 shrink-0" /> },
    { id: 'account', label: 'Admin Account', icon: <UserCheck className="w-4 h-4 shrink-0" /> },
  ];

  return (
    <div className="relative flex flex-row items-start gap-5 min-h-[calc(100vh-8rem)] pb-16">
      {/* Disappearing Left-Side Role Desk */}
      <aside
        onMouseEnter={() => setIsSidebarHovered(true)}
        onMouseLeave={() => setIsSidebarHovered(false)}
        className={`${
          isDeskExpanded ? 'w-60 shadow-2xl shadow-black/60' : 'w-14'
        } sticky top-24 left-0 z-30 bg-[#12141A]/95 backdrop-blur-md rounded-md border border-[#232730] p-2.5 flex flex-col justify-between shrink-0 h-fit transition-all duration-200 ease-out overflow-hidden`}
      >
        <div className="space-y-2">
          <div
            className={`flex items-center ${
              isDeskExpanded ? 'justify-between px-2' : 'justify-center'
            } py-1.5 border-b border-[#232730]`}
          >
            {isDeskExpanded && (
              <span className="text-[11px] font-mono uppercase tracking-[0.14em] text-[#C5A46D] whitespace-nowrap">
                Auditor Console
              </span>
            )}
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed((prev) => !prev)}
              className="inline-flex p-1.5 rounded text-[#8E95A5] hover:text-[#F4F5F7] hover:bg-[#171A22] transition-colors cursor-pointer"
              aria-label={isDeskExpanded ? 'Collapse desk menu' : 'Expand desk menu'}
              title={isSidebarCollapsed ? 'Pin desk menu open' : 'Auto-hide desk menu'}
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
            title="Disconnect Wallet"
            className="w-full flex items-center justify-center gap-2 px-2.5 py-2 rounded text-xs font-medium text-[#C94A4A] hover:bg-[#C94A4A]/10 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {isDeskExpanded && <span className="whitespace-nowrap">Disconnect</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 space-y-6">
        {/* 1. Platform Overview */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#232730] pb-5">
              <div>
                <h1 className="text-xl font-display font-semibold text-[#F4F5F7]">
                  Platform Governance & Monitoring
                </h1>
                <p className="text-xs text-[#8E95A5] mt-0.5">
                  Contract deployment state, authorized Oracle signer verification, and auction registry on Hardhat #31337.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('oracle')}
                className="px-4 py-2 rounded-md bg-[#C5A46D] hover:bg-[#D4B57E] text-[#0B0C10] text-xs font-semibold uppercase tracking-[0.08em] transition-colors whitespace-nowrap shrink-0 cursor-pointer self-start sm:self-auto"
              >
                Inspect PriceOracle.sol
              </button>
            </div>

            {/* 4 Key Operational KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#232730] bg-[#12141A] rounded-md border border-[#232730] font-mono tabular-nums">
              <div className="p-4">
                <div className="text-xs font-sans text-[#8E95A5]">Deployed Lots</div>
                <div className="text-2xl font-semibold text-[#F4F5F7] mt-1">{auctions.length}</div>
              </div>
              <div className="p-4">
                <div className="text-xs font-sans text-[#8E95A5]">Active Windows</div>
                <div className="text-2xl font-semibold text-[#C5A46D] mt-1">{activeAuctions.length}</div>
              </div>
              <div className="p-4">
                <div className="text-xs font-sans text-[#8E95A5]">Emitted Events</div>
                <div className="text-2xl font-semibold text-[#F4F5F7] mt-1">{allEvents.length}</div>
              </div>
              <div className="p-4">
                <div className="text-xs font-sans text-[#8E95A5]">Chain ID</div>
                <div className="text-2xl font-semibold text-[#2E9B68] mt-1">{chainId}</div>
              </div>
            </div>

            {/* Deployed Contracts Table */}
            <section className="bg-[#12141A] rounded-md border border-[#232730] overflow-hidden">
              <div className="px-6 py-4 border-b border-[#232730]">
                <h2 className="text-sm font-semibold text-[#F4F5F7]">Deployed Smart Contracts</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#0B0C10] text-[#8E95A5] border-b border-[#232730]">
                    <tr>
                      <th className="py-3 px-4 font-medium">Contract</th>
                      <th className="py-3 px-4 font-medium">Address</th>
                      <th className="py-3 px-4 font-medium">Configuration / Owner</th>
                      <th className="py-3 px-4 font-medium text-right">State</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#232730] font-mono">
                    <tr>
                      <td className="py-3.5 px-4 font-semibold text-[#F4F5F7]">SealedAuction.sol</td>
                      <td className="py-3.5 px-4 text-[#C5A46D]">{auctionContractAddress}</td>
                      <td className="py-3.5 px-4 font-sans text-[#8E95A5]">
                        Commit-reveal escrow linked to PriceOracle.sol
                      </td>
                      <td className="py-3.5 px-4 text-right font-sans text-[#2E9B68] font-medium">
                        Operational
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3.5 px-4 font-semibold text-[#F4F5F7]">PriceOracle.sol</td>
                      <td className="py-3.5 px-4 text-[#C5A46D]">{oracleContractAddress}</td>
                      <td className="py-3.5 px-4 text-[#8E95A5]">
                        Signer: {shortenAddress(authorizedOracleAddress)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-sans text-[#2E9B68] font-medium">
                        Synced
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {/* 2. Chainlink Price Feed Oracle Panel */}
        {activeTab === 'oracle' && (
          <div className="space-y-6">
            <div className="border-b border-[#232730] pb-4">
              <div className="flex items-center gap-2 text-xs font-mono text-[#C5A46D]">
                <span>AggregatorV3Interface</span>
                <span className="text-[#232730]">·</span>
                <span className="text-[#2E9B68]">Oracle Synchronized</span>
              </div>
              <h2 className="text-lg font-display font-semibold text-[#F4F5F7] mt-1">
                Price Oracle (ETH / INR)
              </h2>
              <p className="text-xs text-[#8E95A5] mt-0.5">
                On-chain price oracle providing verified Ethereum to Indian Rupee (INR) conversion rates for bids, deposits, and reserve prices across AuctionChain.
              </p>
            </div>

            {/* Oracle Feed Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#232730] bg-[#12141A] rounded-md border border-[#232730] font-mono tabular-nums">
              <div className="p-4">
                <div className="text-xs font-sans text-[#8E95A5]">ETH / INR Rate</div>
                <div className="text-2xl font-semibold text-[#C5A46D] mt-1 flex items-center gap-1.5">
                  <span>₹{liveEthInrRate.toLocaleString('en-IN')}</span>
                </div>
                <div className="text-[10px] text-[#646C7E] mt-0.5 font-sans">per 1.00 ETH</div>
              </div>
              <div className="p-4">
                <div className="text-xs font-sans text-[#8E95A5]">Round ID</div>
                <div className="text-2xl font-semibold text-[#F4F5F7] mt-1">#{oracleRoundId}</div>
                <div className="text-[10px] text-[#646C7E] mt-0.5 font-sans">Oracle Round</div>
              </div>
              <div className="p-4">
                <div className="text-xs font-sans text-[#8E95A5]">Feed Decimals</div>
                <div className="text-2xl font-semibold text-[#F4F5F7] mt-1">8</div>
                <div className="text-[10px] text-[#646C7E] mt-0.5 font-sans">1e8 fixed-point</div>
              </div>
              <div className="p-4">
                <div className="text-xs font-sans text-[#8E95A5]">Heartbeat Status</div>
                <div className="text-2xl font-semibold text-[#2E9B68] mt-1 flex items-center gap-1.5">
                  <Activity className="w-5 h-5 text-[#2E9B68]" />
                  <span>Healthy</span>
                </div>
                <div className="text-[10px] text-[#646C7E] mt-0.5 font-sans">Auto-broadcasting</div>
              </div>
            </div>

            {/* Real-Time Spot Market Ingestion Box */}
            <section className="bg-[#12141A] rounded-md border border-[#232730] p-5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-[#C5A46D]" />
                    <h3 className="text-sm font-semibold text-[#F4F5F7]">
                      Live Real-World Market Ingestion (CoinGecko / Binance)
                    </h3>
                  </div>
                  <p className="text-xs text-[#8E95A5]">
                    Fetch real-time Ethereum spot price in Indian Rupees (INR) from public market aggregators and broadcast to the on-chain oracle.
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={handleFetchMarketPrice}
                    disabled={isFetchingMarketRate}
                    className="px-4 py-2 rounded-md bg-[#C5A46D] hover:bg-[#D4B57E] disabled:opacity-50 text-[#0B0C10] text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    {isFetchingMarketRate ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Querying Spot Market...</span>
                      </>
                    ) : (
                      <>
                        <Globe className="w-3.5 h-3.5" />
                        <span>Fetch Live Spot Market Price</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-[#232730] flex flex-wrap items-center justify-between gap-3 text-xs text-[#8E95A5]">
                <div className="flex items-center gap-4">
                  <span>
                    Current Source: <strong className="text-[#F4F5F7]">{marketRateSource || 'Initial Baseline'}</strong>
                  </span>
                  {lastMarketFetchTime && (
                    <span>
                      Last Synced: <strong className="text-[#C5A46D]">{new Date(lastMarketFetchTime).toLocaleTimeString()}</strong>
                    </span>
                  )}
                </div>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isAutoMarketSync}
                    onChange={(e) => toggleAutoMarketSync(e.target.checked)}
                    className="w-3.5 h-3.5 rounded accent-[#C5A46D] cursor-pointer"
                  />
                  <span className="text-[#F4F5F7] text-xs">Auto-Sync with Spot Market (every 60s)</span>
                </label>
              </div>
            </section>

            {/* Live Feed Simulator Form */}
            <section className="bg-[#12141A] rounded-md border border-[#232730] p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-[#F4F5F7] flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#C5A46D]" />
                    Simulate Price Oracle Update
                  </h3>
                  <p className="text-xs text-[#8E95A5] mt-0.5">
                    Broadcast a new ETH/INR rate on-chain to test dynamic fiat recalculations across bids, reserves, and escrow settlement.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-[#8E95A5]">Quick Rates:</span>
                {[240000, 250000, 260000, 275000, 290000].map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => handleUpdatePriceFeed(rate)}
                    disabled={isUpdatingFeed}
                    className="px-2.5 py-1 rounded bg-[#0B0C10] hover:bg-[#171A22] border border-[#232730] text-[#F4F5F7] hover:border-[#C5A46D]/50 text-xs font-mono transition-colors cursor-pointer"
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
                className="flex flex-col sm:flex-row gap-3 pt-1"
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
                    className="w-full pl-8 pr-4 py-2 bg-[#0B0C10] border border-[#232730] focus:border-[#C5A46D] rounded-md text-[#F4F5F7] font-mono text-sm outline-none transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isUpdatingFeed || !rateInput}
                  className="px-5 py-2 rounded-md bg-[#C5A46D] hover:bg-[#D4B57E] disabled:opacity-50 text-[#0B0C10] text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
                >
                  {isUpdatingFeed ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Broadcasting Round...</span>
                    </>
                  ) : (
                    <>
                      <Coins className="w-3.5 h-3.5" />
                      <span>Push Oracle Round</span>
                    </>
                  )}
                </button>
              </form>

              {feedFeedback && (
                <div className="p-3 rounded-md bg-[#2E9B68]/10 border border-[#2E9B68]/40 text-[#F4F5F7] text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#2E9B68] shrink-0" />
                  <span>{feedFeedback}</span>
                </div>
              )}
            </section>

            {/* Smart Contract Specifications */}
            <section className="bg-[#12141A] rounded-md border border-[#232730] p-6 space-y-4">
              <h3 className="text-sm font-semibold text-[#F4F5F7]">
                PriceOracle.sol Chainlink Feed Technical Specifications
              </h3>

              <dl className="divide-y divide-[#232730] text-xs">
                <div className="py-2.5 flex justify-between gap-4">
                  <dt className="text-[#8E95A5]">Contract Address</dt>
                  <dd className="font-mono text-[#F4F5F7]">{oracleContractAddress}</dd>
                </div>
                <div className="py-2.5 flex justify-between gap-4">
                  <dt className="text-[#8E95A5]">Description String</dt>
                  <dd className="font-mono text-[#F4F5F7]">&quot;ETH / INR Price Feed&quot;</dd>
                </div>
                <div className="py-2.5 flex justify-between gap-4">
                  <dt className="text-[#8E95A5]">Standard Interface</dt>
                  <dd className="font-mono text-[#C5A46D] font-medium">AggregatorV3Interface (decimals=8, version=3)</dd>
                </div>
                <div className="py-2.5 flex justify-between gap-4">
                  <dt className="text-[#8E95A5]">Authorized Oracle Feeder / Signer</dt>
                  <dd className="font-mono text-[#2E9B68] font-semibold">{authorizedOracleAddress}</dd>
                </div>
                <div className="py-2.5 flex justify-between gap-4">
                  <dt className="text-[#8E95A5]">Convenience On-Chain Helper</dt>
                  <dd className="font-mono text-[#F4F5F7]">getLatestEthInrRate() returns (uint256 rupees)</dd>
                </div>
              </dl>

              <div className="p-4 rounded-md border border-[#232730] bg-[#0B0C10] text-xs text-[#8E95A5] flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#C5A46D] shrink-0 mt-0.5" />
                <span>
                  <strong className="text-[#F4F5F7]">Why an ETH/INR Price Feed Oracle?</strong> Vehicle auction participants and sellers value their assets in Indian Rupees (INR), whereas bids and escrow settlements are executed on-chain in Test ETH. Using a Chainlink AggregatorV3Interface ensures verifiable, tamper-resistant exchange rates across the dApp.
                </span>
              </div>
            </section>
          </div>
        )}

        {/* 3. Auction Registry Table */}
        {activeTab === 'auctions' && (
          <section className="bg-[#12141A] rounded-md border border-[#232730] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#232730]">
              <h2 className="text-base font-semibold text-[#F4F5F7]">Platform Auction Registry</h2>
              <p className="text-xs text-[#8E95A5] mt-0.5">
                Read-only administrative inspection of all vehicle auctions on SealedAuction.sol
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#0B0C10] text-[#8E95A5] border-b border-[#232730]">
                  <tr>
                    <th className="py-3 px-4 font-medium">Lot</th>
                    <th className="py-3 px-4 font-medium">Seller</th>
                    <th className="py-3 px-4 font-medium">Phase</th>
                    <th className="py-3 px-4 font-medium text-right">AI Estimate (INR)</th>
                    <th className="py-3 px-4 font-medium text-right">Reserve (ETH)</th>
                    <th className="py-3 px-4 font-medium text-right">Commits</th>
                    <th className="py-3 px-4 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#232730] font-mono tabular-nums">
                  {auctions.map((auc) => (
                    <tr key={auc.id} className="hover:bg-[#171A22] transition-colors">
                      <td className="py-3.5 px-4 font-sans font-semibold text-[#F4F5F7]">
                        #{auc.numericId} · {auc.title}
                      </td>
                      <td className="py-3.5 px-4 text-[#8E95A5]">
                        {shortenAddress(auc.sellerAddress)}
                      </td>
                      <td className="py-3.5 px-4 font-sans font-medium text-[#C5A46D]">
                        {auc.phase}
                      </td>
                      <td className="py-3.5 px-4 text-right text-[#F4F5F7]">
                        {formatInr(auc.aiPrediction.predicted_price ?? auc.aiPrediction.predicted_price_inr)}
                      </td>
                      <td className="py-3.5 px-4 text-right text-[#F4F5F7]">
                        <div>{auc.reservePriceEth.toFixed(2)} ETH</div>
                        <div className="text-[11px] text-[#C5A46D]">{formatEthToInr(auc.reservePriceEth)}</div>
                      </td>
                      <td className="py-3.5 px-4 text-right text-[#F4F5F7]">
                        {auc.commitments.length}
                      </td>
                      <td className="py-3.5 px-4 text-right font-sans">
                        <button
                          type="button"
                          onClick={() => onSelectAuction(auc)}
                          className="px-2.5 py-1 rounded border border-[#232730] hover:border-[#C5A46D]/50 text-[#F4F5F7] hover:text-[#C5A46D] cursor-pointer"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* 4. Role Accounts Table */}
        {activeTab === 'roles' && (
          <section className="bg-[#12141A] rounded-md border border-[#232730] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#232730]">
              <h2 className="text-base font-semibold text-[#F4F5F7]">Hardhat Role Directory</h2>
              <p className="text-xs text-[#8E95A5] mt-0.5">
                4 human-facing accounts and 1 autonomous background Oracle service
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#0B0C10] text-[#8E95A5] border-b border-[#232730]">
                  <tr>
                    <th className="py-3 px-4 font-medium">Signer</th>
                    <th className="py-3 px-4 font-medium">Role</th>
                    <th className="py-3 px-4 font-medium">Address</th>
                    <th className="py-3 px-4 font-medium text-right">Balance</th>
                    <th className="py-3 px-4 font-medium">Access Scope</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#232730]">
                  {humanWallets.map((acct) => (
                    <tr key={acct.address}>
                      <td className="py-3.5 px-4 font-semibold text-[#F4F5F7]">{acct.label}</td>
                      <td className="py-3.5 px-4 text-[#C5A46D]">{acct.roleTitle}</td>
                      <td className="py-3.5 px-4 font-mono text-[#8E95A5]">{acct.address}</td>
                      <td className="py-3.5 px-4 font-mono text-[#F4F5F7] text-right tabular-nums">
                        {acct.balanceEth.toFixed(1)} ETH
                      </td>
                      <td className="py-3.5 px-4 text-[#8E95A5]">{acct.description}</td>
                    </tr>
                  ))}
                  <tr>
                    <td className="py-3.5 px-4 font-semibold text-[#F4F5F7]">
                      Account 4 — Price Oracle
                    </td>
                    <td className="py-3.5 px-4 text-[#2E9B68]">Autonomous Oracle</td>
                    <td className="py-3.5 px-4 font-mono text-[#8E95A5]">
                      0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[#F4F5F7] text-right tabular-nums">
                      10000.0 ETH
                    </td>
                    <td className="py-3.5 px-4 text-[#8E95A5]">
                      Authorized Price Oracle broadcasting on-chain ETH/INR rounds to PriceOracle.sol
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* 5. Blockchain Event Audit Log */}
        {activeTab === 'blockchain' && (
          <section className="bg-[#12141A] rounded-md border border-[#232730] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#232730]">
              <h2 className="text-base font-semibold text-[#F4F5F7]">Global On-Chain Event Log</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#0B0C10] text-[#8E95A5] border-b border-[#232730]">
                  <tr>
                    <th className="py-3 px-4 font-medium">Event</th>
                    <th className="py-3 px-4 font-medium">Summary</th>
                    <th className="py-3 px-4 font-medium text-right">Block</th>
                    <th className="py-3 px-4 font-medium text-right">Tx Hash</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#232730]">
                  {allEvents.map((evt) => (
                    <tr key={evt.id} className="hover:bg-[#171A22] transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-[#C5A46D] whitespace-nowrap">
                        {evt.eventName}
                      </td>
                      <td className="py-3 px-4 text-[#F4F5F7]">{evt.summary}</td>
                      <td className="py-3 px-4 font-mono text-[#8E95A5] text-right tabular-nums">
                        #{evt.blockNumber}
                      </td>
                      <td className="py-3 px-4 font-mono text-[#8E95A5] text-right tabular-nums">
                        {shortenAddress(evt.txHash)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* 6. ML Model Specification */}
        {activeTab === 'model' && (
          <section className="bg-[#12141A] rounded-md border border-[#232730] p-6 space-y-6">
            <div className="border-b border-[#232730] pb-4">
              <h2 className="text-base font-semibold text-[#F4F5F7]">
                AI Valuation Engine Specification
              </h2>
              <p className="text-xs text-[#8E95A5] mt-0.5">
                Indian pre-owned vehicle valuation engine with canonical SHA-256 attestation
              </p>
            </div>

            <dl className="divide-y divide-[#232730] text-xs font-mono tabular-nums">
              <div className="py-3 flex justify-between">
                <dt className="font-sans text-[#8E95A5]">Valuation Engine</dt>
                <dd className="text-[#F4F5F7] font-semibold">Gemini 3.8 Flash (@google/genai)</dd>
              </div>
              <div className="py-3 flex justify-between">
                <dt className="font-sans text-[#8E95A5]">Target Market</dt>
                <dd className="text-[#F4F5F7]">Indian Pre-Owned Automotive (INR / ₹)</dd>
              </div>
              <div className="py-3 flex justify-between">
                <dt className="font-sans text-[#8E95A5]">On-Chain Unit</dt>
                <dd className="text-[#C5A46D] font-semibold">Integer Paise (uint256)</dd>
              </div>
              <div className="py-3 flex justify-between">
                <dt className="font-sans text-[#8E95A5]">Cryptographic Anchoring</dt>
                <dd className="text-[#F4F5F7]">SHA-256 Canonical Hash + PriceOracle.sol Proof</dd>
              </div>
            </dl>
          </section>
        )}

        {/* 7. Service Topology */}
        {activeTab === 'system' && (
          <section className="bg-[#12141A] rounded-md border border-[#232730] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#232730]">
              <h2 className="text-base font-semibold text-[#F4F5F7]">System Service Topology</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#0B0C10] text-[#8E95A5] border-b border-[#232730]">
                  <tr>
                    <th className="py-3 px-4 font-medium">Service</th>
                    <th className="py-3 px-4 font-medium">Directory / Endpoint</th>
                    <th className="py-3 px-4 font-medium">Role</th>
                    <th className="py-3 px-4 font-medium text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#232730]">
                  <tr>
                    <td className="py-3.5 px-4 font-semibold text-[#F4F5F7]">1. Hardhat EVM Node</td>
                    <td className="py-3.5 px-4 font-mono text-[#8E95A5]">http://127.0.0.1:8545</td>
                    <td className="py-3.5 px-4 text-[#F4F5F7]">Local blockchain (Chain ID 31337)</td>
                    <td className="py-3.5 px-4 text-right text-[#2E9B68] font-medium">Active</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 font-semibold text-[#F4F5F7]">2. Contract Deployer</td>
                    <td className="py-3.5 px-4 font-mono text-[#8E95A5]">blockchain/scripts/deployLocal.js</td>
                    <td className="py-3.5 px-4 text-[#F4F5F7]">Deploys PriceOracle.sol & Auction.sol</td>
                    <td className="py-3.5 px-4 text-right text-[#2E9B68] font-medium">Deployed</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 font-semibold text-[#F4F5F7]">3. AI Valuation Service</td>
                    <td className="py-3.5 px-4 font-mono text-[#8E95A5]">/api/predict-price</td>
                    <td className="py-3.5 px-4 text-[#F4F5F7]">Gemini 3.8 Flash Indian Car Valuation API</td>
                    <td className="py-3.5 px-4 text-right text-[#2E9B68] font-medium">Ready</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 font-semibold text-[#F4F5F7]">4. Chainlink Price Oracle</td>
                    <td className="py-3.5 px-4 font-mono text-[#8E95A5]">blockchain/contracts/PriceOracle.sol</td>
                    <td className="py-3.5 px-4 text-[#F4F5F7]">Live ETH/INR AggregatorV3 price feed</td>
                    <td className="py-3.5 px-4 text-right text-[#2E9B68] font-medium">Active</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 font-semibold text-[#F4F5F7]">5. Web3 Frontend</td>
                    <td className="py-3.5 px-4 font-mono text-[#8E95A5]">frontend/src</td>
                    <td className="py-3.5 px-4 text-[#F4F5F7]">React 19 + Ethers.js v6 interface</td>
                    <td className="py-3.5 px-4 text-right text-[#2E9B68] font-medium">Connected</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* 8. Admin Account */}
        {activeTab === 'account' && (
          <section className="bg-[#12141A] rounded-md border border-[#232730] p-6 space-y-6">
            <div className="border-b border-[#232730] pb-4">
              <h2 className="text-base font-semibold text-[#F4F5F7]">Administrator Profile</h2>
            </div>

            <dl className="divide-y divide-[#232730] text-xs">
              <div className="py-3 flex justify-between">
                <dt className="text-[#8E95A5]">Assigned Role</dt>
                <dd className="text-[#F4F5F7] font-semibold">Platform Administrator (Account 0)</dd>
              </div>
              <div className="py-3 flex justify-between">
                <dt className="text-[#8E95A5]">Public Address</dt>
                <dd className="text-[#F4F5F7] font-mono">{wallet.address}</dd>
              </div>
              <div className="py-3 flex justify-between">
                <dt className="text-[#8E95A5]">Chain ID</dt>
                <dd className="text-[#C5A46D] font-mono">{chainId}</dd>
              </div>
            </dl>
          </section>
        )}
      </div>
    </div>
  );
};
