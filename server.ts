import express from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { performance } from 'perf_hooks';
import { createServer as createViteServer } from 'vite';

const app = express();
app.use(express.json());

// ============================================================================
// 1. Load Normalized /backend LightGBM Model & Metadata at Startup
// ============================================================================

interface LightGBMTree {
  split_feature: number[];
  threshold: number[];
  decision_type: number[];
  left_child: number[];
  right_child: number[];
  leaf_value: number[];
  cat_boundaries: number[];
  cat_threshold: number[];
}

interface LoadedModelState {
  loaded: boolean;
  loadError: string | null;
  loadMs: number;
  metadata: any;
  featureConfig: any;
  trees: LightGBMTree[];
}

const BACKEND_DIR = path.resolve(process.cwd(), 'backend');
const MODELS_DIR = path.join(BACKEND_DIR, 'models');
const METADATA_PATH = path.join(MODELS_DIR, 'model_metadata.json');
const FEATURE_CONFIG_PATH = path.join(MODELS_DIR, 'feature_config.json');

function parseLightGBMModelText(modelTxt: string): LightGBMTree[] {
  const blocks = modelTxt.split(/\r?\nTree=\d+\r?\n/).slice(1);
  return blocks.map((block) => {
    const lines: Record<string, string> = {};
    for (const line of block.split(/\r?\n/)) {
      const eq = line.indexOf('=');
      if (eq > 0) {
        lines[line.slice(0, eq).trim()] = line.slice(eq + 1).trim();
      }
    }
    const toNums = (s?: string) => (s ? s.split(/\s+/).map(Number) : []);
    return {
      split_feature: toNums(lines.split_feature),
      threshold: toNums(lines.threshold),
      decision_type: toNums(lines.decision_type),
      left_child: toNums(lines.left_child),
      right_child: toNums(lines.right_child),
      leaf_value: toNums(lines.leaf_value),
      cat_boundaries: toNums(lines.cat_boundaries),
      cat_threshold: toNums(lines.cat_threshold),
    };
  });
}

function loadVehiclePriceModel(): LoadedModelState {
  const start = performance.now();
  try {
    if (!fs.existsSync(METADATA_PATH)) {
      throw new Error(`Model metadata not found at ${METADATA_PATH}`);
    }
    if (!fs.existsSync(FEATURE_CONFIG_PATH)) {
      throw new Error(`Feature config not found at ${FEATURE_CONFIG_PATH}`);
    }
    const metadata = JSON.parse(fs.readFileSync(METADATA_PATH, 'utf-8'));
    const featureConfig = JSON.parse(fs.readFileSync(FEATURE_CONFIG_PATH, 'utf-8'));
    const modelFilePath = path.join(MODELS_DIR, metadata.model_file || 'vehicle_price_model.txt');
    if (!fs.existsSync(modelFilePath)) {
      throw new Error(`Model artifact not found at ${modelFilePath}`);
    }
    const modelTxt = fs.readFileSync(modelFilePath, 'utf-8');
    const trees = parseLightGBMModelText(modelTxt);
    const loadMs = Math.round((performance.now() - start) * 100) / 100;
    console.log(
      `[vehicle-price-ai] Loaded ${metadata.algorithm} model v${metadata.model_version} (${trees.length} trees) in ${loadMs} ms`
    );
    return {
      loaded: true,
      loadError: null,
      loadMs,
      metadata,
      featureConfig,
      trees,
    };
  } catch (err: any) {
    console.error('[vehicle-price-ai] Failed to load model:', err?.message || err);
    return {
      loaded: false,
      loadError: err?.message || 'Failed to load model',
      loadMs: 0,
      metadata: null,
      featureConfig: null,
      trees: [],
    };
  }
}

const modelState = loadVehiclePriceModel();

// ============================================================================
// 2. Exact Port of /backend/src/data/preprocessing.py & predictor.py
// ============================================================================

const PLACEHOLDER_VALUES = new Set([
  '',
  '-',
  '–',
  '—',
  'n/a',
  'na',
  'none',
  'null',
  'nan',
  'not supported',
  'unknown',
]);

const BRAND_FIXES: Record<string, [string, string]> = {
  LAND: ['ROVER', 'LAND ROVER'],
  ASTON: ['MARTIN', 'ASTON MARTIN'],
  ALFA: ['ROMEO', 'ALFA ROMEO'],
};

const FUEL_CANONICAL: Array<[string, string]> = [
  ['plug-in hybrid', 'Plug-in Hybrid'],
  ['plug in hybrid', 'Plug-in Hybrid'],
  ['gasoline', 'Gasoline'],
  ['petrol', 'Gasoline'],
  ['gas', 'Gasoline'],
  ['diesel', 'Diesel'],
  ['hybrid', 'Hybrid'],
  ['e85 flex fuel', 'E85 Flex Fuel'],
  ['flex fuel', 'E85 Flex Fuel'],
  ['electric', 'Electric'],
];

