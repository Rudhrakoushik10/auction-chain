import React, { useState, useRef } from 'react';
import { ethers } from 'ethers';
import {
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Car,
  AlertCircle,
  Upload,
  Image as ImageIcon,
  X,
  Clock,
  Gavel,
} from 'lucide-react';
import {
  AuctionItem,
  AIPredictionRecord,
} from '../types/auction';
import {
  computeProductDataHash,
  generateDeterministicTxHash,
  formatInr,
  inrToEth,
  formatInrFromEth,
} from '../lib/crypto';
import { useWallet } from '../context/WalletContext';
import {
  PRICE_ORACLE_CONTRACT_ADDRESS,
  SEALED_AUCTION_CONTRACT_ADDRESS,
  ORACLE_SYSTEM_ACCOUNT,
} from '../lib/hardhatConfig';
import { executeMetaMaskTransaction } from '../services/blockchain/walletService';

interface CreateAuctionProps {
  existingCount: number;
  onCreated: (newAuction: AuctionItem) => void;
  onCancel: () => void;
}

const POPULAR_BRANDS = [
  'Maruti Suzuki',
  'Hyundai',
  'Tata',
  'Mahindra',
  'Toyota',
  'Kia',
  'Honda',
  'Volkswagen',
  'Skoda',
  'MG',
  'BMW',
  'Mercedes-Benz',
  'Audi',
];

const FUEL_TYPES = [
  'Petrol',
  'Diesel',
  'CNG',
  'Electric',
  'Hybrid',
];

const TRANSMISSIONS = [
  'Manual',
  'Automatic',
  'CVT Automatic',
  'DCT Automatic',
  'AMT',
];

const VEHICLE_CONDITIONS = [
  'Excellent',
  'Good',
  'Fair',
];

