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
  PRICE_ORACLE_CONTRACT_ADDRESS,
} from '../lib/hardhatConfig';
import {
  predictVehiclePrice,
  registerPredictionOnOracle,
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

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [title, setTitle] = useState('2020 Ford F-150 XLT SuperCrew 4WD (3.5L V6 400hp Twin Turbo)');
  const [subtitle, setSubtitle] = useState(
    'Single-owner 3.5L EcoBoost V6 pickup with 45,000 miles, 10-speed automatic transmission, Jet Black exterior, and clean history.'
  );
  const [selectedImagePreset, setSelectedImagePreset] = useState<'suv' | 'coupe' | 'sedan'>('suv');

  // Structured Vehicle Schema (matching /backend LightGBM v1.0.0)
  const [vhBrand, setVhBrand] = useState('Ford');
  const [vhModel, setVhModel] = useState('F-150 XLT');
  const [vhYear, setVhYear] = useState(2020);
  const [vhMileage, setVhMileage] = useState(45000);
  const [vhFuelType, setVhFuelType] = useState('Gasoline');
  const [vhEngineType, setVhEngineType] = useState('3.5L V6 400hp Twin Turbo');
  const [vhTransmission, setVhTransmission] = useState('10-Speed Automatic');
  const [vhExteriorColor, setVhExteriorColor] = useState('Black');
  const [vhInteriorColor, setVhInteriorColor] = useState('Black');
  const [vhAccidentHistory, setVhAccidentHistory] = useState<boolean | null>(false);

  // Step 2 & 3 State: Separate AI Prediction vs Oracle Blockchain Registration
  const [isPredicting, setIsPredicting] = useState(false);
  const [predictionError, setPredictionError] = useState<string | null>(null);
  const [aiRecord, setAiRecord] = useState<AIPredictionRecord | null>(null);
  const [oracleTxStage, setOracleTxStage] = useState<
    'idle' | 'waiting_approval' | 'submitted' | 'pending' | 'confirmed'
  >('idle');
  const [deployTxStage, setDeployTxStage] = useState<
    'idle' | 'waiting_approval' | 'submitted' | 'pending' | 'confirmed'
  >('idle');

  // Step 4 State: Auction Terms in Test ETH
  const [startingBidEth, setStartingBidEth] = useState<string>('12.50');
  const [reservePriceEth, setReservePriceEth] = useState<string>('14.50');
  const [fixedDepositEth, setFixedDepositEth] = useState<string>('2.00');
  const [commitMinutes, setCommitMinutes] = useState<number>(60);
  const [revealMinutes, setRevealMinutes] = useState<number>(60);
  const [termsError, setTermsError] = useState<string | null>(null);

  const applyVehiclePreset = (preset: 'suv' | 'coupe' | 'sedan') => {
    setSelectedImagePreset(preset);
    setAiRecord(null);
    setOracleTxStage('idle');
    if (preset === 'suv') {
      setVhBrand('Ford');
      setVhModel('F-150 XLT');
      setVhYear(2020);
      setVhMileage(45000);
      setVhFuelType('Gasoline');
      setVhEngineType('3.5L V6 400hp Twin Turbo');
      setVhTransmission('10-Speed Automatic');
      setVhExteriorColor('Black');
      setVhInteriorColor('Black');
      setVhAccidentHistory(false);
      setTitle('2020 Ford F-150 XLT SuperCrew 4WD (3.5L V6 400hp Twin Turbo)');
      setSubtitle('Single-owner 3.5L EcoBoost V6 with 45,000 miles, 10-speed automatic, and clean history.');
    } else if (preset === 'coupe') {
      setVhBrand('Toyota');
      setVhModel('Camry Hybrid XLE');
      setVhYear(2022);
      setVhMileage(21500);
      setVhFuelType('Hybrid');
      setVhEngineType('2.5L I4 208hp Hybrid');
      setVhTransmission('Automatic');
      setVhExteriorColor('White');
      setVhInteriorColor('Black');
      setVhAccidentHistory(false);
      setTitle('2022 Toyota Camry Hybrid XLE Executive Sedan (2.5L I4)');
      setSubtitle('Executive hybrid sedan with 21,500 miles, Pearl White exterior, and full service records.');
    } else {
      setVhBrand('Kia');
      setVhModel('EV6 GT-Line');
      setVhYear(2023);
      setVhMileage(16200);
      setVhFuelType('Electric');
      setVhEngineType('Electric Motor');
      setVhTransmission('Single-Speed');
      setVhExteriorColor('Gray');
      setVhInteriorColor('Black');
      setVhAccidentHistory(false);
      setTitle('2023 Kia EV6 GT-Line Dual-Motor AWD (Electric Motor)');
      setSubtitle('800V ultra-fast charging electric crossover with 16,200 miles and clean accident-free report.');
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
    setOracleTxStage('idle');
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

  // Step 3: Register Prediction on PriceOracle.sol with MetaMask confirmation & receipt modal
  const handleRegisterOnOracle = async () => {
    if (!aiRecord || !wallet) return;
    setPredictionError(null);
    try {
      setOracleTxStage('waiting_approval');
      const txRes = await executeMetaMaskTransaction({
        senderAddress: wallet.address,
        toAddress: PRICE_ORACLE_CONTRACT_ADDRESS,
        valueEth: 0,
      });

      if (!txRes.success) {
        setOracleTxStage('idle');
        if (txRes.nonceMismatch) {
          reportNonceMismatch(txRes.nonceMismatch);
        }
        setPredictionError(
          txRes.error || 'Rejected: Transaction was rejected by the user in MetaMask.'
        );
        return;
      }

      setOracleTxStage('submitted');
      await new Promise((r) => setTimeout(r, 120));
      setOracleTxStage('pending');
      const registered = await registerPredictionOnOracle(aiRecord, authorizedOracleAddress);
      const finalOracleTxHash = txRes.receipt?.txHash || registered.oracle_tx_hash;
      const finalOracleBlock = txRes.receipt?.blockNumber || registered.oracle_block_number;
      setAiRecord({
        ...registered,
        oracle_registered: true,
        oracle_tx_hash: finalOracleTxHash,
        oracle_block_number: finalOracleBlock,
      });
      setOracleTxStage('confirmed');
      if (finalOracleTxHash) {
        inspectTransaction(finalOracleTxHash);
      }
      setStep(3);
    } catch (err: any) {
      setOracleTxStage('idle');
      setPredictionError(err.message || 'Oracle registration error');
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
    setStep(5);
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
          eventName: 'PredictionRegistered',
          txHash: aiRecord.oracle_tx_hash,
          blockNumber: aiRecord.oracle_block_number,
          timestamp: new Date(now - 15000).toISOString(),
          actorAddress: aiRecord.oracle_address,
          summary: `Oracle registered Vehicle Prediction #${aiRecord.prediction_id} (${formatInr(
            aiRecord.predicted_price
          )} INR / ${toInrPaise(aiRecord.predicted_price).toLocaleString('en-IN')} paise, LightGBM v${aiRecord.model_version}) on PriceOracle.sol`,
        },
        {
          id: `EVT-${100 + nextNumericId}-2`,
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
      <div className="bg-[#0F172A] rounded-xl border border-[#1E293B] p-8 text-center max-w-xl mx-auto my-12 space-y-4">
        <h2 className="text-lg font-bold text-white">
          Seller Wallet Connection Required
        </h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          Connect your Hardhat Seller account on Chain ID 31337 to compute a LightGBM v1.0.0 vehicle valuation in INR (₹), anchor the hash on PriceOracle.sol, and deploy a sealed-bid auction.
        </p>
        <button
          type="button"
          onClick={openAuthModal}
          className="px-5 py-2.5 rounded-lg bg-[#2563EB] hover:bg-blue-600 text-white text-xs font-semibold transition-colors cursor-pointer"
        >
          Connect Seller Wallet
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6 pb-12">
      {/* Compact 5-Step Progress Header */}
      <div className="bg-[#0F172A] rounded-xl p-6 border border-[#1E293B] space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <div className="text-xs font-mono text-slate-400">
              Seller Auction Deployment · Hardhat #31337 · LightGBM v1.0.0
            </div>
            <h1 className="text-xl font-bold text-white mt-0.5">
              Create Sealed-Bid Vehicle Auction
            </h1>
          </div>
          <span className="text-xs font-mono text-slate-400 tabular-nums">
            Seller: {shortenAddress(wallet?.address || '')}
          </span>
        </div>

        <div className="grid grid-cols-5 gap-2 text-xs">
          {[
            { num: 1, label: '01. Specs' },
            { num: 2, label: '02. AI Valuation' },
            { num: 3, label: '03. Oracle Anchor' },
            { num: 4, label: '04. ETH Terms' },
            { num: 5, label: '05. Deploy' },
          ].map((s) => {
            const active = step === s.num;
            const done = step > s.num;
            return (
              <div
                key={s.num}
                className={`py-2 px-3 rounded-lg border text-center font-medium transition-colors ${
                  active
                    ? 'bg-[#2563EB] border-[#2563EB] text-white'
                    : done
                    ? 'bg-[#090D1A] border-emerald-500/40 text-emerald-400'
                    : 'bg-[#090D1A] border-[#1E293B] text-slate-500'
                }`}
              >
                {s.label}
              </div>
            );
          })}
        </div>
      </div>

      {predictionError && (
        <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/30 text-xs text-rose-200 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{predictionError}</span>
        </div>
      )}

      {/* STEP 1: VEHICLE SPECIFICATIONS */}
      {step === 1 && (
        <div className="bg-[#0F172A] rounded-xl border border-[#1E293B] p-6 space-y-6">
          <div className="border-b border-[#1E293B] pb-4 flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-base font-semibold text-white">
                01. Vehicle Specifications (US Market · Miles)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Attributes are scored by LightGBM v1.0.0 and hashed with SHA-256 to generate <code className="text-slate-200">product_data_hash</code>.
              </p>
            </div>

            <div className="flex items-center gap-1 bg-[#090D1A] p-1 rounded-lg border border-[#1E293B]">
              {(
                [
                  { id: 'suv', label: '2020 Ford F-150 XLT' },
                  { id: 'coupe', label: '2022 Camry Hybrid' },
                  { id: 'sedan', label: '2023 Kia EV6' },
                ] as const
              ).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => applyVehiclePreset(p.id)}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                    selectedImagePreset === p.id
                      ? 'bg-[#1E293B] text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Listing Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg border border-[#1E293B] bg-[#090D1A] text-xs font-medium text-white focus:outline-none focus:border-[#2563EB]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Service History & Provenance Summary
              </label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg border border-[#1E293B] bg-[#090D1A] text-xs text-slate-300 focus:outline-none focus:border-[#2563EB]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2 border-t border-[#1E293B]">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Brand / Manufacturer *</label>
              <input
                type="text"
                value={vhBrand}
                onChange={(e) => setVhBrand(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#1E293B] bg-[#090D1A] text-white text-xs focus:outline-none focus:border-[#2563EB]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Model & Trim *</label>
              <input
                type="text"
                value={vhModel}
                onChange={(e) => setVhModel(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#1E293B] bg-[#090D1A] text-white text-xs focus:outline-none focus:border-[#2563EB]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Model Year (1974–2024) *</label>
              <input
                type="number"
                value={vhYear}
                onChange={(e) => setVhYear(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-[#1E293B] bg-[#090D1A] text-white text-xs font-mono tabular-nums focus:outline-none focus:border-[#2563EB]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Mileage (miles / mi.) *</label>
              <input
                type="number"
                value={vhMileage}
                onChange={(e) => setVhMileage(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-[#1E293B] bg-[#090D1A] text-white text-xs font-mono tabular-nums focus:outline-none focus:border-[#2563EB]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Fuel Type</label>
              <select
                value={vhFuelType}
                onChange={(e) => setVhFuelType(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#1E293B] bg-[#090D1A] text-white text-xs focus:outline-none focus:border-[#2563EB]"
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
              <label className="block text-xs font-medium text-slate-400 mb-1">Engine Description</label>
              <input
                type="text"
                value={vhEngineType}
                onChange={(e) => setVhEngineType(e.target.value)}
                placeholder="e.g., 3.5L V6 400hp Twin Turbo"
                className="w-full px-3 py-2 rounded-lg border border-[#1E293B] bg-[#090D1A] text-white text-xs focus:outline-none focus:border-[#2563EB]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Transmission</label>
              <input
                type="text"
                value={vhTransmission}
                onChange={(e) => setVhTransmission(e.target.value)}
                placeholder="e.g., 10-Speed Automatic"
                className="w-full px-3 py-2 rounded-lg border border-[#1E293B] bg-[#090D1A] text-white text-xs focus:outline-none focus:border-[#2563EB]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Exterior Color</label>
              <input
                type="text"
                value={vhExteriorColor}
                onChange={(e) => setVhExteriorColor(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#1E293B] bg-[#090D1A] text-white text-xs focus:outline-none focus:border-[#2563EB]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Accident History</label>
              <select
                value={vhAccidentHistory === true ? 'yes' : vhAccidentHistory === false ? 'no' : 'unknown'}
                onChange={(e) => {
                  const v = e.target.value;
                  setVhAccidentHistory(v === 'yes' ? true : v === 'no' ? false : null);
                }}
                className="w-full px-3 py-2 rounded-lg border border-[#1E293B] bg-[#090D1A] text-white text-xs focus:outline-none focus:border-[#2563EB]"
              >
                <option value="no">None Reported</option>
                <option value="yes">Accident Reported</option>
                <option value="unknown">Unknown</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-[#1E293B]">
            <button
              type="button"
              onClick={handleRunAiPrediction}
              disabled={isPredicting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#2563EB] hover:bg-blue-600 disabled:opacity-50 text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              <span>
                {isPredicting
                  ? 'Scoring 934 LightGBM Trees...'
                  : 'Compute AI Valuation (INR)'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: OFF-CHAIN AI PREDICTION COMPLETED (NOT YET REGISTERED ON ORACLE) */}
      {step === 2 && aiRecord && (
        <div className="bg-[#0F172A] rounded-xl border border-[#1E293B] p-6 space-y-6">
          <div className="flex items-start justify-between flex-wrap gap-4 border-b border-[#1E293B] pb-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-mono text-amber-400">
                <Clock className="w-3.5 h-3.5" />
                <span>State 1/2: Off-Chain AI Valuation Complete · Pending On-Chain Oracle Registration</span>
              </div>
              <h2 className="text-lg font-bold text-white">
                02. Advisory Vehicle Market Valuation (INR)
              </h2>
              <p className="text-xs text-slate-400">
                Computed by LightGBM <code className="text-slate-200">v{aiRecord.model_version}</code> ({aiRecord.inference_ms ?? 1.5} ms). Next, anchor this valuation hash onto <code className="text-slate-200">PriceOracle.sol</code>.
              </p>
            </div>

            <div className="text-right font-mono tabular-nums">
              <div className="text-xs font-sans text-slate-400">Predicted Fair Market Value</div>
              <div className="text-2xl font-bold text-white mt-0.5">
                {formatInr(aiRecord.predicted_price)}
              </div>
              <div className="text-xs text-slate-500">
                {toInrPaise(aiRecord.predicted_price).toLocaleString('en-IN')} paise ·{' '}
                {aiRecord.in_training_distribution !== false ? 'In-Distribution' : 'OOD'}
              </div>
            </div>
          </div>

          {aiRecord.warnings && aiRecord.warnings.length > 0 && (
            <div className="p-3.5 rounded-lg bg-amber-950/30 border border-amber-500/30 space-y-1 text-xs text-amber-200">
              <div className="font-semibold text-amber-300 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>Model Advisory Warnings</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5">
                {aiRecord.warnings.map((w, idx) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="divide-y divide-[#1E293B] border-t border-b border-[#1E293B]">
            {aiRecord.feature_breakdown.map((f, i) => (
              <div key={i} className="py-2.5 flex items-center justify-between text-xs">
                <span className="text-slate-300">{f.factor}</span>
                <span className="font-mono font-semibold text-white tabular-nums">{f.impact}</span>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-lg bg-[#090D1A] border border-[#1E293B] space-y-2 text-xs font-mono">
            <div>
              <span className="text-slate-500">Canonical Vehicle JSON: </span>
              <span className="text-slate-300 break-all">{aiRecord.canonical_json}</span>
            </div>
            <div>
              <span className="text-slate-500">product_data_hash (SHA-256): </span>
              <span className="text-white break-all">{aiRecord.product_data_hash}</span>
            </div>
          </div>

          {oracleTxStage !== 'idle' && (
            <div className="p-3 rounded-lg bg-[#090D1A] border border-[#2563EB]/50 text-xs font-mono text-slate-200">
              {oracleTxStage === 'waiting_approval' && '1/3 Requesting Oracle relayer signature...'}
              {oracleTxStage === 'submitted' && '2/3 Submitting registerPrediction() to PriceOracle.sol...'}
              {oracleTxStage === 'pending' && '3/3 Waiting for block confirmation on Hardhat #31337...'}
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[#1E293B] text-xs font-medium text-slate-300 hover:text-white cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Edit Specifications</span>
            </button>

            <button
              type="button"
              onClick={handleRegisterOnOracle}
              disabled={oracleTxStage !== 'idle'}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#2563EB] hover:bg-blue-600 disabled:opacity-50 text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              <span>Register Valuation on PriceOracle.sol</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: ORACLE REGISTRATION CONFIRMED ON-CHAIN */}
      {step === 3 && aiRecord && (
        <div className="bg-[#0F172A] rounded-xl border border-[#1E293B] p-6 space-y-6">
          <div className="flex items-start gap-3 text-emerald-200 bg-emerald-950/30 border border-emerald-500/30 p-4 rounded-lg">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400 mt-0.5" />
            <div className="space-y-0.5">
              <h2 className="text-sm font-semibold text-white">
                State 2/2: Valuation Anchored on PriceOracle.sol (Record #{aiRecord.prediction_id})
              </h2>
              <p className="text-xs text-slate-300">
                Oracle signer recorded the integer valuation and canonical SHA-256 vehicle hash on Hardhat Chain ID 31337.
              </p>
            </div>
          </div>

          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-lg bg-[#090D1A] border border-[#1E293B] text-xs font-mono tabular-nums">
            <div>
              <dt className="text-slate-500 font-sans">Oracle Prediction ID</dt>
              <dd className="text-white font-semibold mt-0.5">#{aiRecord.prediction_id}</dd>
            </div>
            <div>
              <dt className="text-slate-500 font-sans">Anchored Value (Paise / INR)</dt>
              <dd className="text-white font-semibold mt-0.5">
                {toInrPaise(aiRecord.predicted_price).toLocaleString('en-IN')} paise ({formatInr(aiRecord.predicted_price)})
              </dd>
            </div>
            <div className="md:col-span-2">
              <dt className="text-slate-500 font-sans">Oracle Transaction Hash</dt>
              <dd className="text-slate-200 break-all mt-0.5">{aiRecord.oracle_tx_hash}</dd>
            </div>
            <div>
              <dt className="text-slate-500 font-sans">Authorized Oracle Signer</dt>
              <dd className="text-slate-300 mt-0.5">{aiRecord.oracle_address}</dd>
            </div>
            <div>
              <dt className="text-slate-500 font-sans">Block Number</dt>
              <dd className="text-slate-300 mt-0.5">#{aiRecord.oracle_block_number}</dd>
            </div>
          </dl>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[#1E293B] text-xs font-medium text-slate-300 hover:text-white cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              type="button"
              onClick={() => setStep(4)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#2563EB] hover:bg-blue-600 text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              <span>Configure ETH Auction Terms</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: AUCTION TERMS IN TEST ETH */}
      {step === 4 && aiRecord && (
        <div className="bg-[#0F172A] rounded-xl border border-[#1E293B] p-6 space-y-6">
          <div className="border-b border-[#1E293B] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-white">
                04. Configure Sealed-Bid Terms (Test ETH + Live ₹ INR Value)
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                The AI valuation ({formatInr(aiRecord.predicted_price)}) is an informational benchmark in Indian Rupees (INR). As you enter Test ETH below, the equivalent value in Indian Rupees (1 ETH = ₹{ETH_TO_INR_RATE.toLocaleString('en-IN')}) is calculated in real time.
              </p>
            </div>
          </div>

          {termsError && (
            <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-500/30 text-xs font-medium text-rose-200">
              {termsError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  Starting Bid (Test ETH)
                </label>
                <span className="text-xs font-mono font-semibold text-emerald-400 tabular-nums">
                  ≈ {formatEthToInr(startingBidEth)}
                </span>
              </div>
              <input
                type="number"
                step="0.01"
                value={startingBidEth}
                onChange={(e) => setStartingBidEth(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg border border-[#1E293B] bg-[#090D1A] font-mono text-sm font-semibold text-white tabular-nums focus:outline-none focus:border-[#2563EB]"
              />
              <div className="mt-1.5 text-[11px] font-mono text-slate-400 tabular-nums">
                Value in INR: <strong className="text-emerald-400">{formatEthToInr(startingBidEth)}</strong>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  Reserve Price (Test ETH, &ge; Start)
                </label>
                <span className="text-xs font-mono font-semibold text-emerald-400 tabular-nums">
                  ≈ {formatEthToInr(reservePriceEth)}
                </span>
              </div>
              <input
                type="number"
                step="0.01"
                value={reservePriceEth}
                onChange={(e) => setReservePriceEth(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg border border-[#1E293B] bg-[#090D1A] font-mono text-sm font-semibold text-white tabular-nums focus:outline-none focus:border-[#2563EB]"
              />
              <div className="mt-1.5 text-[11px] font-mono text-slate-400 tabular-nums">
                Value in INR: <strong className="text-emerald-400">{formatEthToInr(reservePriceEth)}</strong>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  Fixed Collateral Deposit (Test ETH)
                </label>
                <span className="text-xs font-mono font-semibold text-emerald-400 tabular-nums">
                  ≈ {formatEthToInr(fixedDepositEth)}
                </span>
              </div>
              <input
                type="number"
                step="0.01"
                value={fixedDepositEth}
                onChange={(e) => setFixedDepositEth(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg border border-[#1E293B] bg-[#090D1A] font-mono text-sm font-semibold text-white tabular-nums focus:outline-none focus:border-[#2563EB]"
              />
              <div className="mt-1.5 text-[11px] font-mono text-slate-400 tabular-nums">
                Value in INR: <strong className="text-emerald-400">{formatEthToInr(fixedDepositEth)}</strong>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Commit Window Duration (Minutes)
              </label>
              <input
                type="number"
                value={commitMinutes}
                onChange={(e) => setCommitMinutes(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-lg border border-[#1E293B] bg-[#090D1A] text-white font-mono text-xs tabular-nums focus:outline-none focus:border-[#2563EB]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Reveal Window Duration (Minutes)
              </label>
              <input
                type="number"
                value={revealMinutes}
                onChange={(e) => setRevealMinutes(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-lg border border-[#1E293B] bg-[#090D1A] text-white font-mono text-xs tabular-nums focus:outline-none focus:border-[#2563EB]"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-[#1E293B]">
            <button
              type="button"
              onClick={() => setStep(3)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[#1E293B] text-xs font-medium text-slate-300 hover:text-white cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              type="button"
              onClick={handleValidateTerms}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#2563EB] hover:bg-blue-600 text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              <span>Review Deployment</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: REVIEW & SIGN TRANSACTION */}
      {step === 5 && aiRecord && (
        <div className="bg-[#0F172A] rounded-xl border border-[#1E293B] p-6 space-y-6">
          <div className="border-b border-[#1E293B] pb-4">
            <h2 className="text-base font-semibold text-white">
              05. Review & Deploy to SealedAuction.sol
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Confirm the anchored Oracle valuation record and Test ETH (with ₹ INR equivalents) escrow parameters before signing.
            </p>
          </div>

          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-lg bg-[#090D1A] border border-[#1E293B] text-xs">
            <div>
              <dt className="text-slate-500">Vehicle Title</dt>
              <dd className="text-white font-semibold mt-0.5">{title}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Anchored AI Valuation (Oracle #{aiRecord.prediction_id})</dt>
              <dd className="text-white font-mono font-semibold tabular-nums mt-0.5">
                {formatInr(aiRecord.predicted_price)} (LightGBM v{aiRecord.model_version})
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Starting Bid / Seller Reserve</dt>
              <dd className="text-white font-mono font-semibold tabular-nums mt-0.5">
                {Number(startingBidEth).toFixed(2)} ETH ({formatEthToInr(startingBidEth)}) / {Number(reservePriceEth).toFixed(2)} ETH ({formatEthToInr(reservePriceEth)})
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Fixed Collateral Deposit</dt>
              <dd className="text-white font-mono font-semibold tabular-nums mt-0.5">
                {Number(fixedDepositEth).toFixed(2)} ETH ({formatEthToInr(fixedDepositEth)}) · {commitMinutes}m Commit · {revealMinutes}m Reveal
              </dd>
            </div>
          </dl>

          {deployTxStage !== 'idle' && (
            <div className="p-3 rounded-lg bg-[#090D1A] border border-[#2563EB]/50 text-xs font-mono text-slate-200">
              {deployTxStage === 'waiting_approval' && '1/4 Waiting for Seller wallet approval...'}
              {deployTxStage === 'submitted' && '2/4 Transaction createAuction() submitted...'}
              {deployTxStage === 'pending' && '3/4 Pending block confirmation on Chain 31337...'}
              {deployTxStage === 'confirmed' && '4/4 Confirmed! Redirecting to auction lot...'}
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-[#1E293B]">
            <button
              type="button"
              onClick={() => setStep(4)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[#1E293B] text-xs font-medium text-slate-300 hover:text-white cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Modify ETH Terms</span>
            </button>

            {!isCorrectNetwork ? (
              <button
                type="button"
                onClick={switchNetworkToHardhat}
                className="px-5 py-2.5 rounded-lg bg-amber-500 text-slate-950 text-xs font-semibold cursor-pointer"
              >
                Switch to Hardhat Chain ID 31337
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSignAndCreateAuction}
                disabled={deployTxStage !== 'idle'}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#2563EB] hover:bg-blue-600 disabled:opacity-50 text-white text-xs font-semibold transition-colors cursor-pointer"
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