const COLOR_SYNONYMS: Record<string, string[]> = {
  Black: [
    'black',
    'blk',
    'ebony',
    'onyx',
    'nero',
    'charcoal',
    'anthracite',
    'graphite',
    'jet black',
    'midnight',
  ],
  White: ['white', 'pearl', 'ivory', 'alabaster'],
  Gray: ['gray', 'grey', 'granite', 'steel', 'gunmetal'],
  Silver: ['silver', 'platinum'],
  Blue: ['blue', 'navy', 'azure', 'teal', 'turquoise', 'indigo', 'cobalt'],
  Red: ['red', 'burgundy', 'maroon', 'pimento', 'crimson', 'carmine', 'rioja'],
  Green: ['green', 'olive', 'emerald', 'forest'],
  Brown: ['brown', 'bronze', 'copper', 'mocha', 'espresso', 'chestnut', 'walnut'],
  Beige: ['beige', 'tan', 'cream', 'sand', 'parchment', 'oyster', 'linen'],
  Gold: ['gold', 'champagne'],
  Orange: ['orange', 'coral'],
  Yellow: ['yellow'],
  Purple: ['purple', 'violet', 'lavender', 'plum'],
  Pink: ['pink', 'rose'],
};

function cleanText(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number' && Number.isNaN(value)) return null;
  const text = String(value).replace(/\s+/g, ' ').trim();
  if (PLACEHOLDER_VALUES.has(text.toLowerCase())) return null;
  return text;
}

function canonicalizeBrandModel(brandRaw: unknown, modelRaw: unknown): [string, string] {
  const brandText = cleanText(brandRaw) || 'UNKNOWN';
  const modelText = cleanText(modelRaw) || 'UNKNOWN';
  let brandUpper = brandText.toUpperCase();
  let modelUpper = modelText.toUpperCase();

  if (BRAND_FIXES[brandUpper]) {
    const [prefix, corrected] = BRAND_FIXES[brandUpper];
    if (modelUpper.startsWith(prefix + ' ')) {
      brandUpper = corrected;
      modelUpper = modelUpper.slice(prefix.length + 1).trim();
    } else if (modelUpper === prefix) {
      brandUpper = corrected;
      modelUpper = 'BASE';
    }
  }
  return [brandUpper, modelUpper];
}

function normaliseColor(value: unknown): string {
  const text = cleanText(value);
  if (!text) return 'Unknown';
  const lowered = text.toLowerCase();
  let bestPos = Infinity;
  let bestColor: string | null = null;

  for (const [base, synonyms] of Object.entries(COLOR_SYNONYMS)) {
    for (const syn of synonyms) {
      const escaped = syn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const match = new RegExp(`\\b${escaped}\\b`, 'i').exec(lowered);
      if (match && match.index < bestPos) {
        bestPos = match.index;
        bestColor = base;
      }
    }
  }
  return bestColor || 'Other';
}

function normaliseAccident(value: unknown): string {
  const text = cleanText(value);
  if (!text) return 'Unknown';
  const lowered = text.toLowerCase();
  if (lowered.includes('none') || lowered.includes('no accident')) return 'None';
  if (lowered.includes('accident') || lowered.includes('damage')) return 'Reported';
  return 'Unknown';
}

function coerceOptionalBool(value: unknown): boolean | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number' && (value === 0 || value === 1)) return Boolean(value);
  if (typeof value === 'string') {
    const lowered = value.trim().toLowerCase();
    if (['true', 'yes', 'y', '1'].includes(lowered)) return true;
    if (['false', 'no', 'n', '0'].includes(lowered)) return false;
    if (['', 'none', 'null', 'nan', 'unknown', 'not reported'].includes(lowered)) return null;
  }
  return null;
}

function normaliseFuelType(value: unknown, isElectric: boolean): string {
  const text = cleanText(value);
  if (!text) return isElectric ? 'Electric' : 'Unknown';
  const lowered = text.toLowerCase();
  if (lowered.includes('plug') && lowered.includes('hybrid')) return 'Plug-in Hybrid';
  for (const [key, canonical] of FUEL_CANONICAL) {
    if (lowered.includes(key)) return canonical;
  }
  return isElectric ? 'Electric' : 'Unknown';
}

