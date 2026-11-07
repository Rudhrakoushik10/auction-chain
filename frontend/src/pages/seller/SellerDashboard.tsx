import React, { useState } from 'react';
import {
  LayoutDashboard,
  PlusCircle,
  Layers,
  Calculator,
  Wallet,
  Bell,
  UserCheck,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  CheckCircle2,
} from 'lucide-react';
import { AuctionItem } from '../../types/auction';
import { useWallet } from '../../context/WalletContext';
import { formatInr, shortenAddress } from '../../lib/crypto';
import { CreateAuction } from '../CreateAuction';
import { AIPriceEstimatorPage } from '../public/AIPriceEstimatorPage';

export type SellerNavTab =
  | 'dashboard'
  | 'create'
  | 'my-auctions'
  | 'active'
  | 'upcoming'
  | 'completed'
  | 'estimator'
  | 'wallet'
  | 'notifications'
  | 'account';

interface SellerDashboardProps {
  auctions: AuctionItem[];
  onSelectAuction: (auction: AuctionItem) => void;
  onCreateAuction: (newAuction: AuctionItem) => void;
  onFinalizeAuction: (auctionId: string) => void;
  onWithdrawProceeds: (auctionId: string) => void;
}

export const SellerDashboard: React.FC<SellerDashboardProps> = ({
  auctions,
  onSelectAuction,
  onCreateAuction,
  onFinalizeAuction,
  onWithdrawProceeds,
}) => {
  const { wallet, chainId, disconnectWallet } = useWallet();
  const [activeTab, setActiveTab] = useState<SellerNavTab>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [auctionFilter, setAuctionFilter] = useState<'all' | 'active' | 'upcoming' | 'completed'>('all');
  const [txNotice, setTxNotice] = useState<string | null>(null);

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
    { id: 'dashboard', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4 shrink-0" /> },
    { id: 'create', label: 'Create Auction', icon: <PlusCircle className="w-4 h-4 shrink-0" /> },
    { id: 'my-auctions', label: 'Manage Lots', icon: <Layers className="w-4 h-4 shrink-0" />, count: myAuctions.length },
    { id: 'estimator', label: 'AI Estimator', icon: <Calculator className="w-4 h-4 shrink-0" /> },
    { id: 'wallet', label: 'Transactions', icon: <Wallet className="w-4 h-4 shrink-0" /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4 shrink-0" /> },
    { id: 'account', label: 'Account', icon: <UserCheck className="w-4 h-4 shrink-0" /> },
  ];

  const getFilteredList = () => {
    if (activeTab === 'active' || (activeTab === 'my-auctions' && auctionFilter === 'active')) {
      return activeAuctions;
    }
    if (activeTab === 'upcoming' || (activeTab === 'my-auctions' && auctionFilter === 'upcoming')) {
      return upcomingAuctions;
    }
    if (activeTab === 'completed' || (activeTab === 'my-auctions' && auctionFilter === 'completed')) {
      return completedAuctions;
    }
    return myAuctions;
  };

  const renderAuctionTable = (items: AuctionItem[]) => {
    if (items.length === 0) {
      return (
        <div className="p-8 text-center space-y-3">
          <div className="text-xs text-slate-400">No vehicle auctions match this view.</div>
          <button
            type="button"
            onClick={() => setActiveTab('create')}
            className="px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-blue-600 text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            Create Vehicle Auction
          </button>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="bg-[#090D1A]/60 text-slate-400 border-b border-[#1E293B]">
            <tr>
              <th className="py-3 px-4 font-medium">Lot / Vehicle</th>
              <th className="py-3 px-4 font-medium">Phase</th>
              <th className="py-3 px-4 font-medium text-right">AI Valuation (USD)</th>
              <th className="py-3 px-4 font-medium text-right">Start / Reserve (ETH)</th>
              <th className="py-3 px-4 font-medium text-right">Commits / Highest</th>
              <th className="py-3 px-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1E293B]">
            {items.map((auc) => {
              const revealedCount = auc.commitments.filter((c) => c.revealed).length;
              return (
                <tr key={auc.id} className="hover:bg-[#131E3A]/50 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={auc.imageUrl}
                        alt={auc.title}
                        referrerPolicy="no-referrer"
                        className="w-12 h-9 object-cover rounded border border-[#1E293B] shrink-0"
                      />
                      <div>
                        <div className="font-semibold text-white line-clamp-1">{auc.title}</div>
                        <div className="font-mono text-[11px] text-slate-400 tabular-nums">
                          #{auc.numericId} ({auc.id}) · {String(auc.attributes.year ?? auc.attributes.manufacturing_year)} · {Number(auc.attributes.mileage ?? auc.attributes.mileage_km ?? 0).toLocaleString('en-US')} mi.
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-medium whitespace-nowrap">
                    <span
                      className={
                        auc.phase === 'Commit'
                          ? 'text-[#3B82F6]'
                          : auc.phase === 'Reveal'
                          ? 'text-amber-400'
                          : auc.phase === 'Sold'
                          ? 'text-emerald-400'
                          : 'text-slate-400'
                      }
                    >
                      {auc.phase}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-200 text-right whitespace-nowrap tabular-nums">
                    {formatInr(auc.aiPrediction.predicted_price ?? auc.aiPrediction.predicted_price_inr)}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-white text-right whitespace-nowrap tabular-nums">
                    {auc.startingBidEth.toFixed(2)} / {auc.reservePriceEth.toFixed(2)} ETH
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-300 text-right whitespace-nowrap tabular-nums">
                    <div>
                      {auc.commitments.length} commits ({revealedCount} rev)
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {auc.phase === 'Commit'
                        ? 'Sealed'
                        : auc.highestBidEth
                        ? `High: ${auc.highestBidEth.toFixed(2)} ETH`
                        : 'No reveals'}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="inline-flex items-center justify-end gap-2">
                      {auc.phase === 'Reveal' && (
                        <button
                          type="button"
                          onClick={() => {
                            onFinalizeAuction(auc.id);
                            setTxNotice(`Finalized Lot #${auc.numericId} on SealedAuction.sol.`);
                          }}
                          className="px-2.5 py-1 rounded bg-[#1E293B] hover:bg-slate-700 text-white font-medium cursor-pointer"
                        >
                          Finalize
                        </button>
                      )}
                      {auc.phase === 'Sold' && auc.winnerSettled && !auc.sellerWithdrawn && (
                        <button
                          type="button"
                          onClick={() => {
                            onWithdrawProceeds(auc.id);
                            setTxNotice(`Withdrew ${auc.highestBidEth?.toFixed(2)} ETH proceeds from Lot #${auc.numericId}.`);
                          }}
                          className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer"
                        >
                          Withdraw {auc.highestBidEth?.toFixed(2)} ETH
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onSelectAuction(auc)}
                        className="px-2.5 py-1 rounded border border-[#1E293B] hover:border-slate-600 text-slate-200 hover:text-white font-medium cursor-pointer"
                      >
                        Inspect
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

  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-[calc(100vh-8rem)] pb-16">
      {/* Collapsible Role Sidebar */}
      <aside
        className={`w-full ${
          isSidebarCollapsed ? 'lg:w-16' : 'lg:w-60'
        } bg-[#0F172A] rounded-xl border border-[#1E293B] p-3 flex flex-col justify-between shrink-0 h-fit transition-all duration-150`}
      >
        <div className="space-y-2">
          <div className="flex items-center justify-between px-2 py-1.5 border-b border-[#1E293B]">
            {!isSidebarCollapsed && (
              <span className="text-xs font-mono text-slate-400">Seller Console</span>
            )}
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed((prev) => !prev)}
              className="hidden lg:inline-flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#131E3A] transition-colors cursor-pointer"
              aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isSidebarCollapsed ? (
                <PanelLeftOpen className="w-4 h-4" />
              ) : (
                <PanelLeftClose className="w-4 h-4" />
              )}
            </button>
          </div>

          <nav className="space-y-1">
            {sidebarItems.map((item) => {
              const isActive =
                activeTab === item.id ||
                (item.id === 'my-auctions' &&
                  (activeTab === 'active' || activeTab === 'upcoming' || activeTab === 'completed'));
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  title={item.label}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#2563EB] text-white'
                      : 'text-slate-400 hover:text-white hover:bg-[#131E3A]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {item.icon}
                    {!isSidebarCollapsed && <span className="whitespace-nowrap">{item.label}</span>}
                  </div>
                  {!isSidebarCollapsed && item.count !== undefined && (
                    <span className="font-mono text-[11px] tabular-nums opacity-80">
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="pt-3 border-t border-[#1E293B] mt-4">
          <button
            type="button"
            onClick={disconnectWallet}
            title="Disconnect Wallet"
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!isSidebarCollapsed && <span>Disconnect</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 space-y-6">
        {txNotice && (
          <div className="px-4 py-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-xs text-emerald-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{txNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setTxNotice(null)}
              className="text-slate-400 hover:text-white text-xs cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* 1. Overview Dashboard */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Workspace Header with Primary Create Auction Action */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1E293B] pb-5">
              <div>
                <h1 className="text-xl font-bold text-white">Seller Operations Overview</h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Deploy certified vehicle lots, monitor sealed commitment activity, and withdraw finalized ETH proceeds.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('create')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#2563EB] hover:bg-blue-600 text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer self-start sm:self-auto"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Create Vehicle Auction</span>
              </button>
            </div>

            {/* 4 Key Operational KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#1E293B] bg-[#0F172A] rounded-xl border border-[#1E293B] font-mono tabular-nums">
              <div className="p-4">
                <div className="text-xs font-sans text-slate-400">Listed Lots</div>
                <div className="text-2xl font-bold text-white mt-1">{myAuctions.length}</div>
              </div>
              <div className="p-4">
                <div className="text-xs font-sans text-slate-400">Active (Commit / Reveal)</div>
                <div className="text-2xl font-bold text-[#3B82F6] mt-1">{activeAuctions.length}</div>
              </div>
              <div className="p-4">
                <div className="text-xs font-sans text-slate-400">Finalized Lots</div>
                <div className="text-2xl font-bold text-emerald-400 mt-1">{completedAuctions.length}</div>
              </div>
              <div className="p-4">
                <div className="text-xs font-sans text-slate-400">Total Commitments</div>
                <div className="text-2xl font-bold text-white mt-1">{totalBidsReceived}</div>
              </div>
            </div>

            {/* Seller Auctions Table */}
            <section className="bg-[#0F172A] rounded-xl border border-[#1E293B] overflow-hidden">
              <div className="px-6 py-4 border-b border-[#1E293B] flex items-center justify-between">
                <h2 className="text-sm font-semibold text-white">Your Vehicle Auctions</h2>
                <button
                  type="button"
                  onClick={() => setActiveTab('my-auctions')}
                  className="text-xs font-medium text-[#3B82F6] hover:underline cursor-pointer"
                >
                  Filter & Manage All ({myAuctions.length})
                </button>
              </div>
              {renderAuctionTable(myAuctions)}
            </section>
          </div>
        )}

        {/* 2. Create Auction Wizard */}
        {activeTab === 'create' && (
          <CreateAuction
            onCreateAuction={(newAuc) => {
              onCreateAuction(newAuc);
              setActiveTab('my-auctions');
            }}
            nextNumericId={auctions.length + 1}
          />
        )}

        {/* 3. Manage Lots (with segmented filter for All / Active / Upcoming / Completed) */}
        {(activeTab === 'my-auctions' ||
          activeTab === 'active' ||
          activeTab === 'upcoming' ||
          activeTab === 'completed') && (
          <section className="bg-[#0F172A] rounded-xl border border-[#1E293B] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#1E293B] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-white">Manage Seller Auctions</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Compare advisory INR valuations with Test ETH reserves and execute settlement actions
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 p-1 bg-[#090D1A] rounded-lg border border-[#1E293B]">
                  {(
                    [
                      { id: 'all', label: `All (${myAuctions.length})` },
                      { id: 'active', label: `Active (${activeAuctions.length})` },
                      { id: 'upcoming', label: `Upcoming (${upcomingAuctions.length})` },
                      { id: 'completed', label: `Completed (${completedAuctions.length})` },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        setActiveTab('my-auctions');
                        setAuctionFilter(tab.id);
                      }}
                      className={`px-3 py-1 rounded text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                        auctionFilter === tab.id && activeTab === 'my-auctions'
                          ? 'bg-[#2563EB] text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab('create')}
                  className="px-3.5 py-2 rounded-lg bg-[#2563EB] hover:bg-blue-600 text-white text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
                >
                  New Lot
                </button>
              </div>
            </div>

            {renderAuctionTable(getFilteredList())}
          </section>
        )}

        {/* 4. AI Price Estimator */}
        {activeTab === 'estimator' && <AIPriceEstimatorPage />}

        {/* 5. Wallet & On-Chain Transactions Table */}
        {activeTab === 'wallet' && (
          <section className="bg-[#0F172A] rounded-xl border border-[#1E293B] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#1E293B] flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-white">Seller On-Chain Audit Log</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Events emitted by PriceOracle.sol and SealedAuction.sol for your listed vehicles
                </p>
              </div>
              <span className="text-xs font-mono text-slate-400 tabular-nums">
                Chain ID {chainId} · {wallet.balanceEth.toFixed(2)} ETH
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#090D1A]/60 text-slate-400 border-b border-[#1E293B]">
                  <tr>
                    <th className="py-3 px-4 font-medium">Event</th>
                    <th className="py-3 px-4 font-medium">Summary</th>
                    <th className="py-3 px-4 font-medium text-right">Block</th>
                    <th className="py-3 px-4 font-medium text-right">Tx Hash</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E293B]">
                  {myAuctions.flatMap((a) => a.events).map((evt) => (
                    <tr key={evt.id} className="hover:bg-[#131E3A]/50 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-white whitespace-nowrap">
                        {evt.eventName}
                      </td>
                      <td className="py-3 px-4 text-slate-300">{evt.summary}</td>
                      <td className="py-3 px-4 font-mono text-slate-400 text-right tabular-nums">
                        #{evt.blockNumber}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-400 text-right tabular-nums">
                        {shortenAddress(evt.txHash)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* 6. Notifications */}
        {activeTab === 'notifications' && (
          <section className="bg-[#0F172A] rounded-xl border border-[#1E293B] divide-y divide-[#1E293B]">
            <div className="px-6 py-4">
              <h2 className="text-base font-semibold text-white">Seller Activity Alerts</h2>
            </div>
            {myAuctions.flatMap((a) => a.events).slice(0, 5).map((evt) => (
              <div key={evt.id} className="px-6 py-4 flex items-start justify-between gap-4 text-xs">
                <div className="space-y-1">
                  <div className="font-mono font-semibold text-white">{evt.eventName}</div>
                  <p className="text-slate-300">{evt.summary}</p>
                </div>
                <span className="font-mono text-slate-500 whitespace-nowrap tabular-nums">
                  Block #{evt.blockNumber}
                </span>
              </div>
            ))}
          </section>
        )}

        {/* 7. Account Information */}
        {activeTab === 'account' && (
          <section className="bg-[#0F172A] rounded-xl border border-[#1E293B] p-6 space-y-6">
            <div className="border-b border-[#1E293B] pb-4">
              <h2 className="text-base font-semibold text-white">Seller Account Profile</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Hardhat deterministic signer assignment and permissions
              </p>
            </div>

            <dl className="divide-y divide-[#1E293B] text-xs">
              <div className="py-3 flex justify-between">
                <dt className="text-slate-400">Assigned Role</dt>
                <dd className="text-white font-semibold">{wallet.roleTitle} ({wallet.label})</dd>
              </div>
              <div className="py-3 flex justify-between">
                <dt className="text-slate-400">Public Address</dt>
                <dd className="text-white font-mono">{wallet.address}</dd>
              </div>
              <div className="py-3 flex justify-between">
                <dt className="text-slate-400">Balance</dt>
                <dd className="text-white font-mono tabular-nums">{wallet.balanceEth.toFixed(4)} ETH</dd>
              </div>
              <div className="py-3 flex justify-between">
                <dt className="text-slate-400">Smart Contract Permissions</dt>
                <dd className="text-slate-300">Create vehicle auctions, configure reserve prices, withdraw proceeds</dd>
              </div>
            </dl>
          </section>
        )}
      </div>
    </div>
  );
};
