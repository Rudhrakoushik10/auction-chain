import { AIPredictionRecord, VehicleAttributes } from '../../types/auction';
import {
  ORACLE_BACKGROUND_ACCOUNT,
} from '../../lib/hardhatConfig';

/**
 * AI API Client (`src/services/api/aiService.ts`)
 * Connects directly to `/api/predict-price` (backed by LightGBM v1.0.0 in `/backend`).
 */
export async function predictVehiclePrice(
  attributes: VehicleAttributes
): Promise<AIPredictionRecord> {
  const response = await fetch('/api/predict-price', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ category: 'vehicle', attributes }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      data.error || data.detail || `Prediction request failed with status ${response.status}`
    );
  }

  const usdPrice = Number(data.predicted_price ?? data.predicted_price_inr);
  const cents = Math.round(usdPrice * 100);

  return {
    prediction_id: data.prediction_id,
    category: 'vehicle',
    predicted_price: usdPrice,
    predicted_price_inr: usdPrice,
    predicted_price_paise: data.predicted_price_paise ?? cents,
    currency: 'USD',
    model_version: data.model_version || '1.0.0',
    in_training_distribution: data.in_training_distribution ?? true,
    warnings: data.warnings || [],
    inference_ms: data.inference_ms ?? 1.5,
    prediction_timestamp: data.prediction_timestamp,
    product_data_hash: data.product_data_hash,
    canonical_json: data.canonical_json,
    feature_breakdown: data.feature_breakdown || [],
    metrics: data.metrics,
    oracle_tx_hash: '',
    oracle_address: ORACLE_BACKGROUND_ACCOUNT.address,
    oracle_contract_address: '',
    oracle_block_number: 0,
    oracle_registered: false,
  };
}