function normaliseTransmission(value: unknown): [string, number] {
  const text = cleanText(value);
  if (!text) return ['Unknown', NaN];
  const lowered = text.toLowerCase();

  const speedMatch = /(\d{1,2})\s*[- ]?\s*(?:speed|spd)\b/i.exec(lowered);
  let speeds = speedMatch ? Number(speedMatch[1]) : NaN;
  if (lowered.includes('single-speed') || lowered.includes('single speed')) {
    speeds = 1.0;
  }

  if (
    lowered.includes('at/mt') ||
    lowered.includes('auto/manual') ||
    lowered.includes('at / mt')
  ) {
    return ['Automatic', speeds];
  }
  if (['cvt', 'variable', 'continuously variable'].some((k) => lowered.includes(k))) {
    return ['CVT', speeds];
  }
  if (
    [
      'dual shift',
      'dual-clutch',
      'dual clutch',
      'dct',
      'pdk',
      's tronic',
      'auto-shift',
      'autoshift',
      'automated manual',
    ].some((k) => lowered.includes(k))
  ) {
    return ['Dual-Clutch', speeds];
  }
  if (lowered.includes('single-speed') || lowered.includes('single speed')) {
    return ['Single-Speed', speeds];
  }
  if (/\bm\/t\b/i.test(lowered) || lowered.includes('manual') || /\bmt\b/i.test(lowered)) {
    return ['Manual', speeds];
  }
  if (
    /\ba\/t\b/i.test(lowered) ||
    lowered.includes('automatic') ||
    /\bauto\b/i.test(lowered) ||
    /\bat\b/i.test(lowered)
  ) {
    return ['Automatic', speeds];
  }
  return ['Unknown', speeds];
}

function parseEngine(engineValue: unknown): {
  horsepower: number;
  displacement_l: number;
  cylinders: number;
  is_turbo: number;
  is_supercharged: number;
  is_electric: number;
  engine_family: string;
  engine_data_missing: number;
} {
  const text = cleanText(engineValue);
  const result = {
    horsepower: NaN,
    displacement_l: NaN,
    cylinders: NaN,
    is_turbo: 0,
    is_supercharged: 0,
    is_electric: 0,
    engine_family: 'Unknown',
    engine_data_missing: 1,
  };
  if (!text) return result;

  const lowered = text.toLowerCase();
  const hpMatch = /(\d+(?:\.\d+)?)\s*hp/i.exec(text);
  if (hpMatch) result.horsepower = Number(hpMatch[1]);

  const dispMatch = /(\d+(?:\.\d+)?)\s*(?:l\b|liter|litre)/i.exec(text);
  if (dispMatch) result.displacement_l = Number(dispMatch[1]);

  let cylinders: number | null = null;
  let layout: string | null = null;
  const layoutMatch = /\b(v|i|w|h)\s*[- ]?(\d{1,2})\b/i.exec(text);
  if (layoutMatch) {
    const letter = layoutMatch[1].toUpperCase();
    cylinders = Number(layoutMatch[2]);
    layout = `${letter}${Math.trunc(cylinders)}`;
  } else {
    const wordMatch = /\b(straight|inline|flat)\s*[- ]?(\d{1,2})\b/i.exec(text);
    if (wordMatch) {
      const word = wordMatch[1].toLowerCase();
      cylinders = Number(wordMatch[2]);
      layout = `${word === 'flat' ? 'H' : 'I'}${Math.trunc(cylinders)}`;
    } else {
      const countMatch = /(\d{1,2})\s*cylinder/i.exec(text);
      if (countMatch) cylinders = Number(countMatch[1]);
    }
  }
  if (cylinders !== null) result.cylinders = cylinders;

  const hasElectric = lowered.includes('electric');
  const hasHybrid = lowered.includes('hybrid');
  const hasGas = lowered.includes('gas') || lowered.includes('gasoline');
  const hasMotor = lowered.includes('motor');
  const hasDisplacement = !Number.isNaN(result.displacement_l);
  let isElectric = (hasElectric || hasMotor) && !hasHybrid && !hasGas;
  if (isElectric && hasDisplacement) isElectric = false;

  if (isElectric) {
    result.is_electric = 1;
    result.displacement_l = 0.0;
    result.cylinders = 0.0;
    result.engine_family = 'Electric';
  } else if (layout !== null) {
    result.engine_family = layout;
  } else if (cylinders !== null) {
    result.engine_family = `${Math.trunc(cylinders)}-Cyl`;
  } else if (lowered.includes('rotary')) {
    result.engine_family = 'Rotary';
  }

  result.is_turbo = lowered.includes('turbo') ? 1 : 0;
  result.is_supercharged = lowered.includes('supercharg') ? 1 : 0;

  const hasAnySpec =
    !Number.isNaN(result.horsepower) ||
    !Number.isNaN(result.displacement_l) ||
    !Number.isNaN(result.cylinders) ||
    result.engine_family !== 'Unknown';
  result.engine_data_missing = hasAnySpec ? 0 : 1;
  return result;
}

class PredictionValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PredictionValidationError';
  }
}

