import React from 'react';
import { AIPredictionRecord } from '../../types/auction';
import { ShieldCheck, CheckCircle2, FileCode2, Scale } from 'lucide-react';
import { PRICE_ORACLE_CONTRACT_ADDRESS } from '../../lib/hardhatConfig';
import { formatInr, toInrPaise, shortenAddress } from '../../lib/crypto';

interface PredictionWidgetProps {
  prediction: AIPredictionRecord;
  compact?: boolean;
}

export const PredictionWidget: React.FC<PredictionWidgetProps> = ({
  prediction,
  compact = false,
}) => {
  const valuationInr =
    prediction.predicted_price ?? prediction.predicted_price_inr ?? 350000;
  const paiseValue =
    prediction.predicted_price_paise || toInrPaise(valuationInr);
  const lowBand = Math.round(valuationInr * 0.9);
  const highBand = Math.round(valuationInr * 1.1);

  if (compact) {
    return (
      <div className="bg-[#12141A] border border-[#232730] rounded-md p-3.5 flex items-center justify-between">
        <div>
          <span className="text-[10px] uppercase tracking-[0.14em] text-[#8E95A5] font-mono block">
            AI Fair Market Valuation
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-sm font-mono font-semibold text-[#F4F5F7] tabular-nums">
              {formatInr(valuationInr)}
            </span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-mono text-[#C5A46D] block">
            Oracle ID #{prediction.prediction_id}
          </span>
          <span className="text-[10px] font-mono text-[#646C7E]">
            {shortenAddress(prediction.product_data_hash)}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#12141A] border border-[#232730] rounded-md p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#232730] pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-[#171A22] border border-[#C5A46D]/30 flex items-center justify-center">
            <Scale className="w-4 h-4 text-[#C5A46D]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-display font-semibold text-[#F4F5F7]">
                Institutional Vehicle Valuation Certificate
              </h4>
              <span className="text-[10px] font-mono uppercase tracking-[0.12em] text-[#C5A46D]">
                · PriceOracle.sol
              </span>
            </div>
            <p className="text-xs text-[#8E95A5] mt-0.5">
              Indian Pre-Owned Automotive Benchmark · Record #{prediction.prediction_id}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#2E9B68]">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{prediction.oracle_registered ? 'On-Chain Verified' : 'Hash Computed'}</span>
        </div>
      </div>

      {/* Primary Financial Readout (Zero Fake ML Metrics) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#0B0C10] border border-[#232730] rounded-md p-4">
          <span className="text-[10px] text-[#8E95A5] uppercase tracking-[0.14em] font-mono block">
            Estimated Market Value (INR)
          </span>
          <div className="text-2xl font-mono font-semibold text-[#F4F5F7] mt-1.5 tabular-nums">
            {formatInr(valuationInr)}
          </div>
          <span className="text-[11px] text-[#C5A46D] font-mono mt-1 block">
            AI-Calibrated Indian Valuation
          </span>
        </div>

        <div className="bg-[#0B0C10] border border-[#232730] rounded-md p-4">
          <span className="text-[10px] text-[#8E95A5] uppercase tracking-[0.14em] font-mono block">
            Advisory Valuation Band
          </span>
          <div className="text-sm font-mono font-semibold text-[#F4F5F7] mt-2 tabular-nums">
            {formatInr(lowBand)} – {formatInr(highBand)}
          </div>
          <span className="text-[11px] text-[#8E95A5] font-mono mt-1.5 block">
            ±10% Condition & Regional Spread
          </span>
        </div>

        <div className="bg-[#0B0C10] border border-[#232730] rounded-md p-4">
          <span className="text-[10px] text-[#8E95A5] uppercase tracking-[0.14em] font-mono block">
            On-Chain Integer (Paise)
          </span>
          <div className="text-sm font-mono font-semibold text-[#F4F5F7] mt-2 tabular-nums">
            {paiseValue.toLocaleString('en-IN')} paise
          </div>
          <span className="text-[11px] text-[#646C7E] font-mono mt-1.5 block">
            uint256 · PriceOracle.sol
          </span>
        </div>
      </div>

      {/* Valuation Factor Attribution */}
      {prediction.feature_breakdown && prediction.feature_breakdown.length > 0 && (
        <div>
          <div className="flex items-center justify-between text-xs text-[#8E95A5] mb-3">
            <span className="font-mono uppercase tracking-[0.12em] text-[11px]">
              Valuation Factor Attribution
            </span>
            <span className="font-mono text-[11px] text-[#646C7E]">
              Depreciation, Odometer, Powertrain & Provenance
            </span>
          </div>
          <div className="space-y-2.5 bg-[#0B0C10] border border-[#232730] rounded-md p-4">
            {prediction.feature_breakdown.map((fw) => (
              <div key={fw.factor} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-[#F4F5F7] font-medium">{fw.factor}</span>
                  <span className="font-mono text-[#8E95A5] tabular-nums">
                    {fw.impact} ({fw.weight}%)
                  </span>
                </div>
                <div className="w-full h-1 bg-[#171A22] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#C5A46D]"
                    style={{ width: `${Math.min(100, Math.max(5, fw.weight))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* On-Chain Cryptographic Verification Metadata */}
      <div className="pt-4 border-t border-[#232730] space-y-2 text-xs font-mono">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[#8E95A5]">Prediction ID (uint256):</span>
          <span className="text-[#F4F5F7]">#{prediction.prediction_id}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-[#8E95A5]">Canonical SHA-256 Data Hash:</span>
          <span
            className="text-[#C5A46D] truncate max-w-[260px]"
            title={prediction.product_data_hash}
          >
            {prediction.product_data_hash}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-[#8E95A5] flex items-center gap-1">
            <FileCode2 className="w-3.5 h-3.5 text-[#8E95A5]" />
            PriceOracle.sol Registry:
          </span>
          <span className="text-[#F4F5F7] truncate max-w-[240px]">
            {prediction.oracle_contract_address || PRICE_ORACLE_CONTRACT_ADDRESS}
          </span>
        </div>
        {prediction.oracle_tx_hash && (
          <div className="flex items-center justify-between gap-2">
            <span className="text-[#8E95A5] flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#2E9B68]" />
              Oracle Proof Transaction:
            </span>
            <span className="text-[#8E95A5] truncate max-w-[240px]">
              {prediction.oracle_tx_hash}
            </span>
          </div>
        )}
        <div className="pt-2 text-[11px] text-[#646C7E] font-sans leading-relaxed">
          Note: Valuation figures serve as an independent institutional reference in
          Indian Rupees (INR). Sealed bids and reserve thresholds are governed
          exclusively in ETH by <code className="font-mono text-[#8E95A5]">SealedAuction.sol</code>.
        </div>
      </div>
    </div>
  );
};
