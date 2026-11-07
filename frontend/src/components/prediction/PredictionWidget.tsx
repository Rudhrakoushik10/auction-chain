import React from 'react';
import { AIPredictionRecord } from '../../types/auction';
import { formatUsd, shortenAddress } from '../../lib/crypto';
import { CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

interface PredictionWidgetProps {
  prediction: AIPredictionRecord;
  compact?: boolean;
}

export const PredictionWidget: React.FC<PredictionWidgetProps> = ({
  prediction,
  compact = false,
}) => {
  const isRegistered = Boolean(prediction.oracle_registered && prediction.oracle_tx_hash);
  const priceUsd = prediction.predicted_price ?? prediction.predicted_price_inr;

  return (
    <div className="bg-[#0F172A] rounded-xl border border-[#1E293B] overflow-hidden">
      {/* Top Status Bar */}
      <div className="px-5 py-3.5 border-b border-[#1E293B] flex flex-wrap items-center justify-between gap-2 bg-[#090D1A]/60">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-white">
            AI Advisory Valuation (LightGBM v{prediction.model_version})
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-mono">
          {isRegistered ? (
            <span className="inline-flex items-center gap-1.5 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Oracle Registered (#{prediction.oracle_block_number})</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-amber-400">
              <Clock className="w-3.5 h-3.5" />
              <span>Off-Chain Advisory Only</span>
            </span>
          )}
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Primary Valuation Readout */}
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pb-4 border-b border-[#1E293B]">
          <div>
            <div className="text-xs text-slate-400">
              Predicted Market Value (US Listings · Advisory Benchmark)
            </div>
            <div className="text-2xl sm:text-3xl font-mono font-bold text-white tracking-tight mt-1 tabular-nums">
              {formatUsd(priceUsd)}
            </div>
            <div className="text-xs font-mono text-slate-500 mt-0.5 tabular-nums">
              Oracle integer: {prediction.predicted_price_paise.toLocaleString('en-US')} cents ·{' '}
              {prediction.in_training_distribution !== false
                ? 'In-Distribution'
                : 'Out-of-Distribution'}
            </div>
          </div>

          <div className="sm:text-right font-mono tabular-nums">
            <div className="text-xs text-slate-400 font-sans">Held-Out Test R²</div>
            <div className="text-base font-bold text-slate-200 mt-0.5">
              {(prediction.metrics.r2 * 100).toFixed(1)}% (85.7% trimmed)
            </div>
            <div className="text-xs text-slate-500">
              MAE ±{formatUsd(prediction.metrics.mae)}
            </div>
          </div>
        </div>

        {prediction.warnings && prediction.warnings.length > 0 && (
          <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-500/30 space-y-1 text-xs text-amber-200">
            <div className="font-semibold flex items-center gap-1.5 text-amber-300">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>Valuation Warnings</span>
            </div>
            <ul className="list-disc list-inside space-y-0.5">
              {prediction.warnings.map((w, idx) => (
                <li key={idx}>{w}</li>
              ))}
            </ul>
          </div>
        )}

        {!compact && (
          <>
            {/* Feature Attribution Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-medium text-slate-300">Engineered Feature Signals</span>
                <span>Impact / Profile</span>
              </div>
              <div className="divide-y divide-[#1E293B] border-t border-b border-[#1E293B]">
                {prediction.feature_breakdown.map((item, idx) => (
                  <div
                    key={idx}
                    className="py-2 flex items-center justify-between text-xs"
                  >
                    <span className="text-slate-300 truncate mr-3">{item.factor}</span>
                    <span className="font-mono font-semibold text-white shrink-0 tabular-nums">
                      {item.impact}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Cryptographic & Model Telemetry */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 text-xs">
              <dl className="space-y-1.5 font-mono tabular-nums text-slate-400">
                <div className="flex justify-between">
                  <dt className="font-sans text-slate-400">Prediction ID</dt>
                  <dd className="text-slate-200">#{prediction.prediction_id}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="font-sans text-slate-400">Test MAE</dt>
                  <dd className="text-slate-200">±{formatUsd(prediction.metrics.mae)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="font-sans text-slate-400">Test RMSE</dt>
                  <dd className="text-slate-200">±{formatUsd(prediction.metrics.rmse)}</dd>
                </div>
              </dl>

              <dl className="space-y-1.5 font-mono tabular-nums text-slate-400">
                <div className="flex justify-between">
                  <dt className="font-sans text-slate-400">Data Hash (SHA-256)</dt>
                  <dd className="text-slate-200" title={prediction.product_data_hash}>
                    {shortenAddress(prediction.product_data_hash)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="font-sans text-slate-400">PriceOracle.sol</dt>
                  <dd className="text-slate-200" title={prediction.oracle_contract_address}>
                    {shortenAddress(prediction.oracle_contract_address)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="font-sans text-slate-400">Oracle Proof Tx</dt>
                  <dd className="text-slate-200" title={prediction.oracle_tx_hash}>
                    {isRegistered ? shortenAddress(prediction.oracle_tx_hash) : 'Not Registered'}
                  </dd>
                </div>
              </dl>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
