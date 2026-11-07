"""Baseline models: Linear Regression and Random Forest.

Both models use the exact same train/validation/test partitions as CatBoost and
LightGBM.  Categorical handling is explicit:
* Linear Regression uses one-hot encoding (rare levels merged).
* Random Forest uses ordinal encoding with a dedicated unknown bucket.
"""
from __future__ import annotations

import gc
import tempfile
import time
from pathlib import Path
from typing import Any, Callable

import joblib
import numpy as np
import pandas as pd
from sklearn.base import clone
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LinearRegression
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, OrdinalEncoder, StandardScaler

import config
from src.evaluation.evaluate import (
    benchmark_predictions,
    current_rss_mb,
    file_size_mb,
    regression_metrics,
)


def _linear_preprocessor(
    categorical: list[str], numerical: list[str]
) -> ColumnTransformer:
    return ColumnTransformer(
        transformers=[
            ("categorical", OneHotEncoder(handle_unknown="ignore", min_frequency=10), categorical),
            ("numerical", StandardScaler(), numerical),
        ],
        remainder="drop",
    )


def _forest_preprocessor(
    categorical: list[str], numerical: list[str]
) -> ColumnTransformer:
    return ColumnTransformer(
        transformers=[
            (
                "categorical",
                OrdinalEncoder(
                    handle_unknown="use_encoded_value",
                    unknown_value=-1,
                    encoded_missing_value=-2,
                ),
                categorical,
            ),
            ("numerical", "passthrough", numerical),
        ],
        remainder="drop",
    )


def _estimate_joblib_memory(path: str) -> float:
    gc.collect()
    before = current_rss_mb()
    loaded = joblib.load(path)
    after = current_rss_mb()
    del loaded
    gc.collect()
    return max(after - before, 0.0)


def _finalise(
    name: str,
    algorithm: str,
    model: Pipeline,
    params: dict[str, Any],
    X_train: pd.DataFrame,
    y_train: pd.Series,
    X_val: pd.DataFrame,
    y_val: pd.Series,
    X_test: pd.DataFrame,
    y_test: pd.Series,
    feature_columns: list[str],
    categorical: list[str],
    training_seconds: float,
) -> dict[str, Any]:
    predict_fn: Callable[[pd.DataFrame], np.ndarray] = model.predict
    validation_metrics = regression_metrics(y_val, predict_fn(X_val))
    test_metrics = regression_metrics(y_test, predict_fn(X_test))

    with tempfile.NamedTemporaryFile(suffix=".joblib", delete=False) as handle:
        artifact_path = handle.name
    joblib.dump(model, artifact_path)
    size_mb = file_size_mb(artifact_path)
    memory_mb = _estimate_joblib_memory(artifact_path)
    inference = benchmark_predictions(predict_fn, X_test)
    Path(artifact_path).unlink(missing_ok=True)

    return {
        "name": name,
        "algorithm": algorithm,
        "model": model,
        "predict_fn": predict_fn,
        "params": params,
        "feature_columns": feature_columns,
        "categorical_features": categorical,
        "validation_metrics": validation_metrics,
        "test_metrics": test_metrics,
        "model_size_mb": size_mb,
        "model_memory_mb": memory_mb,
        "inference": inference,
        "training_seconds": training_seconds,
        "training_rows": int(len(X_train)),
        "notes": "",
    }


def train_linear_regression(
    X_train: pd.DataFrame,
    y_train: pd.Series,
    X_val: pd.DataFrame,
    y_val: pd.Series,
    X_test: pd.DataFrame,
    y_test: pd.Series,
    categorical: list[str],
    numerical: list[str],
    seed: int = config.RANDOM_SEED,
) -> dict[str, Any]:
    pipeline = Pipeline(
        steps=[
            ("preprocessor", _linear_preprocessor(categorical, numerical)),
            ("model", LinearRegression()),
        ]
    )
    start = time.perf_counter()
    pipeline.fit(X_train, y_train)
    training_seconds = time.perf_counter() - start
    feature_columns = categorical + numerical
    return _finalise(
        name="Linear Regression",
        algorithm="sklearn-linear",
        model=pipeline,
        params={"model": "LinearRegression", "one_hot_min_frequency": 10},
        X_train=X_train,
        y_train=y_train,
        X_val=X_val,
        y_val=y_val,
        X_test=X_test,
        y_test=y_test,
        feature_columns=feature_columns,
        categorical=categorical,
        training_seconds=training_seconds,
    )


def train_random_forest(
    X_train: pd.DataFrame,
    y_train: pd.Series,
    X_val: pd.DataFrame,
    y_val: pd.Series,
    X_test: pd.DataFrame,
    y_test: pd.Series,
    categorical: list[str],
    numerical: list[str],
    seed: int = config.RANDOM_SEED,
) -> dict[str, Any]:
    params = {
        "n_estimators": 200,
        "max_depth": 18,
        "min_samples_leaf": 2,
        "max_features": 0.8,
        "random_state": seed,
        "n_jobs": -1,
    }
    pipeline = Pipeline(
        steps=[
            ("preprocessor", _forest_preprocessor(categorical, numerical)),
            ("model", RandomForestRegressor(**params)),
        ]
    )
    start = time.perf_counter()
    pipeline.fit(X_train, y_train)
    training_seconds = time.perf_counter() - start
    feature_columns = categorical + numerical
    return _finalise(
        name="Random Forest",
        algorithm="sklearn-random-forest",
        model=pipeline,
        params=params,
        X_train=X_train,
        y_train=y_train,
        X_val=X_val,
        y_val=y_val,
        X_test=X_test,
        y_test=y_test,
        feature_columns=feature_columns,
        categorical=categorical,
        training_seconds=training_seconds,
    )

def refit_baseline(
    X_train: pd.DataFrame,
    y_train: pd.Series,
    X_val: pd.DataFrame,
    y_val: pd.Series,
    result: dict[str, Any],
) -> Pipeline:
    """Refit a selected scikit-learn baseline on train + validation."""
    model = clone(result["model"])
    feature_columns = result["feature_columns"]
    combined_X = pd.concat([X_train[feature_columns], X_val[feature_columns]], axis=0)
    combined_y = pd.concat([y_train, y_val], axis=0)
    model.fit(combined_X, combined_y)
    return model
