"""Central configuration for the AuctionChain vehicle price prediction service.

All paths are resolved relative to the project root so that the project can be
moved or cloned without changing code.
"""
from __future__ import annotations

from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent

DATASET_DIR = PROJECT_ROOT / "dataset"
RAW_DATA_PATH = DATASET_DIR / "raw" / "used_cars.csv"
PROCESSED_DATA_DIR = DATASET_DIR / "processed"
TRAIN_DATA_PATH = PROCESSED_DATA_DIR / "train.csv"
VALIDATION_DATA_PATH = PROCESSED_DATA_DIR / "validation.csv"
TEST_DATA_PATH = PROCESSED_DATA_DIR / "test.csv"
FULL_FEATURES_PATH = PROCESSED_DATA_DIR / "features.csv"

MODELS_DIR = PROJECT_ROOT / "models"
CANDIDATES_DIR = MODELS_DIR / "candidates"
FINAL_MODEL_PATH = MODELS_DIR / "vehicle_price_model.cbm"
FINAL_MODEL_METADATA_PATH = MODELS_DIR / "model_metadata.json"
FEATURE_CONFIG_PATH = MODELS_DIR / "feature_config.json"

REPORTS_DIR = PROJECT_ROOT / "reports"
FIGURES_DIR = REPORTS_DIR / "figures"
DATASET_ANALYSIS_PATH = REPORTS_DIR / "dataset_analysis.json"
MODEL_COMPARISON_PATH = REPORTS_DIR / "model_comparison.json"
EVALUATION_REPORT_PATH = REPORTS_DIR / "evaluation_report.txt"

TARGET_COLUMN = "price"
ID_COLUMN = "listing_id"
GROUP_COLUMN = "group_id"
SPLIT_COLUMN = "split"

# Reproducibility
RANDOM_SEED = 42
TEST_FRACTION = 0.15
VALIDATION_FRACTION = 0.15  # of the full dataset

# Dataset reference year used to derive vehicle age.  It is stored in the model
# metadata and reused at inference time so training and serving agree.
REFERENCE_YEAR = 2026

# Dataset facts verified during EDA
CURRENCY = "USD"
MILEAGE_UNIT = "mi"
MARKET = "United States (US listings, prices in USD, mileage in miles)"
MODEL_VERSION = "1.0.0"

# Model feature definition.  Raw identifiers are transformed by
# src/data/preprocessing.py before they reach this list.
CATEGORICAL_FEATURES = [
    "brand",
    "model",
    "fuel_type",
    "transmission",
    "exterior_color",
    "interior_color",
    "accident_history",
    "engine_family",
]

NUMERICAL_FEATURES = [
    "vehicle_age",
    "mileage",
    "mileage_per_year",
    "horsepower",
    "displacement_l",
    "cylinders",
    "transmission_speeds",
    "is_turbo",
    "is_supercharged",
    "is_electric",
    "engine_data_missing",
]

FEATURE_COLUMNS = CATEGORICAL_FEATURES + NUMERICAL_FEATURES

# Numeric columns that may legitimately contain missing values and therefore
# need a train-fitted median imputer.
IMPUTABLE_NUMERICAL_FEATURES = [
    "horsepower",
    "displacement_l",
    "cylinders",
    "transmission_speeds",
]

# CatBoost starting point (the training script tunes around these values).
CATBOOST_BASE_PARAMS = {
    "loss_function": "MAE",
    "eval_metric": "MAE",
    "iterations": 500,
    "depth": 6,
    "learning_rate": 0.05,
    "random_seed": RANDOM_SEED,
    "task_type": "CPU",
    "verbose": False,
    "allow_writing_files": False,
    "max_ctr_complexity": 2,
}

# LightGBM starting point.
LIGHTGBM_BASE_PARAMS = {
    "objective": "regression_l1",
    "metric": "mae",
    "n_estimators": 500,
    "learning_rate": 0.05,
    "random_state": RANDOM_SEED,
    "n_jobs": -1,
    "verbosity": -1,
}
