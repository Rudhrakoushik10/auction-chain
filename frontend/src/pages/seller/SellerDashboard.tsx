import React, { useState } from 'react';
import {
  LayoutDashboard,
  PlusCircle,
  Layers,
  Clock,
  Calendar,
  CheckCircle2,
  Calculator,
  Wallet,
  Bell,
  UserCheck,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  DollarSign,
  Gavel,
  ArrowRight,
  RefreshCw,
  LogOut,
  Sliders,
  TrendingUp,
} from 'lucide-react';
import { AuctionItem, VehicleAttributes } from '../../types/auction';
import { useWallet } from '../../context/WalletContext';
import { shortenAddress } from '../../lib/crypto';
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
  const { wallet, chainId, disconnectWallet, adjustBalance } = useWallet();
  const [activeTab, setActiveTab] = useState<SellerNavTab>('dashboard');

  if (!wallet) return null;

  // Filter auctions created by this seller
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

  const sidebarItems: { id: SellerNavTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'create', label: 'Create Auction', icon: <PlusCircle className="w-4 h-4" /> },
    { id: 'my-auctions', label: 'My Auctions', icon: <Layers className="w-4 h-4" />, badge: myAuctions.length },
    { id: 'active', label: 'Active Auctions', icon: <Clock className="w-4 h-4" />, badge: activeAuctions.length },
    { id: 'upcoming', label: 'Upcoming Auctions', icon: <Calendar className="w-4 h-4" />, badge: upcomingAuctions.length },
    { id: 'completed', label: 'Completed Auctions', icon: <CheckCircle2 className="w-4 h-4" />, badge: completedAuctions.length },
    { id: 'estimator', label: 'AI Price Estimator', icon: <Calculator className="w-4 h-4" /> },
    { id: 'wallet', label: 'Wallet & Transactions', icon: <Wallet className="w-4 h-4" /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" />, badge: 2 },
    { id: 'account', label: 'Account Information', icon: <UserCheck className="w-4 h-4" /> },
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-[calc(100vh-8rem)] pb-16 animate-in fade-in">
      {/* Dark Blockchain Role-Specific Sidebar (10 Items) */}
      <aside className="w-full lg:w-64 bg-[#0F172A] rounded-2xl border border-[#1E293B] p-4 flex flex-col justify-between shrink-0 shadow-lg h-fit">
        <div className="space-y-6">
          {/* User Profile Capsule */}
          <div className="p-3.5 rounded-xl bg-[#131E3A] border border-[#1E293B] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-[#2563EB]/20 text-[#3B82F6] border border-[#2563EB]/40 font-bold">
                Role: Seller
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <div>
              <div className="text-xs font-bold text-white truncate">{wallet.label}</div>
              <div className="text-[11px] font-mono text-slate-400 truncate">
                {shortenAddress(wallet.address)}
              </div>
            </div>
            <div className="pt-1.5 border-t border-[#1E293B] flex items-center justify-between text-xs">
              <span className="text-slate-400">Balance:</span>
              <span className="font-mono font-bold text-[#06B6D4]">
                {wallet.balanceEth.toFixed(2)} ETH
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {sidebarItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#2563EB] text-white shadow-md shadow-[#2563EB]/30'
                      : 'text-slate-300 hover:text-white hover:bg-[#131E3A]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                        isActive ? 'bg-white/20 text-white' : 'bg-[#1E293B] text-slate-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Disconnect */}
        <div className="pt-4 border-t border-[#1E293B] mt-6">
          <button
            type="button"
            onClick={disconnectWallet}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Disconnect Wallet</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 space-y-6">
        {/* 1. Dashboard View */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-in fade-in">
            {/* Top Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-[#0F172A] p-4 rounded-2xl border border-[#1E293B] space-y-1">
                <span className="text-xs text-slate-400">Total Auctions</span>
                <div className="text-2xl font-bold text-white">{myAuctions.length}</div>
                <div className="text-[10px] text-slate-500 font-mono">Created by Seller</div>
              </div>
              <div className="bg-[#0F172A] p-4 rounded-2xl border border-[#1E293B] space-y-1">
                <span className="text-xs text-[#3B82F6]">Active Auctions</span>
                <div className="text-2xl font-bold text-[#3B82F6]">{activeAuctions.length}</div>
                <div className="text-[10px] text-slate-500 font-mono">Accepting / Revealing</div>
              </div>
              <div className="bg-[#0F172A] p-4 rounded-2xl border border-[#1E293B] space-y-1">
                <span className="text-xs text-purple-400">Upcoming</span>
                <div className="text-2xl font-bold text-purple-400">{upcomingAuctions.length}</div>
                <div className="text-[10px] text-slate-500 font-mono">Scheduled</div>
              </div>
              <div className="bg-[#0F172A] p-4 rounded-2xl border border-[#1E293B] space-y-1">
                <span className="text-xs text-[#06B6D4]">Total Bids Received</span>
                <div className="text-2xl font-bold text-[#06B6D4]">{totalBidsReceived}</div>
                <div className="text-[10px] text-slate-500 font-mono">Sealed commitments</div>
              </div>
            </div>

            {/* Quick Action Banner */}
            <div className="bg-gradient-to-r from-[#131E3A] to-[#0F172A] rounded-2xl border border-[#2563EB]/40 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white">List a Certified Vehicle for Auction</h3>
                <p className="text-xs text-slate-300">
                  Request AI valuation from vehicle-v1, set starting/reserve price, and deploy to SealedAuction.sol.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('create')}
                className="px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-blue-600 text-white font-bold text-xs transition-all shadow-md shadow-[#2563EB]/30 flex items-center gap-2 cursor-pointer shrink-0"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Create Auction</span>
              </button>
            </div>

            {/* Recent Seller Auctions */}
            <div className="bg-[#0F172A] rounded-2xl border border-[#1E293B] p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white">Your Listed Auctions</h3>
                <button
                  type="button"
                  onClick={() => setActiveTab('my-auctions')}
                  className="text-xs text-[#3B82F6] hover:underline font-medium"
                >
                  View All ({myAuctions.length})
                </button>
              </div>

              {myAuctions.length === 0 ? (
                <div className="text-center py-10 space-y-3">
                  <p className="text-xs text-slate-400">No auctions created yet under this seller account.</p>
                  <button
                    onClick={() => setActiveTab('create')}
                    className="px-4 py-2 rounded-lg bg-[#2563EB] text-white text-xs font-semibold"
                  >
                    Create First Auction
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-[#1E293B]">
                  {myAuctions.slice(0, 4).map((auc) => (
                    <div
                      key={auc.id}
                      className="py-3.5 flex items-center justify-between gap-4 hover:bg-[#131E3A]/40 px-2 rounded-lg transition-colors cursor-pointer"
                      onClick={() => onSelectAuction(auc)}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={auc.imageUrl}
                          alt={auc.title}
                          className="w-12 h-10 object-cover rounded-lg border border-[#1E293B]"
                        />
                        <div>
                          <div className="text-xs font-bold text-white hover:text-[#3B82F6] transition-colors">
                            {auc.title}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            ID: #{auc.numericId} · Starting: {auc.startingBidEth} ETH · Reserve: {auc.reservePriceEth} ETH
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                            auc.phase === 'Commit'
                              ? 'bg-[#2563EB]/20 text-[#3B82F6] border border-[#2563EB]/30'
                              : auc.phase === 'Reveal'
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                              : auc.phase === 'Sold'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-slate-700 text-slate-300'
                          }`}
                        >
                          {auc.phase}
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 2. Create Auction View */}
        {activeTab === 'create' && (
          <CreateAuction
            onCreateAuction={(newAuc) => {
              onCreateAuction(newAuc);
              setActiveTab('my-auctions');
            }}
            nextNumericId={auctions.length + 1}
          />
        )}

        {/* 3. My Auctions View */}
        {activeTab === 'my-auctions' && (
          <div className="bg-[#0F172A] rounded-2xl border border-[#1E293B] p-6 space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-[#1E293B]">
              <div>
                <h2 className="text-lg font-bold text-white">All Seller Auctions</h2>
                <p className="text-xs text-slate-400">Manage all vehicles deployed to the auction contract</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('create')}
                className="px-4 py-2 rounded-xl bg-[#2563EB] text-white text-xs font-bold flex items-center gap-1.5"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>New Auction</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myAuctions.map((auc) => (
                <div
                  key={auc.id}
                  className="bg-[#131E3A] rounded-xl border border-[#1E293B] p-4 space-y-3 hover:border-[#2563EB]/40 transition-colors cursor-pointer"
                  onClick={() => onSelectAuction(auc)}
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={auc.imageUrl}
                      alt={auc.title}
                      className="w-20 h-16 object-cover rounded-lg border border-[#1E293B] shrink-0"
                    />
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-[#06B6D4]">
                          Auction #{auc.numericId}
                        </span>
                        <span className="text-[10px] font-bold uppercase px-1.5 py-0.2 rounded bg-[#090D1A] text-slate-300">
                          {auc.phase}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-white line-clamp-1">{auc.title}</h4>
                      <p className="text-[11px] text-slate-400 font-mono">
                        Valuation: ₹{(auc.aiPrediction?.predicted_price_inr || 0).toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#1E293B] flex items-center justify-between text-xs">
                    <span className="text-slate-400">
                      Bids: <strong className="text-white">{auc.commitments?.length || 0}</strong>
                    </span>
                    <span className="text-[#3B82F6] font-semibold flex items-center gap-1">
                      <span>View Details</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. Active Auctions View */}
        {activeTab === 'active' && (
          <div className="bg-[#0F172A] rounded-2xl border border-[#1E293B] p-6 space-y-4">
            <h2 className="text-lg font-bold text-white">Active Vehicle Auctions</h2>
            <p className="text-xs text-slate-400">
              Auctions currently in Commit or Reveal phase. Competitor secret bid amounts remain cryptographically sealed.
            </p>

            {activeAuctions.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-400">
                No currently active auctions. Click "Create Auction" to schedule one.
              </div>
            ) : (
              <div className="space-y-3">
                {activeAuctions.map((auc) => (
                  <div
                    key={auc.id}
                    onClick={() => onSelectAuction(auc)}
                    className="bg-[#131E3A] p-4 rounded-xl border border-[#1E293B] flex items-center justify-between cursor-pointer hover:border-[#2563EB]/40 transition-colors"
                  >
                    <div>
                      <div className="text-xs font-bold text-white">{auc.title}</div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        Phase: {auc.phase} · Commitments: {auc.commitments?.length || 0} · Reserve: {auc.reservePriceEth} ETH
                      </div>
                    </div>
                    <span className="text-xs font-bold text-[#3B82F6] flex items-center gap-1">
                      <span>Manage</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 5. Upcoming Auctions View */}
        {activeTab === 'upcoming' && (
          <div className="bg-[#0F172A] rounded-2xl border border-[#1E293B] p-6 space-y-4">
            <h2 className="text-lg font-bold text-white">Upcoming Auctions</h2>
            <p className="text-xs text-slate-400">
              Scheduled auctions deployed to the blockchain awaiting their start timestamp.
            </p>
            {upcomingAuctions.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-400">
                No upcoming auctions scheduled at this time.
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingAuctions.map((auc) => (
                  <div key={auc.id} className="bg-[#131E3A] p-4 rounded-xl border border-[#1E293B] flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-white">{auc.title}</div>
                      <div className="text-[11px] text-slate-400 font-mono">Starts soon</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 6. Completed Auctions View */}
        {activeTab === 'completed' && (
          <div className="bg-[#0F172A] rounded-2xl border border-[#1E293B] p-6 space-y-4">
            <h2 className="text-lg font-bold text-white">Completed Auctions & Settlement</h2>
            <p className="text-xs text-slate-400">
              Finalized auction outcomes (Sold vs No Sale) and pull-based seller proceeds withdrawal.
            </p>
            {completedAuctions.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-400">
                No completed auctions yet.
              </div>
            ) : (
              <div className="space-y-3">
                {completedAuctions.map((auc) => (
                  <div
                    key={auc.id}
                    className="bg-[#131E3A] p-4 rounded-xl border border-[#1E293B] flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-bold text-white">{auc.title}</div>
                      <div className="text-[11px] font-mono text-slate-400">
                        Result: <strong className={auc.phase === 'Sold' ? 'text-emerald-400' : 'text-rose-400'}>{auc.phase}</strong> · Highest: {auc.highestBidEth || 0} ETH
                      </div>
                    </div>
                    {auc.phase === 'Sold' && !auc.sellerWithdrawn && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onWithdrawProceeds(auc.id);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                      >
                        Withdraw Proceeds ({auc.highestBidEth} ETH)
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 7. AI Price Estimator View */}
        {activeTab === 'estimator' && <AIPriceEstimatorPage />}

        {/* 8. Wallet & Transactions View */}
        {activeTab === 'wallet' && (
          <div className="bg-[#0F172A] rounded-2xl border border-[#1E293B] p-6 space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white">Seller Wallet & On-Chain Records</h2>
              <p className="text-xs text-slate-400">
                Connected address, network parameters, and smart-contract execution audit trail
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-[#131E3A] p-4 rounded-xl border border-[#1E293B]">
                <span className="text-[11px] text-slate-400">Connected Wallet</span>
                <div className="text-xs font-mono font-bold text-white truncate mt-1">{wallet.address}</div>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5">{wallet.label}</div>
              </div>
              <div className="bg-[#131E3A] p-4 rounded-xl border border-[#1E293B]">
                <span className="text-[11px] text-slate-400">Network & Chain ID</span>
                <div className="text-xs font-mono font-bold text-[#06B6D4] mt-1">Hardhat Localhost</div>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5">Chain ID: {chainId}</div>
              </div>
              <div className="bg-[#131E3A] p-4 rounded-xl border border-[#1E293B]">
                <span className="text-[11px] text-slate-400">Balance</span>
                <div className="text-sm font-mono font-bold text-emerald-400 mt-1">
                  {wallet.balanceEth.toFixed(4)} ETH
                </div>
              </div>
            </div>

            {/* Event Log */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Recent On-Chain Transactions
              </h3>
              <div className="space-y-2 font-mono text-xs">
                {myAuctions.flatMap((a) => a.events).slice(0, 5).map((evt) => (
                  <div key={evt.id} className="p-3 bg-[#131E3A] rounded-xl border border-[#1E293B] flex items-center justify-between">
                    <div>
                      <span className="text-[#3B82F6] font-bold">[{evt.eventName}]</span>{' '}
                      <span className="text-slate-300">{evt.summary}</span>
                    </div>
                    <span className="text-[10px] text-slate-500">{shortenAddress(evt.txHash)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 9. Notifications View */}
        {activeTab === 'notifications' && (
          <div className="bg-[#0F172A] rounded-2xl border border-[#1E293B] p-6 space-y-4">
            <h2 className="text-lg font-bold text-white">Seller Notifications</h2>
            <div className="space-y-3">
              <div className="p-3.5 bg-[#131E3A] rounded-xl border border-[#1E293B] text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#3B82F6]">New Bid Commitment Received</span>
                  <span className="text-[10px] text-slate-400">18m ago</span>
                </div>
                <p className="text-slate-300">
                  Account 3 (Bidder 1) deposited 0.50 ETH fixed collateral and submitted a sealed commitment hash.
                </p>
              </div>
              <div className="p-3.5 bg-[#131E3A] rounded-xl border border-[#1E293B] text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-400">Oracle Valuation Registered</span>
                  <span className="text-[10px] text-slate-400">1h ago</span>
                </div>
                <p className="text-slate-300">
                  Oracle Relayer (Account 5) verified vehicle-v1 prediction on PriceOracle.sol.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 10. Account Information View */}
        {activeTab === 'account' && (
          <div className="bg-[#0F172A] rounded-2xl border border-[#1E293B] p-6 space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white">Account Information</h2>
              <p className="text-xs text-slate-400">Role assignment and cryptographic authorization profile</p>
            </div>

            <div className="bg-[#131E3A] p-5 rounded-xl border border-[#1E293B] space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-[#1E293B]">
                <span className="text-slate-400">Assigned Role</span>
                <span className="font-bold text-white">Vehicle Seller (Account 2)</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-[#1E293B]">
                <span className="text-slate-400">Hardhat Account Index</span>
                <span className="font-mono text-slate-300">Account 1 (Signer Index #1)</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-[#1E293B]">
                <span className="text-slate-400">Public Address</span>
                <span className="font-mono text-white">{wallet.address}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-[#1E293B]">
                <span className="text-slate-400">Network Status</span>
                <span className="font-mono text-emerald-400">Connected (Hardhat 31337)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Role Permissions</span>
                <span className="text-slate-300">Create vehicle auctions, configure reserve price, withdraw sale proceeds</span>
              </div>
            </div>

            <button
              type="button"
              onClick={disconnectWallet}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Disconnect Wallet</span>
            </button>
          </div>
        )}
      </main>
    </div>
  );
};
