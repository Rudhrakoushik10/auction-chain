# AuctionChain Vehicle Price Prediction

A small, CPU-only machine-learning service that estimates a used vehicle's
market price from listing attributes. It is designed to sit behind the
AuctionChain auction platform as an **advisory valuation** component: it never
executes blockchain transactions and never exposes training data.

The model is trained on the supplied US-market dataset (`dataset/raw/used_cars.csv`,
4,009 listings, 12 columns) and served through a FastAPI endpoint that loads the
model once at startup.

## What is in this repository

```
backend/
├── config.py                     # paths, feature lists, seed, reference year
├── dataset/
│   ├── raw/used_cars.csv         # supplied source data
│   └── processed/                # reproducible train/validation/test features
├── models/
│   ├── vehicle_price_model.txt   # final exported model (LightGBM)
│   ├── model_metadata.json       # metrics, hyperparameters, feature schema
│   ├── feature_config.json       # category levels, medians, ranges
│   └── candidates/               # reserved for alternative artifacts
├── notebooks/
│   └── exploratory_analysis.ipynb
├── reports/
│   ├── dataset_analysis.json
│   ├── model_comparison.json
│   ├── evaluation_report.txt     # human-readable final report
│   ├── feature_importance.csv
│   └── figures/                  # actual-vs-predicted, residuals, importance
├── src/
│   ├── data/                     # loading, cleaning, feature engineering, split
│   ├── training/                 # baselines, CatBoost, LightGBM, selection
│   ├── evaluation/               # metrics, latency/memory probes, plots
│   ├── prediction/               # production predictor wrapper
│   └── api/                      # FastAPI app and Pydantic schemas
├── tests/                        # preprocessing, predictor and API tests
├── requirements.txt
└── README.md
```

## Dataset facts and preprocessing choices

- **Market:** United States listings. Prices are **USD** (`$10,300`) and mileage is
  **miles** (`51,000 mi.`).
- **Split:** grouped 70/15/15 by vehicle signature
  (`brand|model|year|mileage//500`), so duplicate/near-duplicate listings cannot
  leak between train, validation and test: 2,801 / 602 / 606 rows.
- **Target:** `price`. Metrics are reported in dollars.
- **`clean_title`:** the source only contains `Yes` (3,413 rows) or missing
  (596 rows). It has no usable variance, so it is **excluded from the model
  features**. The API still accepts `clean_title` for compatibility; it has no
  effect on the prediction.
- **Brand truncation:** `Land`, `Aston` and `Alfa` are repaired to Land Rover,
  Aston Martin and Alfa Romeo using the model text.
- **Fuel placeholders:** `–` and `not supported` become `Unknown`, or `Electric`
  when the engine description indicates an electric motor.
- **Engine text:** parsed into horsepower, displacement, cylinders, forced
  induction, electric indicator and engine family.
- **Outlier:** one 2005 Maserati Quattroporte at `$2,954,083` is retained as a
  data anomaly. MAE training limits its influence; a trimmed test metric is
  reported alongside the full metric.
- **Imputation:** numeric medians are fit on the training partition only and
  reused by the predictor.

## Model selection and measured results

Four candidates were trained and compared on validation MAE; the isolated test
set was used once for the final report, never for selection.

| Model | Val MAE | Test MAE | Test R² | Test MAPE | Size | 1-row latency |
|---|---:|---:|---:|---:|---:|---:|
| **LightGBM (selected)** | **$6,789.74** | **$9,702.14** | 0.7899 | 20.05% | 2.40 MB | 9.77 ms |
| CatBoost | $8,071.77 | $10,372.62 | 0.8024 | 24.97% | 0.92 MB | 0.91 ms |
| Random Forest | $9,976.53 | $13,263.03 | 0.7138 | 28.69% | 20.63 MB | 32.57 ms |
| Linear Regression | $17,438.79 | $21,040.01 | 0.5531 | 80.31% | 0.06 MB | 5.25 ms |

LightGBM had the best validation MAE and was refit on train + validation. Final
held-out test performance:

- **MAE:** `$9,484.57`
- **RMSE:** `$27,311.06`
- **R²:** `0.7615`
- **MAPE:** `19.35%`
- **Median absolute error:** `$3,854.70`
- **Excluding the top 0.5% price outliers (4 rows > $417,061):** MAE `$7,862.64`,
  R² `0.8571`, MAPE `19.16%`

Serving efficiency on CPU:

- Model file: **2.5371 MB**
- Fresh-process loaded-model memory: **5.95 MB** (peak during first prediction
  **6.91 MB**)
- Model load time: **~33 ms**
- Single-row inference: **~11.5 ms** mean
- Batch inference: **~25,700 rows/s** (606 rows in ~24 ms)

**Suitability:** moderately suitable as an advisory reference. It captures the
main price drivers, but errors are material for unusual or high-value vehicles.
It must not be presented as a guaranteed sale price.

Full details: `reports/evaluation_report.txt`, `reports/model_comparison.json`,
`models/model_metadata.json`.

## Setup

Python 3.11 is recommended. Using conda:

```powershell
conda create -n vehicle-price-ai python=3.11 -y
conda activate vehicle-price-ai
pip install -r requirements.txt
```