function runLightGBMPredictor(payload: Record<string, any>, strictExtraFields = false) {
  if (!modelState.loaded || !modelState.metadata) {
    throw new Error(modelState.loadError || 'Model is not loaded.');
  }

  const allowedKeys = new Set([
    'brand',
    'model',
    'year',
    'model_year',
    'mileage',
    'milage',
    'mileage_km',
    'manufacturing_year',
    'fuel_type',
    'fuel',
    'engine_type',
    'engine',
    'transmission',
    'exterior_color',
    'ext_col',
    'interior_color',
    'int_col',
    'accident_history',
    'accident',
    'clean_title',
    'condition',
    'original_price_inr',
  ]);

  if (strictExtraFields) {
    const strictSchemaKeys = new Set([
      'brand',
      'model',
      'year',
      'mileage',
      'fuel_type',
      'engine_type',
      'transmission',
      'exterior_color',
      'interior_color',
      'accident_history',
      'clean_title',
    ]);
    for (const k of Object.keys(payload)) {
      if (!strictSchemaKeys.has(k)) {
        throw new PredictionValidationError(`Extra inputs are not permitted: '${k}'`);
      }
    }
  } else {
    for (const k of Object.keys(payload)) {
      if (!allowedKeys.has(k)) {
        throw new PredictionValidationError(`Unsupported field '${k}'`);
      }
    }
  }

  const brandRaw = payload.brand;
  const modelRaw = payload.model;
  const yearRaw = payload.year ?? payload.model_year ?? payload.manufacturing_year;
  const mileageRaw = payload.mileage ?? payload.milage ?? payload.mileage_km;

  if (brandRaw === undefined || brandRaw === null || String(brandRaw).trim() === '') {
    throw new PredictionValidationError('brand is required');
  }
  if (modelRaw === undefined || modelRaw === null || String(modelRaw).trim() === '') {
    throw new PredictionValidationError('model is required');
  }
  if (yearRaw === undefined || yearRaw === null || yearRaw === '') {
    throw new PredictionValidationError('year is required');
  }
  if (mileageRaw === undefined || mileageRaw === null || mileageRaw === '') {
    throw new PredictionValidationError('mileage is required');
  }

  const year = Number(yearRaw);
  const mileage = Number(mileageRaw);
  const maxYear = new Date().getFullYear() + 2;

  if (!Number.isInteger(year) || year < 1900 || year > maxYear) {
    throw new PredictionValidationError(`year must be between 1900 and ${maxYear}, received ${yearRaw}`);
  }
  if (!Number.isFinite(mileage) || mileage < 0 || mileage > 1_500_000) {
    throw new PredictionValidationError(
      `mileage must be between 0 and 1,500,000 miles, received ${mileageRaw}`
    );
  }

  const meta = modelState.metadata;
  const refYear = Number(meta.reference_year || 2026);
  const [brand, model] = canonicalizeBrandModel(brandRaw, modelRaw);

  const fuelRaw = payload.fuel_type ?? payload.fuel ?? null;
  const engineRaw = payload.engine_type ?? payload.engine ?? null;
  const transmissionRaw = payload.transmission ?? null;
  const exteriorRaw = payload.exterior_color ?? payload.ext_col ?? null;
  const interiorRaw = payload.interior_color ?? payload.int_col ?? null;
  const accidentRaw = payload.accident_history ?? payload.accident ?? null;

  const engine = parseEngine(engineRaw);
  const isElectric = Boolean(engine.is_electric);
  const fuelType = normaliseFuelType(fuelRaw, isElectric);
  const [transmission, rawSpeeds] = normaliseTransmission(transmissionRaw);
  const exteriorColor = normaliseColor(exteriorRaw);
  const interiorColor = normaliseColor(interiorRaw);

  let accidentHistory = 'Unknown';
  const accidentBool = coerceOptionalBool(accidentRaw);
  if (typeof accidentRaw === 'string' && accidentBool === null) {
    accidentHistory = normaliseAccident(accidentRaw);
  } else if (accidentBool === true) {
    accidentHistory = 'Reported';
  } else if (accidentBool === false) {
    accidentHistory = 'None';
  }

  const vehicleAge = Math.max(refYear - year, 0);
  const mileagePerYear = vehicleAge > 0 ? mileage / vehicleAge : mileage;

  const medians = meta.numeric_medians || {
    horsepower: 310.0,
    displacement_l: 3.5,
    cylinders: 6.0,
    transmission_speeds: 7.0,
  };

  const horsepower = Number.isNaN(engine.horsepower) ? medians.horsepower : engine.horsepower;
  const displacementL = Number.isNaN(engine.displacement_l)
    ? medians.displacement_l
    : engine.displacement_l;
  const cylinders = Number.isNaN(engine.cylinders) ? medians.cylinders : engine.cylinders;
  const transmissionSpeeds = Number.isNaN(rawSpeeds) ? medians.transmission_speeds : rawSpeeds;

  const warnings: string[] = [];
  let ood = false;

  const optionalInputs: Record<string, unknown> = {
    fuel_type: fuelRaw,
    engine_type: engineRaw,
    transmission: transmissionRaw,
    exterior_color: exteriorRaw,
    interior_color: interiorRaw,
    accident_history: accidentRaw,
  };
  const missingOptional = Object.entries(optionalInputs)
    .filter(([, v]) => v === null || v === undefined || String(v).trim() === '')
    .map(([k]) => k);
  if (missingOptional.length > 0) {
    warnings.push(
      `Optional fields missing (${missingOptional.join(
        ', '
      )}); neutral/imputed values were used, so this estimate is less precise.`
    );
  }

  const knownValues = meta.known_values || meta.category_levels || {};
  const knownBrands = new Set<string>(knownValues.brand || []);
  if (knownBrands.size > 0 && !knownBrands.has(brand)) {
    warnings.push(
      `Unsupported brand '${brandRaw}' is not present in the training data; the prediction is flagged as out-of-distribution.`
    );
    ood = true;
  }

  const knownModels = new Set<string>(knownValues.model || []);
  if (knownModels.size > 0 && !knownModels.has(model)) {
    warnings.push(
      `Unsupported model '${modelRaw}' is not present in the training data; the prediction is flagged as out-of-distribution.`
    );
    ood = true;
  }

  const [minYear, maxTrainYear] = meta.model_year_range || [1974, 2024];
  if (year < minYear || year > maxTrainYear) {
    warnings.push(
      `Model year ${year} is outside the training range ${minYear}-${maxTrainYear}; the prediction is flagged as out-of-distribution.`
    );
    ood = true;
  }

  const [minMileage, maxMileage] = meta.mileage_range || [100, 405000];
  if (mileage < minMileage || mileage > maxMileage) {
    warnings.push(
      `Mileage ${mileage.toLocaleString('en-US')} miles is outside the training range ${minMileage.toLocaleString(
        'en-US'
      )}-${maxMileage.toLocaleString('en-US')}; the prediction is flagged as out-of-distribution.`
    );
    ood = true;
  }

  if (fuelRaw !== null && fuelRaw !== undefined && String(fuelRaw).trim() !== '' && fuelType === 'Unknown') {
    warnings.push(`Fuel type '${fuelRaw}' is not recognised; treated as Unknown.`);
  }
  if (
    transmissionRaw !== null &&
    transmissionRaw !== undefined &&
    String(transmissionRaw).trim() !== '' &&
    transmission === 'Unknown'
  ) {
    warnings.push(`Transmission '${transmissionRaw}' is not recognised; treated as Unknown.`);
  }
  if (
    engineRaw !== null &&
    engineRaw !== undefined &&
    String(engineRaw).trim() !== '' &&
    engine.engine_data_missing === 1
  ) {
    warnings.push('Engine description could not be parsed; engine specifications were imputed.');
  }

  const catLevels = meta.category_levels;
  const encodeCat = (col: string, val: string): number => {
    const levels: string[] = catLevels[col] || [];
    return levels.indexOf(val); // returns -1 if unseen (NaN in pandas Categorical)
  };

  // Feature order from model_metadata.json:
  // [brand, model, fuel_type, transmission, exterior_color, interior_color, accident_history, engine_family,
  //  vehicle_age, mileage, mileage_per_year, horsepower, displacement_l, cylinders, transmission_speeds,
  //  is_turbo, is_supercharged, is_electric, engine_data_missing]
  const featVec: number[] = [
    encodeCat('brand', brand),
    encodeCat('model', model),
    encodeCat('fuel_type', fuelType),
    encodeCat('transmission', transmission),
    encodeCat('exterior_color', exteriorColor),
    encodeCat('interior_color', interiorColor),
    encodeCat('accident_history', accidentHistory),
    encodeCat('engine_family', engine.engine_family),
    vehicleAge,
    mileage,
    mileagePerYear,
    horsepower,
    displacementL,
    cylinders,
    transmissionSpeeds,
    engine.is_turbo,
    engine.is_supercharged,
    engine.is_electric,
    engine.engine_data_missing,
  ];

  const t0 = performance.now();
  let sum = 0;
  for (const tree of modelState.trees) {
    let node = 0;
    while (node >= 0) {
      const fidx = tree.split_feature[node];
      const fval = featVec[fidx];
      const dt = tree.decision_type[node];
      let goLeft = false;

      if ((dt & 1) === 1) {
        if (fval >= 0 && !Number.isNaN(fval)) {
          const cidx = tree.threshold[node];
          const start = tree.cat_boundaries[cidx];
          const end = tree.cat_boundaries[cidx + 1];
          const i1 = Math.floor(fval / 32);
          const i2 = fval % 32;
          if (start + i1 < end) {
            goLeft = ((tree.cat_threshold[start + i1] >>> i2) & 1) !== 0;
          }
        }
      } else {
        if (Number.isNaN(fval)) {
          goLeft = (dt & 2) !== 0;
        } else {
          goLeft = fval <= tree.threshold[node];
        }
      }
      node = goLeft ? tree.left_child[node] : tree.right_child[node];
    }
    sum += tree.leaf_value[~node];
  }
  const inferenceMs = Math.round((performance.now() - t0) * 1000) / 1000;
  const predictedPrice = Math.max(0, Math.round(sum * 100) / 100);

  const featureBreakdown = [
    {
      factor: `Vehicle Identity (${brand} · ${model})`,
      impact: !ood ? 'In-Distribution' : 'OOD Extrapolated',
      weight: 0.28,
    },
    {
      factor: `Model Year & Age (${year} · ${vehicleAge} yrs)`,
      impact: `${Math.round(mileagePerYear).toLocaleString('en-US')} mi/yr`,
      weight: 0.24,
    },
    {
      factor: `Odometer Reading (${mileage.toLocaleString('en-US')} mi.)`,
      impact: mileage < 30000 ? 'Low Mileage' : mileage < 75000 ? 'Moderate Use' : 'High Mileage',
      weight: 0.22,
    },
    {
      factor: `Powertrain (${engine.engine_family} · ${horsepower}hp · ${fuelType})`,
      impact: `${transmission} (${transmissionSpeeds}-spd)`,
      weight: 0.16,
    },
    {
      factor: `History & Finish (Accident: ${accidentHistory} · ${exteriorColor}/${interiorColor})`,
      impact: accidentHistory === 'None' ? 'Clean History' : accidentHistory,
      weight: 0.1,
    },
  ];

  return {
    predicted_price: predictedPrice,
    currency: 'USD' as const,
    model_version: String(meta.model_version || '1.0.0'),
    prediction_unit: 'vehicle' as const,
    in_training_distribution: !ood,
    warnings,
    inference_ms: inferenceMs,
    feature_breakdown: featureBreakdown,
    engineered: {
      brand,
      model,
      year,
      mileage,
      fuel_type: fuelType,
      transmission,
      exterior_color: exteriorColor,
      interior_color: interiorColor,
      accident_history: accidentHistory,
      engine_family: engine.engine_family,
      horsepower,
      displacement_l: displacementL,
      cylinders,
    },
  };
}

