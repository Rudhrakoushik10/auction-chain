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
  } = useWallet();

  const [activeTab, setActiveTab] = useState<AdminNavTab>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  if (!wallet) return null;

  const activeAuctions = auctions.filter((a) => a.phase === 'Commit' || a.phase === 'Reveal');
  const allEvents = auctions.flatMap((a) => a.events);

  const sidebarItems: { id: AdminNavTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Platform Overview', icon: <LayoutDashboard className="w-4 h-4 shrink-0" /> },
    { id: 'oracle', label: 'Oracle Configuration', icon: <Cpu className="w-4 h-4 shrink-0" /> },
    { id: 'auctions', label: 'Auction Registry', icon: <Gavel className="w-4 h-4 shrink-0" /> },
    { id: 'roles', label: 'Role Accounts', icon: <Users className="w-4 h-4 shrink-0" /> },
    { id: 'blockchain', label: 'Event Audit Log', icon: <Database className="w-4 h-4 shrink-0" /> },
    { id: 'model', label: 'ML Model Spec', icon: <FileCode className="w-4 h-4 shrink-0" /> },
    { id: 'system', label: 'Service Topology', icon: <Activity className="w-4 h-4 shrink-0" /> },
    { id: 'account', label: 'Admin Account', icon: <UserCheck className="w-4 h-4 shrink-0" /> },
  ];

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
              <span className="text-xs font-mono text-slate-400">Admin Console</span>
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
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  title={item.label}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#2563EB] text-white'
                      : 'text-slate-400 hover:text-white hover:bg-[#131E3A]'
                  }`}
                >
                  {item.icon}
                  {!isSidebarCollapsed && <span className="whitespace-nowrap">{item.label}</span>}
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
        {/* 1. Platform Overview */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1E293B] pb-5">
              <div>
                <h1 className="text-xl font-bold text-white">Platform Governance & Monitoring</h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Contract deployment state, authorized Oracle signer verification, and auction registry on Hardhat #31337.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('oracle')}
                className="px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-blue-600 text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer self-start sm:self-auto"
              >
                Inspect PriceOracle.sol
              </button>
            </div>

            {/* 4 Key Operational KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#1E293B] bg-[#0F172A] rounded-xl border border-[#1E293B] font-mono tabular-nums">
              <div className="p-4">
                <div className="text-xs font-sans text-slate-400">Deployed Lots</div>
                <div className="text-2xl font-bold text-white mt-1">{auctions.length}</div>
              </div>
              <div className="p-4">
                <div className="text-xs font-sans text-slate-400">Active Windows</div>
                <div className="text-2xl font-bold text-[#3B82F6] mt-1">{activeAuctions.length}</div>
              </div>
              <div className="p-4">
                <div className="text-xs font-sans text-slate-400">Emitted Events</div>
                <div className="text-2xl font-bold text-white mt-1">{allEvents.length}</div>
              </div>
              <div className="p-4">
                <div className="text-xs font-sans text-slate-400">Chain ID</div>
                <div className="text-2xl font-bold text-emerald-400 mt-1">{chainId}</div>
              </div>
            </div>

            {/* Deployed Contracts Table */}
            <section className="bg-[#0F172A] rounded-xl border border-[#1E293B] overflow-hidden">
              <div className="px-6 py-4 border-b border-[#1E293B]">
                <h2 className="text-sm font-semibold text-white">Deployed Smart Contracts</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#090D1A]/60 text-slate-400 border-b border-[#1E293B]">
                    <tr>
                      <th className="py-3 px-4 font-medium">Contract</th>
                      <th className="py-3 px-4 font-medium">Address</th>
                      <th className="py-3 px-4 font-medium">Configuration / Owner</th>
                      <th className="py-3 px-4 font-medium text-right">State</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1E293B] font-mono">
                    <tr>
                      <td className="py-3.5 px-4 font-semibold text-white">SealedAuction.sol</td>
                      <td className="py-3.5 px-4 text-slate-300">{auctionContractAddress}</td>
                      <td className="py-3.5 px-4 font-sans text-slate-400">
                        Commit-reveal escrow linked to PriceOracle.sol
                      </td>
                      <td className="py-3.5 px-4 text-right font-sans text-emerald-400 font-medium">
                        Operational
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3.5 px-4 font-semibold text-white">PriceOracle.sol</td>
                      <td className="py-3.5 px-4 text-slate-300">{oracleContractAddress}</td>
                      <td className="py-3.5 px-4 text-slate-400">
                        Signer: {shortenAddress(authorizedOracleAddress)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-sans text-emerald-400 font-medium">
                        Synced
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {/* 2. Oracle Configuration (Read-Only Authorized Signer Verification) */}
        {activeTab === 'oracle' && (
          <section className="bg-[#0F172A] rounded-xl border border-[#1E293B] p-6 space-y-6">
            <div className="border-b border-[#1E293B] pb-4">
              <h2 className="text-base font-semibold text-white">
                PriceOracle.sol Signer Configuration
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Read-only verification of the authorized ECDSA Oracle signer address permitted to call <code className="text-slate-200">registerPrediction()</code>.
              </p>
            </div>

            <dl className="divide-y divide-[#1E293B] text-xs">
              <div className="py-3 flex justify-between gap-4">
                <dt className="text-slate-400">PriceOracle.sol Contract Address</dt>
                <dd className="font-mono text-white">{oracleContractAddress}</dd>
              </div>
              <div className="py-3 flex justify-between gap-4">
                <dt className="text-slate-400">Authorized Oracle Signer (Locked)</dt>
                <dd className="font-mono text-emerald-400 font-semibold">{authorizedOracleAddress}</dd>
              </div>
              <div className="py-3 flex justify-between gap-4">
                <dt className="text-slate-400">Hardhat Account 4 (Oracle Worker Service)</dt>
                <dd className="font-mono text-slate-300">0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65</dd>
              </div>
            </dl>

            <div className="p-4 rounded-lg border border-emerald-500/20 bg-emerald-950/20 text-xs text-emerald-200 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                The Oracle signer address is locked to <strong>Account #4 (0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65)</strong> at contract deployment time to guarantee uninterrupted ML valuation registration from Terminal 3.
              </span>
            </div>
          </section>
        )}

        {/* 3. Auction Registry Table */}
        {activeTab === 'auctions' && (
          <section className="bg-[#0F172A] rounded-xl border border-[#1E293B] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#1E293B]">
              <h2 className="text-base font-semibold text-white">Platform Auction Registry</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Read-only administrative inspection of all vehicle auctions on SealedAuction.sol
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#090D1A]/60 text-slate-400 border-b border-[#1E293B]">
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
                <tbody className="divide-y divide-[#1E293B] font-mono tabular-nums">
                  {auctions.map((auc) => (
                    <tr key={auc.id} className="hover:bg-[#131E3A]/50 transition-colors">
                      <td className="py-3.5 px-4 font-sans font-semibold text-white">
                        #{auc.numericId} · {auc.title}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">
                        {shortenAddress(auc.sellerAddress)}
                      </td>
                      <td className="py-3.5 px-4 font-sans font-medium text-slate-200">
                        {auc.phase}
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-200">
                        {formatInr(auc.aiPrediction.predicted_price ?? auc.aiPrediction.predicted_price_inr)}
                      </td>
                      <td className="py-3.5 px-4 text-right text-white">
                        <div>{auc.reservePriceEth.toFixed(2)} ETH</div>
                        <div className="text-[11px] text-emerald-400">{formatEthToInr(auc.reservePriceEth)}</div>
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-300">
                        {auc.commitments.length}
                      </td>
                      <td className="py-3.5 px-4 text-right font-sans">
                        <button
                          type="button"
                          onClick={() => onSelectAuction(auc)}
                          className="px-2.5 py-1 rounded border border-[#1E293B] hover:border-slate-600 text-slate-200 hover:text-white cursor-pointer"
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
          <section className="bg-[#0F172A] rounded-xl border border-[#1E293B] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#1E293B]">
              <h2 className="text-base font-semibold text-white">Hardhat Role Directory</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                4 human-facing accounts and 1 autonomous background Oracle service
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#090D1A]/60 text-slate-400 border-b border-[#1E293B]">
                  <tr>
                    <th className="py-3 px-4 font-medium">Signer</th>
                    <th className="py-3 px-4 font-medium">Role</th>
                    <th className="py-3 px-4 font-medium">Address</th>
                    <th className="py-3 px-4 font-medium text-right">Balance</th>
                    <th className="py-3 px-4 font-medium">Access Scope</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E293B]">
                  {humanWallets.map((acct) => (
                    <tr key={acct.address}>
                      <td className="py-3.5 px-4 font-semibold text-white">{acct.label}</td>
                      <td className="py-3.5 px-4 text-slate-300">{acct.roleTitle}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-400">{acct.address}</td>
                      <td className="py-3.5 px-4 font-mono text-white text-right tabular-nums">
                        {acct.balanceEth.toFixed(1)} ETH
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">{acct.description}</td>
                    </tr>
                  ))}
                  <tr>
                    <td className="py-3.5 px-4 font-semibold text-slate-300">
                      Account 4 — Oracle
                    </td>
                    <td className="py-3.5 px-4 text-emerald-400">Background Daemon</td>
                    <td className="py-3.5 px-4 font-mono text-slate-400">
                      0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400 text-right tabular-nums">
                      10000.0 ETH
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      Relays verified AI predictions to PriceOracle.sol
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* 5. Blockchain Event Audit Log */}
        {activeTab === 'blockchain' && (
          <section className="bg-[#0F172A] rounded-xl border border-[#1E293B] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#1E293B]">
              <h2 className="text-base font-semibold text-white">Global On-Chain Event Log</h2>
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
                  {allEvents.map((evt) => (
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

        {/* 6. ML Model Specification */}
        {activeTab === 'model' && (
          <section className="bg-[#0F172A] rounded-xl border border-[#1E293B] p-6 space-y-6">
            <div className="border-b border-[#1E293B] pb-4">
              <h2 className="text-base font-semibold text-white">
                AI Valuation Model Specification (LightGBM v1.0.0)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Offline evaluation metrics from backend/models/model_metadata.json
              </p>
            </div>

            <dl className="divide-y divide-[#1E293B] text-xs font-mono tabular-nums">
              <div className="py-3 flex justify-between">
                <dt className="font-sans text-slate-400">Model Version</dt>
                <dd className="text-white font-semibold">1.0.0 (vehicle_price_model.txt)</dd>
              </div>
              <div className="py-3 flex justify-between">
                <dt className="font-sans text-slate-400">Estimator Pipeline</dt>
                <dd className="text-slate-200">LightGBM (regression_l1 · 31 leaves · 934 trees)</dd>
              </div>
              <div className="py-3 flex justify-between">
                <dt className="font-sans text-slate-400">R² Coefficient of Determination</dt>
                <dd className="text-emerald-400 font-semibold">0.7615 (0.8571 trimmed)</dd>
              </div>
              <div className="py-3 flex justify-between">
                <dt className="font-sans text-slate-400">Mean Absolute Error (MAE)</dt>
                <dd className="text-white">{formatInr(9484.57)} INR</dd>
              </div>
              <div className="py-3 flex justify-between">
                <dt className="font-sans text-slate-400">Root Mean Squared Error (RMSE)</dt>
                <dd className="text-white">{formatInr(27311.06)} INR</dd>
              </div>
              <div className="py-3 flex justify-between">
                <dt className="font-sans text-slate-400">Training Dataset Volume</dt>
                <dd className="text-white">4,009 US-market used-car listings</dd>
              </div>
            </dl>
          </section>
        )}

        {/* 7. Service Topology */}
        {activeTab === 'system' && (
          <section className="bg-[#0F172A] rounded-xl border border-[#1E293B] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#1E293B]">
              <h2 className="text-base font-semibold text-white">System Service Topology</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#090D1A]/60 text-slate-400 border-b border-[#1E293B]">
                  <tr>
                    <th className="py-3 px-4 font-medium">Service</th>
                    <th className="py-3 px-4 font-medium">Directory / Endpoint</th>
                    <th className="py-3 px-4 font-medium">Role</th>
                    <th className="py-3 px-4 font-medium text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E293B]">
                  <tr>
                    <td className="py-3.5 px-4 font-semibold text-white">1. Hardhat EVM Node</td>
                    <td className="py-3.5 px-4 font-mono text-slate-400">http://127.0.0.1:8545</td>
                    <td className="py-3.5 px-4 text-slate-300">Local blockchain (Chain ID 31337)</td>
                    <td className="py-3.5 px-4 text-right text-emerald-400 font-medium">Active</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 font-semibold text-white">2. Contract Deployer</td>
                    <td className="py-3.5 px-4 font-mono text-slate-400">blockchain/scripts/deployLocal.js</td>
                    <td className="py-3.5 px-4 text-slate-300">Deploys PriceOracle.sol & Auction.sol</td>
                    <td className="py-3.5 px-4 text-right text-emerald-400 font-medium">Deployed</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 font-semibold text-white">3. AI Inference Service</td>
                    <td className="py-3.5 px-4 font-mono text-slate-400">backend/src/api/main.py</td>
                    <td className="py-3.5 px-4 text-slate-300">FastAPI LightGBM v1.0.0 valuation API</td>
                    <td className="py-3.5 px-4 text-right text-emerald-400 font-medium">Ready</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 font-semibold text-white">4. Oracle Relayer</td>
                    <td className="py-3.5 px-4 font-mono text-slate-400">oracle/oracle/main.py</td>
                    <td className="py-3.5 px-4 text-slate-300">Signs predictions with Account 4</td>
                    <td className="py-3.5 px-4 text-right text-emerald-400 font-medium">Active</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 font-semibold text-white">5. Web3 Frontend</td>
                    <td className="py-3.5 px-4 font-mono text-slate-400">frontend/src</td>
                    <td className="py-3.5 px-4 text-slate-300">React 19 + Ethers.js v6 interface</td>
                    <td className="py-3.5 px-4 text-right text-emerald-400 font-medium">Connected</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* 8. Admin Account */}
        {activeTab === 'account' && (
          <section className="bg-[#0F172A] rounded-xl border border-[#1E293B] p-6 space-y-6">
            <div className="border-b border-[#1E293B] pb-4">
              <h2 className="text-base font-semibold text-white">Administrator Profile</h2>
            </div>

            <dl className="divide-y divide-[#1E293B] text-xs">
              <div className="py-3 flex justify-between">
                <dt className="text-slate-400">Assigned Role</dt>
                <dd className="text-white font-semibold">Platform Administrator (Account 0)</dd>
              </div>
              <div className="py-3 flex justify-between">
                <dt className="text-slate-400">Public Address</dt>
                <dd className="text-white font-mono">{wallet.address}</dd>
              </div>
              <div className="py-3 flex justify-between">
                <dt className="text-slate-400">Chain ID</dt>
                <dd className="text-white font-mono">{chainId}</dd>
              </div>
            </dl>
          </section>
        )}
      </div>
    </div>
  );
};
