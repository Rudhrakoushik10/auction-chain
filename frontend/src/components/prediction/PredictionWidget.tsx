import React from 'react';
import { AIPredictionRecord } from '../../types/auction';
import { CheckCircle2, Scale } from 'lucide-react';
import { formatInr, shortenAddress } from '../../lib/crypto';

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
  const lowBand =
    prediction.confidence_min_inr || Math.round(valuationInr * 0.92);
  const highBand =
    prediction.confidence_max_inr || Math.round(valuationInr * 1.08);

  if (compact) {
    return (
      <div className="bg-[#12141A] border border-[#232730] rounded-md p-3.5 flex items-center justify-between">
        <div>
          <span className="text-xs text-[#8E95A5] block">
            AI Fair Market Value
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-sm font-mono font-semibold text-[#F4F5F7] tabular-nums">
              {formatInr(valuationInr)}
            </span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs font-mono text-[#C5A46D] block">
            Report #{prediction.prediction_id}
          </span>
          <span className="text-[11px] font-mono text-[#646C7E]">
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
          <Scale className="w-5 h-5 text-[#C5A46D] shrink-0" />
          <div>
            <h4 className="text-base font-display font-semibold text-[#F4F5F7]">
              AI Fair-Market Price Report (₹ INR)
            </h4>
            <p className="text-xs text-[#8E95A5] mt-0.5">
              Indian Pre-Owned Car Valuation · Report #{prediction.prediction_id}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-mono text-[#2E9B68]">
          <CheckCircle2 className="w-4 h-4" />
          <span>{prediction.oracle_registered ? 'Recorded with Listing' : 'Valuation Ready'}</span>
        </div>
      </div>

      {/* Primary Financial Readout (Clean Hairline Strip, No Nested Boxes) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 border-b border-[#232730] pb-5">
        <div>
          <span className="text-xs text-[#8E95A5] block">
            Estimated Fair Market Price
          </span>
          <div className="text-2xl sm:text-3xl font-mono font-semibold text-[#C5A46D] mt-1 tabular-nums">
            {formatInr(valuationInr)}
          </div>
          <span className="text-xs text-[#8E95A5] mt-1 block">
            Based on Indian used-car market trends
          </span>
        </div>

        <div className="sm:border-l sm:border-[#232730] sm:pl-6">
          <span className="text-xs text-[#8E95A5] block">
            Expected Market Range
          </span>
          <div className="text-lg font-mono font-semibold text-[#F4F5F7] mt-1.5 tabular-nums">
            {formatInr(lowBand)} – {formatInr(highBand)}
          </div>
          <span className="text-xs text-[#8E95A5] mt-1 block">
            Typical price range depending on local city demand &amp; condition
          </span>
        </div>
      </div>

      {/* Valuation Factor Breakdown */}
      {prediction.feature_breakdown && prediction.feature_breakdown.length > 0 && (
        <div className="space-y-3">
          <div className="text-xs font-medium text-[#8E95A5]">
            How This Price Was Calculated
          </div>
          <div className="divide-y divide-[#232730] border-t border-b border-[#232730]">
            {prediction.feature_breakdown.map((fw) => {
              const pct =
                fw.weight <= 1 ? Math.round(fw.weight * 100) : Math.round(fw.weight);
              return (
                <div key={fw.factor} className="py-3 space-y-1.5">
                  <div className="flex justify-between gap-4 text-xs">
                    <span className="text-[#F4F5F7] font-medium">{fw.factor}</span>
                    <span className="font-mono text-[#8E95A5] tabular-nums text-right">
                      {fw.impact} ({pct}% weight)
                    </span>
                  </div>
                  <div className="w-full h-1 bg-[#171A22] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#C5A46D]"
                      style={{ width: `${Math.min(100, Math.max(5, pct))}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Verification Footprint */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#8E95A5]">
        <span>
          Vehicle Details Fingerprint:{' '}
          <code className="font-mono text-[#F4F5F7]" title={prediction.product_data_hash}>
            {shortenAddress(prediction.product_data_hash)}
          </code>
        </span>
        <span className="text-[11px] text-[#646C7E]">
          Locked to vehicle details so specs cannot be changed after listing
        </span>
      </div>
    </div>
  );
};