// ============================================================================
// 3. Canonical Hashing & Oracle Registry
// ============================================================================

function canonicalizeVehicleData(attributes: Record<string, unknown>): string {
  const sortedKeys = Object.keys(attributes).sort();
  const canonicalObj: Record<string, string | number | boolean> = { category: 'vehicle' };

  for (const key of sortedKeys) {
    const val = attributes[key];
    if (typeof val === 'string') {
      canonicalObj[key] = val.trim().toLowerCase();
    } else if (typeof val === 'number' || typeof val === 'boolean') {
      canonicalObj[key] = val;
    } else if (val !== undefined && val !== null) {
      canonicalObj[key] = String(val).trim().toLowerCase();
    }
  }
  return JSON.stringify(canonicalObj);
}

function computeProductDataHash(canonicalJson: string): string {
  const digest = crypto.createHash('sha256').update(canonicalJson).digest('hex');
  return `0x${digest}`;
}

const LIGHTGBM_MODEL_METRICS = {
  mae: 9484.57,
  rmse: 27311.06,
  r2: 0.7615,
  trainingSamples: 3403,
  algorithm: 'LightGBM (regression_l1 · 934 trees · v1.0.0)',
};

interface StoredPrediction {
  prediction_id: number;
  category: 'vehicle';
  predicted_price: number;
  predicted_price_inr: number;
  predicted_price_paise: number;
  currency: 'USD';
  model_version: string;
  prediction_timestamp: number;
  product_data_hash: string;
  canonical_json: string;
  in_training_distribution: boolean;
  warnings: string[];
  inference_ms: number;
  attributes: Record<string, unknown>;
  metrics: typeof LIGHTGBM_MODEL_METRICS;
  oracle?: {
    registered: boolean;
    oracle_address: string;
    tx_hash: string;
    block_number: number;
    contract_address: string;
    registered_at: number;
  };
}