Alternatively, run commands without activating the environment:

```powershell
conda run -n vehicle-price-ai python -m src.training.train
```

All paths are resolved relative to `config.py`, so the project can be moved or
cloned without editing code. Run commands from the project root.

## Train from scratch

```powershell
python -m src.training.train
```

This regenerates the processed splits, comparison JSON, figures, final model,
metadata and evaluation report. Training is reproducible with seed `42`.
`--skip-ablation` skips the CatBoost feature-set ablation and is faster.

The training pipeline:

1. inspects the raw CSV and writes `reports/dataset_analysis.json`;
2. engineers features and creates grouped splits;
3. trains Linear Regression, Random Forest, CatBoost and LightGBM;
4. selects a winner on validation MAE, then artifact size and latency;
5. refits the winner on train + validation;
6. evaluates once on the isolated test set;
7. exports the model, metadata, feature configuration, figures and report.

## Run the API

```powershell
uvicorn src.api.main:app --host 127.0.0.1 --port 8000
```

Interactive docs: <http://127.0.0.1:8000/docs>

### `GET /health`

```json
{
  "status": "ok",
  "model_loaded": true,
  "model_version": "1.0.0",
  "algorithm": "lightgbm",
  "load_error": null
}
```

Returns `503` from `/predict` and `status: "degraded"` from `/health` if the
artifact cannot be loaded.

### `POST /predict`

Required fields: `brand`, `model`, `year`, `mileage` (miles).
Optional fields: `fuel_type`, `engine_type`, `transmission`,
`exterior_color`, `interior_color`, `accident_history` (boolean, `yes`/`no`, or
`unknown`), `clean_title` (boolean or `yes`/`no`; accepted, no effect).

```powershell
$body = @{
  brand = "Ford"
  model = "F-150 XLT"
  year = 2020
  mileage = 45000
  fuel_type = "Gasoline"
  engine_type = "3.5L V6 400hp Twin Turbo"
  transmission = "10-Speed Automatic"
  exterior_color = "Black"
  interior_color = "Black"
  accident_history = $false
  clean_title = $true
} | ConvertTo-Json

Invoke-RestMethod -Uri http://127.0.0.1:8000/predict `
  -Method Post -ContentType "application/json" -Body $body
```

Example response:

```json
{
  "success": true,
  "predicted_price": 46216.25,
  "currency": "USD",
  "model_version": "1.0.0",
  "prediction_unit": "vehicle",
  "in_training_distribution": true,
  "warnings": [],
  "inference_ms": 11.5
}
```

`warnings` may contain:

- unsupported brand/model, year or mileage outside the training range
  (also sets `in_training_distribution: false`);
- missing optional inputs (the prediction still succeeds, with neutral/imputed
  values);
- unrecognised fuel/transmission text or unparseable engine descriptions.

Invalid required fields, negative mileage, implausible years or extra JSON
fields return HTTP `422`.

## Integration notes for the AuctionChain backend

- Call `POST /predict` with the listing attributes and store the returned
  `predicted_price`, `model_version`, `warnings` and `in_training_distribution`
  with the valuation record.
- Treat the value as **advisory**, not an authoritative or guaranteed price.
  Surface `warnings` and consider manual review when
  `in_training_distribution` is `false`.
- Units are fixed: prices **USD**, mileage **miles**. Do not send kilometres.
- `clean_title` is accepted but ignored; the dataset cannot learn an effect.
- The model is loaded once per API process and is safe for concurrent reads.
  Run multiple Uvicorn workers only if the host has enough memory (each worker
  loads its own copy, ~6 MB plus the Python runtime).
- No authentication, CORS or rate limiting is configured: deploy behind the
  existing API gateway.
- The service is purely predictive and never signs or submits blockchain
  transactions.
- To retrain after new data, replace `dataset/raw/used_cars.csv`, update
  `REFERENCE_YEAR` if needed, rerun training, then restart the API.

## Tests

```powershell
python -m pytest -q
```

The suite covers price/mileage parsing, brand repair, engine/transmission/colour
normalisation, feature engineering, predictor behaviour (normal input, missing
optional fields, old/new vehicles, high/low mileage, accidents, clean-title
neutrality, unsupported vehicles, invalid numerics) and the FastAPI endpoints
(health, success, validation errors, extra fields, no data endpoints).

## Limitations

- US-market data only; do not reuse for another market without retraining.
- Dataset covers model years 1974–2024 and 100–405,000 miles. Values outside
  these ranges are accepted but flagged as out-of-distribution.
- Extreme exotics and one implausible Maserati listing remain in the data.
- The model should be retrained periodically as market prices move.
- Predictions are estimates, not appraisals or guaranteed sale prices.

## Reproducibility

- Random seed: `42`
- Reference year: `2026` (`VEHICLE_REFERENCE_YEAR` environment variable can
  override it before training; the value is stored in model metadata and reused
  at inference).
- Final algorithm: LightGBM (`regression_l1`, 31 leaves, learning rate `0.03`,
  934 trees after early stopping).
- All learned preprocessing statistics are fit on the training partition only.
- The test partition is isolated from model selection and hyperparameter tuning.
