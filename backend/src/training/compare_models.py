"""Model comparison, winner selection and plain-text evaluation report."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

import numpy as np
import pandas as pd

import config


def public_result(result: dict[str, Any]) -> dict[str, Any]:
    """Drop in-memory estimators so the result can be serialised to JSON."""
    return {
        "name": result["name"],
        "algorithm": result["algorithm"],
        "feature_set": result.get("feature_set", "full"),
        "feature_count": len(result["feature_columns"]),
        "features": list(result["feature_columns"]),
        "categorical_features": list(result["categorical_features"]),
        "params": result.get("params", {}),
        "validation_metrics": result["validation_metrics"],
        "test_metrics": result["test_metrics"],
        "model_size_mb": round(float(result["model_size_mb"]), 4),
        "model_memory_mb": round(float(result["model_memory_mb"]), 2),
        "inference": {
            key: round(float(value), 4) if isinstance(value, (int, float)) else value
            for key, value in result["inference"].items()
        },
        "training_seconds": round(float(result["training_seconds"]), 3),
        "training_rows": int(result["training_rows"]),
        "notes": result.get("notes", ""),
    }


def build_comparison(results: list[dict[str, Any]]) -> list[dict[str, Any]]:
    comparison = [public_result(result) for result in results]
    comparison.sort(key=lambda item: item["validation_metrics"]["mae"])
    return comparison


def select_best_model(
    results: list[dict[str, Any]], tolerance: float = 0.01
) -> tuple[dict[str, Any], str]:
    """Select using validation MAE, then prefer compact/fast models.

    Any model whose validation MAE is within 1% of the best is considered
    statistically competitive.  Within that band the smallest artifact wins,
    followed by single-row latency.  The isolated test set is never used for
    selection.
    """
    best_mae = min(result["validation_metrics"]["mae"] for result in results)
    eligible = [
        result
        for result in results
        if result["validation_metrics"]["mae"] <= best_mae * (1.0 + tolerance)
    ]
    chosen = min(
        eligible,
        key=lambda result: (
            result["model_size_mb"],
            result["inference"]["single_ms_mean"],
            result["validation_metrics"]["mae"],
        ),
    )
    chosen_mae = chosen["validation_metrics"]["mae"]
    if abs(chosen_mae - best_mae) < 1e-9:
        accuracy_phrase = f"has the best validation MAE ({best_mae:.2f})"
    else:
        accuracy_phrase = (
            f"is within {tolerance * 100:.0f}% of the best validation MAE "
            f"({best_mae:.2f}) with {chosen_mae:.2f}"
        )
    reason = (
        f"{chosen['name']} selected because it {accuracy_phrase}, and among the "
        f"competitive models it has the smallest artifact "
        f"({chosen['model_size_mb']:.2f} MB) followed by lowest single-row "
        f"latency ({chosen['inference']['single_ms_mean']:.2f} ms)."
    )
    return chosen, reason


def _metric_row(item: dict[str, Any]) -> str:
    validation = item["validation_metrics"]
    test = item["test_metrics"]
    return (
        f"{item['name']:<20} "
        f"{validation['mae']:>10.2f} "
        f"{test['mae']:>10.2f} "
        f"{test['rmse']:>12.2f} "
        f"{test['r2']:>8.4f} "
        f"{test['mape'] * 100:>8.2f}% "
        f"{item['model_size_mb']:>9.2f} "
        f"{item['inference']['single_ms_mean']:>9.2f} "
        f"{item['inference']['batch_rows_per_second']:>12.0f} "
        f"{item['feature_count']:>8}"
    )


def _suitability(metrics: dict[str, float]) -> str:
    r2 = metrics["r2"]
    mape = metrics["mape"]
    if r2 >= 0.85 and mape <= 0.15:
        return (
            "SUITABLE as an advisory market-value reference. The model explains a "
            "large share of price variance and typical percentage error is moderate. "
            "It must still be presented as an estimate, not a guaranteed sale price."
        )
    if r2 >= 0.70 and mape <= 0.25:
        return (
            "MODERATELY SUITABLE as an advisory reference. It captures the main price "
            "drivers but has material errors for some vehicles. Use as a guide only, "
            "with human review for high-value or unusual listings."
        )
    return (
        "NOT SUITABLE for high-stakes pricing without further work. Explained variance "
        "and/or percentage error are weak on the held-out test set. It can be used for "
        "rough guidance only and must not be presented as an authoritative valuation."
    )


def write_evaluation_report(
    path: str,
    dataset_analysis: dict[str, Any],
    split_counts: dict[str, int],
    comparison: list[dict[str, Any]],
    selected: dict[str, Any],
    selection_reason: str,
    final_metrics: dict[str, float],
    final_train_metrics: dict[str, float],
    final_trimmed_metrics: dict[str, float],
    residual_quantiles: dict[str, float],
    feature_importance: pd.Series | None,
    model_file: str,
    model_size_mb: float,
    model_memory_mb: float,
    inference: dict[str, float],
    load_seconds: float,
    final_params: dict[str, Any],
    final_feature_columns: list[str],
) -> None:
    dataset = dataset_analysis["dataset"]
    lines: list[str] = []
    lines.append("=" * 78)
    lines.append("AuctionChain Vehicle Price Prediction - Evaluation Report")
    lines.append(f"Generated: {datetime.now(timezone.utc).isoformat(timespec='seconds')}")
    lines.append("=" * 78)
    lines.append("")
    lines.append("DATASET")
    lines.append(f"  Rows: {dataset['rows']}   Columns: {dataset['columns']}")
    lines.append(f"  Market: {dataset['market']}")
    lines.append(f"  Currency: {dataset['currency']}   Mileage unit: {dataset['mileage_unit']}")
    lines.append(
        f"  Price range: ${dataset_analysis['price']['min']:,.0f} - "
        f"${dataset_analysis['price']['max']:,.0f} "
        f"(median ${dataset_analysis['price']['p50']:,.0f})"
    )
    lines.append(
        f"  Mileage range: {dataset_analysis['mileage']['min']:,.0f} - "
        f"{dataset_analysis['mileage']['max']:,.0f} miles "
        f"(median {dataset_analysis['mileage']['p50']:,.0f})"
    )
    lines.append(
        f"  Model years: {int(dataset_analysis['model_year']['min'])} - "
        f"{int(dataset_analysis['model_year']['max'])}"
    )
    lines.append("")
    lines.append("SPLIT (grouped by vehicle signature to prevent duplicate-listing leakage)")
    for split_name, count in split_counts.items():
        lines.append(f"  {split_name:<12}: {count:>5} rows")
    lines.append("")
    lines.append("PREPROCESSING DECISIONS")
    for note in dataset_analysis["data_quality_notes"]:
        lines.append(f"  - {note}")
    lines.append("")
    lines.append("MODEL COMPARISON (validation used for tuning; test held out from selection)")
    header = (
        f"{'Model':<20} {'Val MAE':>10} {'Test MAE':>10} {'Test RMSE':>12} "
        f"{'Test R2':>8} {'Test MAPE':>9} {'Size MB':>9} {'1-row ms':>9} "
        f"{'Rows/s':>12} {'Features':>8}"
    )
    lines.append(header)
    lines.append("-" * len(header))
    for item in comparison:
        lines.append(_metric_row(item))
    lines.append(
        "  Note: candidate rows are trained on the train split only; the final "
        "model is refit on train + validation, so its test metrics can differ "
        "slightly. The test set was never used for selection."
    )
    lines.append(
        "  Note: CatBoost has a slightly higher test R2 but worse MAE and MAPE; "
        "selection prioritized validation MAE for the advisory-pricing objective."
    )
    lines.append("")
    lines.append("SELECTED MODEL")
    lines.append(f"  Algorithm: {selected['name']} ({selected['algorithm']})")
    lines.append(f"  Feature set: {selected['feature_set']} ({len(final_feature_columns)} features)")
    lines.append(f"  Why: {selection_reason}")
    lines.append(f"  Artifact: {model_file}")
    lines.append(f"  Hyperparameters: {final_params}")
    lines.append("")
    lines.append("FINAL MODEL (refit on train + validation, evaluated once on the isolated test set)")
    lines.append(
        f"  Test MAE:  ${final_metrics['mae']:,.2f}"
    )
    lines.append(
        f"  Test RMSE: ${final_metrics['rmse']:,.2f}"
    )
    lines.append(f"  Test R2:   {final_metrics['r2']:.4f}")
    lines.append(f"  Test MAPE: {final_metrics['mape'] * 100:.2f}%")
    lines.append(f"  Test median absolute error: ${final_metrics['median_absolute_error']:,.2f}")
    lines.append(f"  Test rows: {int(final_metrics['rows'])}")
    lines.append(
        f"  Training MAE (fit check on train + validation): "
        f"${final_train_metrics['mae']:,.2f}"
    )
    lines.append(
        "  Note: training R2 is not comparable with test R2 because the "
        "train + validation split contains the single $2.95M outlier, which "
        "inflates target variance; the isolated test split does not."
    )
    lines.append(
        f"  Test metrics excluding top 0.5% price outliers "
        f"({final_trimmed_metrics['excluded_rows']} rows above "
        f"${final_trimmed_metrics['upper_threshold']:,.0f}): "
        f"MAE ${final_trimmed_metrics['mae']:,.2f}, "
        f"RMSE ${final_trimmed_metrics['rmse']:,.2f}, "
        f"R2 {final_trimmed_metrics['r2']:.4f}, "
        f"MAPE {final_trimmed_metrics['mape'] * 100:.2f}%"
    )
    lines.append(
        "  Residual quantiles (actual - predicted): "
        + ", ".join(f"p{key[1:]} ${value:,.0f}" for key, value in residual_quantiles.items())
    )
    lines.append("")
    lines.append("EFFICIENCY")
    lines.append(f"  Model file size: {model_size_mb:.4f} MB")
    if model_memory_mb > 0:
        lines.append(
            f"  Loaded-model memory (fresh serving process RSS delta): "
            f"{model_memory_mb:.2f} MB"
        )
    else:
        lines.append("  Loaded-model memory: not reliably measurable in-process")
    lines.append(f"  Model load time: {load_seconds * 1000:.1f} ms")
    lines.append(
        f"  Single-row inference: {inference['single_ms_mean']:.3f} ms mean, "
        f"{inference['single_ms_p95']:.3f} ms p95"
    )
    lines.append(
        f"  Batch inference: {inference['batch_rows']} rows in "
        f"{inference['batch_ms']:.2f} ms ({inference['batch_rows_per_second']:,.0f} rows/s)"
    )
    lines.append("  Execution: CPU only")
    lines.append("")
    if feature_importance is not None and not feature_importance.empty:
        lines.append("TOP FEATURE IMPORTANCE")
        for name, value in feature_importance.sort_values(ascending=False).head(15).items():
            lines.append(f"  {name:<24} {value:>12.4f}")
        lines.append("")
    lines.append("SUITABILITY ASSESSMENT")
    lines.append("  " + _suitability(final_metrics))
    lines.append("")
    lines.append("CAVEATS")
    lines.append("  - Predictions are advisory only and are not a guaranteed selling price.")
    lines.append("  - Unsupported brands/models are flagged as out-of-distribution; their predictions are less reliable.")
    lines.append("  - The dataset is US-market, USD, miles. Do not reuse for another market without retraining.")
    lines.append("  - The model should be retrained periodically (and the reference year updated) as market prices move.")
    lines.append("  - Extreme exotics and one implausible Maserati listing remain in the data; see outlier metrics above.")
    lines.append("")
    lines.append("=" * 78)
    with open(path, "w", encoding="utf-8") as handle:
        handle.write("\n".join(lines) + "\n")
