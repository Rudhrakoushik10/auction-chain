import React, { useState } from 'react';
import {
  LayoutDashboard,
  Search,
  Lock,
  Trophy,
  TrendingUp,
  Wallet,
  Bell,
  UserCheck,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  CheckCircle2,
} from 'lucide-react';
import { AuctionItem, LocalRevealBackupSecret } from '../../types/auction';
import { useWallet } from '../../context/WalletContext';
import { formatInr, formatEthToInr, shortenAddress } from '../../lib/crypto';
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
  onClaimRefund: (auctionId: string) => Promise<{ success: boolean; message: string }>;
  onSettleWinner: (auctionId: string) => Promise<{ success: boolean; message: string }>;
}

export const BidderDashboard: React.FC<BidderDashboardProps> = ({
  auctions,
  onSelectAuction,
  onClaimRefund,
  onSettleWinner,
}) => {
  const { wallet, chainId, disconnectWallet } = useWallet();
  const [activeTab, setActiveTab] = useState<BidderNavTab>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const isDeskExpanded = !isSidebarCollapsed || isSidebarHovered;
  const [txNotice, setTxNotice] = useState<string | null>(null);

  if (!wallet) return null;

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

  const bidderTitle =
    wallet.bidderIdentifier ||
    (wallet.address.toLowerCase().includes('3c44') ? 'Bidder 1' : 'Bidder 2');

  const sidebarItems: { id: BidderNavTab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'dashboard', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4 shrink-0" /> },
    { id: 'browse', label: 'Browse Auctions', icon: <Search className="w-4 h-4 shrink-0" />, count: activeAuctions.length },
    { id: 'my-bids', label: 'My Sealed Bids', icon: <Lock className="w-4 h-4 shrink-0" />, count: myBids.length },
    { id: 'won', label: 'Won & Settlement', icon: <Trophy className="w-4 h-4 shrink-0" />, count: wonAuctions.length },
    { id: 'insights', label: 'AI Valuation Feed', icon: <TrendingUp className="w-4 h-4 shrink-0" /> },
    { id: 'wallet', label: 'Transactions', icon: <Wallet className="w-4 h-4 shrink-0" /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4 shrink-0" /> },
    { id: 'account', label: 'Account', icon: <UserCheck className="w-4 h-4 shrink-0" /> },
  ];

  const renderMyBidsTable = () => {
    if (myBids.length === 0) {
      return (
        <div className="p-8 text-center space-y-3">
          <div className="text-xs text-[#8E95A5]">
            No sealed commitments submitted by {bidderTitle} yet.
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('browse')}
            className="px-4 py-2 rounded-md bg-[#C5A46D] hover:bg-[#D4B57E] text-[#0B0C10] text-xs font-semibold transition-colors cursor-pointer"
          >
            Browse Active Auctions
          </button>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="bg-[#0B0C10] text-[#8E95A5] border-b border-[#232730]">
            <tr>
              <th className="py-3 px-4 font-medium">Lot / Vehicle</th>
              <th className="py-3 px-4 font-medium">Auction Phase</th>
              <th className="py-3 px-4 font-medium">Your Commitment Status</th>
              <th className="py-3 px-4 font-medium text-right">Locked Deposit</th>
              <th className="py-3 px-4 font-medium text-right">Your Revealed Bid</th>
              <th className="py-3 px-4 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#232730]">
            {myBids.map((auc) => {
              const myComm = auc.commitments.find(
                (c) => c.bidderAddress.toLowerCase() === wallet.address.toLowerCase()
              );
              const isWinner =
                auc.winningBidderAddress?.toLowerCase() === wallet.address.toLowerCase();
              const canClaimRefund =
                myComm &&
                myComm.revealed &&
                !myComm.depositRefunded &&
                (auc.phase === 'No Sale' || (auc.phase === 'Sold' && !isWinner));

              return (
                <tr key={auc.id} className="hover:bg-[#171A22] transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-[#F4F5F7] line-clamp-1">{auc.title}</div>
                    <div className="font-mono text-[11px] text-[#8E95A5] tabular-nums">
                      #{auc.numericId} · Hash: {myComm?.commitmentHash.slice(0, 14)}...
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-medium whitespace-nowrap">
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
                      {auc.phase}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {myComm?.revealed ? (
                      <span className="text-[#2E9B68] font-medium">
                        Verified & Revealed
                      </span>
                    ) : (
                      <span className="text-[#D49B38] font-medium">
                        Sealed (Awaiting Reveal)
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[#F4F5F7] text-right whitespace-nowrap tabular-nums">
                    <div>{myComm?.depositEth.toFixed(2)} ETH</div>
                    <div className="text-[11px] text-[#C5A46D]">
                      {formatEthToInr(myComm?.depositEth || 0)}
                    </div>
                    {myComm?.depositRefunded && (
                      <span className="block text-[10px] text-[#2E9B68]">
                        {isWinner ? 'Credited' : 'Refunded'}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[#F4F5F7] text-right whitespace-nowrap tabular-nums">
                    {myComm?.revealed ? (
                      <div>
                        <div>{myComm.revealedAmountEth?.toFixed(2)} ETH</div>
                        <div className="text-[11px] text-[#C5A46D]">
                          {formatEthToInr(myComm.revealedAmountEth || 0)}
                        </div>
                      </div>
                    ) : (
                      'Concealed'
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="inline-flex items-center justify-end gap-2">
                      {auc.phase === 'Sold' && isWinner && !auc.winnerSettled && (
                        <button
                          type="button"
                          onClick={async () => {
                            const res = await onSettleWinner(auc.id);
                            setTxNotice(res.message);
                          }}
                          className="px-2.5 py-1 rounded bg-[#C5A46D] hover:bg-[#D4B57E] text-[#0B0C10] font-semibold cursor-pointer"
                        >
                          Settle Balance
                        </button>
                      )}
                      {canClaimRefund && (
                        <button
                          type="button"
                          onClick={async () => {
                            const res = await onClaimRefund(auc.id);
                            setTxNotice(res.message);
                          }}
                          className="px-2.5 py-1 rounded bg-[#2E9B68] hover:bg-[#2E9B68]/90 text-[#F4F5F7] font-semibold cursor-pointer"
                        >
                          Claim Refund
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onSelectAuction(auc)}
                        className="px-2.5 py-1 rounded border border-[#232730] hover:border-[#C5A46D]/50 text-[#F4F5F7] hover:text-[#C5A46D] font-medium cursor-pointer"
                      >
                        {auc.phase === 'Reveal' && !myComm?.revealed ? 'Reveal Bid' : 'Inspect'}
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
                {bidderTitle} Desk
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

        {/* 1. Overview Dashboard */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#232730] pb-5">
              <div>
                <h1 className="text-xl font-display font-semibold text-[#F4F5F7]">
                  {bidderTitle} Bidding Workspace
                </h1>
                <p className="text-xs text-[#8E95A5] mt-0.5">
                  Submit confidential Keccak-256 bid commitments, verify reveals, and claim pull-based deposit refunds.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('browse')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md bg-[#C5A46D] hover:bg-[#D4B57E] text-[#0B0C10] text-xs font-semibold uppercase tracking-[0.08em] transition-colors whitespace-nowrap shrink-0 cursor-pointer self-start sm:self-auto"
              >
                <Search className="w-4 h-4" />
                <span>Browse Live Auctions</span>
              </button>
            </div>

            {/* 4 Key Operational KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#232730] bg-[#12141A] rounded-md border border-[#232730] font-mono tabular-nums">
              <div className="p-4">
                <div className="text-xs font-sans text-[#8E95A5]">Your Commitments</div>
                <div className="text-2xl font-semibold text-[#F4F5F7] mt-1">{myBids.length}</div>
              </div>
              <div className="p-4">
                <div className="text-xs font-sans text-[#8E95A5]">Open Lots</div>
                <div className="text-2xl font-semibold text-[#C5A46D] mt-1">{activeAuctions.length}</div>
              </div>
              <div className="p-4">
                <div className="text-xs font-sans text-[#8E95A5]">Won Auctions</div>
                <div className="text-2xl font-semibold text-[#2E9B68] mt-1">{wonAuctions.length}</div>
              </div>
              <div className="p-4">
                <div className="text-xs font-sans text-[#8E95A5]">Available Balance</div>
                <div className="text-2xl font-semibold text-[#F4F5F7] mt-1">{wallet.balanceEth.toFixed(1)} ETH</div>
                <div className="text-[11px] text-[#C5A46D] mt-0.5">{formatEthToInr(wallet.balanceEth)}</div>
              </div>
            </div>

            {/* Submitted Bids Table */}
            <section className="bg-[#12141A] rounded-md border border-[#232730] overflow-hidden">
              <div className="px-6 py-4 border-b border-[#232730] flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-[#F4F5F7]">Your Sealed Commitments & Reveals</h2>
                  <p className="text-xs text-[#8E95A5] mt-0.5">
                    Other bidders&apos; unrevealed bids remain mathematically concealed.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('my-bids')}
                  className="text-xs font-medium text-[#C5A46D] hover:underline cursor-pointer"
                >
                  View All ({myBids.length})
                </button>
              </div>
              {renderMyBidsTable()}
            </section>
          </div>
        )}

        {/* 2. Browse Auctions */}
        {(activeTab === 'browse' || activeTab === 'active' || activeTab === 'upcoming') && (
          <Marketplace auctions={auctions} onSelectAuction={onSelectAuction} />
        )}

        {/* 3. My Sealed Bids & History */}
        {(activeTab === 'my-bids' || activeTab === 'history') && (
          <section className="bg-[#12141A] rounded-md border border-[#232730] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#232730]">
              <h2 className="text-base font-semibold text-[#F4F5F7]">
                Submitted Sealed Bids ({bidderTitle})
              </h2>
              <p className="text-xs text-[#8E95A5] mt-0.5">
                Track commitment hashes, reveal windows, and deposit refund eligibility
              </p>
            </div>
            {renderMyBidsTable()}
          </section>
        )}

        {/* 4. Won Auctions & Settlement */}
        {activeTab === 'won' && (
          <section className="bg-[#12141A] rounded-md border border-[#232730] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#232730]">
              <h2 className="text-base font-semibold text-[#F4F5F7]">Won Auctions & Escrow Settlement</h2>
              <p className="text-xs text-[#8E95A5] mt-0.5">
                Settle remaining winning balance (winning bid minus locked participation deposit)
              </p>
            </div>

            {wonAuctions.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#8E95A5]">
                You have not won any finalized vehicle auctions yet.
              </div>
            ) : (
              <div className="divide-y divide-[#232730]">
                {wonAuctions.map((auc) => {
                  const dueEth = Math.max(0, (auc.highestBidEth || 0) - auc.fixedDepositEth);
                  return (
                    <div
                      key={auc.id}
                      className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="text-sm font-semibold text-[#F4F5F7]">{auc.title}</div>
                        <div className="text-xs font-mono text-[#8E95A5] tabular-nums">
                          Winning Bid: <strong className="text-[#F4F5F7]">{auc.highestBidEth?.toFixed(2)} ETH ({formatEthToInr(auc.highestBidEth || 0)})</strong> · Deposit Credited: {auc.fixedDepositEth.toFixed(2)} ETH ({formatEthToInr(auc.fixedDepositEth)}) · Remaining Due: {dueEth.toFixed(2)} ETH ({formatEthToInr(dueEth)})
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {!auc.winnerSettled ? (
                          <button
                            type="button"
                            onClick={async () => {
                              const res = await onSettleWinner(auc.id);
                              setTxNotice(res.message);
                            }}
                            className="px-4 py-2 rounded-md bg-[#C5A46D] hover:bg-[#D4B57E] text-[#0B0C10] text-xs font-semibold cursor-pointer"
                          >
                            Settle {dueEth.toFixed(2)} ETH ({formatEthToInr(dueEth)})
                          </button>
                        ) : (
                          <span className="text-xs font-mono text-[#2E9B68]">
                            Settled On-Chain
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => onSelectAuction(auc)}
                          className="px-3 py-2 rounded-md border border-[#232730] hover:border-[#C5A46D]/50 text-xs text-[#F4F5F7] hover:text-[#C5A46D] cursor-pointer"
                        >
                          Inspect
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* 5. AI Valuation Feed */}
        {activeTab === 'insights' && (
          <section className="bg-[#12141A] rounded-md border border-[#232730] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#232730]">
              <h2 className="text-base font-semibold text-[#F4F5F7]">
                Oracle-Verified AI Valuation Feed
              </h2>
              <p className="text-xs text-[#8E95A5] mt-0.5">
                Compare advisory INR (₹) valuations anchored on PriceOracle.sol with seller Test ETH starting and reserve prices
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#0B0C10] text-[#8E95A5] border-b border-[#232730]">
                  <tr>
                    <th className="py-3 px-4 font-medium">Lot / Vehicle</th>
                    <th className="py-3 px-4 font-medium text-right">AI Valuation (INR)</th>
                    <th className="py-3 px-4 font-medium text-right">Starting Bid (ETH)</th>
                    <th className="py-3 px-4 font-medium text-right">Reserve (ETH)</th>
                    <th className="py-3 px-4 font-medium text-right">Oracle Proof</th>
                    <th className="py-3 px-4 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#232730] font-mono tabular-nums">
                  {auctions.map((auc) => (
                    <tr key={auc.id} className="hover:bg-[#171A22] transition-colors">
                      <td className="py-3.5 px-4 font-sans font-semibold text-[#F4F5F7]">
                        {auc.title}
                      </td>
                      <td className="py-3.5 px-4 text-right text-[#F4F5F7] font-semibold">
                        {formatInr(auc.aiPrediction.predicted_price ?? auc.aiPrediction.predicted_price_inr)}
                      </td>
                      <td className="py-3.5 px-4 text-right text-[#F4F5F7]">
                        <div>{auc.startingBidEth.toFixed(2)} ETH</div>
                        <div className="text-[11px] text-[#C5A46D]">{formatEthToInr(auc.startingBidEth)}</div>
                      </td>
                      <td className="py-3.5 px-4 text-right text-[#F4F5F7]">
                        <div>{auc.reservePriceEth.toFixed(2)} ETH</div>
                        <div className="text-[11px] text-[#C5A46D]">{formatEthToInr(auc.reservePriceEth)}</div>
                      </td>
                      <td className="py-3.5 px-4 text-right text-[#8E95A5]">
                        #{auc.aiPrediction.prediction_id} ({shortenAddress(auc.aiPrediction.product_data_hash)})
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

        {/* 6. Wallet & Transactions */}
        {activeTab === 'wallet' && (
          <section className="bg-[#12141A] rounded-md border border-[#232730] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#232730] flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-[#F4F5F7]">
                  {bidderTitle} On-Chain Transactions
                </h2>
                <p className="text-xs text-[#8E95A5] mt-0.5">
                  Commitments, reveals, settlements, and refunds signed by {shortenAddress(wallet.address)}
                </p>
              </div>
              <span className="text-xs font-mono text-[#8E95A5] tabular-nums">
                Chain ID {chainId} · {wallet.balanceEth.toFixed(2)} ETH ({formatEthToInr(wallet.balanceEth)})
              </span>
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
                  {auctions
                    .flatMap((a) => a.events)
                    .filter((e) => e.actorAddress.toLowerCase() === wallet.address.toLowerCase())
                    .map((evt) => (
                      <tr key={evt.id} className="hover:bg-[#171A22] transition-colors">
                        <td className="py-3 px-4 font-mono font-semibold text-[#C5A46D]">
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

        {/* 7. Notifications */}
        {activeTab === 'notifications' && (
          <section className="bg-[#12141A] rounded-md border border-[#232730] divide-y divide-[#232730]">
            <div className="px-6 py-4">
              <h2 className="text-base font-semibold text-[#F4F5F7]">Bidder Activity Alerts</h2>
            </div>
            {activeAuctions.map((auc) => (
              <div
                key={auc.id}
                className="px-6 py-4 flex items-center justify-between gap-4 text-xs"
              >
                <div className="space-y-0.5">
                  <div className="font-semibold text-[#F4F5F7]">
                    Lot #{auc.numericId} ({auc.phase} Phase Open)
                  </div>
                  <p className="text-[#8E95A5]">{auc.title}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onSelectAuction(auc)}
                  className="px-3 py-1.5 rounded bg-[#171A22] hover:bg-[#C5A46D] text-[#F4F5F7] hover:text-[#0B0C10] border border-[#232730] font-medium shrink-0 cursor-pointer transition-colors"
                >
                  Open Lot
                </button>
              </div>
            ))}
          </section>
        )}

        {/* 8. Account Profile */}
        {activeTab === 'account' && (
          <section className="bg-[#12141A] rounded-md border border-[#232730] p-6 space-y-6">
            <div className="border-b border-[#232730] pb-4">
              <h2 className="text-base font-semibold text-[#F4F5F7]">Bidder Account Profile</h2>
              <p className="text-xs text-[#8E95A5] mt-0.5">
                Hardhat deterministic signer assignment
              </p>
            </div>

            <dl className="divide-y divide-[#232730] text-xs">
              <div className="py-3 flex justify-between">
                <dt className="text-[#8E95A5]">Assigned Role</dt>
                <dd className="text-[#F4F5F7] font-semibold">
                  {wallet.roleTitle} ({bidderTitle})
                </dd>
              </div>
              <div className="py-3 flex justify-between">
                <dt className="text-[#8E95A5]">Hardhat Signer Index</dt>
                <dd className="text-[#F4F5F7] font-mono">Account #{wallet.accountIndex}</dd>
              </div>
              <div className="py-3 flex justify-between">
                <dt className="text-[#8E95A5]">Public Address</dt>
                <dd className="text-[#F4F5F7] font-mono">{wallet.address}</dd>
              </div>
              <div className="py-3 flex justify-between">
                <dt className="text-[#8E95A5]">Available Balance</dt>
                <dd className="text-[#C5A46D] font-mono tabular-nums">
                  {wallet.balanceEth.toFixed(4)} ETH ({formatEthToInr(wallet.balanceEth)})
                </dd>
              </div>
            </dl>
          </section>
        )}
      </div>
    </div>
  );
};
