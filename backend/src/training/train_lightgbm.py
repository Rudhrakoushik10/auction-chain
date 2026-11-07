"""LightGBM training as the lightweight alternative to CatBoost."""
from __future__ import annotations

import gc
import tempfile
import time
from pathlib import Path
from typing import Any, Callable

import lightgbm as lgb
import numpy as np
import pandas as pd

import config
from src.evaluation.evaluate import (
    benchmark_predictions,
    current_rss_mb,
    file_size_mb,
    regression_metrics,
)

LIGHTGBM_GRID: list[dict[str, Any]] = [
    {"num_leaves": 15, "learning_rate": 0.05, "n_estimators": 600},
    {"num_leaves": 31, "learning_rate": 0.05, "n_estimators": 600},
    {"num_leaves": 15, "learning_rate": 0.03, "n_estimators": 900},
    {"num_leaves": 31, "learning_rate": 0.03, "n_estimators": 900},
    {"num_leaves": 15, "learning_rate": 0.08, "n_estimators": 500},
    {"num_leaves": 31, "learning_rate": 0.08, "n_estimators": 500},
]


def _category_levels(X: pd.DataFrame, categorical: list[str]) -> dict[str, list[str]]:
    return {
        column: sorted(X[column].dropna().astype(str).unique().tolist())
        for column in categorical
    }


def _encode(
    frame: pd.DataFrame,
    feature_columns: list[str],
    categorical: list[str],
    numerical: list[str],
    levels: dict[str, list[str]],
) -> pd.DataFrame:
    encoded = frame[feature_columns].copy()
    for column in categorical:
        encoded[column] = pd.Categorical(
            encoded[column].astype(str), categories=levels[column]
        )
    for column in numerical:
        if column in encoded.columns:
            encoded[column] = encoded[column].astype(float)
    return encoded


def _estimate_memory(path: str) -> float:
    gc.collect()
    before = current_rss_mb()
    loaded = lgb.Booster(model_file=path)
    after = current_rss_mb()
    del loaded
    gc.collect()
    return max(after - before, 0.0)


def _fit(
    X_train: pd.DataFrame,
    y_train: pd.Series,
    X_val: pd.DataFrame,
    y_val: pd.Series,
    params: dict[str, Any],
    feature_columns: list[str],
    categorical: list[str],
    numerical: list[str],
    levels: dict[str, list[str]],
    seed: int,
) -> dict[str, Any]:
    train_encoded = _encode(X_train, feature_columns, categorical, numerical, levels)
    val_encoded = _encode(X_val, feature_columns, categorical, numerical, levels)

    model = lgb.LGBMRegressor(
        objective="regression_l1",
        metric="mae",
        random_state=seed,
        n_jobs=-1,
        verbosity=-1,
        min_child_samples=15,
        subsample=0.9,
        subsample_freq=1,
        colsample_bytree=0.8,
        reg_lambda=1.0,
        max_cat_threshold=32,
        cat_smooth=10.0,
        cat_l2=10.0,
        **params,
    )
    start = time.perf_counter()
    model.fit(
        train_encoded,
        y_train,
        eval_X=val_encoded,
        eval_y=y_val,
        categorical_feature=categorical,
        callbacks=[lgb.early_stopping(50, verbose=False)],
    )
    training_seconds = time.perf_counter() - start

    validation_predictions = model.predict(val_encoded)
    validation_metrics = regression_metrics(y_val, validation_predictions)

    with tempfile.NamedTemporaryFile(suffix=".txt", delete=False) as handle:
        artifact_path = handle.name
    model.booster_.save_model(artifact_path)
    size_mb = file_size_mb(artifact_path)
    Path(artifact_path).unlink(missing_ok=True)

    return {
        "model": model,
        "params": dict(params),
        "best_iteration": int(model.best_iteration_ or model.n_estimators_),
        "trees": int(model.booster_.num_trees()),
        "validation_metrics": validation_metrics,
        "model_size_mb": size_mb,
        "training_seconds": training_seconds,
    }


