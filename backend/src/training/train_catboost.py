"""CatBoost training, hyperparameter search and feature-set ablation."""
from __future__ import annotations

import gc
import tempfile
import time
from pathlib import Path
from typing import Any, Callable

import numpy as np
import pandas as pd
from catboost import CatBoostRegressor

import config
from src.evaluation.evaluate import (
    benchmark_predictions,
    current_rss_mb,
    file_size_mb,
    regression_metrics,
)

CATBOOST_GRID: list[dict[str, Any]] = [
    {"depth": 4, "learning_rate": 0.05, "iterations": 600},
    {"depth": 5, "learning_rate": 0.05, "iterations": 600},
    {"depth": 6, "learning_rate": 0.05, "iterations": 600},
    {"depth": 4, "learning_rate": 0.03, "iterations": 900},
    {"depth": 5, "learning_rate": 0.03, "iterations": 900},
    {"depth": 6, "learning_rate": 0.03, "iterations": 900},
    {"depth": 4, "learning_rate": 0.08, "iterations": 500},
    {"depth": 5, "learning_rate": 0.08, "iterations": 500},
    {"depth": 6, "learning_rate": 0.08, "iterations": 500},
]


def _estimate_cbm_memory(path: str) -> float:
    gc.collect()
    before = current_rss_mb()
    loaded = CatBoostRegressor().load_model(path)
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
    seed: int,
) -> dict[str, Any]:
    model = CatBoostRegressor(
        loss_function="MAE",
        eval_metric="MAE",
        random_seed=seed,
        task_type="CPU",
        verbose=False,
        allow_writing_files=False,
        max_ctr_complexity=2,
        od_type="Iter",
        early_stopping_rounds=50,
        use_best_model=True,
        thread_count=-1,
        **params,
    )
    start = time.perf_counter()
    model.fit(
        X_train[feature_columns],
        y_train,
        cat_features=categorical,
        eval_set=(X_val[feature_columns], y_val),
        use_best_model=True,
    )
    training_seconds = time.perf_counter() - start

    validation_predictions = model.predict(X_val[feature_columns])
    validation_metrics = regression_metrics(y_val, validation_predictions)

    with tempfile.NamedTemporaryFile(suffix=".cbm", delete=False) as handle:
        artifact_path = handle.name
    model.save_model(artifact_path)
    size_mb = file_size_mb(artifact_path)
    Path(artifact_path).unlink(missing_ok=True)

    best_iteration = int(model.get_best_iteration() or model.tree_count_)
    return {
        "model": model,
        "params": dict(params),
        "feature_columns": list(feature_columns),
        "categorical": list(categorical),
        "best_iteration": best_iteration,
        "trees": int(model.tree_count_),
        "validation_metrics": validation_metrics,
        "model_size_mb": size_mb,
        "training_seconds": training_seconds,
    }


def _select_compact(candidates: list[dict[str, Any]], tolerance: float = 0.01) -> dict[str, Any]:
    """Choose the smallest model whose validation MAE is within tolerance of best."""
    best_mae = min(candidate["validation_metrics"]["mae"] for candidate in candidates)
    eligible = [
        candidate
        for candidate in candidates
        if candidate["validation_metrics"]["mae"] <= best_mae * (1.0 + tolerance)
    ]
    return min(
        eligible,
        key=lambda candidate: (
            candidate["model_size_mb"],
            candidate["validation_metrics"]["mae"],
        ),
    )


def _feature_variants(feature_columns: list[str], categorical: list[str]) -> dict[str, tuple[list[str], list[str]]]:
    variants: dict[str, tuple[list[str], list[str]]] = {
        "full": (list(feature_columns), list(categorical)),
    }
    if "model" in feature_columns:
        reduced = [column for column in feature_columns if column != "model"]
        variants["without_model"] = (
            reduced,
            [column for column in categorical if column in reduced],
        )
    if "engine_family" in feature_columns:
        reduced = [column for column in feature_columns if column != "engine_family"]
        variants["without_engine_family"] = (
            reduced,
            [column for column in categorical if column in reduced],
        )
    if "model" in feature_columns and "engine_family" in feature_columns:
        reduced = [
            column
            for column in feature_columns
            if column not in {"model", "engine_family"}
        ]
        variants["compact"] = (
            reduced,
            [column for column in categorical if column in reduced],
        )
    return variants


