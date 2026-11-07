import React, { useState } from 'react';
import {
  LayoutDashboard,
  Search,
  Lock,
  Clock,
  Calendar,
  Trophy,
  History,
  TrendingUp,
  Wallet,
  Bell,
  UserCheck,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  LogOut,
  RefreshCw,
  Info,
} from 'lucide-react';
import { AuctionItem, LocalRevealBackupSecret } from '../../types/auction';
import { useWallet } from '../../context/WalletContext';
import { shortenAddress } from '../../lib/crypto';
import { Marketplace } from '../Marketplace';

export type BidderNavTab =
  | 'dashboard'
  | 'browse'
  | 'my-bids'
  | 'active'
  | 'upcoming'
  | 'won'
  | 'history'
  | 'insights'
  | 'wallet'
  | 'notifications'
  | 'account';

interface BidderDashboardProps {
  auctions: AuctionItem[];
  savedSecrets: LocalRevealBackupSecret[];
  onSelectAuction: (auction: AuctionItem) => void;
  onClaimRefund: (auctionId: string) => void;
  onSettleWinner: (auctionId: string) => void;
}

export const BidderDashboard: React.FC<BidderDashboardProps> = ({
  auctions,
  savedSecrets,
  onSelectAuction,
  onClaimRefund,
  onSettleWinner,
}) => {
  const { wallet, chainId, disconnectWallet } = useWallet();
  const [activeTab, setActiveTab] = useState<BidderNavTab>('dashboard');

  if (!wallet) return null;

  // Filter auctions where the connected bidder committed or won
  const myBids = auctions.filter((a) =>
    a.commitments.some(
      (c) => c.bidderAddress.toLowerCase() === wallet.address.toLowerCase()
    )
  );

  const wonAuctions = auctions.filter(
    (a) =>
      a.winningBidderAddress?.toLowerCase() === wallet.address.toLowerCase() &&
      a.phase === 'Sold'
  );

  const activeAuctions = auctions.filter(
    (a) => a.phase === 'Commit' || a.phase === 'Reveal'
  );
  const upcomingAuctions = auctions.filter((a) => a.phase === 'Upcoming');

  const bidderTitle = wallet.bidderIdentifier || (wallet.address.toLowerCase().includes('3c44') ? 'Bidder 1' : 'Bidder 2');

  const sidebarItems: { id: BidderNavTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'browse', label: 'Browse Auctions', icon: <Search className="w-4 h-4" /> },
    { id: 'my-bids', label: 'My Bids', icon: <Lock className="w-4 h-4" />, badge: myBids.length },
    { id: 'active', label: 'Active Auctions', icon: <Clock className="w-4 h-4" />, badge: activeAuctions.length },
    { id: 'upcoming', label: 'Upcoming Auctions', icon: <Calendar className="w-4 h-4" />, badge: upcomingAuctions.length },
    { id: 'won', label: 'Won Auctions', icon: <Trophy className="w-4 h-4" />, badge: wonAuctions.length },
    { id: 'history', label: 'Bid History', icon: <History className="w-4 h-4" /> },
    { id: 'insights', label: 'AI Price Insights', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'wallet', label: 'Wallet & Transactions', icon: <Wallet className="w-4 h-4" /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" />, badge: 2 },
    { id: 'account', label: 'Account Information', icon: <UserCheck className="w-4 h-4" /> },
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-[calc(100vh-8rem)] pb-16 animate-in fade-in">
      {/* Dark Blockchain Role-Specific Sidebar (11 Items) */}
      <aside className="w-full lg:w-64 bg-[#0F172A] rounded-2xl border border-[#1E293B] p-4 flex flex-col justify-between shrink-0 shadow-lg h-fit">
        <div className="space-y-6">
          {/* User Profile Capsule */}
          <div className="p-3.5 rounded-xl bg-[#131E3A] border border-[#1E293B] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-[#7C3AED]/20 text-[#A78BFA] border border-[#7C3AED]/40 font-bold">
                {bidderTitle}
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
              <span className="text-slate-400">Collateral:</span>
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
                      ? 'bg-[#7C3AED] text-white shadow-md shadow-[#7C3AED]/30'
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
                <span className="text-xs text-slate-400">Active Bids</span>
                <div className="text-2xl font-bold text-white">{myBids.length}</div>
                <div className="text-[10px] text-slate-500 font-mono">Committed auctions</div>
              </div>
              <div className="bg-[#0F172A] p-4 rounded-2xl border border-[#1E293B] space-y-1">
                <span className="text-xs text-[#3B82F6]">Live Auctions</span>
                <div className="text-2xl font-bold text-[#3B82F6]">{activeAuctions.length}</div>
                <div className="text-[10px] text-slate-500 font-mono">Accepting Bids</div>
              </div>
              <div className="bg-[#0F172A] p-4 rounded-2xl border border-[#1E293B] space-y-1">
                <span className="text-xs text-emerald-400">Won Auctions</span>
                <div className="text-2xl font-bold text-emerald-400">{wonAuctions.length}</div>
                <div className="text-[10px] text-slate-500 font-mono">Awaiting / Settled</div>
              </div>
              <div className="bg-[#0F172A] p-4 rounded-2xl border border-[#1E293B] space-y-1">
                <span className="text-xs text-[#06B6D4]">Available Test ETH</span>
                <div className="text-2xl font-bold text-[#06B6D4]">{wallet.balanceEth.toFixed(1)}</div>
                <div className="text-[10px] text-slate-500 font-mono">Chain ID 31337</div>
              </div>
            </div>

            {/* Quick Action: Browse Auctions */}
            <div className="bg-gradient-to-r from-[#131E3A] to-[#0F172A] rounded-2xl border border-[#7C3AED]/40 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white">Participate in Sealed-Bid Vehicle Auctions</h3>
                <p className="text-xs text-slate-300">
                  Submit cryptographic commitments with zero front-running risk. Values remain 100% hidden until the reveal window.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('browse')}
                className="px-5 py-2.5 rounded-xl bg-[#7C3AED] hover:bg-purple-600 text-white font-bold text-xs transition-all shadow-md shadow-[#7C3AED]/30 flex items-center gap-2 cursor-pointer shrink-0"
              >
                <Search className="w-4 h-4" />
                <span>Browse Auctions</span>
              </button>
            </div>

            {/* Recent Bidding Activity */}
            <div className="bg-[#0F172A] rounded-2xl border border-[#1E293B] p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white">Your Committed Auctions</h3>
                <button
                  type="button"
                  onClick={() => setActiveTab('my-bids')}
                  className="text-xs text-[#A78BFA] hover:underline font-medium"
                >
                  View All ({myBids.length})
                </button>
              </div>

              {myBids.length === 0 ? (
                <div className="text-center py-10 space-y-3">
                  <p className="text-xs text-slate-400">
                    No active sealed bids submitted by {bidderTitle} yet.
                  </p>
                  <button
                    onClick={() => setActiveTab('browse')}
                    className="px-4 py-2 rounded-lg bg-[#7C3AED] text-white text-xs font-semibold"
                  >
                    Explore Vehicles to Bid
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-[#1E293B]">
                  {myBids.map((auc) => {
                    const myComm = auc.commitments.find(
                      (c) => c.bidderAddress.toLowerCase() === wallet.address.toLowerCase()
                    );
                    return (
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
                            <div className="text-xs font-bold text-white">{auc.title}</div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              Deposit: {myComm?.depositEth || auc.fixedDepositEth} ETH · Status:{' '}
                              {myComm?.revealed ? (
                                <span className="text-emerald-400">Revealed ({myComm.revealedAmountEth} ETH)</span>
                              ) : (
                                <span className="text-amber-400">Sealed Hash Committed</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-[#131E3A] text-slate-300 border border-[#1E293B]">
                            {auc.phase}
                          </span>
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 2. Browse Auctions View */}
        {activeTab === 'browse' && (
          <Marketplace auctions={auctions} onSelectAuction={onSelectAuction} />
        )}

        {/* 3. My Bids View */}
        {activeTab === 'my-bids' && (
          <div className="bg-[#0F172A] rounded-2xl border border-[#1E293B] p-6 space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-[#1E293B]">
              <div>
                <h2 className="text-lg font-bold text-white">My Submitted Bids ({bidderTitle})</h2>
                <p className="text-xs text-slate-400">
                  Only your own confidential bids are displayed. Competitors' secret bids remain concealed.
                </p>
              </div>
            </div>

            {myBids.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-400">
                You haven't committed any bids yet. Browse the marketplace to participate.
              </div>
            ) : (
              <div className="space-y-4">
                {myBids.map((auc) => {
                  const myComm = auc.commitments.find(
                    (c) => c.bidderAddress.toLowerCase() === wallet.address.toLowerCase()
                  );
                  return (
                    <div
                      key={auc.id}
                      className="bg-[#131E3A] p-5 rounded-xl border border-[#1E293B] space-y-3"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={auc.imageUrl}
                            alt={auc.title}
                            className="w-16 h-12 object-cover rounded-lg border border-[#1E293B]"
                          />
                          <div>
                            <span className="text-[10px] font-mono text-[#06B6D4]">Auction #{auc.numericId}</span>
                            <h4 className="text-sm font-bold text-white">{auc.title}</h4>
                            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                              Phase: <strong className="text-white">{auc.phase}</strong> · Collateral Deposit: {auc.fixedDepositEth} ETH
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => onSelectAuction(auc)}
                          className="px-3.5 py-1.5 rounded-lg bg-[#2563EB] hover:bg-blue-600 text-white text-xs font-bold shrink-0"
                        >
                          View & Reveal
                        </button>
                      </div>

                      <div className="bg-[#090D1A] p-3 rounded-lg text-xs font-mono space-y-1 text-slate-300 border border-[#1E293B]">
                        <div>Commitment Hash: {myComm?.commitmentHash}</div>
                        <div>Tx Hash: {myComm?.txHash}</div>
                        {myComm?.revealed && (
                          <div className="text-emerald-400 font-bold">
                            Verified Revealed Bid: {myComm.revealedAmountEth} ETH
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 4. Active Auctions View */}
        {activeTab === 'active' && (
          <div className="bg-[#0F172A] rounded-2xl border border-[#1E293B] p-6 space-y-4">
            <h2 className="text-lg font-bold text-white">Active Auctions Accepting Bids</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeAuctions.map((auc) => (
                <div
                  key={auc.id}
                  onClick={() => onSelectAuction(auc)}
                  className="bg-[#131E3A] p-4 rounded-xl border border-[#1E293B] space-y-3 cursor-pointer hover:border-[#7C3AED]/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <img src={auc.imageUrl} alt={auc.title} className="w-16 h-12 object-cover rounded-lg" />
                    <div>
                      <div className="text-xs font-bold text-white line-clamp-1">{auc.title}</div>
                      <div className="text-[11px] font-mono text-[#06B6D4]">
                        Starting Bid: {auc.startingBidEth} ETH
                      </div>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-[#1E293B] flex items-center justify-between text-xs">
                    <span className="text-slate-400">Phase: {auc.phase}</span>
                    <span className="text-[#A78BFA] font-bold">Submit Sealed Bid →</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. Upcoming Auctions View */}
        {activeTab === 'upcoming' && (
          <div className="bg-[#0F172A] rounded-2xl border border-[#1E293B] p-6 space-y-4">
            <h2 className="text-lg font-bold text-white">Upcoming Auctions</h2>
            <p className="text-xs text-slate-400">Auctions awaiting scheduled start timestamp.</p>
            {upcomingAuctions.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-400">No upcoming auctions scheduled.</div>
            ) : (
              <div className="space-y-3">
                {upcomingAuctions.map((auc) => (
                  <div key={auc.id} className="bg-[#131E3A] p-4 rounded-xl border border-[#1E293B] flex items-center justify-between">
                    <div className="text-xs font-bold text-white">{auc.title}</div>
                    <span className="text-xs text-slate-400">Starts soon</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 6. Won Auctions View */}
        {activeTab === 'won' && (
          <div className="bg-[#0F172A] rounded-2xl border border-[#1E293B] p-6 space-y-4">
            <h2 className="text-lg font-bold text-white">Won Auctions & Vehicle Settlement</h2>
            {wonAuctions.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-400">
                You have not won any finalized auctions yet.
              </div>
            ) : (
              <div className="space-y-4">
                {wonAuctions.map((auc) => (
                  <div key={auc.id} className="bg-[#131E3A] p-5 rounded-xl border border-emerald-500/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-bold text-white">{auc.title}</div>
                      <span className="text-xs font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
                        WINNER
                      </span>
                    </div>
                    <div className="text-xs text-slate-300 font-mono">
                      Winning Bid: {auc.highestBidEth} ETH · Deposit Credited: {auc.fixedDepositEth} ETH
                    </div>
                    {!auc.winnerSettled ? (
                      <button
                        type="button"
                        onClick={() => onSettleWinner(auc.id)}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                      >
                        Settle Balance ({(auc.highestBidEth || 0) - auc.fixedDepositEth} ETH)
                      </button>
                    ) : (
                      <span className="text-xs font-mono text-emerald-400">✓ Balance Fully Settled on-chain</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 7. Bid History View */}
        {activeTab === 'history' && (
          <div className="bg-[#0F172A] rounded-2xl border border-[#1E293B] p-6 space-y-4">
            <h2 className="text-lg font-bold text-white">Bid History ({bidderTitle})</h2>
            <div className="space-y-2 font-mono text-xs">
              {myBids.flatMap((a) => a.commitments.filter((c) => c.bidderAddress.toLowerCase() === wallet.address.toLowerCase())).map((comm) => (
                <div key={comm.id} className="p-3 bg-[#131E3A] rounded-xl border border-[#1E293B] flex items-center justify-between">
                  <div>
                    <span className="text-[#3B82F6] font-bold">[{comm.id}]</span> Auction #{comm.numericAuctionId} · Collateral: {comm.depositEth} ETH
                  </div>
                  <span className="text-[10px] text-slate-400">{comm.txHash ? shortenAddress(comm.txHash) : 'Pending'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 8. AI Price Insights View */}
        {activeTab === 'insights' && (
          <div className="bg-[#0F172A] rounded-2xl border border-[#1E293B] p-6 space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white">AI Price Insights for Active Vehicles</h2>
              <p className="text-xs text-slate-400">
                Off-chain machine learning valuations registered on-chain via PriceOracle.sol. Distinct from secret bids.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {auctions.map((auc) => (
                <div key={auc.id} className="bg-[#131E3A] p-4 rounded-xl border border-[#1E293B] space-y-2 text-xs">
                  <div className="font-bold text-white">{auc.title}</div>
                  <div className="text-slate-400 font-mono">
                    AI Estimated Resale: ₹{(auc.aiPrediction?.predicted_price_inr || 0).toLocaleString('en-IN')}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    Model: {auc.aiPrediction?.model_version} · Hash: {shortenAddress(auc.aiPrediction?.product_data_hash || '')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 9. Wallet & Transactions View */}
        {activeTab === 'wallet' && (
          <div className="bg-[#0F172A] rounded-2xl border border-[#1E293B] p-6 space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white">Bidder Wallet & Balance</h2>
              <p className="text-xs text-slate-400">Active signer and transaction history on Hardhat Local</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-[#131E3A] p-4 rounded-xl border border-[#1E293B]">
                <span className="text-[11px] text-slate-400">Address</span>
                <div className="text-xs font-mono font-bold text-white truncate mt-1">{wallet.address}</div>
                <div className="text-[10px] text-[#A78BFA] font-mono mt-0.5">{bidderTitle}</div>
              </div>
              <div className="bg-[#131E3A] p-4 rounded-xl border border-[#1E293B]">
                <span className="text-[11px] text-slate-400">Network</span>
                <div className="text-xs font-mono font-bold text-[#06B6D4] mt-1">Hardhat (31337)</div>
              </div>
              <div className="bg-[#131E3A] p-4 rounded-xl border border-[#1E293B]">
                <span className="text-[11px] text-slate-400">Available Balance</span>
                <div className="text-sm font-mono font-bold text-emerald-400 mt-1">
                  {wallet.balanceEth.toFixed(4)} ETH
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 10. Notifications View */}
        {activeTab === 'notifications' && (
          <div className="bg-[#0F172A] rounded-2xl border border-[#1E293B] p-6 space-y-4">
            <h2 className="text-lg font-bold text-white">Bidder Notifications</h2>
            <div className="space-y-3 text-xs">
              <div className="p-3.5 bg-[#131E3A] rounded-xl border border-[#1E293B] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#A78BFA]">Reveal Phase Reminder</span>
                  <span className="text-[10px] text-slate-400">25m ago</span>
                </div>
                <p className="text-slate-300">
                  Auction #1 reveal phase is now open. Submit your secret salt to verify your commitment on-chain.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 11. Account Information View */}
        {activeTab === 'account' && (
          <div className="bg-[#0F172A] rounded-2xl border border-[#1E293B] p-6 space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white">Account Information</h2>
              <p className="text-xs text-slate-400">Bidder participant authentication</p>
            </div>
            <div className="bg-[#131E3A] p-5 rounded-xl border border-[#1E293B] space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-[#1E293B]">
                <span className="text-slate-400">Assigned Role</span>
                <span className="font-bold text-white">Vehicle Bidder ({bidderTitle})</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-[#1E293B]">
                <span className="text-slate-400">Hardhat Account Index</span>
                <span className="font-mono text-slate-300">Account #{wallet.accountIndex}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-[#1E293B]">
                <span className="text-slate-400">Public Address</span>
                <span className="font-mono text-white">{wallet.address}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-[#1E293B]">
                <span className="text-slate-400">Network Status</span>
                <span className="font-mono text-emerald-400">Connected (Chain ID 31337)</span>
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
