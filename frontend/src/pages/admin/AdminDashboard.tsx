import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Gavel,
  Cpu,
  Database,
  Activity,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  FileCode,
  Terminal,
  LogOut,
  RefreshCw,
  Search,
} from 'lucide-react';
import { AuctionItem } from '../../types/auction';
import { useWallet } from '../../context/WalletContext';
import { shortenAddress } from '../../lib/crypto';
import contractAddresses from '../../contracts/contractAddresses.json';

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
  } = useWallet();

  const [activeTab, setActiveTab] = useState<AdminNavTab>('dashboard');

  if (!wallet) return null;

  const totalCommitments = auctions.reduce((sum, a) => sum + (a.commitments?.length || 0), 0);
  const activeAuctions = auctions.filter((a) => a.phase === 'Commit' || a.phase === 'Reveal');
  const completedAuctions = auctions.filter((a) => a.phase === 'Sold' || a.phase === 'No Sale');

  const sidebarItems: { id: AdminNavTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'roles', label: 'User & Role Overview', icon: <Users className="w-4 h-4" /> },
    { id: 'auctions', label: 'Auction Management', icon: <Gavel className="w-4 h-4" /> },
    { id: 'oracle', label: 'Oracle Management', icon: <Cpu className="w-4 h-4" /> },
    { id: 'blockchain', label: 'Blockchain Records', icon: <Database className="w-4 h-4" /> },
    { id: 'model', label: 'AI Model Information', icon: <FileCode className="w-4 h-4" /> },
    { id: 'system', label: 'System Activity', icon: <Activity className="w-4 h-4" /> },
    { id: 'account', label: 'Account Information', icon: <UserCheck className="w-4 h-4" /> },
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-[calc(100vh-8rem)] pb-16 animate-in fade-in">
      {/* Dark Blockchain Role-Specific Sidebar (8 Items) */}
      <aside className="w-full lg:w-64 bg-[#0F172A] rounded-2xl border border-[#1E293B] p-4 flex flex-col justify-between shrink-0 shadow-lg h-fit">
        <div className="space-y-6">
          {/* User Profile Capsule */}
          <div className="p-3.5 rounded-xl bg-[#131E3A] border border-[#1E293B] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                Administrator
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
              <span className="text-slate-400">Governance:</span>
              <span className="font-mono font-bold text-[#06B6D4]">Hardhat Account 0</span>
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
                  className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                      : 'text-slate-300 hover:text-white hover:bg-[#131E3A]'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
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
                <span className="text-xs text-slate-400">Preconfigured Roles</span>
                <div className="text-2xl font-bold text-white">4 Human</div>
                <div className="text-[10px] text-slate-500 font-mono">+ 1 Background Oracle</div>
              </div>
              <div className="bg-[#0F172A] p-4 rounded-2xl border border-[#1E293B] space-y-1">
                <span className="text-xs text-[#3B82F6]">Total Auctions</span>
                <div className="text-2xl font-bold text-[#3B82F6]">{auctions.length}</div>
                <div className="text-[10px] text-slate-500 font-mono">{activeAuctions.length} currently active</div>
              </div>
              <div className="bg-[#0F172A] p-4 rounded-2xl border border-[#1E293B] space-y-1">
                <span className="text-xs text-emerald-400">Oracle Status</span>
                <div className="text-2xl font-bold text-emerald-400">Synced</div>
                <div className="text-[10px] text-slate-500 font-mono">Terminal 4 Active</div>
              </div>
              <div className="bg-[#0F172A] p-4 rounded-2xl border border-[#1E293B] space-y-1">
                <span className="text-xs text-[#06B6D4]">Hardhat Localhost</span>
                <div className="text-2xl font-bold text-[#06B6D4]">Chain 31337</div>
                <div className="text-[10px] text-slate-500 font-mono">RPC: 8545</div>
              </div>
            </div>

            {/* Platform Overview */}
            <div className="bg-[#0F172A] rounded-2xl border border-[#1E293B] p-6 space-y-4">
              <h3 className="text-base font-bold text-white">Smart Contract Deployment Overview</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                <div className="bg-[#131E3A] p-4 rounded-xl border border-[#1E293B] space-y-1">
                  <div className="text-slate-400">SealedAuction.sol Contract</div>
                  <div className="text-white font-bold">{auctionContractAddress}</div>
                  <div className="text-[10px] text-emerald-400">● Deployed & Operational</div>
                </div>
                <div className="bg-[#131E3A] p-4 rounded-xl border border-[#1E293B] space-y-1">
                  <div className="text-slate-400">PriceOracle.sol Contract</div>
                  <div className="text-white font-bold">{oracleContractAddress}</div>
                  <div className="text-[10px] text-emerald-400">● Authorized Signer: {shortenAddress(authorizedOracleAddress)}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. User & Role Overview (Section 8: 4 human roles + 1 oracle background) */}
        {activeTab === 'roles' && (
          <div className="bg-[#0F172A] rounded-2xl border border-[#1E293B] p-6 space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white">Preconfigured User & Role Overview</h2>
              <p className="text-xs text-slate-400">
                Four human-facing accounts and one autonomous background Oracle service
              </p>
            </div>

            <div className="space-y-3">
              {humanWallets.map((acct) => (
                <div
                  key={acct.address}
                  className="bg-[#131E3A] p-4 rounded-xl border border-[#1E293B] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{acct.label}</span>
                      <span
                        className="text-[10px] font-bold uppercase px-2 py-0.5 rounded text-white"
                        style={{ backgroundColor: acct.badgeColor }}
                      >
                        {acct.roleTitle}
                      </span>
                    </div>
                    <div className="font-mono text-slate-400">{acct.address}</div>
                    <p className="text-slate-400 text-[11px]">{acct.description}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-mono font-bold text-[#06B6D4]">{acct.balanceEth.toFixed(1)} ETH</span>
                    <div className="text-[10px] text-slate-500 font-mono">Signer #{acct.accountIndex}</div>
                  </div>
                </div>
              ))}

              {/* Background Oracle Service */}
              <div className="bg-[#090D1A] p-4 rounded-xl border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-emerald-400">Account 4 — Oracle (Background Worker)</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/50 text-emerald-300 border border-emerald-500/30">
                      Service Only
                    </span>
                  </div>
                  <div className="font-mono text-slate-400">0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65</div>
                  <p className="text-slate-400 text-[11px]">Submits AI predictions on-chain. Background service only, not a human-facing account.</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-mono font-bold text-emerald-400">Authorized Signer</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. Auction Management */}
        {activeTab === 'auctions' && (
          <div className="bg-[#0F172A] rounded-2xl border border-[#1E293B] p-6 space-y-4">
            <h2 className="text-lg font-bold text-white">Auction Management & On-Chain Status</h2>
            <p className="text-xs text-slate-400">
              Inspect all auctions across the platform. Administrative integrity ensures bids cannot be altered.
            </p>

            <div className="space-y-3">
              {auctions.map((auc) => (
                <div
                  key={auc.id}
                  onClick={() => onSelectAuction(auc)}
                  className="bg-[#131E3A] p-4 rounded-xl border border-[#1E293B] flex items-center justify-between cursor-pointer hover:border-[#3B82F6]/40 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{auc.title}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#090D1A] text-slate-300">
                        #{auc.numericId}
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-400">
                      Seller: {shortenAddress(auc.sellerAddress)} · Reserve: {auc.reservePriceEth} ETH · Bids: {auc.commitments?.length || 0}
                    </div>
                  </div>
                  <span className="text-xs font-bold uppercase px-2.5 py-1 rounded bg-[#090D1A] text-[#06B6D4] font-mono">
                    {auc.phase}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. Oracle Management */}
        {activeTab === 'oracle' && (
          <div className="bg-[#0F172A] rounded-2xl border border-[#1E293B] p-6 space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white">PriceOracle.sol Contract Management</h2>
              <p className="text-xs text-slate-400">Authorized ECDSA signer configuration and prediction feed logs</p>
            </div>

            <div className="bg-[#131E3A] p-5 rounded-xl border border-[#1E293B] space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-[#1E293B]">
                <span className="text-slate-400">Oracle Contract Address</span>
                <span className="font-mono text-white">{oracleContractAddress}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-[#1E293B]">
                <span className="text-slate-400">Authorized Oracle Signer</span>
                <span className="font-mono text-emerald-400 font-bold">{authorizedOracleAddress}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Oracle Worker Status</span>
                <span className="font-mono text-emerald-400">● Active (Terminal 4 Python Relayer)</span>
              </div>
            </div>
          </div>
        )}

        {/* 5. Blockchain Records */}
        {activeTab === 'blockchain' && (
          <div className="bg-[#0F172A] rounded-2xl border border-[#1E293B] p-6 space-y-4">
            <h2 className="text-lg font-bold text-white">Blockchain Records & Audit Trail</h2>
            <div className="space-y-2 font-mono text-xs">
              {auctions.flatMap((a) => a.events).map((evt) => (
                <div key={evt.id} className="p-3 bg-[#131E3A] rounded-xl border border-[#1E293B] flex items-center justify-between">
                  <div>
                    <span className="text-[#3B82F6] font-bold">[{evt.eventName}]</span> {evt.summary}
                  </div>
                  <span className="text-[10px] text-slate-400">{shortenAddress(evt.txHash)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6. AI Model Information */}
        {activeTab === 'model' && (
          <div className="bg-[#0F172A] rounded-2xl border border-[#1E293B] p-6 space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white">AI Model Information (vehicle-v1)</h2>
              <p className="text-xs text-slate-400">Trained regression pipeline evaluation metrics</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
              <div className="bg-[#131E3A] p-4 rounded-xl border border-[#1E293B]">
                <span className="text-slate-400">Model Name</span>
                <div className="text-sm font-bold text-white mt-1">vehicle-v1</div>
              </div>
              <div className="bg-[#131E3A] p-4 rounded-xl border border-[#1E293B]">
                <span className="text-slate-400">R² Score</span>
                <div className="text-sm font-bold text-emerald-400 mt-1">0.918</div>
              </div>
              <div className="bg-[#131E3A] p-4 rounded-xl border border-[#1E293B]">
                <span className="text-slate-400">Mean Abs Error</span>
                <div className="text-sm font-bold text-[#06B6D4] mt-1">₹28,500</div>
              </div>
              <div className="bg-[#131E3A] p-4 rounded-xl border border-[#1E293B]">
                <span className="text-slate-400">Trained Samples</span>
                <div className="text-sm font-bold text-purple-400 mt-1">18,900</div>
              </div>
            </div>
          </div>
        )}

        {/* 7. System Activity */}
        {activeTab === 'system' && (
          <div className="bg-[#0F172A] rounded-2xl border border-[#1E293B] p-6 space-y-4">
            <h2 className="text-lg font-bold text-white">5-Terminal System Activity</h2>
            <div className="space-y-3 text-xs">
              <div className="p-3.5 bg-[#131E3A] rounded-xl border border-[#1E293B] flex items-center justify-between">
                <div>
                  <div className="font-bold text-white">Terminal 1: Blockchain Node</div>
                  <div className="text-slate-400 font-mono">Hardhat Node on http://127.0.0.1:8545</div>
                </div>
                <span className="text-emerald-400 font-mono">● Running</span>
              </div>
              <div className="p-3.5 bg-[#131E3A] rounded-xl border border-[#1E293B] flex items-center justify-between">
                <div>
                  <div className="font-bold text-white">Terminal 2: Smart Contract Deployer</div>
                  <div className="text-slate-400 font-mono">deployLocal.js configured</div>
                </div>
                <span className="text-emerald-400 font-mono">● Deployed</span>
              </div>
              <div className="p-3.5 bg-[#131E3A] rounded-xl border border-[#1E293B] flex items-center justify-between">
                <div>
                  <div className="font-bold text-white">Terminal 3: AI Inference Engine</div>
                  <div className="text-slate-400 font-mono">FastAPI / vehicle-v1 regression pipeline</div>
                </div>
                <span className="text-emerald-400 font-mono">● Ready (Mock Sim Active)</span>
              </div>
              <div className="p-3.5 bg-[#131E3A] rounded-xl border border-[#1E293B] flex items-center justify-between">
                <div>
                  <div className="font-bold text-white">Terminal 4: Oracle Worker</div>
                  <div className="text-slate-400 font-mono">Python relayer with Account 5 signer</div>
                </div>
                <span className="text-emerald-400 font-mono">● Active</span>
              </div>
              <div className="p-3.5 bg-[#131E3A] rounded-xl border border-[#1E293B] flex items-center justify-between">
                <div>
                  <div className="font-bold text-white">Terminal 5: Web Frontend</div>
                  <div className="text-slate-400 font-mono">Vite + React 19 + Ethers.js v6</div>
                </div>
                <span className="text-emerald-400 font-mono">● Connected</span>
              </div>
            </div>
          </div>
        )}

        {/* 8. Account Information */}
        {activeTab === 'account' && (
          <div className="bg-[#0F172A] rounded-2xl border border-[#1E293B] p-6 space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white">Admin Account Information</h2>
              <p className="text-xs text-slate-400">Hardhat Account 0 credentials</p>
            </div>
            <div className="bg-[#131E3A] p-5 rounded-xl border border-[#1E293B] space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-[#1E293B]">
                <span className="text-slate-400">Role</span>
                <span className="font-bold text-white">Platform Administrator</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-[#1E293B]">
                <span className="text-slate-400">Public Address</span>
                <span className="font-mono text-white">{wallet.address}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-[#1E293B]">
                <span className="text-slate-400">Network</span>
                <span className="font-mono text-emerald-400">Hardhat (31337)</span>
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
