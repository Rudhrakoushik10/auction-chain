import { AIPredictionRecord, VehicleAttributes } from '../../types/auction';
import {
  simulateVehiclePricePrediction,
  simulateOracleRegistration,
} from '../mock/mockAIService';

/**
 * Unified AI & Oracle API Client (`src/services/api/aiService.ts`)
 * Uses `mockAIService.ts` simulation by default when the Python `backend` service is offline,
 * while syncing seamlessly with `/api/predict-price` and `/api/oracle/register` when available.
 */
export async function predictVehiclePrice(
  attributes: VehicleAttributes
): Promise<AIPredictionRecord> {
  try {
    const response = await fetch('/api/predict-price', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category: 'vehicle', attributes }),
    });
    if (response.ok) {
      const data = await response.json();
      return {
        prediction_id: data.prediction_id,
        category: 'vehicle',
        predicted_price_inr: data.predicted_price_inr,
        predicted_price_paise: data.predicted_price_paise,
        currency: 'INR',
        model_version: data.model_version || 'vehicle-v1',
        prediction_timestamp: data.prediction_timestamp,
        product_data_hash: data.product_data_hash,
        canonical_json: data.canonical_json,
        feature_breakdown: data.feature_breakdown || [],
        metrics: data.metrics,
        oracle_tx_hash: '',
        oracle_address: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
        oracle_contract_address: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
        oracle_block_number: 0,
        oracle_registered: false,
      };
    }
  } catch {
    // Fallback cleanly to client-side mockAIService
  }
  return simulateVehiclePricePrediction(attributes);
}

export async function registerPredictionOnOracle(
  prediction: AIPredictionRecord,
  oracleSignerAddress: string
): Promise<AIPredictionRecord> {
  try {
    const response = await fetch('/api/oracle/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prediction_id: prediction.prediction_id,
        predicted_price_inr: prediction.predicted_price_inr,
        product_data_hash: prediction.product_data_hash,
        model_version: prediction.model_version,
        prediction_timestamp: prediction.prediction_timestamp,
        oracle_address: oracleSignerAddress,
      }),
    });
    if (response.ok) {
      const data = await response.json();
      return {
        ...prediction,
        prediction_id: data.prediction_id,
        oracle_tx_hash: data.tx_hash,
        oracle_block_number: data.block_number,
        oracle_address: data.oracle_address,
        oracle_contract_address: data.contract_address,
        oracle_registered: true,
      };
    }
  } catch {
    // Fallback cleanly to mockAIService
  }
  return simulateOracleRegistration(prediction, oracleSignerAddress);
}