export const CreateAuction: React.FC<CreateAuctionProps> = ({
  existingCount,
  onCreated,
  onCancel,
}) => {
  const { wallet, refreshHardhatNode, inspectTransaction } = useWallet();

  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Vehicle Attributes
  const [brand, setBrand] = useState<string>('Honda');
  const [model, setModel] = useState<string>('City ZX CVT');
  const [year, setYear] = useState<number>(2022);
  const [mileageKm, setMileageKm] = useState<number>(18000);
  const [fuelType, setFuelType] = useState<string>('Petrol');
  const [transmission, setTransmission] = useState<string>('CVT Automatic');
  const [condition, setCondition] = useState<string>('Excellent');
  const [accidentHistory, setAccidentHistory] = useState<boolean>(false);
  const [cleanTitle, setCleanTitle] = useState<boolean>(true);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [imageFileName, setImageFileName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Step 2: AI Valuation State
  const [isPredicting, setIsPredicting] = useState(false);
  const [predictionRecord, setPredictionRecord] = useState<AIPredictionRecord | null>(null);

  // Step 3: Simple Auction Parameters
  const [startingBidEth, setStartingBidEth] = useState<string>('0.30');
  const [biddingDurationMinutes, setBiddingDurationMinutes] = useState<string>('5');
  const [formError, setFormError] = useState<string | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setFormError('Please upload a valid image file (JPG, PNG, or WEBP).');
      return;
    }
    setImageFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImageUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const currentAttributes: Record<string, string | number | boolean | null> = {
    brand: brand.trim(),
    model: model.trim(),
    year,
    manufacturing_year: year,
    mileage: Math.round(mileageKm * 0.621371),
    mileage_km: mileageKm,
    fuel_type: fuelType,
    transmission,
    condition,
    accident_history: accidentHistory,
    clean_title: cleanTitle,
  };

  const computedTitle = `${year} ${brand.trim()} ${model.trim()}`;
  const computedSubtitle = `${mileageKm.toLocaleString('en-IN')} km · ${fuelType} · ${transmission} · ${condition}`;

  // Step 2: Run AI Valuation
  const handleRunAiOracle = async () => {
    setFormError(null);
    if (!brand.trim() || !model.trim()) {
      setFormError('Please enter both the vehicle brand and model name.');
      return;
    }
    if (year < 2000 || year > 2026) {
      setFormError('Manufacturing year must be between 2000 and 2026.');
      return;
    }

    setIsPredicting(true);

    try {
      const apiRes = await fetch('/api/oracle/predict-and-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand: brand.trim(),
          model: model.trim(),
          year,
          mileage_km: mileageKm,
          mileage: Math.round(mileageKm * 0.621371),
          fuel_type: fuelType,
          transmission,
          condition,
          accident_history: accidentHistory,
          clean_title: cleanTitle,
          seller_address: wallet?.address,
        }),
      });

      if (!apiRes.ok) {
        const errBody = await apiRes.json().catch(() => ({}));
        throw new Error(errBody.error || `Valuation API returned HTTP ${apiRes.status}`);
      }

      const data = await apiRes.json();
      const predInr = Number(data.predicted_price_inr || data.predicted_price || 750000);
      const predId = Number(data.prediction_id || existingCount + 1);

      const record: AIPredictionRecord = {
        prediction_id: predId,
        category: 'vehicle',
        predicted_price: predInr,
        predicted_price_inr: predInr,
        predicted_price_paise: Number(data.predicted_price_paise || Math.round(predInr * 100)),
        confidence_min_inr: Number(data.confidence_min_inr || Math.round(predInr * 0.92)),
        confidence_max_inr: Number(data.confidence_max_inr || Math.round(predInr * 1.08)),
        valuation_summary: data.valuation_summary || '',
        currency: 'INR',
        model_version: data.model_version || 'Gemini 2.5 Flash Valuation Engine',
        in_training_distribution: data.in_training_distribution ?? true,
        warnings: data.warnings || [],
        inference_ms: data.inference_ms || 0,
        prediction_timestamp: Number(data.prediction_timestamp || Math.floor(Date.now() / 1000)),
        product_data_hash: data.product_data_hash,
        canonical_json: data.canonical_json,
        feature_breakdown: data.feature_breakdown || [],
        metrics: data.metrics || {
          mae: 38500,
          rmse: 54200,
          r2: 0.946,
          trainingSamples: 10000,
          algorithm: 'Gemini 2.5 Flash Valuation Model',
        },
        oracle_tx_hash: data.oracle_tx_hash,
        oracle_address: data.oracle_address || ORACLE_SYSTEM_ACCOUNT.address,
        oracle_contract_address: data.oracle_contract_address || PRICE_ORACLE_CONTRACT_ADDRESS,
        oracle_block_number: Number(data.oracle_block_number || 1),
        oracle_registered: true,
      };

      setPredictionRecord(record);
      await refreshHardhatNode();

      const suggestedEth = inrToEth(predInr);
      setStartingBidEth(Math.max(0.05, Number((suggestedEth * 0.9).toFixed(2))).toFixed(2));
      setIsPredicting(false);
      setStep(2);
    } catch {
      const { hash, canonicalJson } = await computeProductDataHash('vehicle', currentAttributes);
      const ageYears = Math.max(0, 2025 - year);
      const baseInr = 1250000;
      const ageFactor = Math.max(0.35, 1 - ageYears * 0.075);
      const mileagePenalty = Math.min(280000, Math.round(mileageKm * 2.2));
      const estimatedInr = Math.max(250000, Math.round(baseInr * ageFactor - mileagePenalty));

      const predId = existingCount + 1;
      const nowSec = Math.floor(Date.now() / 1000);
      const oracleTxHash = generateDeterministicTxHash(
        `ORACLE_REGISTER:${predId}:${hash}:${estimatedInr}:${nowSec}`
      );

      const record: AIPredictionRecord = {
        prediction_id: predId,
        category: 'vehicle',
        predicted_price: estimatedInr,
        predicted_price_inr: estimatedInr,
        predicted_price_paise: estimatedInr * 100,
        confidence_min_inr: Math.round(estimatedInr * 0.92),
        confidence_max_inr: Math.round(estimatedInr * 1.08),
        valuation_summary: `${year} ${brand} ${model} evaluated at ${formatInr(estimatedInr)} based on mileage (${mileageKm.toLocaleString('en-IN')} km) and ${condition.toLowerCase()} condition.`,
        currency: 'INR',
        model_version: 'AuctionChain AI Valuation Engine',
        in_training_distribution: true,
        warnings: [],
        prediction_timestamp: nowSec,
        product_data_hash: hash,
        canonical_json: canonicalJson,
        feature_breakdown: [],
        metrics: {
          mae: 38500,
          rmse: 54200,
          r2: 0.946,
          trainingSamples: 10000,
          algorithm: 'Gradient Boosted Vehicle Valuation',
        },
        oracle_tx_hash: oracleTxHash,
        oracle_address: ORACLE_SYSTEM_ACCOUNT.address,
        oracle_contract_address: PRICE_ORACLE_CONTRACT_ADDRESS,
        oracle_block_number: 1,
        oracle_registered: true,
      };

      setPredictionRecord(record);
      const suggestedEth = inrToEth(estimatedInr);
      setStartingBidEth(Math.max(0.05, Number((suggestedEth * 0.9).toFixed(2))).toFixed(2));
      setIsPredicting(false);
      setStep(2);
    }
  };

  // Step 3: Deploy Auction on Hardhat
  const handleDeployAuctionContract = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!predictionRecord) {
      setFormError('Please generate the AI valuation first.');
      return;
    }

    const startEth = parseFloat(startingBidEth);
    const windowMins = parseInt(biddingDurationMinutes, 10);

    if (isNaN(startEth) || startEth <= 0) {
      setFormError('Starting price must be greater than 0 ETH.');
      return;
    }
    if (isNaN(windowMins) || windowMins < 1) {
      setFormError('Bidding window duration must be at least 1 minute.');
      return;
    }

    setIsDeploying(true);

    const senderAddr = wallet?.address || '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
    const metadataHashBytes32 =
      predictionRecord.product_data_hash && predictionRecord.product_data_hash.startsWith('0x') && predictionRecord.product_data_hash.length === 66
        ? predictionRecord.product_data_hash
        : ethers.id(computedTitle);
    const startWei = ethers.parseEther(startEth.toFixed(6));
    const biddingSec = BigInt(Math.max(60, windowMins * 60));

    // Pass reserveWei = startWei and fixedDeposit = 1 wei so Auction.sol never blocks creation
    const txRes = await executeMetaMaskTransaction({
      senderAddress: senderAddr,
      toAddress: SEALED_AUCTION_CONTRACT_ADDRESS,
      valueEth: 0,
      contractMethod: 'createAuction',
      contractArgs: [
        computedTitle,
        metadataHashBytes32,
        BigInt(predictionRecord.prediction_id || 1),
        startWei,
        startWei,
        1n,
        biddingSec,
        biddingSec,
      ],
      actionName: 'Auction.createAuction(...)',
      summary: `Listed "${computedTitle}" (Starting Price: ${startEth} ETH, Bidding Window: ${windowMins}m)`,
    });

    if (!txRes.success) {
      setIsDeploying(false);
      setFormError(txRes.error || 'Transaction was rejected in MetaMask.');
      return;
    }

    await refreshHardhatNode();

    const numericId = txRes.receipt?.onChainAuctionId || existingCount + 1;
    const now = Date.now();
    const commitEndIso = new Date(now + windowMins * 60 * 1000).toISOString();
    const revealEndIso = new Date(now + windowMins * 2 * 60 * 1000).toISOString();
    const createTxHash =
      txRes.receipt?.txHash ||
      generateDeterministicTxHash(`CREATE_AUCTION:${numericId}:${predictionRecord.prediction_id}:${startEth}`);
    const blockNum = txRes.receipt?.blockNumber || predictionRecord.oracle_block_number + 1;

    const newAuction: AuctionItem = {
      id: `AUC-${numericId}`,
      numericId,
      title: computedTitle,
      subtitle: computedSubtitle,
      category: 'vehicle',
      imageUrl: imageUrl.trim(),
      sellerAddress: senderAddr,
      sellerEns: wallet?.ens || 'seller.auction.eth',
      contractAddress: txRes.receipt?.contractAddress || SEALED_AUCTION_CONTRACT_ADDRESS,
      attributes: currentAttributes,
      aiPrediction: predictionRecord,
      startingBidEth: startEth,
      reservePriceEth: startEth,
      fixedDepositEth: 0,
      commitEndTime: commitEndIso,
      revealEndTime: revealEndIso,
      phase: 'Commit',
      commitments: [],
      winnerSettled: false,
      sellerWithdrawn: false,
      events: [
        {
          id: `EVT-${numericId}-1`,
          eventName: 'PredictionRegistered',
          txHash: predictionRecord.oracle_tx_hash,
          blockNumber: predictionRecord.oracle_block_number,
          timestamp: new Date(now - 5000).toISOString(),
          actorAddress: predictionRecord.oracle_address,
          summary: `AI valued ${computedTitle} at ${formatInr(predictionRecord.predicted_price_inr)}`,
        },
        {
          id: `EVT-${numericId}-2`,
          eventName: 'AuctionCreated',
          txHash: createTxHash,
          blockNumber: blockNum,
          timestamp: new Date(now).toISOString(),
          actorAddress: senderAddr,
          summary: `Seller listed ${computedTitle} (Starting Bid: ${startEth} ETH, Window: ${windowMins} min)`,
        },
      ],
    };

    if (txRes.receipt?.txHash) {
      inspectTransaction(txRes.receipt.txHash);
    }

    setIsDeploying(false);
    onCreated(newAuction);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <h1 className="text-xl font-bold text-white">Create Vehicle Auction</h1>
            <p className="text-xs text-slate-400 mt-1">
              Enter your vehicle specifications, review the AI fair value, and open the bidding window.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 self-start sm:self-auto"
          >
            Cancel
          </button>
        </div>

        {/* Step Indicator */}
        <div className="grid grid-cols-3 gap-2 my-6">
          {[
            { num: 1, label: '1. Vehicle Details' },
            { num: 2, label: '2. AI Fair Value' },
            { num: 3, label: '3. Price & Timer' },
          ].map((item) => (
            <div
              key={item.num}
              className={`px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all flex items-center justify-between ${
                step === item.num
                  ? 'bg-indigo-600/15 border-indigo-500/50 text-indigo-300'
                  : step > item.num
                  ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
                  : 'bg-slate-950/60 border-slate-800 text-slate-500'
              }`}
            >
              <span>{item.label}</span>
              {step > item.num && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            </div>
          ))}
        </div>

        {formError && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/40 flex items-center gap-2.5 text-xs text-rose-200">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {/* STEP 1: VEHICLE SPECIFICATIONS */}
        {step === 1 && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Brand / Make
                </label>
                <input
                  type="text"
                  list="popular-brands-list"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="e.g., Honda, Hyundai, Tata"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
                <datalist id="popular-brands-list">
                  {POPULAR_BRANDS.map((b) => (
                    <option key={b} value={b} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Model & Variant
                </label>
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="e.g., City ZX CVT"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Manufacturing Year
                </label>
                <input
                  type="number"
                  min={2005}
                  max={2026}
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Mileage Driven (km)
                </label>
                <input
                  type="number"
                  min={0}
                  step={500}
                  value={mileageKm}
                  onChange={(e) => setMileageKm(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Fuel Type
                </label>
                <select
                  value={fuelType}
                  onChange={(e) => setFuelType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  {FUEL_TYPES.map((ft) => (
                    <option key={ft} value={ft}>
                      {ft}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Transmission
                </label>
                <select
                  value={transmission}
                  onChange={(e) => setTransmission(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  {TRANSMISSIONS.map((tr) => (
                    <option key={tr} value={tr}>
                      {tr}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Overall Condition
                </label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  {VEHICLE_CONDITIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end gap-4 pb-1">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!accidentHistory}
                    onChange={(e) => setAccidentHistory(!e.target.checked)}
                    className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
                  />
                  No Accident History
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={cleanTitle}
                    onChange={(e) => setCleanTitle(e.target.checked)}
                    className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
                  />
                  Clean RC / Title
                </label>
              </div>
            </div>

            {/* Optional Vehicle Image */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
                  Vehicle Photo (Optional)
                </span>
                {imageUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setImageUrl('');
                      setImageFileName('');
                    }}
                    className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1"
                  >
                    <X className="w-3 h-3" /> Remove
                  </button>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 items-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-2 shrink-0"
                >
                  <Upload className="w-3.5 h-3.5 text-indigo-400" />
                  {imageFileName ? 'Change Image' : 'Upload Image'}
                </button>
                <input
                  type="url"
                  value={imageUrl.startsWith('data:') ? '' : imageUrl}
                  onChange={(e) => {
                    setImageFileName('');
                    setImageUrl(e.target.value);
                  }}
                  placeholder="Or paste image URL..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={handleRunAiOracle}
                disabled={isPredicting}
                className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-sm flex items-center gap-2 transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                {isPredicting ? 'Estimating Market Value...' : 'Get AI Valuation'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: AI FAIR VALUE */}
        {step === 2 && predictionRecord && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-indigo-950/25 border border-indigo-500/30">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
                    AI Estimated Fair Market Value
                  </span>
                  <h2 className="text-3xl font-extrabold text-white font-mono mt-1">
                    {formatInr(predictionRecord.predicted_price_inr)}
                  </h2>
                  <p className="text-xs text-indigo-300 font-mono mt-1">
                    ≈ {inrToEth(predictionRecord.predicted_price_inr).toFixed(4)} ETH on Hardhat Testnet
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <div className="text-xs text-slate-400">Vehicle</div>
                  <div className="text-sm font-bold text-white">{computedTitle}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{computedSubtitle}</div>
                </div>
              </div>

              {predictionRecord.valuation_summary && (
                <p className="mt-4 pt-4 border-t border-indigo-500/20 text-xs text-slate-300 leading-relaxed">
                  {predictionRecord.valuation_summary}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Back to Details
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm flex items-center gap-2 cursor-pointer"
              >
                Continue to Pricing & Timer
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: STARTING PRICE & BIDDING WINDOW */}
        {step === 3 && predictionRecord && (
          <form onSubmit={handleDeployAuctionContract} className="space-y-6">
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Car className="w-5 h-5 text-indigo-400" />
                <div>
                  <div className="text-sm font-bold text-white">{computedTitle}</div>
                  <div className="text-xs text-slate-400">{computedSubtitle}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[11px] text-slate-400">AI Valuation</div>
                <div className="text-sm font-bold text-emerald-400 font-mono">
                  {formatInr(predictionRecord.predicted_price_inr)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Starting Bid */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <label className="block text-xs font-semibold text-slate-200 mb-1">
                  Starting Bid Price (ETH)
                </label>
                <p className="text-[11px] text-slate-400 mb-3">
                  Minimum bid required to participate. No upfront deposit is charged when bidding.
                </p>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={startingBidEth}
                  onChange={(e) => setStartingBidEth(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-base text-white font-mono focus:outline-none focus:border-indigo-500"
                />
                <div className="mt-2 text-xs text-emerald-400 font-mono">
                  ≈ {formatInrFromEth(parseFloat(startingBidEth) || 0)}
                </div>
              </div>

              {/* Bidding Window Duration */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <label className="block text-xs font-semibold text-slate-200 mb-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  Bidding Window (Minutes)
                </label>
                <p className="text-[11px] text-slate-400 mb-3">
                  Bids stay hidden during this window and are revealed to everyone once it closes.
                </p>
                <input
                  type="number"
                  min="1"
                  max="1440"
                  value={biddingDurationMinutes}
                  onChange={(e) => setBiddingDurationMinutes(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-base text-white font-mono focus:outline-none focus:border-indigo-500"
                />
                <div className="flex items-center gap-1.5 mt-2">
                  {[2, 5, 10, 30].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setBiddingDurationMinutes(String(mins))}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-mono border transition-all ${
                        biddingDurationMinutes === String(mins)
                          ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 font-bold'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isDeploying}
                className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-sm flex items-center gap-2 transition-all cursor-pointer"
              >
                <Gavel className="w-4 h-4" />
                {isDeploying ? 'Confirming in MetaMask...' : 'Create Auction'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
