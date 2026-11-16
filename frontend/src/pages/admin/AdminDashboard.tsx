import React from 'react';
import {
  ShieldCheck,
  Trash2,
  RotateCcw,
  Eye,
  ExternalLink,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { AuctionItem } from '../../types/auction';
import { useWallet } from '../../context/WalletContext';
import { shortenAddress, formatInr, formatInrFromEth } from '../../lib/crypto';
import {
  HUMAN_ROLE_WALLETS,
  PRICE_ORACLE_CONTRACT_ADDRESS,
  SEALED_AUCTION_CONTRACT_ADDRESS,
} from '../../lib/hardhatConfig';

interface AdminDashboardProps {
  auctions: AuctionItem[];
  onSelectAuction: (auction: AuctionItem) => void;
  onDeleteAuction: (auctionId: string) => void;
  onResetAllData: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  auctions,
  onSelectAuction,
  onDeleteAuction,
  onResetAllData,
}) => {
  const { humanWallets, inspectTransaction } = useWallet();

  const totalBids = auctions.reduce((sum, a) => sum + a.commitments.length, 0);
  const completedSales = auctions.filter((a) => a.phase === 'Sold' && a.winnerSettled).length;
  const totalVolumeEth = auctions
    .filter((a) => a.phase === 'Sold' && a.winnerSettled)
    .reduce((sum, a) => sum + (a.highestBidEth || 0), 0);

  const accountsToShow = humanWallets.length > 0 ? humanWallets : HUMAN_ROLE_WALLETS;

  return (
    <div className="space-y-6">
      {/* Admin Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            Platform Administrator
          </span>
          <h1 className="text-2xl font-bold text-white mt-0.5">
            System Registry & Wallets
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Monitor active auctions, participant wallet balances on Hardhat (Chain ID 31337), and smart contract transactions.
          </p>
        </div>

        <button
          onClick={onResetAllData}
          className="px-4 py-2.5 rounded-xl bg-rose-950/50 hover:bg-rose-900/60 border border-rose-500/40 text-rose-200 text-xs font-semibold flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Clear Auctions
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs text-slate-400">Total Auctions</div>
          <div className="text-2xl font-bold text-white font-mono mt-1">{auctions.length}</div>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs text-slate-400">Total Bids Placed</div>
          <div className="text-2xl font-bold text-indigo-400 font-mono mt-1">{totalBids}</div>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs text-slate-400">Completed Sales</div>
          <div className="text-2xl font-bold text-emerald-400 font-mono mt-1">{completedSales}</div>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs text-slate-400">Settled Volume</div>
          <div className="text-xl font-bold text-white font-mono mt-1">
            {totalVolumeEth.toFixed(2)} ETH
          </div>
          <div className="text-[11px] text-emerald-400 font-mono">
            {formatInrFromEth(totalVolumeEth)}
          </div>
        </div>
      </div>

      {/* Role Accounts & Live Hardhat Balances */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <h2 className="text-base font-bold text-white">
            Role Wallets (Hardhat Chain 31337)
          </h2>
          <div className="text-xs text-slate-400 font-mono">
            Auction.sol: {shortenAddress(SEALED_AUCTION_CONTRACT_ADDRESS)} · PriceOracle.sol:{' '}
            {shortenAddress(PRICE_ORACLE_CONTRACT_ADDRESS)}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {accountsToShow.map((acct) => (
            <div
              key={acct.address}
              className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">{acct.label}</span>
                <span className="text-[11px] font-mono text-slate-400">
                  Account #{acct.accountIndex}
                </span>
              </div>
              <div className="text-xs font-mono text-slate-400">
                {shortenAddress(acct.address)}
              </div>
              <div className="pt-2 border-t border-slate-800/80 flex items-baseline justify-between">
                <span className="text-[11px] text-slate-400">Balance</span>
                <span className="text-sm font-bold text-emerald-400 font-mono">
                  {acct.balanceEth.toFixed(4)} ETH
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* All Auctions Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-slate-800">
          <h2 className="text-base font-bold text-white">All Vehicle Auctions</h2>
        </div>

        {auctions.length === 0 ? (
          <div className="p-10 text-center text-xs text-slate-400">
            No vehicle auctions registered yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 bg-slate-950/60">
                  <th className="py-3.5 px-5">Vehicle</th>
                  <th className="py-3.5 px-4">AI Valuation</th>
                  <th className="py-3.5 px-4">Start / Highest Bid</th>
                  <th className="py-3.5 px-4">Bids</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-xs">
                {auctions.map((auc) => (
                  <tr key={auc.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-5">
                      <div className="font-bold text-white text-sm">{auc.title}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Lot #{auc.numericId} · Seller {shortenAddress(auc.sellerAddress)}
                      </div>
                    </td>
                    <td className="py-4 px-4 font-mono text-indigo-300 font-semibold">
                      {formatInr(
                        auc.aiPrediction.predicted_price_inr ||
                          auc.aiPrediction.predicted_price
                      )}
                    </td>
                    <td className="py-4 px-4 font-mono text-white">
                      {auc.phase !== 'Commit' && auc.highestBidEth ? (
                        <div>
                          <span className="text-emerald-400 font-bold">
                            {auc.highestBidEth.toFixed(4)} ETH
                          </span>
                          <div className="text-[10px] text-slate-400">
                            Start: {auc.startingBidEth.toFixed(2)} ETH
                          </div>
                        </div>
                      ) : (
                        <span>{auc.startingBidEth.toFixed(2)} ETH</span>
                      )}
                    </td>
                    <td className="py-4 px-4 font-mono text-slate-300">
                      {auc.commitments.length}
                    </td>
                    <td className="py-4 px-4">
                      {auc.phase === 'Commit' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-semibold">
                          <Clock className="w-3 h-3" />
                          Bidding Open
                        </span>
                      ) : auc.phase === 'Reveal' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold">
                          Bids Revealed
                        </span>
                      ) : auc.phase === 'Sold' && !auc.winnerSettled ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold">
                          Approved · Payment Due
                        </span>
                      ) : auc.phase === 'Sold' && auc.winnerSettled ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold">
                          <CheckCircle2 className="w-3 h-3" />
                          Paid & Closed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 text-slate-400 font-semibold">
                          Closed
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onSelectAuction(auc)}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Inspect
                        </button>
                        <button
                          onClick={() => onDeleteAuction(auc.id)}
                          className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-500/30 cursor-pointer"
                          title="Delete Auction"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent On-Chain Transactions */}
      {auctions.flatMap((a) => a.events).length > 0 && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-base font-bold text-white mb-4">
            On-Chain Transaction Ledger
          </h2>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {auctions
              .flatMap((a) => a.events)
              .slice()
              .reverse()
              .map((evt) => (
                <div
                  key={evt.id}
                  className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-4 text-xs"
                >
                  <div>
                    <span className="font-semibold text-white">{evt.eventName}</span>
                    <span className="text-slate-400 ml-2">{evt.summary}</span>
                  </div>
                  <button
                    onClick={() => inspectTransaction(evt.txHash)}
                    className="text-indigo-400 hover:text-indigo-300 font-mono inline-flex items-center gap-1 shrink-0"
                  >
                    {evt.txHash.slice(0, 12)}...
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};
