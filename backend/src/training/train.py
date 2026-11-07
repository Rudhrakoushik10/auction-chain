"""End-to-end reproducible training pipeline.

Run from the project root:

    python -m src.training.train

The script:
1. inspects the raw dataset and writes reports/dataset_analysis.json
2. builds features and a grouped train/validation/test split
3. trains Linear Regression, Random Forest, CatBoost and LightGBM
4. selects a winner on validation accuracy, size and latency
5. refits the winner on train+validation
6. evaluates once on the isolated test set
7. exports the model, metadata, feature configuration, figures and report
"""
from __future__ import annotations

import argparse
import gc
import json
import random
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import joblib
import lightgbm as lgb
import numpy as np
import pandas as pd
from catboost import CatBoostRegressor

import config
from src.data.load_dataset import analyse_raw_dataset, load_raw_dataset, write_json
from src.data.preprocessing import (
    encode_categorical_features,
    prepare_splits,
)
from src.evaluation.evaluate import (
    benchmark_predictions,
    current_rss_mb,
    file_size_mb,
    measure_serving_memory_mb,
    regression_metrics,
    residual_quantiles,
    trimmed_metrics,
)
from src.evaluation.visualize import (
    plot_actual_vs_predicted,
    plot_feature_importance,
    plot_model_comparison,
    plot_residuals,
    save_feature_importance_csv,
)
from src.training.compare_models import (
    build_comparison,
    select_best_model,
    write_evaluation_report,
)
from src.training.train_baseline import (
    refit_baseline,
    train_linear_regression,
    train_random_forest,
)
from src.training.train_catboost import refit_catboost, train_catboost
from src.training.train_lightgbm import refit_lightgbm, train_lightgbm

FINAL_ARTIFACT_NAMES = [
    "vehicle_price_model.cbm",
    "vehicle_price_model.txt",
    "vehicle_price_model.joblib",
]


def set_seed(seed: int) -> None:
    random.seed(seed)
    np.random.seed(seed)


def _ensure_directories() -> None:
    for directory in [
        config.DATASET_DIR,
        config.PROCESSED_DATA_DIR,
        config.MODELS_DIR,
        config.CANDIDATES_DIR,
        config.REPORTS_DIR,
        config.FIGURES_DIR,
    ]:
        directory.mkdir(parents=True, exist_ok=True)


def _remove_old_artifacts() -> None:
    for name in FINAL_ARTIFACT_NAMES:
        (config.MODELS_DIR / name).unlink(missing_ok=True)


def _split_frames(features: pd.DataFrame) -> dict[str, pd.DataFrame]:
    return {
        split: features[features[config.SPLIT_COLUMN] == split].reset_index(drop=True)
        for split in ["train", "validation", "test"]
    }


def _save_processed(features: pd.DataFrame, frames: dict[str, pd.DataFrame]) -> None:
    features.to_csv(config.FULL_FEATURES_PATH, index=False)
    paths = {
        "train": config.TRAIN_DATA_PATH,
        "validation": config.VALIDATION_DATA_PATH,
        "test": config.TEST_DATA_PATH,
    }
    for split, path in paths.items():
        frames[split].to_csv(path, index=False)


def _feature_importance(
    final_model: Any,
    algorithm: str,
    feature_columns: list[str],
) -> pd.Series | None:
    try:
        if algorithm == "catboost":
            values = final_model.get_feature_importance()
            return pd.Series(values, index=feature_columns, dtype=float)
        if algorithm == "lightgbm":
            booster = final_model.booster_
            values = booster.feature_importance(importance_type="gain")
            names = booster.feature_name()
            return pd.Series(values, index=names, dtype=float)
        if algorithm.startswith("sklearn"):
            preprocessor = final_model.named_steps["preprocessor"]
            names = preprocessor.get_feature_names_out()
            estimator = final_model.named_steps["model"]
            if hasattr(estimator, "feature_importances_"):
                values = estimator.feature_importances_
            elif hasattr(estimator, "coef_"):
                values = np.abs(np.ravel(estimator.coef_))
            else:
                return None
            if len(names) != len(values):
                return None
            return pd.Series(values, index=names, dtype=float)
    except Exception as error:  # importance is diagnostic; never fail training
        print(f"[train] Could not compute feature importance: {error}")
    return None


