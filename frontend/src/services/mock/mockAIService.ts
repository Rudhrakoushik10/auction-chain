import { AIPredictionRecord, VehicleAttributes } from '../../types/auction';
import { computeCanonicalProductHash, generateDeterministicTxHash } from '../../lib/crypto';
import contractAddresses from '../../contracts/contractAddresses.json';

let mockPredictionIdCounter = 204;
let mockOracleBlockCounter = 4189310;

/**
 * Deterministic Mock Vehicle AI Valuation Service (`mockAIService.ts`)
 * Used when the external Python `backend/` server (Terminal 2) is running in offline/mock mode.
 * Computes realistic INR resale valuations from structured Vehicle attributes and canonical SHA-256 hash.
 */
export async function simulateVehiclePricePrediction(
  attributes: VehicleAttributes
): Promise<AIPredictionRecord> {
  const currentYear = 2026;
  const mfgYear = Number(attributes.manufacturing_year) || 2023;
  const vehicleAge = Math.max(0, currentYear - mfgYear);
  const mileageKm = Math.max(0, Number(attributes.mileage_km) || 18000);
  const origPriceInr = Math.max(100000, Number(attributes.original_price_inr) || 2000000);
  const fuelType = String(attributes.fuel_type || 'Electric').toLowerCase();
  const transmission = String(attributes.transmission || 'Automatic').toLowerCase();
  const condition = String(attributes.condition || 'Excellent').toLowerCase();

  const conditionMultipliers: Record<string, number> = {
    'like new': 0.92,
    'excellent': 0.86,
    'good': 0.76,
    'fair': 0.62,
  };
  const condMult = conditionMultipliers[condition] ?? 0.82;
  const ageFactor = Math.pow(0.87, vehicleAge);
  const mileageFactor = Math.max(0.55, 1 - (mileageKm / 10000) * 0.024);
  const fuelBonus =
    fuelType.includes('electric') || fuelType.includes('hybrid') || fuelType.includes('diesel')
      ? 1.04
      : 1.0;
  const transBonus = transmission.includes('automatic') ? 22000 : 0;

  const rawResaleInr =
    origPriceInr * ageFactor * mileageFactor * condMult * fuelBonus + transBonus;
  const predictedInr = Math.max(85000, Math.round(rawResaleInr / 500) * 500);

  const { hash: productDataHash, canonicalJson } = await computeCanonicalProductHash(
    'vehicle',
    attributes as unknown as Record<string, string | number>
  );

  const predictionId = mockPredictionIdCounter++;
  const timestamp = Math.floor(Date.now() / 1000);

  return {
    prediction_id: predictionId,
    category: 'vehicle',
    predicted_price_inr: predictedInr,
    predicted_price_paise: predictedInr * 100,
    currency: 'INR',
    model_version: 'vehicle-v1',
    prediction_timestamp: timestamp,
    product_data_hash: productDataHash,
    canonical_json: canonicalJson,
    feature_breakdown: [
      {
        factor: `Ex-Showroom MRP (₹${origPriceInr.toLocaleString('en-IN')})`,
        impact: 'Base Anchor',
        weight: 0.38,
      },
      {
        factor: `Vehicle Age (${mfgYear}, ${vehicleAge} yrs depreciation)`,
        impact: `${Math.round((ageFactor - 1) * 100)}%`,
        weight: 0.26,
      },
      {
        factor: `Cumulative Odometer (${mileageKm.toLocaleString('en-IN')} km)`,
        impact: `${Math.round((mileageFactor - 1) * 100)}%`,
        weight: 0.22,
      },
      {
        factor: `Drivetrain & Condition (${attributes.fuel_type} · ${attributes.transmission} · ${attributes.condition})`,
        impact: `${Math.round(condMult * 100)}% retention`,
        weight: 0.14,
      },
    ],
    metrics: {
      mae: 28500,
      rmse: 37400,
      r2: 0.918,
      trainingSamples: 18900,
      algorithm: 'ExtraTreesRegressor (scikit-learn vehicle-v1 pipeline)',
    },
    oracle_tx_hash: '',
    oracle_address: contractAddresses.roles.oracleSigner,
    oracle_contract_address: contractAddresses.PriceOracle,
    oracle_block_number: 0,
    oracle_registered: false,
  };
}

/**
 * Simulates Oracle Worker (Terminal 4) registering the prediction on PriceOracle.sol
 */
export async function simulateOracleRegistration(
  prediction: AIPredictionRecord,
  oracleSignerAddress: string
): Promise<AIPredictionRecord> {
  const blockNumber = ++mockOracleBlockCounter;
  const txHash = generateDeterministicTxHash(
    `ORACLE:${prediction.prediction_id}:${prediction.predicted_price_paise}:${prediction.product_data_hash}:${blockNumber}`
  );

  return {
    ...prediction,
    oracle_tx_hash: txHash,
    oracle_address: oracleSignerAddress || contractAddresses.roles.oracleSigner,
    oracle_contract_address: contractAddresses.PriceOracle,
    oracle_block_number: blockNumber,
    oracle_registered: true,
  };
}