def train_catboost(
    X_train: pd.DataFrame,
    y_train: pd.Series,
    X_val: pd.DataFrame,
    y_val: pd.Series,
    X_test: pd.DataFrame,
    y_test: pd.Series,
    feature_columns: list[str],
    categorical: list[str],
    seed: int = config.RANDOM_SEED,
    run_ablation: bool = True,
) -> dict[str, Any]:
    trial_results: list[dict[str, Any]] = []
    for index, params in enumerate(CATBOOST_GRID, start=1):
        result = _fit(
            X_train,
            y_train,
            X_val,
            y_val,
            params,
            feature_columns,
            categorical,
            seed,
        )
        result["trial"] = index
        result["feature_set"] = "full"
        trial_results.append(result)
        print(
            f"[catboost] trial {index}/{len(CATBOOST_GRID)} "
            f"depth={params['depth']} lr={params['learning_rate']} "
            f"trees={result['trees']} val_MAE={result['validation_metrics']['mae']:.2f} "
            f"size={result['model_size_mb']:.2f}MB"
        )

    best_full = _select_compact(trial_results, tolerance=0.0)
    ablation_results: list[dict[str, Any]] = []
    if run_ablation:
        best_params = {
            "depth": best_full["params"]["depth"],
            "learning_rate": best_full["params"]["learning_rate"],
            "iterations": max(200, best_full["best_iteration"]),
        }
        for name, (columns, cats) in _feature_variants(feature_columns, categorical).items():
            if name == "full":
                continue
            result = _fit(
                X_train,
                y_train,
                X_val,
                y_val,
                best_params,
                columns,
                cats,
                seed,
            )
            result["trial"] = None
            result["feature_set"] = name
            ablation_results.append(result)
            print(
                f"[catboost] ablation {name}: val_MAE={result['validation_metrics']['mae']:.2f} "
                f"size={result['model_size_mb']:.2f}MB features={len(columns)}"
            )

    all_candidates = [best_full] + ablation_results
    chosen = _select_compact(all_candidates, tolerance=0.01)

    chosen_features = chosen["feature_columns"]
    chosen_cats = chosen["categorical"]
    predict_fn: Callable[[pd.DataFrame], np.ndarray] = lambda frame: chosen["model"].predict(
        frame[chosen_features]
    )
    validation_metrics = regression_metrics(y_val, predict_fn(X_val))
    test_metrics = regression_metrics(y_test, predict_fn(X_test))

    with tempfile.NamedTemporaryFile(suffix=".cbm", delete=False) as handle:
        artifact_path = handle.name
    chosen["model"].save_model(artifact_path)
    size_mb = file_size_mb(artifact_path)
    memory_mb = _estimate_cbm_memory(artifact_path)
    Path(artifact_path).unlink(missing_ok=True)

    inference = benchmark_predictions(predict_fn, X_test[chosen_features])

    summary = {
        "name": "CatBoost",
        "algorithm": "catboost",
        "model": chosen["model"],
        "predict_fn": predict_fn,
        "params": {
            **chosen["params"],
            "loss_function": "MAE",
            "eval_metric": "MAE",
            "trees_used": chosen["trees"],
            "max_ctr_complexity": 2,
            "early_stopping_rounds": 50,
        },
        "feature_columns": chosen_features,
        "categorical_features": chosen_cats,
        "feature_set": chosen["feature_set"],
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
                "trial": trial.get("trial"),
                "feature_set": trial.get("feature_set"),
                "params": trial["params"],
                "trees": trial["trees"],
                "validation_mae": trial["validation_metrics"]["mae"],
                "model_size_mb": trial["model_size_mb"],
                "training_seconds": trial["training_seconds"],
            }
            for trial in all_candidates
        ],
        "notes": f"Selected feature set: {chosen['feature_set']}",
    }
    return summary


def refit_catboost(
    X_train: pd.DataFrame,
    y_train: pd.Series,
    X_val: pd.DataFrame,
    y_val: pd.Series,
    result: dict[str, Any],
    seed: int = config.RANDOM_SEED,
) -> CatBoostRegressor:
    """Refit the selected CatBoost configuration on train + validation."""
    feature_columns = result["feature_columns"]
    categorical = result["categorical_features"]
    params = result["params"]
    iterations = max(100, int(result["best_iteration"] * 1.05))
    model = CatBoostRegressor(
        loss_function="MAE",
        eval_metric="MAE",
        random_seed=seed,
        task_type="CPU",
        verbose=False,
        allow_writing_files=False,
        max_ctr_complexity=params.get("max_ctr_complexity", 2),
        iterations=iterations,
        depth=params["depth"],
        learning_rate=params["learning_rate"],
        thread_count=-1,
    )
    combined_X = pd.concat([X_train[feature_columns], X_val[feature_columns]], axis=0)
    combined_y = pd.concat([y_train, y_val], axis=0)
    model.fit(combined_X, combined_y, cat_features=categorical)
    return model