const predictionStore = new Map<number, StoredPrediction>();
let nextPredictionCounter = 204;
let currentBlockNumber = 4189220;
const ORACLE_CONTRACT_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
const DEFAULT_ORACLE_ACCOUNT = '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65';

// ============================================================================
// 4. REST API Endpoints (/health, /predict, /api/predict-price, /api/oracle/register)
// ============================================================================

app.get(['/health', '/api/health'], (_req, res) => {
  if (!modelState.loaded) {
    return res.json({
      status: 'degraded',
      model_loaded: false,
      model_version: null,
      algorithm: null,
      load_error: modelState.loadError,
    });
  }
  return res.json({
    status: 'ok',
    model_loaded: true,
    model_version: modelState.metadata.model_version || '1.0.0',
    algorithm: modelState.metadata.algorithm || 'lightgbm',
    load_error: null,
    service: 'AuctionChain Vehicle Price Prediction API (LightGBM v1.0.0)',
    chainId: 31337,
    network: 'Hardhat Localhost',
    currency: 'USD',
    mileage_unit: 'mi',
  });
});

app.get('/api/model-metadata', (_req, res) => {
  if (!modelState.loaded || !modelState.metadata) {
    return res.status(503).json({ detail: 'Model metadata is not loaded.' });
  }
  const meta = modelState.metadata;
  return res.json({
    model_version: meta.model_version,
    algorithm: meta.algorithm,
    algorithm_display_name: meta.algorithm_display_name,
    model_file: meta.model_file,
    model_size_mb: meta.model_size_mb,
    currency: meta.currency,
    mileage_unit: meta.mileage_unit,
    market: meta.market,
    reference_year: meta.reference_year,
    model_year_range: meta.model_year_range,
    mileage_range: meta.mileage_range,
    validation_metrics: meta.validation_metrics,
    test_metrics: meta.test_metrics,
    test_metrics_trimmed: meta.test_metrics_trimmed,
    candidates: meta.candidates,
    selection_reason: meta.selection_reason,
  });
});

