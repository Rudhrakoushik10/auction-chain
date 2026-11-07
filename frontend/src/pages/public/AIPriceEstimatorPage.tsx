import React, { useState } from 'react';
import { Calculator, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { VehicleAttributes, AIPredictionRecord } from '../../types/auction';
import { predictVehiclePrice } from '../../services/api/aiService';
import { formatInr, toInrPaise, shortenAddress } from '../../lib/crypto';

const PRESET_EXAMPLES: Array<{ label: string; data: VehicleAttributes }> = [
  {
    label: `2020 Ford F-150 XLT (${formatInr(46216.25)})`,
    data: {
      brand: 'Ford',
      model: 'F-150 XLT',
      year: 2020,
      mileage: 45000,
      fuel_type: 'Gasoline',
      engine_type: '3.5L V6 400hp Twin Turbo',
      transmission: '10-Speed Automatic',
      exterior_color: 'Black',
      interior_color: 'Black',
      accident_history: false,
      clean_title: true,
    },
  },
  {
    label: `2023 BMW X5 xDrive40i (${formatInr(69696.35)})`,
    data: {
      brand: 'BMW',
      model: 'X5 xDrive40i',
      year: 2023,
      mileage: 12500,
      fuel_type: 'Gasoline',
      engine_type: '3.0L I6 335hp Turbo',
      transmission: '8-Speed Automatic',
      exterior_color: 'Black',
      interior_color: 'Black',
      accident_history: false,
      clean_title: true,
    },
  },
  {
    label: `2022 Porsche Taycan Base (${formatInr(77282.87)})`,
    data: {
      brand: 'Porsche',
      model: 'Taycan Base',
      year: 2022,
      mileage: 14800,
      fuel_type: 'Electric',
      engine_type: 'Electric Motor',
      transmission: 'Automatic',
      exterior_color: 'Silver',
      interior_color: 'Black',
      accident_history: false,
      clean_title: true,
    },
  },
];

export const AIPriceEstimatorPage: React.FC = () => {
  const [formData, setFormData] = useState<VehicleAttributes>(PRESET_EXAMPLES[0].data);
  const [prediction, setPrediction] = useState<AIPredictionRecord | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleInputChange = (field: keyof VehicleAttributes, val: any) => {
    setValidationError(null);
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  const handleEstimate = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!formData.brand.trim()) {
      setValidationError('Brand / manufacturer is required.');
      return;
    }
    if (!formData.model.trim()) {
      setValidationError('Vehicle model and trim is required.');
      return;
    }
    if (formData.year < 1900 || formData.year > 2028) {
      setValidationError('Model year must be between 1900 and 2028 (training range: 1974–2024).');
      return;
    }
    if (formData.mileage < 0 || formData.mileage > 1500000) {
      setValidationError('Mileage must be between 0 and 1,500,000 miles.');
      return;
    }

    setIsCalculating(true);
    try {
      const res = await predictVehiclePrice(formData);
      setPrediction({
        ...res,
        oracle_registered: false,
      });
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Page Header */}
      <div className="border-b border-[#1E293B] pb-6 space-y-1.5">
        <div className="text-xs font-mono text-slate-400">
          Off-Chain Advisory Valuation · LightGBM v1.0.0 (Displayed in INR · ₹ · Miles)
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          AI Vehicle Price Estimator
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-3xl leading-relaxed">
          Trained on 4,009 used-vehicle listings (<code className="text-slate-200">dataset/raw/used_cars.csv</code>) using a grouped 70/15/15 split. Estimates are strictly advisory, converted and displayed in Indian Rupees (<code className="text-slate-200">₹ / INR</code>) with odometer readings in miles (<code className="text-slate-200">mi.</code>), and never execute blockchain transactions directly.
        </p>
      </div>

      {/* Main Grid: Form Left (7 cols), Output Right (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <section className="lg:col-span-7 bg-[#0F172A] rounded-xl border border-[#1E293B] p-6 space-y-6">
          <div className="border-b border-[#1E293B] pb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-white">Vehicle Listing Attributes</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Required: brand, model, year, mileage (mi.) · Optional: powertrain, color & history
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400">Units: INR (₹) · Miles (mi.)</span>
          </div>

          {/* Quick Benchmark Presets */}
          <div className="space-y-1.5">
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
              Load Verified Benchmark Vehicle
            </div>
            <div className="flex flex-wrap gap-2">
              {PRESET_EXAMPLES.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    setValidationError(null);
                    setFormData(preset.data);
                  }}
                  className="px-3 py-1.5 rounded-lg border border-[#1E293B] bg-[#090D1A] hover:border-slate-600 text-xs text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {validationError && (
            <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-500/30 text-xs text-rose-200">
              {validationError}
            </div>
          )}

          <form onSubmit={handleEstimate} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Brand / Manufacturer *
                </label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={(e) => handleInputChange('brand', e.target.value)}
                  placeholder="e.g., Ford, BMW, Porsche, Tesla, Toyota"
                  className="w-full px-3.5 py-2 rounded-lg border border-[#1E293B] bg-[#090D1A] text-xs font-medium text-white focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Model & Trim *
                </label>
                <input
                  type="text"
                  value={formData.model}
                  onChange={(e) => handleInputChange('model', e.target.value)}
                  placeholder="e.g., F-150 XLT, X5 xDrive40i, Model 3 Long Range"
                  className="w-full px-3.5 py-2 rounded-lg border border-[#1E293B] bg-[#090D1A] text-xs font-medium text-white focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Model Year (Training: 1974–2024) *
                </label>
                <input
                  type="number"
                  min="1900"
                  max="2028"
                  value={formData.year}
                  onChange={(e) => handleInputChange('year', Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-lg border border-[#1E293B] bg-[#090D1A] text-xs font-mono text-white tabular-nums focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Odometer Mileage (miles / mi.) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={formData.mileage}
                  onChange={(e) => handleInputChange('mileage', Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-lg border border-[#1E293B] bg-[#090D1A] text-xs font-mono text-white tabular-nums focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Fuel Type
                </label>
                <select
                  value={formData.fuel_type || ''}
                  onChange={(e) => handleInputChange('fuel_type', e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-[#1E293B] bg-[#090D1A] text-xs font-medium text-white focus:outline-none focus:border-[#2563EB]"
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
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Engine Description (Free Text)
                </label>
                <input
                  type="text"
                  value={formData.engine_type || ''}
                  onChange={(e) => handleInputChange('engine_type', e.target.value)}
                  placeholder="e.g., 3.5L V6 400hp Twin Turbo or Electric Motor"
                  className="w-full px-3.5 py-2 rounded-lg border border-[#1E293B] bg-[#090D1A] text-xs font-medium text-white focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Transmission
                </label>
                <input
                  type="text"
                  value={formData.transmission || ''}
                  onChange={(e) => handleInputChange('transmission', e.target.value)}
                  placeholder="e.g., 10-Speed Automatic, 6-Speed Manual, Single-Speed"
                  className="w-full px-3.5 py-2 rounded-lg border border-[#1E293B] bg-[#090D1A] text-xs font-medium text-white focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Accident / Damage History
                </label>
                <select
                  value={
                    formData.accident_history === true
                      ? 'yes'
                      : formData.accident_history === false
                      ? 'no'
                      : 'unknown'
                  }
                  onChange={(e) => {
                    const v = e.target.value;
                    handleInputChange(
                      'accident_history',
                      v === 'yes' ? true : v === 'no' ? false : null
                    );
                  }}
                  className="w-full px-3.5 py-2 rounded-lg border border-[#1E293B] bg-[#090D1A] text-xs font-medium text-white focus:outline-none focus:border-[#2563EB]"
                >
                  <option value="no">None Reported (False)</option>
                  <option value="yes">Accident / Damage Reported (True)</option>
                  <option value="unknown">Unknown / Not Reported</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Exterior Color
                </label>
                <input
                  type="text"
                  value={formData.exterior_color || ''}
                  onChange={(e) => handleInputChange('exterior_color', e.target.value)}
                  placeholder="e.g., Black, White, Silver, Gray, Blue"
                  className="w-full px-3.5 py-2 rounded-lg border border-[#1E293B] bg-[#090D1A] text-xs font-medium text-white focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Interior Color
                </label>
                <input
                  type="text"
                  value={formData.interior_color || ''}
                  onChange={(e) => handleInputChange('interior_color', e.target.value)}
                  placeholder="e.g., Black, Gray, Beige, Brown"
                  className="w-full px-3.5 py-2 rounded-lg border border-[#1E293B] bg-[#090D1A] text-xs font-medium text-white focus:outline-none focus:border-[#2563EB]"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-[#1E293B] flex items-center justify-between gap-4">
              <span className="text-[11px] text-slate-500">
                Note: <code className="text-slate-400">clean_title</code> is accepted for API compatibility (neutral effect).
              </span>
              <button
                type="submit"
                disabled={isCalculating}
                className="px-5 py-2.5 rounded-lg text-xs font-semibold text-white bg-[#2563EB] hover:bg-blue-600 transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Calculator className="w-4 h-4" />
                <span>{isCalculating ? 'Scoring LightGBM Trees...' : 'Calculate Advisory Estimate'}</span>
              </button>
            </div>
          </form>
        </section>

        {/* Right Output Column (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {prediction ? (
            <section className="bg-[#0F172A] rounded-xl border border-[#1E293B] p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-[#1E293B] pb-4 text-xs font-mono text-slate-400">
                <span>LightGBM v{prediction.model_version}</span>
                <span
                  className={`inline-flex items-center gap-1.5 ${
                    prediction.in_training_distribution !== false
                      ? 'text-emerald-400'
                      : 'text-amber-400'
                  }`}
                >
                  {prediction.in_training_distribution !== false ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>In Training Distribution</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Out-of-Distribution</span>
                    </>
                  )}
                </span>
              </div>

              <div>
                <div className="text-xs text-slate-400">Advisory Predicted Market Price (INR)</div>
                <div className="text-3xl font-mono font-bold text-white tracking-tight mt-1 tabular-nums">
                  {formatInr(prediction.predicted_price)}
                </div>
                <div className="text-xs font-mono text-slate-500 mt-1 tabular-nums">
                  Oracle integer representation: {toInrPaise(prediction.predicted_price).toLocaleString('en-IN')} paise · Latency: {prediction.inference_ms ?? 1.5} ms
                </div>
              </div>

              {prediction.warnings && prediction.warnings.length > 0 && (
                <div className="p-3.5 rounded-lg bg-amber-950/30 border border-amber-500/30 space-y-1.5">
                  <div className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>Model Advisory Warnings ({prediction.warnings.length})</span>
                  </div>
                  <ul className="space-y-1 text-xs text-amber-200/90 list-disc list-inside">
                    {prediction.warnings.map((w, idx) => (
                      <li key={idx}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Engineered Feature Summary */}
              <div className="space-y-2 pt-2 border-t border-[#1E293B]">
                <div className="text-xs font-semibold text-slate-300">
                  Engineered Feature Signals (19 Features)
                </div>
                <div className="divide-y divide-[#1E293B] border-t border-b border-[#1E293B]">
                  {prediction.feature_breakdown.map((f, i) => (
                    <div
                      key={i}
                      className="py-2 flex items-center justify-between text-xs"
                    >
                      <span className="text-slate-300 truncate mr-2">{f.factor}</span>
                      <span className="font-mono text-white font-semibold shrink-0 tabular-nums">
                        {f.impact}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Canonical Hash & Validation Metrics */}
              <dl className="space-y-1.5 text-xs font-mono tabular-nums text-slate-400">
                <div className="flex justify-between">
                  <dt className="font-sans">Held-Out Test R² / MAE</dt>
                  <dd className="text-slate-200">
                    {prediction.metrics.r2} (0.8571 trimmed) / ±{formatInr(prediction.metrics.mae)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="font-sans">SHA-256 Data Hash</dt>
                  <dd className="text-slate-200" title={prediction.product_data_hash}>
                    {shortenAddress(prediction.product_data_hash)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="font-sans">Oracle Status</dt>
                  <dd className="text-amber-400 font-sans">Off-Chain Advisory Only</dd>
                </div>
              </dl>
            </section>
          ) : (
            <section className="bg-[#0F172A] rounded-xl border border-[#1E293B] p-8 text-center space-y-2">
              <h3 className="text-sm font-semibold text-white">No Estimate Computed Yet</h3>
              <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
                Enter vehicle attributes on the left and click &ldquo;Calculate Advisory Estimate&rdquo; to run the 934-tree LightGBM booster in INR (₹).
              </p>
            </section>
          )}

          {/* Model Comparison Table from vehicle-price-ai */}
          <section className="bg-[#0F172A] rounded-xl border border-[#1E293B] overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#1E293B] flex items-center justify-between">
              <span className="text-xs font-semibold text-white">
                Model Selection Benchmark (4,009 Listings)
              </span>
              <span className="text-[11px] font-mono text-slate-400">Grouped 70/15/15 Split</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#1E293B] bg-[#090D1A]/60 text-[11px] font-mono uppercase text-slate-400">
                    <th className="py-2.5 px-4">Candidate</th>
                    <th className="py-2.5 px-3 text-right">Val MAE (INR)</th>
                    <th className="py-2.5 px-3 text-right">Test R²</th>
                    <th className="py-2.5 px-4 text-right">Size</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E293B] font-mono tabular-nums">
                  <tr className="bg-blue-950/20 text-white font-semibold">
                    <td className="py-2.5 px-4 font-sans">LightGBM (Selected)</td>
                    <td className="py-2.5 px-3 text-right text-emerald-400">{formatInr(6789.74)}</td>
                    <td className="py-2.5 px-3 text-right">0.7899</td>
                    <td className="py-2.5 px-4 text-right">2.40 MB</td>
                  </tr>
                  <tr className="text-slate-300">
                    <td className="py-2.5 px-4 font-sans">CatBoost</td>
                    <td className="py-2.5 px-3 text-right">{formatInr(8071.77)}</td>
                    <td className="py-2.5 px-3 text-right">0.8024</td>
                    <td className="py-2.5 px-4 text-right">0.92 MB</td>
                  </tr>
                  <tr className="text-slate-400">
                    <td className="py-2.5 px-4 font-sans">Random Forest</td>
                    <td className="py-2.5 px-3 text-right">{formatInr(9976.53)}</td>
                    <td className="py-2.5 px-3 text-right">0.7138</td>
                    <td className="py-2.5 px-4 text-right">20.63 MB</td>
                  </tr>
                  <tr className="text-slate-400">
                    <td className="py-2.5 px-4 font-sans">Linear Regression</td>
                    <td className="py-2.5 px-3 text-right">{formatInr(17438.79)}</td>
                    <td className="py-2.5 px-3 text-right">0.5531</td>
                    <td className="py-2.5 px-4 text-right">0.06 MB</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
