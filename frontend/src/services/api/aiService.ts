import { AIPredictionRecord, VehicleAttributes } from '../../types/auction';
import {
  ORACLE_BACKGROUND_ACCOUNT,
} from '../../lib/hardhatConfig';

/**
 * AI API Client (`src/services/api/aiService.ts`)
 * Connects directly to `/api/predict-price` (Indian Vehicle Valuation Engine).
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

  const inrPrice = Number(data.predicted_price ?? data.predicted_price_inr);
  const paise = data.predicted_price_paise ?? Math.round(inrPrice * 100);

  return {
    prediction_id: data.prediction_id,
    category: 'vehicle',
    predicted_price: inrPrice,
    predicted_price_inr: inrPrice,
    predicted_price_paise: paise,
    currency: 'INR',
    model_version: data.model_version || 'AuctionChain AI v2.4 (India Market)',
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

export async function registerOraclePrediction(
  record: AIPredictionRecord,
  oracleAddress: string
): Promise<AIPredictionRecord> {
  const response = await fetch('/api/oracle/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prediction_id: record.prediction_id,
      predicted_price: record.predicted_price,
      predicted_price_inr: record.predicted_price_inr ?? record.predicted_price,
      product_data_hash: record.product_data_hash,
      model_version: record.model_version,
      prediction_timestamp: record.prediction_timestamp,
      oracle_address: oracleAddress || ORACLE_BACKGROUND_ACCOUNT.address,
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    return record;
  }

  return {
    ...record,
    oracle_registered: true,
    oracle_tx_hash: data.tx_hash || record.oracle_tx_hash,
    oracle_block_number: data.block_number || record.oracle_block_number,
    oracle_address: data.oracle_address || oracleAddress,
    oracle_contract_address: data.contract_address || record.oracle_contract_address,
  };
}