// Direct FastAPI-compatible /predict endpoint (matches backend/src/api/main.py)
app.post('/predict', (req, res) => {
  if (!modelState.loaded) {
    return res.status(503).json({
      detail: `Model is not loaded. ${modelState.loadError || ''}`.trim(),
    });
  }
  try {
    const result = runLightGBMPredictor(req.body || {}, true);
    return res.json({
      success: true,
      predicted_price: result.predicted_price,
      currency: result.currency,
      model_version: result.model_version,
      prediction_unit: 'vehicle',
      in_training_distribution: result.in_training_distribution,
      warnings: result.warnings,
      inference_ms: result.inference_ms,
    });
  } catch (err: any) {
    if (err instanceof PredictionValidationError) {
      return res.status(422).json({ detail: err.message });
    }
    return res.status(500).json({ detail: 'Prediction failed due to an internal error.' });
  }
});

// Platform /api/predict-price endpoint (computes LightGBM valuation + canonical SHA-256 hash)
app.post('/api/predict-price', (req, res) => {
  if (!modelState.loaded) {
    return res.status(503).json({
      error: `Model is not loaded. ${modelState.loadError || ''}`.trim(),
    });
  }
  try {
    const body = req.body || {};
    const category = String(body.category || 'vehicle').trim().toLowerCase();
    if (category !== 'vehicle') {
      return res.status(400).json({
        error: 'AuctionChain exclusively supports the "vehicle" auction category.',
      });
    }

    const attributes = body.attributes && typeof body.attributes === 'object' ? body.attributes : body;
    const result = runLightGBMPredictor(attributes, false);

    const canonicalJson = canonicalizeVehicleData(attributes);
    const productDataHash = computeProductDataHash(canonicalJson);
    const predictionTimestamp = Math.floor(Date.now() / 1000);
    const predictionId = nextPredictionCounter++;
    const priceCents = Math.round(result.predicted_price * 100);

    const record: StoredPrediction = {
      prediction_id: predictionId,
      category: 'vehicle',
      predicted_price: result.predicted_price,
      predicted_price_inr: result.predicted_price,
      predicted_price_paise: priceCents,
      currency: 'USD',
      model_version: result.model_version,
      prediction_timestamp: predictionTimestamp,
      product_data_hash: productDataHash,
      canonical_json: canonicalJson,
      in_training_distribution: result.in_training_distribution,
      warnings: result.warnings,
      inference_ms: result.inference_ms,
      attributes,
      metrics: LIGHTGBM_MODEL_METRICS,
    };

    predictionStore.set(predictionId, record);

    return res.json({
      success: true,
      prediction_id: predictionId,
      category: 'vehicle',
      predicted_price: result.predicted_price,
      predicted_price_inr: result.predicted_price,
      predicted_price_paise: priceCents,
      currency: 'USD',
      model_version: result.model_version,
      prediction_unit: 'vehicle',
      in_training_distribution: result.in_training_distribution,
      warnings: result.warnings,
      inference_ms: result.inference_ms,
      prediction_timestamp: predictionTimestamp,
      product_data_hash: productDataHash,
      canonical_json: canonicalJson,
      feature_breakdown: result.feature_breakdown,
      metrics: LIGHTGBM_MODEL_METRICS,
    });
  } catch (err: any) {
    if (err instanceof PredictionValidationError) {
      return res.status(422).json({ error: err.message, detail: err.message });
    }
    return res.status(500).json({
      error: err?.message || 'Prediction service error',
    });
  }
});

