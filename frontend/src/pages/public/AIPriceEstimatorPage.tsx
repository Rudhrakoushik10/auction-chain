import React, { useState } from 'react';
import {
  Calculator,
  Cpu,
  Sparkles,
  Info,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  Sliders,
  CheckCircle2,
} from 'lucide-react';
import { VehicleAttributes, AIPredictionRecord } from '../../types/auction';
import { simulateVehiclePricePrediction } from '../../services/mock/mockAIService';
import { useWallet } from '../../context/WalletContext';

export const AIPriceEstimatorPage: React.FC = () => {
  const { openAuthModal, isConnected, wallet } = useWallet();

  const [formData, setFormData] = useState<VehicleAttributes>({
    brand: 'BMW',
    model: 'iX1 xDrive30 M Sport',
    manufacturing_year: 2024,
    mileage_km: 9200,
    fuel_type: 'Electric',
    transmission: 'Automatic',
    condition: 'Like New',
    original_price_inr: 6690000,
  });

  const [prediction, setPrediction] = useState<AIPredictionRecord | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const handleInputChange = (field: keyof VehicleAttributes, val: any) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  const handleEstimate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCalculating(true);
    try {
      const res = await simulateVehiclePricePrediction(formData);
      setPrediction(res);
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <div className="space-y-10 pb-16 animate-in fade-in duration-200">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3 pt-4">
        <span className="text-xs font-mono font-bold tracking-widest uppercase px-3 py-1 rounded bg-[#2563EB]/10 text-[#2563EB] border border-[#2563EB]/20">
          Machine Learning Resale Valuation
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#101B3D] tracking-tight">
          AI Vehicle Price Estimator
        </h1>
        <p className="text-base text-slate-600 leading-relaxed">
          Trained on historical automotive transactions to calculate fair vehicle market valuations based on vehicle age, odometer mileage, drivetrain, and cosmetic condition.
        </p>
      </div>

      {/* Main Grid: Form Left, Output Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-[#E2E8F0] p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 pb-5 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#101B3D]">Vehicle Information Form</h2>
              <p className="text-xs text-slate-500">
                Input attributes supported by the vehicle-v1 regression pipeline
              </p>
            </div>
          </div>

          <form onSubmit={handleEstimate} className="space-y-5 pt-5">
            {/* Brand & Model */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#101B3D] uppercase tracking-wider mb-1.5">
                  Brand / Make
                </label>
                <select
                  value={formData.brand}
                  onChange={(e) => handleInputChange('brand', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 bg-white"
                >
                  <option value="BMW">BMW</option>
                  <option value="Mercedes-Benz">Mercedes-Benz</option>
                  <option value="Audi">Audi</option>
                  <option value="Tesla">Tesla</option>
                  <option value="Hyundai">Hyundai</option>
                  <option value="Tata Motors">Tata Motors</option>
                  <option value="Mahindra">Mahindra</option>
                  <option value="Toyota">Toyota</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#101B3D] uppercase tracking-wider mb-1.5">
                  Model Variant
                </label>
                <input
                  type="text"
                  value={formData.model}
                  onChange={(e) => handleInputChange('model', e.target.value)}
                  required
                  placeholder="e.g. iX1 xDrive30"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
                />
              </div>
            </div>

            {/* Year & Mileage */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#101B3D] uppercase tracking-wider mb-1.5">
                  Manufacturing Year
                </label>
                <input
                  type="number"
                  min="2012"
                  max="2026"
                  value={formData.manufacturing_year}
                  onChange={(e) => handleInputChange('manufacturing_year', Number(e.target.value))}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#101B3D] uppercase tracking-wider mb-1.5">
                  Mileage (Odometer km)
                </label>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={formData.mileage_km}
                  onChange={(e) => handleInputChange('mileage_km', Number(e.target.value))}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
                />
              </div>
            </div>

            {/* Fuel Type & Transmission */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#101B3D] uppercase tracking-wider mb-1.5">
                  Fuel Type
                </label>
                <select
                  value={formData.fuel_type}
                  onChange={(e) => handleInputChange('fuel_type', e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 bg-white"
                >
                  <option value="Electric">Electric</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="Petrol">Petrol</option>
                  <option value="Diesel">Diesel</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#101B3D] uppercase tracking-wider mb-1.5">
                  Transmission
                </label>
                <select
                  value={formData.transmission}
                  onChange={(e) => handleInputChange('transmission', e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 bg-white"
                >
                  <option value="Automatic">Automatic</option>
                  <option value="Manual">Manual</option>
                </select>
              </div>
            </div>

            {/* Condition & Original Price */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#101B3D] uppercase tracking-wider mb-1.5">
                  Physical Condition
                </label>
                <select
                  value={formData.condition}
                  onChange={(e) => handleInputChange('condition', e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 bg-white"
                >
                  <option value="Like New">Like New (Mint, full warranty)</option>
                  <option value="Excellent">Excellent (Minor cosmetic wear)</option>
                  <option value="Good">Good (Regular road use)</option>
                  <option value="Fair">Fair (Noticeable wear)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#101B3D] uppercase tracking-wider mb-1.5">
                  Original Invoice Price (INR ₹)
                </label>
                <input
                  type="number"
                  min="200000"
                  step="50000"
                  value={formData.original_price_inr}
                  onChange={(e) => handleInputChange('original_price_inr', Number(e.target.value))}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isCalculating}
              className="w-full py-3 px-6 rounded-xl text-sm font-bold text-white bg-[#2563EB] hover:bg-blue-600 transition-all shadow-md shadow-[#2563EB]/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              <Calculator className="w-4 h-4" />
              <span>{isCalculating ? 'Computing Valuation...' : 'Calculate AI Price Estimate'}</span>
            </button>
          </form>
        </div>

        {/* Right Output & Explanations (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {prediction ? (
            <div className="bg-white rounded-2xl border border-[#2563EB]/40 p-6 shadow-md space-y-5 animate-in fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-mono font-bold text-[#2563EB] uppercase">
                  Valuation Result
                </span>
                <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Model: {prediction.model_version}
                </span>
              </div>

              <div>
                <span className="text-xs font-medium text-slate-500">Estimated Resale Price</span>
                <div className="text-3xl sm:text-4xl font-extrabold text-[#101B3D] tracking-tight mt-1">
                  ₹{prediction.predicted_price_inr.toLocaleString('en-IN')}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  ({(prediction.predicted_price_paise / 100).toLocaleString('en-IN')} INR equivalent)
                </div>
              </div>

              {/* Feature Breakdown */}
              <div className="space-y-2 pt-2">
                <span className="text-xs font-bold text-[#101B3D] uppercase tracking-wider">
                  Feature Weight Drivers
                </span>
                <div className="space-y-1.5">
                  {prediction.feature_breakdown.map((f, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-xs bg-[#F8FAFC] p-2 rounded-lg border border-[#E2E8F0]"
                    >
                      <span className="text-slate-700 font-medium truncate mr-2">{f.factor}</span>
                      <span className="font-mono text-slate-600 shrink-0 font-semibold">{f.impact}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Accuracy Metrics */}
              <div className="bg-[#101B3D] text-white p-4 rounded-xl text-xs space-y-2">
                <div className="flex items-center justify-between text-[#06B6D4] font-bold">
                  <span>Model Performance Metrics</span>
                  <span>R² = {prediction.metrics.r2}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300 font-mono">
                  <div>MAE: ₹{prediction.metrics.mae.toLocaleString('en-IN')}</div>
                  <div>RMSE: ₹{prediction.metrics.rmse.toLocaleString('en-IN')}</div>
                  <div className="col-span-2">Trained Samples: {prediction.metrics.trainingSamples.toLocaleString()}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#2563EB] mx-auto flex items-center justify-center">
                <Calculator className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-[#101B3D]">No Estimate Generated Yet</h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                Fill in the vehicle attributes and click "Calculate AI Price Estimate" to view predicted resale market value.
              </p>
            </div>
          )}

          {/* Mandatory Informational Disclaimer (Section 2) */}
          <div className="bg-amber-50 rounded-2xl border border-amber-200 p-5 space-y-2 text-xs text-amber-900">
            <div className="flex items-center gap-2 font-bold text-amber-950">
              <Info className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Informational Estimation Disclaimer</span>
            </div>
            <p className="leading-relaxed">
              This estimate is strictly <span className="font-semibold">informational guidance</span> derived from the vehicle-v1 machine learning model and historical market trends. It is <span className="font-semibold">not a guaranteed sale price</span> or a formal financial appraisal. Market outcomes depend on buyer participation, bidding competition, and seller-set reserve thresholds.
            </p>
          </div>

          {/* Registration Distinction Note (Section 2) */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 space-y-2.5 text-xs text-slate-600">
            <div className="flex items-center gap-2 font-bold text-[#101B3D]">
              <ShieldCheck className="w-4 h-4 text-[#2563EB] shrink-0" />
              <span>Viewing vs. On-Chain Oracle Registration</span>
            </div>
            <p className="leading-relaxed">
              Viewing this estimate here is completely free, off-chain, and does not require connecting a wallet or spending gas.
            </p>
            <p className="leading-relaxed">
              When a seller creates a live vehicle auction, this valuation is cryptographically hashed with its canonical specification and registered on <span className="font-mono font-bold text-[#101B3D]">PriceOracle.sol</span> by the background Oracle relayer (Account 5).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
