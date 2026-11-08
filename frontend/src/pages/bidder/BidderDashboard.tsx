import React, { useState } from 'react';
import {
  LayoutDashboard,
  Search,
  Trophy,
  TrendingUp,
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
  | 'won'
  | 'insights'
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
  const { wallet, disconnectWallet } = useWallet();
  const [activeTab, setActiveTab] = useState<BidderNavTab>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const isDeskExpanded = !isSidebarCollapsed || isSidebarHovered;
  const [txNotice, setTxNotice] = useState<string | null>(null);

  React.useEffect(() => {
    setActiveTab('dashboard');
    setTxNotice(null);
  }, [wallet?.address]);

  React.useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [activeTab, wallet?.address]);

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
    { id: 'dashboard', label: 'My Bids & Overview', icon: <LayoutDashboard className="w-4 h-4 shrink-0" />, count: myBids.length },
    { id: 'browse', label: 'Browse Cars', icon: <Search className="w-4 h-4 shrink-0" />, count: activeAuctions.length },
    { id: 'won', label: 'Cars Won & Payment', icon: <Trophy className="w-4 h-4 shrink-0" />, count: wonAuctions.length },
    { id: 'insights', label: 'AI Price Comparison', icon: <TrendingUp className="w-4 h-4 shrink-0" /> },
    { id: 'account', label: 'My Account', icon: <UserCheck className="w-4 h-4 shrink-0" /> },
  ];

  const formatPhaseLabel = (phase: AuctionItem['phase']) => {
    if (phase === 'Commit') return 'Bidding Open (Sealed)';
    if (phase === 'Reveal') return 'Opening Envelopes';
    if (phase === 'Sold') return 'Sold';
    if (phase === 'No Sale') return 'Reserve Not Met';
    return phase;
  };

  const renderMyBidsTable = () => {
    if (myBids.length === 0) {
      return (
        <div className="py-14 text-center space-y-3 border-b border-[#232730]">
          <div className="text-sm font-medium text-[#F4F5F7]">
            You haven&apos;t placed any sealed bids yet.
          </div>
          <p className="text-xs text-[#8E95A5] max-w-md mx-auto">
            Browse available vehicles to compare AI fair-market valuations in Rupees (₹) and submit a private sealed-envelope offer.
          </p>
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setActiveTab('browse')}
              className="px-4 py-2 rounded-md bg-[#C5A46D] hover:bg-[#D4B57E] text-[#0B0C10] text-xs font-semibold transition-colors cursor-pointer"
            >
              Browse Cars
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
              <th className="py-3.5 px-4 font-medium">Auction Status</th>
              <th className="py-3.5 px-4 font-medium">Your Envelope Status</th>
              <th className="py-3.5 px-4 font-medium text-right">Security Deposit</th>
              <th className="py-3.5 px-4 font-medium text-right">Your Bid Offer</th>
              <th className="py-3.5 px-4 font-medium text-right">Actions</th>
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
                <tr key={auc.id} className="hover:bg-[#12141A] transition-colors">
                  <td className="py-4 px-4">
                    <div className="font-semibold text-[#F4F5F7] line-clamp-1">{auc.title}</div>
                    <div className="font-mono text-[11px] text-[#8E95A5] tabular-nums">
                      Lot #{auc.numericId} · Envelope ID: {myComm?.commitmentHash.slice(0, 12)}...
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
                  <td className="py-4 px-4 whitespace-nowrap">
                    {myComm?.revealed ? (
                      <span className="text-[#2E9B68] font-medium">
                        Opened &amp; Verified
                      </span>
                    ) : (
                      <span className="text-[#D49B38] font-medium">
                        Locked in Envelope
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-4 font-mono text-[#F4F5F7] text-right whitespace-nowrap tabular-nums">
                    <div>{formatEthToInr(myComm?.depositEth || 0)}</div>
                    <div className="text-[11px] text-[#8E95A5]">
                      {myComm?.depositEth.toFixed(2)} ETH
                    </div>
                    {myComm?.depositRefunded && (
                      <span className="block text-[10px] text-[#2E9B68]">
                        {isWinner ? 'Applied to Purchase' : 'Refunded to Wallet'}
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-4 font-mono text-[#F4F5F7] text-right whitespace-nowrap tabular-nums">
                    {myComm?.revealed ? (
                      <div>
                        <div>{formatEthToInr(myComm.revealedAmountEth || 0)}</div>
                        <div className="text-[11px] text-[#8E95A5]">
                          {myComm.revealedAmountEth?.toFixed(2)} ETH
                        </div>
                      </div>
                    ) : (
                      <span className="text-[#8E95A5]">Hidden until opened</span>
                    )}
                  </td>
                  <td className="py-4 px-4 text-right whitespace-nowrap">
                    <div className="inline-flex items-center justify-end gap-2">
                      {auc.phase === 'Sold' && isWinner && !auc.winnerSettled && (
                        <button
                          type="button"
                          onClick={async () => {
                            const res = await onSettleWinner(auc.id);
                            setTxNotice(res.message);
                          }}
                          className="px-2.5 py-1.5 rounded bg-[#C5A46D] hover:bg-[#D4B57E] text-[#0B0C10] font-semibold cursor-pointer"
                        >
                          Pay Remaining Balance
                        </button>
                      )}
                      {canClaimRefund && (
                        <button
                          type="button"
                          onClick={async () => {
                            const res = await onClaimRefund(auc.id);
                            setTxNotice(res.message);
                          }}
                          className="px-2.5 py-1.5 rounded bg-[#2E9B68] hover:bg-[#2E9B68]/90 text-[#F4F5F7] font-semibold cursor-pointer"
                        >
                          Claim Deposit Refund
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onSelectAuction(auc)}
                        className="px-2.5 py-1.5 rounded border border-[#232730] hover:border-[#C5A46D]/50 text-[#F4F5F7] hover:text-[#C5A46D] font-medium cursor-pointer"
                      >
                        {auc.phase === 'Reveal' && !myComm?.revealed ? 'Open My Envelope' : 'View Details'}
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

  const myEvents = auctions
    .flatMap((a) => a.events)
    .filter((e) => e.actorAddress.toLowerCase() === wallet.address.toLowerCase());

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
                {bidderTitle} Menu
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

        {/* 1. Overview & My Bids */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#232730] pb-5">
              <div>
                <h1 className="text-2xl font-display font-semibold text-[#F4F5F7]">
                  {bidderTitle} Workspace
                </h1>
                <p className="text-xs text-[#8E95A5] mt-1">
                  Browse verified cars, place private sealed-envelope bids, and claim instant deposit refunds if you don&apos;t win.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('browse')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md bg-[#C5A46D] hover:bg-[#D4B57E] text-[#0B0C10] text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer self-start sm:self-auto"
              >
                <Search className="w-4 h-4" />
                <span>Browse Available Cars</span>
              </button>
            </div>

            {/* Clean Hairline KPI Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 border-b border-[#232730] pb-6 font-mono tabular-nums">
              <div>
                <div className="text-xs font-sans text-[#8E95A5]">Your Sealed Bids</div>
                <div className="text-2xl font-semibold text-[#F4F5F7] mt-1">{myBids.length}</div>
              </div>
              <div>
                <div className="text-xs font-sans text-[#8E95A5]">Open Car Auctions</div>
                <div className="text-2xl font-semibold text-[#C5A46D] mt-1">{activeAuctions.length}</div>
              </div>
              <div>
                <div className="text-xs font-sans text-[#8E95A5]">Cars Won</div>
                <div className="text-2xl font-semibold text-[#2E9B68] mt-1">{wonAuctions.length}</div>
              </div>
              <div>
                <div className="text-xs font-sans text-[#8E95A5]">Wallet Balance</div>
                <div className="text-2xl font-semibold text-[#F4F5F7] mt-1">{formatEthToInr(wallet.balanceEth)}</div>
                <div className="text-[11px] text-[#8E95A5] mt-0.5">{wallet.balanceEth.toFixed(2)} ETH</div>
              </div>
            </div>

            {/* Your Sealed Bids Ledger */}
            <section className="space-y-4">
              <div>
                <h2 className="text-base font-display font-semibold text-[#F4F5F7]">
                  Your Sealed Bids
                </h2>
                <p className="text-xs text-[#8E95A5] mt-0.5">
                  Your offer stays locked in a private digital envelope until the bidding timer ends.
                </p>
              </div>
              {renderMyBidsTable()}
            </section>
          </div>
        )}

        {/* 2. Browse Cars */}
        {activeTab === 'browse' && (
          <Marketplace auctions={auctions} onSelectAuction={onSelectAuction} />
        )}

        {/* 3. Cars Won & Payment */}
        {activeTab === 'won' && (
          <section className="space-y-4">
            <div className="border-b border-[#232730] pb-4">
              <h2 className="text-xl font-display font-semibold text-[#F4F5F7]">
                Cars Won &amp; Final Payment
              </h2>
              <p className="text-xs text-[#8E95A5] mt-1">
                Your initial security deposit is automatically credited toward your winning price. Pay only the remaining balance to complete your purchase.
              </p>
            </div>

            {wonAuctions.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#8E95A5] border-b border-[#232730]">
                You haven&apos;t won any completed vehicle auctions yet.
              </div>
            ) : (
              <div className="divide-y divide-[#232730] border-b border-[#232730]">
                {wonAuctions.map((auc) => {
                  const dueEth = Math.max(0, (auc.highestBidEth || 0) - auc.fixedDepositEth);
                  return (
                    <div
                      key={auc.id}
                      className="py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="text-base font-semibold text-[#F4F5F7]">{auc.title}</div>
                        <div className="text-xs font-mono text-[#8E95A5] tabular-nums">
                          Winning Price: <strong className="text-[#F4F5F7]">{formatEthToInr(auc.highestBidEth || 0)} ({auc.highestBidEth?.toFixed(2)} ETH)</strong> · Deposit Credited: {formatEthToInr(auc.fixedDepositEth)} · Remaining Due: <strong className="text-[#C5A46D]">{formatEthToInr(dueEth)} ({dueEth.toFixed(2)} ETH)</strong>
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
                            Pay Balance ({formatEthToInr(dueEth)})
                          </button>
                        ) : (
                          <span className="text-xs font-mono text-[#2E9B68]">
                            Paid in Full
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => onSelectAuction(auc)}
                          className="px-3 py-2 rounded-md border border-[#232730] hover:border-[#C5A46D]/50 text-xs text-[#F4F5F7] hover:text-[#C5A46D] cursor-pointer"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* 4. AI Price Comparison */}
        {activeTab === 'insights' && (
          <section className="space-y-4">
            <div className="border-b border-[#232730] pb-4">
              <h2 className="text-xl font-display font-semibold text-[#F4F5F7]">
                AI Fair-Price Comparison
              </h2>
              <p className="text-xs text-[#8E95A5] mt-1">
                Compare each vehicle&apos;s independent AI valuation in Indian Rupees (₹) against the seller&apos;s starting and minimum reserve prices.
              </p>
            </div>

            {auctions.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#8E95A5] border-b border-[#232730]">
                No vehicles have been listed yet.
              </div>
            ) : (
              <div className="overflow-x-auto border-b border-[#232730]">
                <table className="w-full text-xs text-left">
                  <thead className="text-[#8E95A5] border-b border-[#232730]">
                    <tr>
                      <th className="py-3.5 px-4 font-medium">Vehicle</th>
                      <th className="py-3.5 px-4 font-medium text-right">AI Fair Value (₹)</th>
                      <th className="py-3.5 px-4 font-medium text-right">Starting Price</th>
                      <th className="py-3.5 px-4 font-medium text-right">Minimum Reserve</th>
                      <th className="py-3.5 px-4 font-medium text-right">Security Deposit</th>
                      <th className="py-3.5 px-4 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#232730] font-mono tabular-nums">
                    {auctions.map((auc) => (
                      <tr key={auc.id} className="hover:bg-[#12141A] transition-colors">
                        <td className="py-4 px-4 font-sans font-semibold text-[#F4F5F7]">
                          {auc.title}
                        </td>
                        <td className="py-4 px-4 text-right text-[#F4F5F7] font-semibold">
                          {formatInr(auc.aiPrediction.predicted_price ?? auc.aiPrediction.predicted_price_inr)}
                        </td>
                        <td className="py-4 px-4 text-right text-[#F4F5F7]">
                          <div>{formatEthToInr(auc.startingBidEth)}</div>
                          <div className="text-[11px] text-[#8E95A5]">{auc.startingBidEth.toFixed(2)} ETH</div>
                        </td>
                        <td className="py-4 px-4 text-right text-[#F4F5F7]">
                          <div>{formatEthToInr(auc.reservePriceEth)}</div>
                          <div className="text-[11px] text-[#8E95A5]">{auc.reservePriceEth.toFixed(2)} ETH</div>
                        </td>
                        <td className="py-4 px-4 text-right text-[#C5A46D]">
                          <div>{formatEthToInr(auc.fixedDepositEth)}</div>
                          <div className="text-[11px] text-[#8E95A5]">{auc.fixedDepositEth.toFixed(2)} ETH</div>
                        </td>
                        <td className="py-4 px-4 text-right font-sans">
                          <button
                            type="button"
                            onClick={() => onSelectAuction(auc)}
                            className="px-2.5 py-1.5 rounded border border-[#232730] hover:border-[#C5A46D]/50 text-[#F4F5F7] hover:text-[#C5A46D] cursor-pointer"
                          >
                            View Vehicle
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* 5. My Account & Personal Activity */}
        {activeTab === 'account' && (
          <div className="space-y-10">
            <section className="max-w-2xl space-y-4">
              <div className="border-b border-[#232730] pb-4">
                <h2 className="text-xl font-display font-semibold text-[#F4F5F7]">
                  {bidderTitle} Account Details
                </h2>
                <p className="text-xs text-[#8E95A5] mt-1">
                  Your connected buyer wallet and available balance.
                </p>
              </div>

              <dl className="divide-y divide-[#232730] border-b border-[#232730] text-xs">
                <div className="py-3.5 flex justify-between gap-4">
                  <dt className="text-[#8E95A5]">Buyer Profile</dt>
                  <dd className="text-[#F4F5F7] font-semibold">
                    {wallet.roleTitle} ({bidderTitle})
                  </dd>
                </div>
                <div className="py-3.5 flex justify-between gap-4">
                  <dt className="text-[#8E95A5]">Wallet Address</dt>
                  <dd className="text-[#F4F5F7] font-mono break-all">{wallet.address}</dd>
                </div>
                <div className="py-3.5 flex justify-between gap-4">
                  <dt className="text-[#8E95A5]">Available Balance</dt>
                  <dd className="text-[#C5A46D] font-mono tabular-nums">
                    {formatEthToInr(wallet.balanceEth)} ({wallet.balanceEth.toFixed(4)} ETH)
                  </dd>
                </div>
              </dl>
            </section>

            <section className="space-y-4">
              <h3 className="text-base font-display font-semibold text-[#F4F5F7]">
                Your Recent Activity
              </h3>

              {myEvents.length === 0 ? (
                <div className="py-10 text-center text-xs text-[#8E95A5] border-t border-b border-[#232730]">
                  No bidding activity recorded for this account yet.
                </div>
              ) : (
                <div className="overflow-x-auto border-t border-b border-[#232730]">
                  <table className="w-full text-xs text-left">
                    <thead className="text-[#8E95A5] border-b border-[#232730]">
                      <tr>
                        <th className="py-3 px-4 font-medium">Action</th>
                        <th className="py-3 px-4 font-medium">Summary</th>
                        <th className="py-3 px-4 font-medium text-right">Receipt ID</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#232730]">
                      {myEvents.map((evt) => (
                        <tr key={evt.id} className="hover:bg-[#12141A] transition-colors">
                          <td className="py-3.5 px-4 font-mono font-semibold text-[#C5A46D]">
                            {evt.eventName}
                          </td>
                          <td className="py-3.5 px-4 text-[#F4F5F7]">{evt.summary}</td>
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
          </div>
        )}
      </div>
    </div>
  );
};
