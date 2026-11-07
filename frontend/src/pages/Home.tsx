import React, { useState } from 'react';
import {
  ShieldCheck,
  Cpu,
  Lock,
  ArrowRight,
  Wallet,
  Car,
  PlusCircle,
  Gavel,
  Terminal,
  Gauge,
  Fuel,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { AuctionItem } from '../types/auction';
import { useWallet } from '../context/WalletContext';
import { AuctionCard } from '../components/auction/AuctionCard';
import { PRICE_ORACLE_SOL, SEALED_AUCTION_SOL } from '../lib/solidityCode';
import { shortenAddress } from '../lib/crypto';
import enhancedLogoUrl from '../assets/images/auctionchain_logo.jpg';

interface HomeProps {
  auctions: AuctionItem[];
  onSelectAuction: (auction: AuctionItem) => void;
  onNavigate: (
    tab: 'home' | 'how-it-works' | 'explore' | 'ai-estimator' | 'security' | 'about'
  ) => void;
  focusArchitecture?: boolean;
}

export const Home: React.FC<HomeProps> = ({
  auctions,
  onSelectAuction,
  onNavigate,
  focusArchitecture = false,
}) => {
  const {
    isConnected,
    wallet,
    openAuthModal,
    authorizedOracleAddress,
    updateAuthorizedOracle,
  } = useWallet();

  const [selectedContractTab, setSelectedContractTab] = useState<'oracle' | 'auction'>('auction');
  const [newOracleInput, setNewOracleInput] = useState(authorizedOracleAddress);
  const [oracleRotateMsg, setOracleRotateMsg] = useState<string | null>(null);

  const handleOracleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOracleInput.startsWith('0x') || newOracleInput.length < 10) {
      setOracleRotateMsg('Error: Please enter a valid 0x Ethereum address.');
      return;
    }
    const ok = updateAuthorizedOracle(newOracleInput.trim());
    if (ok) {
      setOracleRotateMsg(
        `Authorized Oracle address updated on PriceOracle.sol to ${shortenAddress(newOracleInput.trim())}`
      );
    } else {
      setOracleRotateMsg('Error: Only Contract Owner / Admin can update the authorized oracle.');
    }
  };

  return (
    <div className="space-y-16 pb-16 animate-in fade-in">
      {/* Hero Section */}
      <section className="relative rounded-3xl bg-gradient-to-b from-[#0F172A] to-[#090D1A] text-white overflow-hidden border border-[#1E293B] shadow-2xl">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[#2563EB]/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-[#7C3AED]/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 px-6 py-12 sm:px-12 sm:py-16 lg:py-20 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-[#131E3A] border border-[#06B6D4]/40 text-xs font-mono text-[#06B6D4]">
              <span className="w-2 h-2 rounded-full bg-[#06B6D4] animate-ping" />
              <span>AI-Powered Vehicle Sealed-Bid Auction Platform · Hardhat #31337</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight text-white">
              AI Vehicle Valuation Meets{' '}
              <span className="text-[#06B6D4]">Cryptographic Sealed Bidding.</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl">
              <strong className="text-white">AuctionChain</strong> eliminates price manipulation, bid sniping, and copycat bidding in automotive resale auctions. Our{' '}
              <code className="text-[#06B6D4] bg-[#131E3A] px-1.5 py-0.5 rounded">vehicle-v1</code> ML pipeline estimates fair vehicle market value in{' '}
              <strong className="text-white">INR (₹)</strong>, an on-chain <code className="text-purple-300 bg-[#131E3A] px-1.5 py-0.5 rounded">PriceOracle.sol</code> anchors the prediction hash, and{' '}
              <code className="text-blue-300 bg-[#131E3A] px-1.5 py-0.5 rounded">SealedAuction.sol</code> enforces two-phase commit-reveal bidding in <strong className="text-white">Test ETH</strong>.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                type="button"
                onClick={openAuthModal}
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl text-sm font-bold text-white bg-[#2563EB] hover:bg-blue-600 transition-all shadow-lg shadow-[#2563EB]/40 cursor-pointer"
              >
                <Wallet className="w-4 h-4" />
                <span>Connect Wallet</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => onNavigate('explore')}
                className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl text-sm font-semibold text-slate-200 bg-[#131E3A] hover:bg-[#1E293B] border border-[#1E293B] transition-all cursor-pointer"
              >
                <Gavel className="w-4 h-4 text-[#06B6D4]" />
                <span>Explore Live Auctions (Guest)</span>
              </button>
            </div>

            {/* Protocol Highlights Strip */}
            <div className="pt-4 grid grid-cols-3 gap-4 border-t border-[#1E293B] text-xs">
              <div>
                <div className="font-mono font-bold text-lg text-[#06B6D4]">vehicle-v1 ML</div>
                <div className="text-slate-400">R² = 0.918 · MAE ±₹28,500</div>
              </div>
              <div>
                <div className="font-mono font-bold text-lg text-white">INR + Test ETH</div>
                <div className="text-slate-400">Advisory ₹ ML · On-Chain ETH Settlement</div>
              </div>
              <div>
                <div className="font-mono font-bold text-lg text-[#06B6D4]">5-Terminal Stack</div>
                <div className="text-slate-400">Hardhat · Deploy · AI · Oracle · DApp</div>
              </div>
            </div>
          </div>

          {/* Right Column: Prominent AuctionChain Brand Emblem */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl bg-[#0F172A] text-white p-6 shadow-2xl border border-[#2563EB]/50 space-y-5">
              <div className="flex items-center gap-4 border-b border-[#1E293B] pb-4">
                <div className="relative h-20 w-20 rounded-2xl bg-[#090D1A] p-1.5 shadow-[0_0_30px_rgba(6,182,212,0.5)] ring-2 ring-[#06B6D4] border border-[#2563EB]/50 flex items-center justify-center shrink-0 overflow-hidden group">
                  <img
                    src={enhancedLogoUrl}
                    alt="AuctionChain Official Emblem"
                    className="h-full w-full object-contain transition-transform duration-300 hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        '/public/assets/aistudio/240_F_1121784514_Q6OwYEhb7qcBUqrLWLBNtkmP8TiX12Jx_3c2efe6e.jpg';
                    }}
                  />
                </div>
                <div>
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-[#7C3AED]/20 text-[#A78BFA] border border-[#7C3AED]/30">
                    Vehicle Auction Protocol
                  </span>
                  <h2 className="text-xl font-extrabold text-white mt-1">
                    AuctionChain Engine
                  </h2>
                  <p className="text-xs font-mono text-[#06B6D4] font-semibold">
                    Predict (INR) · Bid (ETH) · Verify (On-Chain)
                  </p>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-[#131E3A] border border-[#1E293B] flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-[#7C3AED]/20 text-[#A78BFA] border border-[#7C3AED]/30 shrink-0">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-white">
                      1. Vehicle AI Resale Prediction (INR)
                    </div>
                    <p className="text-slate-400 mt-0.5">
                      <code className="text-[#06B6D4]">vehicle-v1</code> evaluates odometer km, manufacturing year, fuel type, transmission, and condition.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#131E3A] border border-[#1E293B] flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-[#2563EB]/20 text-[#3B82F6] border border-[#2563EB]/30 shrink-0">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-white">
                      2. On-Chain Oracle & Sealed Commit Phase
                    </div>
                    <p className="text-slate-400 mt-0.5">
                      Oracle anchors prediction hash on <code className="text-[#06B6D4]">PriceOracle.sol</code>. Bidders submit <code className="text-purple-300">keccak256(bid, salt)</code> with uniform collateral deposit.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#131E3A] border border-[#1E293B] flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-white">
                      3. Reveal Verification & Pull-Based Settlement
                    </div>
                    <p className="text-slate-400 mt-0.5">
                      <code className="text-blue-300">SealedAuction.sol</code> confirms revealed hash, enforces reserve, and enables pull-based seller proceeds withdrawal and losing deposit refunds.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Vehicle Valuation Schema & Topology Overview */}
      <section className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#7C3AED]">
              Domain Specialization: Vehicles (`vehicle-v1`)
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
              Vehicle Feature Schema & 5-Terminal Architecture
            </h2>
          </div>
          <p className="text-xs text-slate-400 max-w-md">
            Built for local execution on Hardhat network with MetaMask Ethers.js v6 integration.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#0F172A] rounded-2xl border border-[#1E293B] p-6 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-xl bg-[#2563EB]/10 text-[#3B82F6]">
                <Car className="w-6 h-6" />
              </div>
              <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-[#131E3A] text-[#06B6D4] border border-[#1E293B]">
                vehicle-v1 Schema
              </span>
            </div>
            <h3 className="text-lg font-bold text-white">Structured Vehicle Attributes</h3>
            <p className="text-xs text-slate-400">
              Normalized into canonical JSON before hashing with SHA-256 to produce deterministic <code>product_data_hash</code>.
            </p>
            <div className="p-3 rounded-xl bg-[#131E3A] border border-[#1E293B] font-mono text-[11px] text-slate-300 space-y-1">
              <div>• brand, model</div>
              <div>• manufacturing_year, mileage_km</div>
              <div>• fuel_type, transmission</div>
              <div>• condition, original_price_inr</div>
            </div>
          </div>

          <div className="bg-[#0F172A] rounded-2xl border border-[#1E293B] p-6 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-xl bg-[#7C3AED]/10 text-[#A78BFA]">
                <Gauge className="w-6 h-6" />
              </div>
              <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-emerald-950/40 text-emerald-300 border border-emerald-500/30">
                Evaluation Metrics
              </span>
            </div>
            <h3 className="text-lg font-bold text-white">Model Evaluation Metrics</h3>
            <p className="text-xs text-slate-400">
              Trained on 18,900 vehicle resale records using an ExtraTreesRegressor pipeline.
            </p>
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#1E293B] text-center">
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">R² Score</div>
                <div className="text-sm font-mono font-bold text-emerald-400">0.918</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">MAE</div>
                <div className="text-sm font-mono font-bold text-white">±₹28,500</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">RMSE</div>
                <div className="text-sm font-mono font-bold text-[#A78BFA]">±₹37,400</div>
              </div>
            </div>
          </div>

          <div className="bg-[#0F172A] rounded-2xl border border-[#1E293B] p-6 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-xl bg-[#06B6D4]/10 text-[#06B6D4]">
                <Terminal className="w-6 h-6" />
              </div>
              <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-[#131E3A] text-[#06B6D4] border border-[#1E293B]">
                4 Active Servers
              </span>
            </div>
            <h3 className="text-lg font-bold text-white">4-Server Auto-Deploy Architecture</h3>
            <div className="p-3 rounded-xl bg-[#131E3A] border border-[#1E293B] font-mono text-[11px] text-slate-300 space-y-1">
              <div>S1: blockchain/ (Hardhat + Auto-Deploy)</div>
              <div>S2: backend/ (FastAPI + Vehicle AI Engine)</div>
              <div>S3: oracle/ (PriceOracle Relayer Daemon)</div>
              <div>S4: frontend/ (React 19 + Vite Web3 DApp)</div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Vehicle Auctions Preview */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#3B82F6]">
              Read-Only Guest Access Enabled
            </span>
            <h2 className="text-2xl font-extrabold text-white mt-1">
              Active & Verified Vehicle Auctions
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('explore')}
            className="text-xs font-bold text-[#3B82F6] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>View All Auctions</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {auctions.slice(0, 3).map((auction) => (
            <AuctionCard key={auction.id} auction={auction} onSelect={onSelectAuction} />
          ))}
        </div>
      </section>

      {/* Smart Contract Code & Cryptographic Spec Inspector */}
      <section className="rounded-3xl bg-[#0F172A] text-white p-6 sm:p-10 border border-[#1E293B] space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-[#06B6D4]">
              Solidity ^0.8.24 · Hardhat Local Network (Chain ID 31337)
            </span>
            <h2 className="text-2xl font-bold mt-1 text-white">
              On-Chain Smart Contracts: SealedAuction.sol & PriceOracle.sol
            </h2>
          </div>
          <div className="flex items-center gap-2 bg-[#131E3A] p-1 rounded-xl border border-[#1E293B]">
            <button
              type="button"
              onClick={() => setSelectedContractTab('auction')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                selectedContractTab === 'auction'
                  ? 'bg-[#2563EB] text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              SealedAuction.sol
            </button>
            <button
              type="button"
              onClick={() => setSelectedContractTab('oracle')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                selectedContractTab === 'oracle'
                  ? 'bg-[#7C3AED] text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              PriceOracle.sol
            </button>
          </div>
        </div>

        <div className="rounded-2xl bg-[#090D1A] p-4 sm:p-6 border border-[#1E293B] overflow-x-auto">
          <pre className="font-mono text-xs text-slate-300 leading-relaxed">
            {selectedContractTab === 'auction' ? SEALED_AUCTION_SOL : PRICE_ORACLE_SOL}
          </pre>
        </div>
      </section>
    </div>
  );
};
