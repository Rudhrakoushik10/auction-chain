import React, { useState } from 'react';
import {
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import {
  AuctionItem,
  AIPredictionRecord,
  VehicleAttributes,
} from '../types/auction';
import { useWallet } from '../context/WalletContext';
import {
  formatInr,
  toInrPaise,
  formatEthToInr,
  ETH_TO_INR_RATE,
  shortenAddress,
  generateDeterministicTxHash,
} from '../lib/crypto';
import {
  SEALED_AUCTION_CONTRACT_ADDRESS,
} from '../lib/hardhatConfig';
import {
  predictVehiclePrice,
} from '../services/api/aiService';
import { executeMetaMaskTransaction } from '../services/blockchain/walletService';
import vehicleSuvImg from '../assets/images/vehicle-suv.jpg';
import vehicleCoupeImg from '../assets/images/vehicle-coupe.jpg';
import vehicleSedanImg from '../assets/images/vehicle-sedan.jpg';

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
    reportNonceMismatch,
    inspectTransaction,
  } = useWallet();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [title, setTitle] = useState('2020 Ford F-150 XLT SuperCrew 4WD (3.5L V6 400hp Twin Turbo)');
  const [subtitle, setSubtitle] = useState(
    'Single-owner 3.5L EcoBoost V6 pickup with 45,000 miles, 10-speed automatic transmission, Jet Black exterior, and clean history.'
  );
  const [selectedImagePreset, setSelectedImagePreset] = useState<'suv' | 'coupe' | 'sedan'>('suv');

  // Structured Vehicle Schema (matching Gemini AI Indian Car Valuation)
  const [vhBrand, setVhBrand] = useState('Hyundai');
  const [vhModel, setVhModel] = useState('Creta SX');
  const [vhYear, setVhYear] = useState(2021);
  const [vhMileage, setVhMileage] = useState(32000);
  const [vhFuelType, setVhFuelType] = useState('Diesel');
  const [vhEngineType, setVhEngineType] = useState('1.5L CRDi Diesel');
  const [vhTransmission, setVhTransmission] = useState('Manual');
  const [vhExteriorColor, setVhExteriorColor] = useState('Polar White');
  const [vhInteriorColor, setVhInteriorColor] = useState('Dual Tone');
  const [vhAccidentHistory, setVhAccidentHistory] = useState<boolean | null>(false);

  // Step 2 State: AI Resale Valuation (Gemini AI in INR)
  const [isPredicting, setIsPredicting] = useState(false);
  const [predictionError, setPredictionError] = useState<string | null>(null);
  const [aiRecord, setAiRecord] = useState<AIPredictionRecord | null>(null);
  const [deployTxStage, setDeployTxStage] = useState<
    'idle' | 'waiting_approval' | 'submitted' | 'pending' | 'confirmed'
  >('idle');

  // Step 3 State: Auction Terms in Test ETH (with real-time INR display)
  const [startingBidEth, setStartingBidEth] = useState<string>('1.50');
  const [reservePriceEth, setReservePriceEth] = useState<string>('1.80');
  const [fixedDepositEth, setFixedDepositEth] = useState<string>('0.25');
  const [commitMinutes, setCommitMinutes] = useState<number>(60);
  const [revealMinutes, setRevealMinutes] = useState<number>(60);
  const [termsError, setTermsError] = useState<string | null>(null);

  const applyVehiclePreset = (preset: 'suv' | 'coupe' | 'sedan') => {
    setSelectedImagePreset(preset);
    setAiRecord(null);
    if (preset === 'suv') {
      setVhBrand('Hyundai');
      setVhModel('Creta SX');
      setVhYear(2021);
      setVhMileage(32000);
      setVhFuelType('Diesel');
      setVhEngineType('1.5L CRDi Diesel');
      setVhTransmission('Manual');
      setVhExteriorColor('Polar White');
      setVhInteriorColor('Dual Tone');
      setVhAccidentHistory(false);
      setTitle('2021 Hyundai Creta SX 1.5L CRDi Diesel');
      setSubtitle('Single-owner well maintained diesel compact SUV with 32,000 km, touch infotainment, and full service records.');
    } else if (preset === 'coupe') {
      setVhBrand('Honda');
      setVhModel('City ZX');
      setVhYear(2020);
      setVhMileage(38500);
      setVhFuelType('Gasoline');
      setVhEngineType('1.5L i-VTEC Petrol');
      setVhTransmission('Automatic');
      setVhExteriorColor('Golden Brown');
      setVhInteriorColor('Beige');
      setVhAccidentHistory(false);
      setTitle('2020 Honda City ZX 1.5L i-VTEC Automatic');
      setSubtitle('Executive sedan with sunroof, leather upholstery, pristine mechanicals, and clean accident-free history.');
    } else {
      setVhBrand('Maruti Suzuki');
      setVhModel('Swift ZXi');
      setVhYear(2022);
      setVhMileage(24000);
      setVhFuelType('Gasoline');
      setVhEngineType('1.2L K12 DualJet Petrol');
      setVhTransmission('Manual');
      setVhExteriorColor('Solid Fire Red');
      setVhInteriorColor('Black');
      setVhAccidentHistory(false);
      setTitle('2022 Maruti Suzuki Swift ZXi DualJet Petrol');
      setSubtitle('Fuel-efficient hatchback with 24,000 km, alloy wheels, smart infotainment, and showroom condition.');
    }
  };

  const buildCurrentVehicleAttributes = (): VehicleAttributes => ({
    brand: vhBrand,
    model: vhModel,
    year: Number(vhYear),
    mileage: Number(vhMileage),
    fuel_type: vhFuelType,
    engine_type: vhEngineType,
    transmission: vhTransmission,
    exterior_color: vhExteriorColor,
    interior_color: vhInteriorColor,
    accident_history: vhAccidentHistory,
    clean_title: true,
  });

  // Step 2: Compute Off-Chain AI Prediction (Strictly NOT registered on-chain yet)
  const handleRunAiPrediction = async () => {
    setPredictionError(null);
    setIsPredicting(true);
    try {
      const attrs = buildCurrentVehicleAttributes();
      const record = await predictVehiclePrice(attrs);
      setAiRecord({
        ...record,
        oracle_registered: false,
        oracle_tx_hash: '',
        oracle_block_number: 0,
      });
      setStep(2);
    } catch (err: any) {
      setPredictionError(err.message || 'Vehicle AI prediction failed');
    } finally {
      setIsPredicting(false);
    }
  };

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
    setStep(4);
  };

  const handleSignAndCreateAuction = async () => {
    if (!wallet || !aiRecord) return;
    setTermsError(null);
    setDeployTxStage('waiting_approval');

    const txRes = await executeMetaMaskTransaction({
      senderAddress: wallet.address,
      toAddress: SEALED_AUCTION_CONTRACT_ADDRESS,
      valueEth: 0,
    });

    if (!txRes.success) {
      setDeployTxStage('idle');
      if (txRes.nonceMismatch) {
        reportNonceMismatch(txRes.nonceMismatch);
      }
      setTermsError(txRes.error || 'Failed to publish auction transaction.');
      return;
    }

    setDeployTxStage('submitted');
    await new Promise((r) => setTimeout(r, 120));
    setDeployTxStage('pending');
    await new Promise((r) => setTimeout(r, 120));
    setDeployTxStage('confirmed');

    const now = Date.now();
    const commitEnd = new Date(now + commitMinutes * 60 * 1000).toISOString();
    const revealEnd = new Date(now + (commitMinutes + revealMinutes) * 60 * 1000).toISOString();
    const createTxHash =
      txRes.receipt?.txHash ||
      generateDeterministicTxHash(
        `CREATE:${nextNumericId}:${wallet.address}:${aiRecord.product_data_hash}:${now}`
      );
    const createBlockNumber = txRes.receipt?.blockNumber || aiRecord.oracle_block_number + 1;

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
      attributes: buildCurrentVehicleAttributes() as unknown as Record<string, string | number | boolean | null>,
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
          eventName: 'AuctionCreated',
          txHash: createTxHash,
          blockNumber: createBlockNumber,
          timestamp: new Date(now).toISOString(),
          actorAddress: wallet.address,
          summary: `Seller created Vehicle Auction #${nextNumericId} (Start: ${Number(
            startingBidEth
          ).toFixed(2)} ETH / ${formatEthToInr(startingBidEth)}, Reserve: ${Number(
            reservePriceEth
          ).toFixed(2)} ETH / ${formatEthToInr(reservePriceEth)}, Fixed Deposit: ${Number(
            fixedDepositEth
          ).toFixed(2)} ETH / ${formatEthToInr(fixedDepositEth)})`,
        },
      ],
    };

    if (createTxHash) {
      inspectTransaction(createTxHash);
    }
    onCreateAuction(newAuction);
  };

  if (!isConnected) {
    return (
      <div className="bg-[#12141A] rounded-lg border border-[#232730] p-8 text-center max-w-xl mx-auto my-12 space-y-4">
        <h2 className="text-lg font-semibold text-[#F4F5F7]">
          Seller Wallet Connection Required
        </h2>
        <p className="text-xs text-[#8E95A5] leading-relaxed">
          Connect your Hardhat Seller account on Chain ID 31337 to compute an AI vehicle valuation in INR (₹), anchor the hash on PriceOracle.sol, and deploy a sealed-bid auction.
        </p>
        <button
          type="button"
          onClick={openAuthModal}
          className="px-5 py-2.5 rounded-md bg-[#C5A46D] hover:bg-[#D4B57E] text-[#0B0C10] text-xs font-semibold transition-colors cursor-pointer"
        >
          Connect Seller Wallet
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6 pb-12">
      {/* Compact 4-Step Progress Header */}
      <div className="bg-[#12141A] rounded-lg p-6 border border-[#232730] space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-[0.14em] text-[#C5A46D]">
              Seller Consignment Desk · Hardhat #31337
            </div>
            <h1 className="text-xl font-semibold text-[#F4F5F7] mt-1 tracking-tight">
              Deploy Sealed-Bid Vehicle Auction
            </h1>
          </div>
          <span className="text-xs font-mono text-[#8E95A5] tabular-nums">
            Seller: {shortenAddress(wallet?.address || '')}
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2 text-xs">
          {[
            { num: 1, label: '01. Specifications' },
            { num: 2, label: '02. AI Valuation' },
            { num: 3, label: '03. Escrow Terms' },
            { num: 4, label: '04. Review & Deploy' },
          ].map((s) => {
            const active = step === s.num;
            const done = step > s.num;
            return (
              <div
                key={s.num}
                className={`py-2.5 px-3 rounded-md border text-center font-medium transition-colors ${
                  active
                    ? 'bg-[#C5A46D] border-[#C5A46D] text-[#0B0C10] font-semibold'
                    : done
                    ? 'bg-[#0B0C10] border-emerald-500/40 text-emerald-400'
                    : 'bg-[#0B0C10] border-[#232730] text-[#646C7E]'
                }`}
              >
                {s.label}
              </div>
            );
          })}
        </div>
      </div>

      {predictionError && (
        <div className="p-4 rounded-lg bg-rose-950/30 border border-rose-500/30 text-xs text-rose-200 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{predictionError}</span>
        </div>
      )}

      {/* STEP 1: VEHICLE SPECIFICATIONS */}
      {step === 1 && (
        <div className="bg-[#12141A] rounded-lg border border-[#232730] p-6 space-y-6">
          <div className="border-b border-[#232730] pb-4 flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-base font-semibold text-[#F4F5F7]">
                01. Vehicle Specifications (Indian Pre-Owned Market)
              </h2>
              <p className="text-xs text-[#8E95A5] mt-0.5">
                Attributes are evaluated by the AI Valuation Engine and hashed with SHA-256 to generate <code className="text-[#F4F5F7] font-mono">product_data_hash</code>.
              </p>
            </div>

            <div className="flex items-center gap-1 bg-[#0B0C10] p-1 rounded-md border border-[#232730]">
              {(
                [
                  { id: 'suv', label: '2021 Hyundai Creta' },
                  { id: 'coupe', label: '2020 Honda City' },
                  { id: 'sedan', label: '2022 Maruti Swift' },
                ] as const
              ).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => applyVehiclePreset(p.id)}
                  className={`px-3 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer ${
                    selectedImagePreset === p.id
                      ? 'bg-[#171A22] text-[#C5A46D] border border-[#C5A46D]/30'
                      : 'text-[#8E95A5] hover:text-[#F4F5F7]'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-[#8E95A5] mb-1.5">
                Listing Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-md border border-[#232730] bg-[#0B0C10] text-xs font-medium text-[#F4F5F7] focus:outline-none focus:border-[#C5A46D]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-[#8E95A5] mb-1.5">
                Service History & Provenance Summary
              </label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-md border border-[#232730] bg-[#0B0C10] text-xs text-[#F4F5F7] focus:outline-none focus:border-[#C5A46D]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-[#232730]">
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-[#8E95A5] mb-1.5">Brand / Manufacturer *</label>
              <input
                type="text"
                value={vhBrand}
                onChange={(e) => setVhBrand(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-[#232730] bg-[#0B0C10] text-[#F4F5F7] text-xs focus:outline-none focus:border-[#C5A46D]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-[#8E95A5] mb-1.5">Model & Trim *</label>
              <input
                type="text"
                value={vhModel}
                onChange={(e) => setVhModel(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-[#232730] bg-[#0B0C10] text-[#F4F5F7] text-xs focus:outline-none focus:border-[#C5A46D]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-[#8E95A5] mb-1.5">Model Year (1974–2024) *</label>
              <input
                type="number"
                value={vhYear}
                onChange={(e) => setVhYear(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-md border border-[#232730] bg-[#0B0C10] text-[#F4F5F7] text-xs font-mono tabular-nums focus:outline-none focus:border-[#C5A46D]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-[#8E95A5] mb-1.5">Odometer Mileage *</label>
              <input
                type="number"
                value={vhMileage}
                onChange={(e) => setVhMileage(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-md border border-[#232730] bg-[#0B0C10] text-[#F4F5F7] text-xs font-mono tabular-nums focus:outline-none focus:border-[#C5A46D]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-[#8E95A5] mb-1.5">Fuel Type</label>
              <select
                value={vhFuelType}
                onChange={(e) => setVhFuelType(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-[#232730] bg-[#0B0C10] text-[#F4F5F7] text-xs focus:outline-none focus:border-[#C5A46D]"
              >
                <option value="Gasoline">Gasoline</option>
                <option value="Electric">Electric</option>
                <option value="Hybrid">Hybrid</option>
                <option value="Plug-in Hybrid">Plug-in Hybrid</option>
                <option value="Diesel">Diesel</option>
                <option value="E85 Flex Fuel">E85 Flex Fuel</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-[#8E95A5] mb-1.5">Engine Description</label>
              <input
                type="text"
                value={vhEngineType}
                onChange={(e) => setVhEngineType(e.target.value)}
                placeholder="e.g., 1.5L VVT-i Petrol"
                className="w-full px-3 py-2 rounded-md border border-[#232730] bg-[#0B0C10] text-[#F4F5F7] text-xs focus:outline-none focus:border-[#C5A46D]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-[#8E95A5] mb-1.5">Transmission</label>
              <input
                type="text"
                value={vhTransmission}
                onChange={(e) => setVhTransmission(e.target.value)}
                placeholder="e.g., 6-Speed Automatic"
                className="w-full px-3 py-2 rounded-md border border-[#232730] bg-[#0B0C10] text-[#F4F5F7] text-xs focus:outline-none focus:border-[#C5A46D]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-[#8E95A5] mb-1.5">Exterior Color</label>
              <input
                type="text"
                value={vhExteriorColor}
                onChange={(e) => setVhExteriorColor(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-[#232730] bg-[#0B0C10] text-[#F4F5F7] text-xs focus:outline-none focus:border-[#C5A46D]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-[#8E95A5] mb-1.5">Accident History</label>
              <select
                value={vhAccidentHistory === true ? 'yes' : vhAccidentHistory === false ? 'no' : 'unknown'}
                onChange={(e) => {
                  const v = e.target.value;
                  setVhAccidentHistory(v === 'yes' ? true : v === 'no' ? false : null);
                }}
                className="w-full px-3 py-2 rounded-md border border-[#232730] bg-[#0B0C10] text-[#F4F5F7] text-xs focus:outline-none focus:border-[#C5A46D]"
              >
                <option value="no">None Reported</option>
                <option value="yes">Accident Reported</option>
                <option value="unknown">Unknown</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-[#232730]">
            <button
              type="button"
              onClick={handleRunAiPrediction}
              disabled={isPredicting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-[#C5A46D] hover:bg-[#D4B57E] disabled:opacity-50 text-[#0B0C10] text-xs font-semibold transition-colors cursor-pointer"
            >
              <span>
                {isPredicting
                  ? 'Computing AI Market Valuation (INR)...'
                  : 'Compute AI Valuation (INR)'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: OFF-CHAIN AI PREDICTION COMPLETED */}
      {step === 2 && aiRecord && (
        <div className="bg-[#12141A] rounded-lg border border-[#232730] p-6 space-y-6">
          <div className="flex items-start justify-between flex-wrap gap-4 border-b border-[#232730] pb-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-[#C5A46D]">
                <Clock className="w-3.5 h-3.5" />
                <span>State 1/2: AI Valuation Certificate Ready · Pending Consignment Terms</span>
              </div>
              <h2 className="text-lg font-semibold text-[#F4F5F7]">
                02. Advisory Vehicle Market Valuation (INR)
              </h2>
              <p className="text-xs text-[#8E95A5]">
                Computed by AI Valuation Engine <code className="text-[#F4F5F7] font-mono">({aiRecord.model_version || 'Gemini 3.8 Flash'})</code>. Next, configure your starting bid and reserve thresholds.
              </p>
            </div>

            <div className="text-right font-mono tabular-nums">
              <div className="text-[11px] font-sans uppercase tracking-wider text-[#8E95A5]">Estimated Fair Market Value</div>
              <div className="text-2xl font-semibold text-[#F4F5F7] mt-0.5">
                {formatInr(aiRecord.predicted_price)}
              </div>
              <div className="text-xs text-[#646C7E]">
                {toInrPaise(aiRecord.predicted_price).toLocaleString('en-IN')} paise
              </div>
            </div>
          </div>

          {aiRecord.warnings && aiRecord.warnings.length > 0 && (
            <div className="p-3.5 rounded-md bg-amber-950/30 border border-amber-500/30 space-y-1 text-xs text-amber-200">
              <div className="font-semibold text-amber-300 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>Valuation Advisory Notes</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5">
                {aiRecord.warnings.map((w, idx) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="divide-y divide-[#232730] border-t border-b border-[#232730]">
            {aiRecord.feature_breakdown.map((f, i) => (
              <div key={i} className="py-2.5 flex items-center justify-between text-xs">
                <span className="text-[#8E95A5]">{f.factor}</span>
                <span className="font-mono font-semibold text-[#F4F5F7] tabular-nums">{f.impact}</span>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-md bg-[#0B0C10] border border-[#232730] space-y-2 text-xs font-mono">
            <div>
              <span className="text-[#646C7E]">Canonical Vehicle JSON: </span>
              <span className="text-[#8E95A5] break-all">{aiRecord.canonical_json}</span>
            </div>
            <div>
              <span className="text-[#646C7E]">product_data_hash (SHA-256): </span>
              <span className="text-[#F4F5F7] break-all">{aiRecord.product_data_hash}</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md border border-[#232730] text-xs font-medium text-[#8E95A5] hover:text-[#F4F5F7] cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Edit Specifications</span>
            </button>

            <button
              type="button"
              onClick={() => setStep(3)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-[#C5A46D] hover:bg-[#D4B57E] text-[#0B0C10] text-xs font-semibold transition-colors cursor-pointer"
            >
              <span>Configure Escrow Terms</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: AUCTION TERMS IN TEST ETH */}
      {step === 3 && aiRecord && (
        <div className="bg-[#12141A] rounded-lg border border-[#232730] p-6 space-y-6">
          <div className="border-b border-[#232730] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-[#F4F5F7]">
                03. Configure Sealed-Bid Escrow Terms (Test ETH + Live ₹ INR Value)
              </h2>
              <p className="text-xs text-[#8E95A5] mt-1">
                The AI valuation ({formatInr(aiRecord.predicted_price)}) is an informational benchmark in Indian Rupees (INR). As you enter Test ETH below, the equivalent value in Indian Rupees (1 ETH = ₹{ETH_TO_INR_RATE.toLocaleString('en-IN')}) is calculated in real time.
              </p>
            </div>
          </div>

          {termsError && (
            <div className="p-3 rounded-md bg-rose-950/30 border border-rose-500/30 text-xs font-medium text-rose-200">
              {termsError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-medium uppercase tracking-wider text-[#8E95A5]">
                  Starting Bid (ETH)
                </label>
                <span className="text-xs font-mono font-semibold text-[#C5A46D] tabular-nums">
                  ≈ {formatEthToInr(startingBidEth)}
                </span>
              </div>
              <input
                type="number"
                step="0.01"
                value={startingBidEth}
                onChange={(e) => setStartingBidEth(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-md border border-[#232730] bg-[#0B0C10] font-mono text-sm font-semibold text-[#F4F5F7] tabular-nums focus:outline-none focus:border-[#C5A46D]"
              />
              <div className="mt-1.5 text-[11px] font-mono text-[#8E95A5] tabular-nums">
                Value in INR: <strong className="text-[#F4F5F7]">{formatEthToInr(startingBidEth)}</strong>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-medium uppercase tracking-wider text-[#8E95A5]">
                  Reserve Price (ETH)
                </label>
                <span className="text-xs font-mono font-semibold text-[#C5A46D] tabular-nums">
                  ≈ {formatEthToInr(reservePriceEth)}
                </span>
              </div>
              <input
                type="number"
                step="0.01"
                value={reservePriceEth}
                onChange={(e) => setReservePriceEth(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-md border border-[#232730] bg-[#0B0C10] font-mono text-sm font-semibold text-[#F4F5F7] tabular-nums focus:outline-none focus:border-[#C5A46D]"
              />
              <div className="mt-1.5 text-[11px] font-mono text-[#8E95A5] tabular-nums">
                Value in INR: <strong className="text-[#F4F5F7]">{formatEthToInr(reservePriceEth)}</strong>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-medium uppercase tracking-wider text-[#8E95A5]">
                  Collateral Deposit (ETH)
                </label>
                <span className="text-xs font-mono font-semibold text-[#C5A46D] tabular-nums">
                  ≈ {formatEthToInr(fixedDepositEth)}
                </span>
              </div>
              <input
                type="number"
                step="0.01"
                value={fixedDepositEth}
                onChange={(e) => setFixedDepositEth(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-md border border-[#232730] bg-[#0B0C10] font-mono text-sm font-semibold text-[#F4F5F7] tabular-nums focus:outline-none focus:border-[#C5A46D]"
              />
              <div className="mt-1.5 text-[11px] font-mono text-[#8E95A5] tabular-nums">
                Value in INR: <strong className="text-[#F4F5F7]">{formatEthToInr(fixedDepositEth)}</strong>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-[#8E95A5] mb-1.5">
                Commit Window Duration (Minutes)
              </label>
              <input
                type="number"
                value={commitMinutes}
                onChange={(e) => setCommitMinutes(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-md border border-[#232730] bg-[#0B0C10] text-[#F4F5F7] font-mono text-xs tabular-nums focus:outline-none focus:border-[#C5A46D]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-[#8E95A5] mb-1.5">
                Reveal Window Duration (Minutes)
              </label>
              <input
                type="number"
                value={revealMinutes}
                onChange={(e) => setRevealMinutes(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-md border border-[#232730] bg-[#0B0C10] text-[#F4F5F7] font-mono text-xs tabular-nums focus:outline-none focus:border-[#C5A46D]"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[#232730]">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md border border-[#232730] text-xs font-medium text-[#8E95A5] hover:text-[#F4F5F7] cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              type="button"
              onClick={handleValidateTerms}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-[#C5A46D] hover:bg-[#D4B57E] text-[#0B0C10] text-xs font-semibold transition-colors cursor-pointer"
            >
              <span>Review Deployment</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: REVIEW & SIGN TRANSACTION */}
      {step === 4 && aiRecord && (
        <div className="bg-[#12141A] rounded-lg border border-[#232730] p-6 space-y-6">
          <div className="border-b border-[#232730] pb-4">
            <h2 className="text-base font-semibold text-[#F4F5F7]">
              04. Review & Deploy to SealedAuction.sol
            </h2>
            <p className="text-xs text-[#8E95A5] mt-1">
              Confirm your vehicle listing parameters and Test ETH (with ₹ INR equivalents) escrow terms before signing.
            </p>
          </div>

          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-md bg-[#0B0C10] border border-[#232730] text-xs">
            <div>
              <dt className="text-[#646C7E]">Vehicle Title</dt>
              <dd className="text-[#F4F5F7] font-semibold mt-0.5">{title}</dd>
            </div>
            <div>
              <dt className="text-[#646C7E]">AI Valuation (Advisory Benchmark)</dt>
              <dd className="text-[#F4F5F7] font-mono font-semibold tabular-nums mt-0.5">
                {formatInr(aiRecord.predicted_price)} ({aiRecord.model_version})
              </dd>
            </div>
            <div>
              <dt className="text-[#646C7E]">Starting Bid / Seller Reserve</dt>
              <dd className="text-[#F4F5F7] font-mono font-semibold tabular-nums mt-0.5">
                {Number(startingBidEth).toFixed(2)} ETH ({formatEthToInr(startingBidEth)}) / {Number(reservePriceEth).toFixed(2)} ETH ({formatEthToInr(reservePriceEth)})
              </dd>
            </div>
            <div>
              <dt className="text-[#646C7E]">Fixed Collateral Deposit</dt>
              <dd className="text-[#F4F5F7] font-mono font-semibold tabular-nums mt-0.5">
                {Number(fixedDepositEth).toFixed(2)} ETH ({formatEthToInr(fixedDepositEth)}) · {commitMinutes}m Commit · {revealMinutes}m Reveal
              </dd>
            </div>
          </dl>

          {deployTxStage !== 'idle' && (
            <div className="p-3 rounded-md bg-[#0B0C10] border border-[#C5A46D]/50 text-xs font-mono text-[#F4F5F7]">
              {deployTxStage === 'waiting_approval' && '1/4 Waiting for Seller wallet approval...'}
              {deployTxStage === 'submitted' && '2/4 Transaction createAuction() submitted...'}
              {deployTxStage === 'pending' && '3/4 Pending block confirmation on Chain 31337...'}
              {deployTxStage === 'confirmed' && '4/4 Confirmed! Redirecting to auction lot...'}
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-[#232730]">
            <button
              type="button"
              onClick={() => setStep(3)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md border border-[#232730] text-xs font-medium text-[#8E95A5] hover:text-[#F4F5F7] cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Modify Escrow Terms</span>
            </button>

            {!isCorrectNetwork ? (
              <button
                type="button"
                onClick={switchNetworkToHardhat}
                className="px-5 py-2.5 rounded-md bg-[#C5A46D] text-[#0B0C10] text-xs font-semibold cursor-pointer"
              >
                Switch to Hardhat Chain ID 31337
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSignAndCreateAuction}
                disabled={deployTxStage !== 'idle'}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-[#C5A46D] hover:bg-[#D4B57E] disabled:opacity-50 text-[#0B0C10] text-xs font-semibold transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Sign & Deploy Vehicle Auction</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