def _load_artifact(
    path: Path,
    algorithm: str,
    feature_columns: list[str],
    categorical: list[str],
    numerical: list[str],
    levels: dict[str, list[str]],
    probe: pd.DataFrame,
) -> tuple[float, float, np.ndarray]:
    """Load the exported artifact in a fresh object and verify a prediction."""
    gc.collect()
    before = current_rss_mb()
    start = time.perf_counter()
    if algorithm == "catboost":
        loaded: Any = CatBoostRegressor()
        loaded.load_model(str(path))
        probe_input = probe[feature_columns]
    elif algorithm == "lightgbm":
        loaded = lgb.Booster(model_file=str(path))
        probe_input = encode_categorical_features(
            probe, feature_columns, categorical, numerical, levels
        )
    else:
        loaded = joblib.load(path)
        probe_input = probe[feature_columns]
    load_seconds = time.perf_counter() - start
    memory_mb = max(current_rss_mb() - before, 0.0)
    predictions = np.asarray(loaded.predict(probe_input), dtype=float)
    return load_seconds, memory_mb, predictions


def main() -> None:
    parser = argparse.ArgumentParser(description="Train the AuctionChain vehicle price model")
    parser.add_argument(
        "--skip-ablation",
        action="store_true",
        help="Skip CatBoost feature-set ablation (faster, slightly larger model).",
    )
    args = parser.parse_args()

    _ensure_directories()
    _remove_old_artifacts()
    set_seed(config.RANDOM_SEED)
    started = datetime.now(timezone.utc)
    print("[train] Loading and inspecting dataset")
    raw = load_raw_dataset()
    analysis = analyse_raw_dataset(raw)
    write_json(analysis, config.DATASET_ANALYSIS_PATH)
    print(
        f"[train] Dataset: {analysis['dataset']['rows']} rows, "
        f"{analysis['dataset']['columns']} columns, "
        f"currency {analysis['dataset']['currency']}, "
        f"mileage {analysis['dataset']['mileage_unit']}"
    )

    print("[train] Engineering features and creating grouped splits")
    features, medians, feature_config = prepare_splits(
        raw,
        reference_year=config.REFERENCE_YEAR,
        seed=config.RANDOM_SEED,
    )
    frames = _split_frames(features)
    _save_processed(features, frames)
    split_counts = {split: int(len(frame)) for split, frame in frames.items()}
    print(f"[train] Split sizes: {split_counts}")

    feature_columns = list(config.FEATURE_COLUMNS)
    categorical = list(config.CATEGORICAL_FEATURES)
    numerical = list(config.NUMERICAL_FEATURES)

    train = frames["train"]
    validation = frames["validation"]
    test = frames["test"]
    X_train, y_train = train[feature_columns], train[config.TARGET_COLUMN]
    X_val, y_val = validation[feature_columns], validation[config.TARGET_COLUMN]
    X_test, y_test = test[feature_columns], test[config.TARGET_COLUMN]

    results: list[dict[str, Any]] = []

    print("[train] Training Linear Regression baseline")
    results.append(
        train_linear_regression(
            X_train, y_train, X_val, y_val, X_test, y_test, categorical, numerical
        )
    )

    print("[train] Training Random Forest baseline")
    results.append(
        train_random_forest(
            X_train, y_train, X_val, y_val, X_test, y_test, categorical, numerical
        )
    )

    print("[train] Training CatBoost")
    results.append(
        train_catboost(
            X_train,
            y_train,
            X_val,
            y_val,
            X_test,
            y_test,
            feature_columns,
            categorical,
            seed=config.RANDOM_SEED,
            run_ablation=not args.skip_ablation,
        )
    )

    print("[train] Training LightGBM")
    results.append(
        train_lightgbm(
            X_train,
            y_train,
            X_val,
            y_val,
            X_test,
            y_test,
            feature_columns,
            categorical,
            numerical,
            seed=config.RANDOM_SEED,
        )
    )

    comparison = build_comparison(results)
    selected, selection_reason = select_best_model(results)
    print(f"[train] {selection_reason}")

    write_json(
        {
            "generated_at_utc": started.isoformat(),
            "selection_split": "validation",
            "test_used_for_selection": False,
            "selection_tolerance": 0.01,
            "split_counts": split_counts,
            "selected": selected["name"],
            "selection_reason": selection_reason,
            "candidates": comparison,
        },
        config.MODEL_COMPARISON_PATH,
    )

    algorithm = selected["algorithm"]
    final_features = list(selected["feature_columns"])
    final_categorical = list(selected["categorical_features"])
    final_numerical = [column for column in final_features if column not in final_categorical]
    levels = selected.get("category_levels", feature_config["category_levels"])
    levels = {column: levels[column] for column in final_categorical if column in levels}

    print(f"[train] Refitting {selected['name']} on train + validation")
    if algorithm == "catboost":
        final_model = refit_catboost(
            X_train, y_train, X_val, y_val, selected, seed=config.RANDOM_SEED
        )
        final_path = config.FINAL_MODEL_PATH
        final_model.save_model(str(final_path))
        final_predict_fn = lambda frame: final_model.predict(frame[final_features])
        final_params = {
            **selected["params"],
            "iterations": int(final_model.tree_count_),
        }
    elif algorithm == "lightgbm":
        final_model = refit_lightgbm(
            X_train, y_train, X_val, y_val, selected, seed=config.RANDOM_SEED
        )
        final_path = config.MODELS_DIR / "vehicle_price_model.txt"
        final_model.booster_.save_model(str(final_path))
        final_predict_fn = lambda frame: final_model.predict(
            encode_categorical_features(
                frame, final_features, final_categorical, final_numerical, levels
            )
        )
        final_params = {
            **selected["params"],
            "iterations": int(final_model.booster_.num_trees()),
        }
    else:
        final_model = refit_baseline(X_train, y_train, X_val, y_val, selected)
        final_path = config.MODELS_DIR / "vehicle_price_model.joblib"
        joblib.dump(final_model, final_path)
        final_predict_fn = lambda frame: final_model.predict(frame[final_features])
        final_params = {
            **selected["params"],
            "refit": "train+validation",
        }

    final_model_size_mb = file_size_mb(final_path)
    load_seconds, model_memory_mb, probe_predictions = _load_artifact(
        final_path,
        algorithm,
        final_features,
        final_categorical,
        final_numerical,
        levels,
        X_test.head(5),
    )
    if not np.isfinite(probe_predictions).all():
        raise RuntimeError("Exported model produced non-finite predictions")

    test_predictions = np.asarray(final_predict_fn(X_test), dtype=float)
    final_metrics = regression_metrics(y_test, test_predictions)
    final_trimmed = trimmed_metrics(y_test, test_predictions)
    residual_q = residual_quantiles(y_test, test_predictions)

    combined_train_X = pd.concat([X_train[final_features], X_val[final_features]], axis=0)
    combined_train_y = pd.concat([y_train, y_val], axis=0)
    train_predictions = np.asarray(final_predict_fn(combined_train_X), dtype=float)
    final_train_metrics = regression_metrics(combined_train_y, train_predictions)

    inference = benchmark_predictions(final_predict_fn, X_test)
    print(
        f"[train] Final test MAE ${final_metrics['mae']:,.2f}, "
        f"RMSE ${final_metrics['rmse']:,.2f}, R2 {final_metrics['r2']:.4f}, "
        f"MAPE {final_metrics['mape'] * 100:.2f}%"
    )
    print(
        f"[train] Export: {final_path.name} "
        f"({final_model_size_mb:.2f} MB), "
        f"single-row {inference['single_ms_mean']:.2f} ms"
    )

    feature_importance = _feature_importance(final_model, algorithm, final_features)
    if feature_importance is not None:
        save_feature_importance_csv(
            feature_importance, config.REPORTS_DIR / "feature_importance.csv"
        )
        plot_feature_importance(
            feature_importance,
            config.FIGURES_DIR / "feature_importance.png",
            title=f"{selected['name']} feature importance",
        )

    plot_actual_vs_predicted(
        y_test.to_numpy(),
        test_predictions,
        config.FIGURES_DIR / "actual_vs_predicted.png",
        title=f"{selected['name']} - test set",
    )
    plot_residuals(
        y_test.to_numpy(),
        test_predictions,
        config.FIGURES_DIR / "residuals.png",
        title=f"{selected['name']} - test residuals",
    )
    plot_model_comparison(comparison, config.FIGURES_DIR / "model_comparison.png")

    final_levels = {column: levels[column] for column in final_categorical}
    final_feature_config = {
        **feature_config,
        "feature_columns": final_features,
        "categorical_features": final_categorical,
        "numerical_features": final_numerical,
        "category_levels": final_levels,
        "known_values": feature_config["known_values"],
        "model_year_range": [
            int(features["model_year"].min()),
            int(features["model_year"].max()),
        ],
        "mileage_range": [
            float(features["mileage"].min()),
            float(features["mileage"].max()),
        ],
        "price_range": [
            float(features[config.TARGET_COLUMN].min()),
            float(features[config.TARGET_COLUMN].max()),
        ],
        "selection_reason": selection_reason,
    }
    write_json(final_feature_config, config.FEATURE_CONFIG_PATH)

    metadata = {
        "model_version": config.MODEL_VERSION,
        "generated_at_utc": started.isoformat(),
        "algorithm": algorithm,
        "algorithm_display_name": selected["name"],
        "model_file": final_path.name,
        "model_size_mb": round(float(final_model_size_mb), 4),
        "model_load_seconds": round(float(load_seconds), 4),
        "model_memory_mb_approx": round(float(model_memory_mb), 2),
        "currency": config.CURRENCY,
        "mileage_unit": config.MILEAGE_UNIT,
        "market": config.MARKET,
        "reference_year": int(config.REFERENCE_YEAR),
        "target": config.TARGET_COLUMN,
        "features": {
            "feature_set": selected.get("feature_set", "full"),
            "feature_columns": final_features,
            "categorical_features": final_categorical,
            "numerical_features": final_numerical,
        },
        "numeric_medians": medians,
        "category_levels": final_levels,
        "known_values": feature_config["known_values"],
        "feature_ranges": feature_config["feature_ranges"],
        "model_year_range": [
            int(features["model_year"].min()),
            int(features["model_year"].max()),
        ],
        "mileage_range": [
            float(features["mileage"].min()),
            float(features["mileage"].max()),
        ],
        "training": {
            "seed": config.RANDOM_SEED,
            "split": "grouped 70/15/15 (vehicle-signature groups)",
            "train_rows": split_counts["train"],
            "validation_rows": split_counts["validation"],
            "test_rows": split_counts["test"],
            "refit_on_train_plus_validation": True,
        },
        "hyperparameters": final_params,
        "validation_metrics": selected["validation_metrics"],
        "test_metrics": final_metrics,
        "test_metrics_trimmed": final_trimmed,
        "train_metrics_final": final_train_metrics,
        "residual_quantiles": residual_q,
        "inference": inference,
        "selection_reason": selection_reason,
        "candidates": comparison,
        "data_quality_notes": analysis["data_quality_notes"],
    }
    write_json(metadata, config.FINAL_MODEL_METADATA_PATH)

    sample_payload = {
        "brand": str(test.iloc[0]["brand"]),
        "model": str(test.iloc[0]["model"]),
        "year": int(test.iloc[0]["model_year"]),
        "mileage": float(test.iloc[0]["mileage"]),
    }
    serving_memory = measure_serving_memory_mb(sample_payload)
    if serving_memory is not None:
        model_memory_mb = serving_memory["model_memory_mb"]
        metadata["model_memory_mb_approx"] = round(float(model_memory_mb), 2)
        metadata["peak_serving_memory_mb"] = round(float(serving_memory["peak_memory_mb"]), 2)
        metadata["serving_probe_load_seconds"] = round(float(serving_memory["load_seconds"]), 4)
        write_json(metadata, config.FINAL_MODEL_METADATA_PATH)
        print(
            f"[train] Serving memory probe: model {model_memory_mb:.2f} MB, "
            f"peak {serving_memory['peak_memory_mb']:.2f} MB"
        )
    else:
        print("[train] Serving memory probe unavailable; using in-process RSS delta")

    write_evaluation_report(
        path=str(config.EVALUATION_REPORT_PATH),
        dataset_analysis=analysis,
        split_counts=split_counts,
        comparison=comparison,
        selected=selected,
        selection_reason=selection_reason,
        final_metrics=final_metrics,
        final_train_metrics=final_train_metrics,
        final_trimmed_metrics=final_trimmed,
        residual_quantiles=residual_q,
        feature_importance=feature_importance,
        model_file=final_path.name,
        model_size_mb=final_model_size_mb,
        model_memory_mb=model_memory_mb,
        inference=inference,
        load_seconds=load_seconds,
        final_params=final_params,
        final_feature_columns=final_features,
    )

    print("\n[train] Complete")
    print(f"  Model:  {final_path}")
    print(f"  Config: {config.FEATURE_CONFIG_PATH}")
    print(f"  Meta:   {config.FINAL_MODEL_METADATA_PATH}")
    print(f"  Report: {config.EVALUATION_REPORT_PATH}")
    print(f"  Figures: {config.FIGURES_DIR}")


if __name__ == "__main__":
    main()