def train_lightgbm(
    X_train: pd.DataFrame,
    y_train: pd.Series,
    X_val: pd.DataFrame,
    y_val: pd.Series,
    X_test: pd.DataFrame,
    y_test: pd.Series,
    feature_columns: list[str],
    categorical: list[str],
    numerical: list[str],
    seed: int = config.RANDOM_SEED,
) -> dict[str, Any]:
    levels = _category_levels(X_train, categorical)
    trial_results: list[dict[str, Any]] = []
    for index, params in enumerate(LIGHTGBM_GRID, start=1):
        result = _fit(
            X_train,
            y_train,
            X_val,
            y_val,
            params,
            feature_columns,
            categorical,
            numerical,
            levels,
            seed,
        )
        result["trial"] = index
        trial_results.append(result)
        print(
            f"[lightgbm] trial {index}/{len(LIGHTGBM_GRID)} "
            f"leaves={params['num_leaves']} lr={params['learning_rate']} "
            f"trees={result['trees']} val_MAE={result['validation_metrics']['mae']:.2f} "
            f"size={result['model_size_mb']:.2f}MB"
        )

    best_mae = min(result["validation_metrics"]["mae"] for result in trial_results)
    eligible = [
        result
        for result in trial_results
        if result["validation_metrics"]["mae"] <= best_mae * 1.01
    ]
    chosen = min(
        eligible,
        key=lambda result: (result["model_size_mb"], result["validation_metrics"]["mae"]),
    )
    model = chosen["model"]

    def predict_fn(frame: pd.DataFrame) -> np.ndarray:
        encoded = _encode(frame, feature_columns, categorical, numerical, levels)
        return model.predict(encoded)

    validation_metrics = regression_metrics(y_val, predict_fn(X_val))
    test_metrics = regression_metrics(y_test, predict_fn(X_test))

    with tempfile.NamedTemporaryFile(suffix=".txt", delete=False) as handle:
        artifact_path = handle.name
    model.booster_.save_model(artifact_path)
    size_mb = file_size_mb(artifact_path)
    memory_mb = _estimate_memory(artifact_path)
    Path(artifact_path).unlink(missing_ok=True)

    inference = benchmark_predictions(predict_fn, X_test)

    return {
        "name": "LightGBM",
        "algorithm": "lightgbm",
        "model": model,
        "predict_fn": predict_fn,
        "params": {
            **chosen["params"],
            "objective": "regression_l1",
            "metric": "mae",
            "trees_used": chosen["trees"],
            "early_stopping_rounds": 50,
        },
        "feature_columns": list(feature_columns),
        "categorical_features": list(categorical),
        "numerical_features": list(numerical),
        "category_levels": levels,
        "feature_set": "full",
        "validation_metrics": validation_metrics,
        "test_metrics": test_metrics,
        "model_size_mb": size_mb,
        "model_memory_mb": memory_mb,
        "inference": inference,
        "training_seconds": sum(trial["training_seconds"] for trial in trial_results),
        "training_rows": int(len(X_train)),
        "best_iteration": chosen["best_iteration"],
        "trials": [
            {
                "trial": result["trial"],
                "params": result["params"],
                "trees": result["trees"],
                "validation_mae": result["validation_metrics"]["mae"],
                "model_size_mb": result["model_size_mb"],
                "training_seconds": result["training_seconds"],
            }
            for result in trial_results
        ],
        "notes": "",
    }


def refit_lightgbm(
    X_train: pd.DataFrame,
    y_train: pd.Series,
    X_val: pd.DataFrame,
    y_val: pd.Series,
    result: dict[str, Any],
    seed: int = config.RANDOM_SEED,
) -> lgb.LGBMRegressor:
    feature_columns = result["feature_columns"]
    categorical = result["categorical_features"]
    numerical = result["numerical_features"]
    levels = result["category_levels"]
    params = result["params"]
    iterations = max(100, int(result["best_iteration"] * 1.05))

    combined_X = pd.concat([X_train[feature_columns], X_val[feature_columns]], axis=0)
    combined_y = pd.concat([y_train, y_val], axis=0)
    train_encoded = _encode(combined_X, feature_columns, categorical, numerical, levels)

    model = lgb.LGBMRegressor(
        objective="regression_l1",
        metric="mae",
        random_state=seed,
        n_jobs=-1,
        verbosity=-1,
        min_child_samples=15,
        subsample=0.9,
        subsample_freq=1,
        colsample_bytree=0.8,
        reg_lambda=1.0,
        max_cat_threshold=32,
        cat_smooth=10.0,
        cat_l2=10.0,
        num_leaves=params["num_leaves"],
        learning_rate=params["learning_rate"],
        n_estimators=iterations,
    )
    model.fit(train_encoded, combined_y, categorical_feature=categorical)
    return model