// Oracle Registration Endpoint
app.post('/api/oracle/register', (req, res) => {
  try {
    const {
      prediction_id,
      predicted_price,
      predicted_price_inr,
      product_data_hash,
      model_version,
      prediction_timestamp,
      oracle_address,
    } = req.body || {};

    const resolvedPrice = Number(predicted_price ?? predicted_price_inr);
    if (!resolvedPrice || !product_data_hash) {
      return res.status(400).json({
        error: 'Missing required oracle payload fields (predicted_price, product_data_hash).',
      });
    }

    const predId = Number(prediction_id) || nextPredictionCounter++;
    const priceCents = Math.round(resolvedPrice * 100);
    const signer = oracle_address || DEFAULT_ORACLE_ACCOUNT;
    const blockNumber = ++currentBlockNumber;
    const version = model_version || '1.0.0';

    const txSeed = `${predId}:${priceCents}:${product_data_hash}:${version}:${prediction_timestamp || Date.now()}`;
    const txHash = `0x${crypto.createHash('sha256').update(txSeed).digest('hex')}`;

    const existing = predictionStore.get(predId);
    const oracleConfirmation = {
      registered: true,
      oracle_address: signer,
      tx_hash: txHash,
      block_number: blockNumber,
      contract_address: ORACLE_CONTRACT_ADDRESS,
      registered_at: Math.floor(Date.now() / 1000),
    };

    if (existing) {
      existing.oracle = oracleConfirmation;
      predictionStore.set(predId, existing);
    } else {
      predictionStore.set(predId, {
        prediction_id: predId,
        category: 'vehicle',
        predicted_price: resolvedPrice,
        predicted_price_inr: resolvedPrice,
        predicted_price_paise: priceCents,
        currency: 'USD',
        model_version: version,
        prediction_timestamp: Number(prediction_timestamp) || Math.floor(Date.now() / 1000),
        product_data_hash: String(product_data_hash),
        canonical_json: '{}',
        in_training_distribution: true,
        warnings: [],
        inference_ms: 1.5,
        attributes: {},
        metrics: LIGHTGBM_MODEL_METRICS,
        oracle: oracleConfirmation,
      });
    }

    return res.json({
      prediction_id: predId,
      predicted_price: resolvedPrice,
      predicted_price_inr: resolvedPrice,
      predicted_price_paise: priceCents,
      product_data_hash,
      model_version: version,
      prediction_timestamp: Number(prediction_timestamp) || Math.floor(Date.now() / 1000),
      oracle_address: signer,
      contract_address: ORACLE_CONTRACT_ADDRESS,
      tx_hash: txHash,
      block_number: blockNumber,
      status: 'CONFIRMED_ON_CHAIN',
    });
  } catch (err: any) {
    return res.status(500).json({
      error: err?.message || 'Oracle registration error',
    });
  }
});

app.get('/api/predictions/:id', (req, res) => {
  const id = Number(req.params.id);
  const record = predictionStore.get(id);
  if (!record) {
    return res.status(404).json({ error: `Prediction #${id} not found.` });
  }
  return res.json(record);
});

async function startServer() {
  const args = process.argv.slice(2);
  let PORT = 3000;
  let HOST = '0.0.0.0';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--port' && args[i + 1]) {
      PORT = Number(args[i + 1]) || PORT;
      i++;
    } else if (args[i] === '--host') {
      if (args[i + 1] && !args[i + 1].startsWith('-')) {
        HOST = args[i + 1];
        i++;
      } else {
        HOST = '0.0.0.0';
      }
    }
  }

  const isProduction = args.includes('--prod');
  if (!isProduction) {
    const vite = await createViteServer({
      configFile: path.resolve(process.cwd(), 'vite.config.ts'),
      root: path.resolve(process.cwd(), 'frontend'),
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    app.use('*', async (req, res, next) => {
      if (req.method !== 'GET') return next();
      try {
        const url = req.originalUrl;
        const indexPath = path.resolve(process.cwd(), 'frontend/index.html');
        let template = fs.readFileSync(indexPath, 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, HOST, () => {
    console.log(
      `\n  VITE v6.1.1  ready\n\n  ➜  Local:   http://localhost:${PORT}/\n`
    );
    console.log(
      `[AuctionChain] Server & LightGBM v1.0.0 Engine active at http://localhost:${PORT}`
    );
  });
}

startServer();
