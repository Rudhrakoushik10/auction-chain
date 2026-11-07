import React, { useState } from 'react';
import {
  Car,
  Cpu,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  AlertTriangle,
  Database,
} from 'lucide-react';
import {
  AuctionItem,
  AIPredictionRecord,
  VehicleAttributes,
} from '../types/auction';
import { useWallet } from '../context/WalletContext';
import { formatInr, shortenAddress, generateDeterministicTxHash } from '../lib/crypto';
import { SEALED_AUCTION_CONTRACT_ADDRESS } from '../lib/mockData';
import {
  predictVehiclePrice,
  registerPredictionOnOracle,
} from '../services/api/aiService';
import vehicleSuvImg from '../assets/images/prd_vehicle_luxury_suv_1793900974419.jpg';
import vehicleCoupeImg from '../assets/images/prd_vehicle_hybrid_coupe_1793900977068.jpg';
import vehicleSedanImg from '../assets/images/prd_vehicle_electric_sedan_1793897605273.jpg';

interface CreateAuctionProps {
  onCreateAuction: (newAuction: AuctionItem) => void;
  nextNumericId: number;
}

export const CreateAuction: React.FC<CreateAuctionProps> = ({
  onCreateAuction,
  nextNumericId,
}) => {
  const {
    isConnected,
    wallet,
    isCorrectNetwork,
    openAuthModal,
    switchNetworkToHardhat,
    authorizedOracleAddress,
  } = useWallet();

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [title, setTitle] = useState('2024 Tata Nexon EV Empowered+ Long Range (45 kWh)');
  const [subtitle, setSubtitle] = useState(
    'Single-owner electric SUV with 12,500 km odometer, 7.2 kW AC fast-charger kit, and zero-depreciation insurance.'
  );
  const [selectedImagePreset, setSelectedImagePreset] = useState<'suv' | 'coupe' | 'sedan'>('suv');

  // Structured Vehicle Schema (backend/app/schemas/vehicle.py)
  const [vhBrand, setVhBrand] = useState('Tata');
  const [vhModel, setVhModel] = useState('Nexon EV Empowered+ LR');
  const [vhMfgYear, setVhMfgYear] = useState(2024);
  const [vhMileageKm, setVhMileageKm] = useState(12500);
  const [vhFuelType, setVhFuelType] = useState<'Petrol' | 'Diesel' | 'Electric' | 'Hybrid'>('Electric');
  const [vhTransmission, setVhTransmission] = useState<'Manual' | 'Automatic'>('Automatic');
  const [vhCondition, setVhCondition] = useState<'Like New' | 'Excellent' | 'Good' | 'Fair'>('Excellent');
  const [vhOrigPriceInr, setVhOrigPriceInr] = useState(1949000);

  // Step 2 & 3 State: AI Prediction (Mock Simulation) & Oracle Record
  const [isPredicting, setIsPredicting] = useState(false);
  const [predictionError, setPredictionError] = useState<string | null>(null);
  const [aiRecord, setAiRecord] = useState<AIPredictionRecord | null>(null);
  const [isRegisteringOracle, setIsRegisteringOracle] = useState(false);

  // Step 4 State: Auction Terms in Test ETH (Never auto-filled from INR!)
  const [startingBidEth, setStartingBidEth] = useState<string>('4.50');
  const [reservePriceEth, setReservePriceEth] = useState<string>('5.50');
  const [fixedDepositEth, setFixedDepositEth] = useState<string>('0.80');
  const [commitMinutes, setCommitMinutes] = useState<number>(60);
  const [revealMinutes, setRevealMinutes] = useState<number>(60);
  const [termsError, setTermsError] = useState<string | null>(null);

  const applyVehiclePreset = (preset: 'suv' | 'coupe' | 'sedan') => {
    setSelectedImagePreset(preset);
    setAiRecord(null);
    if (preset === 'suv') {
      setVhBrand('Tata');
      setVhModel('Nexon EV Empowered+ LR');
      setVhMfgYear(2024);
      setVhMileageKm(12500);
      setVhFuelType('Electric');
      setVhTransmission('Automatic');
      setVhCondition('Excellent');
      setVhOrigPriceInr(1949000);
      setTitle('2024 Tata Nexon EV Empowered+ Long Range (45 kWh)');
      setSubtitle('Single-owner electric SUV with 12,500 km odometer and fast-charger kit.');
    } else if (preset === 'coupe') {
      setVhBrand('Toyota');
      setVhModel('Camry 2.5L Hybrid Executive');
      setVhMfgYear(2023);
      setVhMileageKm(19200);
      setVhFuelType('Hybrid');
      setVhTransmission('Automatic');
      setVhCondition('Like New');
      setVhOrigPriceInr(4617000);
      setTitle('2023 Toyota Camry 2.5L Self-Charging Hybrid Sedan (e-CVT)');
      setSubtitle('Chauffeur-driven executive hybrid sedan with 19,200 km and full Toyota warranty.');
    } else {
      setVhBrand('Kia');
      setVhModel('EV6 GT-Line AWD');
      setVhMfgYear(2023);
      setVhMileageKm(16200);
      setVhFuelType('Electric');
      setVhTransmission('Automatic');
      setVhCondition('Excellent');
      setVhOrigPriceInr(6595000);
      setTitle('2023 Kia EV6 GT-Line Dual-Motor AWD (77.4 kWh)');
      setSubtitle('800V ultra-fast charging electric crossover with 16,200 km odometer.');
    }
  };

  const buildCurrentVehicleAttributes = (): VehicleAttributes => ({
    brand: vhBrand,
    model: vhModel,
    manufacturing_year: Number(vhMfgYear),
    mileage_km: Number(vhMileageKm),
    fuel_type: vhFuelType,
    transmission: vhTransmission,
    condition: vhCondition,
    original_price_inr: Number(vhOrigPriceInr),
  });

  // Step 2: Run Mock AI Vehicle Valuation (`src/services/api/aiService.ts` -> `mockAIService.ts`)
  const handleRunAiPrediction = async () => {
    setPredictionError(null);
    setIsPredicting(true);
    try {
      const attrs = buildCurrentVehicleAttributes();
      const record = await predictVehiclePrice(attrs);
      setAiRecord(record);
      setStep(2);
    } catch (err: any) {
      setPredictionError(err.message || 'Vehicle AI prediction failed');
    } finally {
      setIsPredicting(false);
    }
  };

  // Step 3: Register Prediction on PriceOracle.sol
  const handleRegisterOnOracle = async () => {
    if (!aiRecord) return;
    setIsRegisteringOracle(true);
    try {
      const registered = await registerPredictionOnOracle(aiRecord, authorizedOracleAddress);
      setAiRecord(registered);
      setStep(3);
    } catch (err: any) {
      setPredictionError(err.message || 'Oracle registration error');
    } finally {
      setIsRegisteringOracle(false);
    }
  };

  // Validate Step 4 ETH Auction Terms
  const handleValidateTerms = () => {
    setTermsError(null);
    const start = Number(startingBidEth);
    const reserve = Number(reservePriceEth);
    const deposit = Number(fixedDepositEth);

    if (Number.isNaN(start) || start <= 0) {
      setTermsError('Starting bid must be greater than 0 ETH.');
      return;
    }
    if (Number.isNaN(reserve) || reserve < start) {
      setTermsError('Reserve price must be greater than or equal to the starting bid.');
      return;
    }
    if (Number.isNaN(deposit) || deposit <= 0) {
      setTermsError('Fixed participation deposit must be greater than 0 ETH.');
      return;
    }
    setStep(5);
  };

  // Step 5: Sign & Deploy Vehicle Auction on Auction.sol
  const handleSignAndCreateAuction = () => {
    if (!wallet || !aiRecord) return;
    const now = Date.now();
    const commitEnd = new Date(now + commitMinutes * 60 * 1000).toISOString();
    const revealEnd = new Date(now + (commitMinutes + revealMinutes) * 60 * 1000).toISOString();
    const createTxHash = generateDeterministicTxHash(
      `CREATE:${nextNumericId}:${wallet.address}:${aiRecord.product_data_hash}:${now}`
    );

    const imgUrl =
      selectedImagePreset === 'suv'
        ? vehicleSuvImg
        : selectedImagePreset === 'coupe'
        ? vehicleCoupeImg
        : vehicleSedanImg;

    const newAuction: AuctionItem = {
      id: `AUC-${100 + nextNumericId}`,
      numericId: nextNumericId,
      title,
      subtitle,
      category: 'vehicle',
      imageUrl: imgUrl,
      sellerAddress: wallet.address,
      sellerEns: wallet.ens,
      contractAddress: SEALED_AUCTION_CONTRACT_ADDRESS,
      attributes: buildCurrentVehicleAttributes() as unknown as Record<string, string | number>,
      aiPrediction: aiRecord,
      startingBidEth: Number(startingBidEth),
      reservePriceEth: Number(reservePriceEth),
      fixedDepositEth: Number(fixedDepositEth),
      commitEndTime: commitEnd,
      revealEndTime: revealEnd,
      phase: 'Commit',
      commitments: [],
      winnerSettled: false,
      sellerWithdrawn: false,
      events: [
        {
          id: `EVT-${100 + nextNumericId}-1`,
          eventName: 'PredictionRegistered',
          txHash: aiRecord.oracle_tx_hash,
          blockNumber: aiRecord.oracle_block_number,
          timestamp: new Date(now - 15000).toISOString(),
          actorAddress: aiRecord.oracle_address,
          summary: `Oracle registered Vehicle Prediction #${aiRecord.prediction_id} (${formatInr(
            aiRecord.predicted_price_inr
          )} / ${aiRecord.predicted_price_paise.toLocaleString('en-IN')} paise, model vehicle-v1) on PriceOracle.sol`,
        },
        {
          id: `EVT-${100 + nextNumericId}-2`,
          eventName: 'AuctionCreated',
          txHash: createTxHash,
          blockNumber: aiRecord.oracle_block_number + 1,
          timestamp: new Date(now).toISOString(),
          actorAddress: wallet.address,
          summary: `Seller created Vehicle Auction #${nextNumericId} (Start: ${Number(
            startingBidEth
          ).toFixed(2)} ETH, Reserve: ${Number(reservePriceEth).toFixed(
            2
          )} ETH, Fixed Deposit: ${Number(fixedDepositEth).toFixed(2)} ETH)`,
        },
      ],
    };

    onCreateAuction(newAuction);
  };

  if (!isConnected) {
    return (
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-10 text-center max-w-xl mx-auto my-12 space-y-4 shadow-sm">
        <h2 className="text-xl font-extrabold text-[#101B3D]">
          Wallet Connection Required to Create a Vehicle Auction
        </h2>
        <p className="text-xs text-slate-600">
          Connect your Hardhat Seller account on Chain ID 31337 to request a simulated <code>vehicle-v1</code> resale valuation in INR, register it on PriceOracle.sol, and deploy a sealed-bid vehicle auction.
        </p>
        <button
          onClick={openAuthModal}
          className="px-6 py-3 rounded-xl bg-[#2563EB] text-white text-xs font-bold shadow-md cursor-pointer"
        >
          Connect MetaMask / Seller Wallet
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Top 5-Step Progress Indicator */}
      <div className="bg-[#101B3D] text-white rounded-2xl p-6 border border-white/10 shadow-lg space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-[#06B6D4]">
              Vehicle Sealed-Bid Creation Wizard · Mock AI Simulation Active
            </span>
            <h1 className="text-2xl font-extrabold mt-0.5">
              5-Step Vehicle Auction Deployment
            </h1>
          </div>
          <span className="px-3 py-1 rounded-lg bg-white/10 text-xs font-mono text-[#06B6D4]">
            Seller: {shortenAddress(wallet?.address || '')}
          </span>
        </div>

        <div className="grid grid-cols-5 gap-2 text-xs">
          {[
            { num: 1, label: '1. Vehicle Specs' },
            { num: 2, label: '2. AI Estimate (INR)' },
            { num: 3, label: '3. Oracle Proof' },
            { num: 4, label: '4. ETH Terms' },
            { num: 5, label: '5. Sign & Deploy' },
          ].map((s) => {
            const active = step === s.num;
            const done = step > s.num;
            return (
              <div
                key={s.num}
                className={`p-2.5 rounded-xl border text-center font-bold transition-all ${
                  active
                    ? 'bg-[#2563EB] border-[#06B6D4] text-white shadow-md'
                    : done
                    ? 'bg-emerald-600/30 border-emerald-400/40 text-emerald-200'
                    : 'bg-white/5 border-white/10 text-slate-400'
                }`}
              >
                {s.label}
              </div>
            );
          })}
        </div>
      </div>

      {predictionError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{predictionError}</span>
        </div>
      )}

      {/* STEP 1: VEHICLE SPECIFICATIONS */}
      {step === 1 && (
        <div className="bg-[#0F172A] rounded-2xl border border-[#1E293B] p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-lg font-bold text-white">
                Step 1: Enter Vehicle Specifications (`vehicle-v1` Schema)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                All fields are normalized to compute a deterministic <code className="text-[#06B6D4]">product_data_hash</code> for <code className="text-[#06B6D4]">PriceOracle.sol</code>.
              </p>
            </div>
            <span className="px-3 py-1 rounded-lg bg-[#7C3AED]/20 text-[#A78BFA] font-mono text-xs font-bold border border-[#7C3AED]/30">
              Category: vehicle
            </span>
          </div>

          {/* Quick Vehicle Preset Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(
              [
                { id: 'suv', label: 'Preset 1: Electric SUV', sub: '2024 Tata Nexon EV LR' },
                { id: 'coupe', label: 'Preset 2: Hybrid Sedan', sub: '2023 Toyota Camry Hybrid' },
                { id: 'sedan', label: 'Preset 3: Performance EV', sub: '2023 Kia EV6 GT-Line AWD' },
              ] as const
            ).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => applyVehiclePreset(p.id)}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedImagePreset === p.id
                    ? 'bg-[#131E3A] border-[#2563EB] ring-2 ring-[#2563EB]/40'
                    : 'bg-[#131E3A]/60 border-[#1E293B] hover:bg-[#131E3A]'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-xs text-white">
                  <Car className="w-4 h-4 text-[#3B82F6]" />
                  <span>{p.label}</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">{p.sub}</div>
              </button>
            ))}
          </div>

          {/* Listing Title & Description */}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Vehicle Auction Listing Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#1E293B] bg-[#131E3A] text-xs font-medium text-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]/40"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Vehicle Service History & Provenance Notes *
              </label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#1E293B] bg-[#131E3A] text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/40"
              />
            </div>
          </div>

          {/* Vehicle Attributes Form */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 rounded-xl bg-[#131E3A] border border-[#1E293B]">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Make / Brand (`brand`)</label>
              <input
                type="text"
                value={vhBrand}
                onChange={(e) => setVhBrand(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#1E293B] bg-[#090D1A] text-white text-xs focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Vehicle Model (`model`)</label>
              <input
                type="text"
                value={vhModel}
                onChange={(e) => setVhModel(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#1E293B] bg-[#090D1A] text-white text-xs focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Mfg Year (`manufacturing_year`)</label>
              <input
                type="number"
                value={vhMfgYear}
                onChange={(e) => setVhMfgYear(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-[#1E293B] bg-[#090D1A] text-white text-xs font-mono focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Odometer KM (`mileage_km`)</label>
              <input
                type="number"
                value={vhMileageKm}
                onChange={(e) => setVhMileageKm(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-[#1E293B] bg-[#090D1A] text-white text-xs font-mono focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Fuel Type (`fuel_type`)</label>
              <select
                value={vhFuelType}
                onChange={(e) => setVhFuelType(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg border border-[#1E293B] bg-[#090D1A] text-white text-xs focus:outline-none"
              >
                <option value="Electric">Electric</option>
                <option value="Hybrid">Hybrid</option>
                <option value="Diesel">Diesel</option>
                <option value="Petrol">Petrol</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Transmission (`transmission`)</label>
              <select
                value={vhTransmission}
                onChange={(e) => setVhTransmission(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg border border-[#1E293B] bg-[#090D1A] text-white text-xs focus:outline-none"
              >
                <option value="Automatic">Automatic</option>
                <option value="Manual">Manual</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Condition (`condition`)</label>
              <select
                value={vhCondition}
                onChange={(e) => setVhCondition(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg border border-[#1E293B] bg-[#090D1A] text-white text-xs focus:outline-none"
              >
                <option value="Like New">Like New</option>
                <option value="Excellent">Excellent</option>
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Original Ex-Showroom Price in INR (`original_price_inr`)
              </label>
              <input
                type="number"
                value={vhOrigPriceInr}
                onChange={(e) => setVhOrigPriceInr(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-[#2563EB] bg-[#090D1A] text-sm font-mono font-bold text-[#06B6D4] focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handleRunAiPrediction}
              disabled={isPredicting}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#6D28D9] hover:bg-purple-700 text-white text-xs font-bold shadow-md transition-all cursor-pointer"
            >
              <Cpu className="w-4 h-4" />
              <span>
                {isPredicting
                  ? 'Running Mock Vehicle AI Simulation...'
                  : 'Step 2: Request Vehicle AI Valuation (INR)'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: AI ESTIMATE IN INR */}
      {step === 2 && aiRecord && (
        <div className="bg-[#0F172A] rounded-2xl border border-[#1E293B] p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4 border-b border-[#1E293B] pb-5">
            <div>
              <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-[#7C3AED]/20 text-[#A78BFA] border border-[#7C3AED]/30">
                Model: {aiRecord.model_version} · Mock AI Service Simulation
              </span>
              <h2 className="text-xl font-extrabold text-white mt-1">
                Step 2: Advisory Vehicle Resale Valuation in INR
              </h2>
            </div>

            <div className="text-right bg-[#131E3A] text-white px-5 py-3 rounded-2xl border border-[#1E293B]">
              <div className="text-[10px] uppercase tracking-wider text-slate-400">
                Predicted Fair Vehicle Value
              </div>
              <div className="text-2xl font-mono font-extrabold text-[#06B6D4]">
                {formatInr(aiRecord.predicted_price_inr)}
              </div>
              <div className="text-[10px] font-mono text-slate-400">
                {aiRecord.predicted_price_paise.toLocaleString('en-IN')} paise
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {aiRecord.feature_breakdown.map((f, i) => (
              <div
                key={i}
                className="p-3 rounded-xl bg-[#131E3A] border border-[#1E293B] flex items-center justify-between text-xs"
              >
                <span className="font-medium text-slate-200">{f.factor}</span>
                <span className="font-mono font-bold text-[#A78BFA]">{f.impact}</span>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-xl bg-[#131E3A] border border-[#1E293B] space-y-2 text-xs font-mono">
            <div>
              <span className="text-slate-400">Canonical Vehicle JSON: </span>
              <span className="text-slate-200 break-all">{aiRecord.canonical_json}</span>
            </div>
            <div>
              <span className="text-slate-400">product_data_hash (SHA-256): </span>
              <span className="text-[#3B82F6] font-bold break-all">{aiRecord.product_data_hash}</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#1E293B] text-xs font-bold text-slate-300 hover:bg-[#131E3A]"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Edit Vehicle Specs</span>
            </button>

            <button
              type="button"
              onClick={handleRegisterOnOracle}
              disabled={isRegisteringOracle}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#2563EB] hover:bg-blue-600 text-white text-xs font-bold shadow-md cursor-pointer"
            >
              <Database className="w-4 h-4" />
              <span>
                {isRegisteringOracle
                  ? 'Registering on PriceOracle.sol...'
                  : 'Step 3: Register Vehicle Prediction on PriceOracle.sol'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: ORACLE REGISTRATION CONFIRMATION */}
      {step === 3 && aiRecord && (
        <div className="bg-[#0F172A] rounded-2xl border border-[#1E293B] p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex items-center gap-3 text-emerald-300 bg-emerald-950/40 border border-emerald-500/30 p-4 rounded-xl">
            <CheckCircle2 className="w-6 h-6 shrink-0 text-emerald-400" />
            <div>
              <h2 className="text-sm font-bold text-white">
                Step 3 Complete: Vehicle Valuation Anchored on PriceOracle.sol (ID #{aiRecord.prediction_id})
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                The Oracle Signer recorded the integer paise value and canonical vehicle hash on Hardhat Chain ID 31337.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-[#131E3A] border border-[#1E293B] text-xs font-mono">
            <div>
              <span className="text-slate-400 block">Prediction ID:</span>
              <strong className="text-white">#{aiRecord.prediction_id}</strong>
            </div>
            <div>
              <span className="text-slate-400 block">Stored Integer Value (Paise):</span>
              <strong className="text-[#06B6D4] bg-[#090D1A] px-2 py-0.5 rounded border border-[#1E293B]">
                {aiRecord.predicted_price_paise.toLocaleString('en-IN')} paise ({formatInr(aiRecord.predicted_price_inr)})
              </strong>
            </div>
            <div className="md:col-span-2">
              <span className="text-slate-400 block">Oracle Transaction Hash:</span>
              <strong className="text-[#3B82F6] break-all">{aiRecord.oracle_tx_hash}</strong>
            </div>
            <div>
              <span className="text-slate-400 block">Oracle Signer Address:</span>
              <strong className="text-white">{aiRecord.oracle_address}</strong>
            </div>
            <div>
              <span className="text-slate-400 block">Block Number:</span>
              <strong className="text-white">#{aiRecord.oracle_block_number}</strong>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#1E293B] text-xs font-bold text-slate-300"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              type="button"
              onClick={() => setStep(4)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#2563EB] text-white text-xs font-bold shadow-md cursor-pointer"
            >
              <span>Step 4: Configure Auction Terms in Test ETH</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: AUCTION TERMS IN TEST ETH */}
      {step === 4 && aiRecord && (
        <div className="bg-[#0F172A] rounded-2xl border border-[#1E293B] p-6 sm:p-8 shadow-xl space-y-6">
          <div>
            <h2 className="text-lg font-bold text-white">
              Step 4: Configure Vehicle Sealed-Bid Terms in Test ETH
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              The AI valuation ({formatInr(aiRecord.predicted_price_inr)}) is an advisory reference in INR. Define your Starting Bid, Reserve Price, and Fixed Deposit in <strong className="text-white">Test ETH</strong>.
            </p>
          </div>

          {termsError && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-xs font-bold text-rose-300">
              {termsError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Starting Bid (Test ETH) *
              </label>
              <input
                type="number"
                step="0.01"
                value={startingBidEth}
                onChange={(e) => setStartingBidEth(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#1E293B] bg-[#131E3A] font-mono text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]/40"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Reserve Price (Test ETH, &ge; Start) *
              </label>
              <input
                type="number"
                step="0.01"
                value={reservePriceEth}
                onChange={(e) => setReservePriceEth(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#2563EB] bg-[#131E3A] font-mono text-sm font-bold text-[#3B82F6] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/40"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Uniform Fixed Deposit (Test ETH) *
              </label>
              <input
                type="number"
                step="0.01"
                value={fixedDepositEth}
                onChange={(e) => setFixedDepositEth(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#7C3AED] bg-[#131E3A] font-mono text-sm font-bold text-[#A78BFA] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/40"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Commit Window Duration (Minutes)
              </label>
              <input
                type="number"
                value={commitMinutes}
                onChange={(e) => setCommitMinutes(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#1E293B] bg-[#131E3A] text-white font-mono text-xs focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Reveal Window Duration (Minutes)
              </label>
              <input
                type="number"
                value={revealMinutes}
                onChange={(e) => setRevealMinutes(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#1E293B] bg-[#131E3A] text-white font-mono text-xs focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setStep(3)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#1E293B] text-xs font-bold text-slate-300"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              type="button"
              onClick={handleValidateTerms}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#2563EB] text-white text-xs font-bold shadow-md cursor-pointer"
            >
              <span>Step 5: Review & Sign Transaction</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: REVIEW & SIGN METAMASK TRANSACTION */}
      {step === 5 && aiRecord && (
        <div className="bg-[#0F172A] rounded-2xl border border-[#1E293B] p-6 sm:p-8 shadow-xl space-y-6">
          <div>
            <h2 className="text-xl font-extrabold text-white">
              Step 5: Review & Sign Auction.createAuction() Transaction
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Verify both the advisory INR AI Oracle record and your Test ETH smart contract parameters before signing.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 rounded-2xl bg-[#131E3A] border border-[#1E293B] text-xs space-y-2">
            <div>
              <span className="text-slate-400 block">Vehicle Listing Title:</span>
              <strong className="text-white">{title}</strong>
            </div>
            <div>
              <span className="text-slate-400 block">Advisory AI Estimate (PriceOracle #{aiRecord.prediction_id}):</span>
              <strong className="text-[#A78BFA] font-mono">
                {formatInr(aiRecord.predicted_price_inr)} ({aiRecord.model_version})
              </strong>
            </div>
            <div>
              <span className="text-slate-400 block">Starting Bid / Reserve Price:</span>
              <strong className="text-[#3B82F6] font-mono">
                {Number(startingBidEth).toFixed(2)} ETH / {Number(reservePriceEth).toFixed(2)} ETH
              </strong>
            </div>
            <div>
              <span className="text-slate-400 block">Uniform Fixed Participation Deposit:</span>
              <strong className="text-white font-mono">
                {Number(fixedDepositEth).toFixed(2)} ETH
              </strong>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setStep(4)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#1E293B] text-xs font-bold text-slate-300"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Modify ETH Terms</span>
            </button>

            {!isCorrectNetwork ? (
              <button
                type="button"
                onClick={switchNetworkToHardhat}
                className="px-6 py-3 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold"
              >
                Switch to Hardhat Chain ID 31337 to Sign
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSignAndCreateAuction}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#2563EB] hover:bg-blue-600 text-white text-xs font-bold shadow-lg cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Sign & Deploy Vehicle Auction on Auction.sol</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
