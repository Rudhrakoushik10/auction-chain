import React from 'react';
import { Cpu, ShieldCheck, Hash, Database, CheckCircle2, Info, BarChart3 } from 'lucide-react';
import { AIPredictionRecord } from '../../types/auction';
import { formatInr, shortenAddress } from '../../lib/crypto';

interface PredictionWidgetProps {
  prediction: AIPredictionRecord;
  compact?: boolean;
}

export const PredictionWidget: React.FC<PredictionWidgetProps> = ({
  prediction,
  compact = false,
}) => {
  return (
    <div className="rounded-2xl bg-[#0F172A] border border-[#1E293B] shadow-xl overflow-hidden">
      {/* Top Banner */}
      <div className="bg-[#090D1A] px-5 py-4 text-white flex items-center justify-between flex-wrap gap-3 border-b border-[#1E293B]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#7C3AED]/20 border border-[#7C3AED]/40 text-[#06B6D4]">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">
                AI Advisory Resale Valuation
              </h3>
              <span className="px-2 py-0.5 text-[10px] font-mono font-semibold uppercase rounded bg-[#06B6D4]/20 text-[#06B6D4] border border-[#06B6D4]/30">
                {prediction.model_version}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              vehicle-v1 scikit-learn regression pipeline · Anchored on PriceOracle.sol
            </p>
          </div>
        </div>

        <div className="text-right">
          <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
            Predicted Fair Market Value (INR)
          </div>
          <div className="text-2xl font-mono font-extrabold text-[#06B6D4]">
            {formatInr(prediction.predicted_price_inr)}
          </div>
          <div className="text-[10px] font-mono text-slate-400">
            On-chain integer: {prediction.predicted_price_paise.toLocaleString('en-IN')} paise
          </div>
        </div>
      </div>

      {/* Currency Separation Notice */}
      <div className="bg-[#131E3A] border-b border-[#1E293B] px-5 py-2.5 flex items-center gap-2.5 text-xs text-slate-300">
        <Info className="w-4 h-4 text-[#3B82F6] shrink-0" />
        <span>
          <strong className="text-white">Currency Separation Rule:</strong> AI estimates are in{' '}
          <strong className="text-white">INR (₹)</strong> from historical vehicle datasets, whereas auction bidding, reserve checks, and collateral deposits settle in{' '}
          <strong className="text-white">Test ETH</strong> on Hardhat Localhost (Chain ID 31337).
        </span>
      </div>

      {!compact && (
        <div className="p-5 space-y-5">
          {/* Feature Attribution Breakdown */}
          {prediction.feature_breakdown && prediction.feature_breakdown.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5 text-[#A78BFA]" />
                <span>Vehicle Feature Attribution & Depreciation Weights</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {prediction.feature_breakdown.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-[#131E3A] border border-[#1E293B] flex items-center justify-between gap-2"
                  >
                    <div className="text-xs font-medium text-slate-200">{item.factor}</div>
                    <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-[#7C3AED]/20 text-[#A78BFA] shrink-0 border border-[#7C3AED]/30">
                      {item.impact}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Model Evaluation Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-[#131E3A] border border-[#1E293B]">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                Model R² Score
              </div>
              <div className="text-sm font-mono font-bold text-white mt-0.5">
                {prediction.metrics.r2.toFixed(3)} ({Math.round(prediction.metrics.r2 * 100)}% fit)
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                Test MAE (INR)
              </div>
              <div className="text-sm font-mono font-bold text-[#3B82F6] mt-0.5">
                ±{formatInr(prediction.metrics.mae)}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                Test RMSE (INR)
              </div>
              <div className="text-sm font-mono font-bold text-[#A78BFA] mt-0.5">
                ±{formatInr(prediction.metrics.rmse)}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                Training Dataset
              </div>
              <div className="text-sm font-mono font-bold text-white mt-0.5">
                {prediction.metrics.trainingSamples.toLocaleString()} vehicles
              </div>
            </div>
          </div>

          {/* On-Chain PriceOracle Proof Metadata */}
          <div className="rounded-xl bg-[#090D1A] border border-[#1E293B] p-4 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>On-Chain PriceOracle.sol Record (#{prediction.prediction_id})</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-950/40 text-emerald-300 border border-emerald-500/30">
                <CheckCircle2 className="w-3 h-3" />
                Verified at Block #{prediction.oracle_block_number}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1 font-mono text-[11px] text-slate-400">
              <div className="truncate">
                <span className="text-slate-500">productDataHash: </span>
                <span className="text-slate-300 font-semibold">{prediction.product_data_hash}</span>
              </div>
              <div className="truncate">
                <span className="text-slate-500">oracleTxHash: </span>
                <span className="text-[#3B82F6] font-semibold">{prediction.oracle_tx_hash}</span>
              </div>
              <div className="truncate">
                <span className="text-slate-500">oracleSigner: </span>
                <span className="text-slate-300">{shortenAddress(prediction.oracle_address)}</span>
              </div>
              <div className="truncate">
                <span className="text-slate-500">PriceOracle Contract: </span>
                <span className="text-slate-300">
                  {shortenAddress(prediction.oracle_contract_address)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
