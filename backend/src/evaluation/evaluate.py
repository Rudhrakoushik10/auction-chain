"""Metric calculation and inference benchmarking utilities."""
from __future__ import annotations

import json
import subprocess
import sys
import time
from pathlib import Path
from typing import Any, Callable

import numpy as np
import pandas as pd
import psutil
from sklearn.metrics import (
    mean_absolute_error,
    mean_absolute_percentage_error,
    mean_squared_error,
    r2_score,
)


def regression_metrics(y_true: pd.Series | np.ndarray, y_pred: np.ndarray) -> dict[str, float]:
    y_true_array = np.asarray(y_true, dtype=float)
    y_pred_array = np.asarray(y_pred, dtype=float)
    abs_errors = np.abs(y_true_array - y_pred_array)

    metrics = {
        "rows": int(y_true_array.shape[0]),
        "mae": float(mean_absolute_error(y_true_array, y_pred_array)),
        "rmse": float(np.sqrt(mean_squared_error(y_true_array, y_pred_array))),
        "r2": float(r2_score(y_true_array, y_pred_array)),
        "median_absolute_error": float(np.median(abs_errors)),
        "mape": float("nan"),
    }
    if np.all(y_true_array > 0):
        metrics["mape"] = float(mean_absolute_percentage_error(y_true_array, y_pred_array))
    return metrics


def trimmed_metrics(
    y_true: pd.Series | np.ndarray,
    y_pred: np.ndarray,
    upper_quantile: float = 0.995,
) -> dict[str, float]:
    """Metrics excluding extreme high-price outliers (diagnostic only)."""
    y_true_array = np.asarray(y_true, dtype=float)
    y_pred_array = np.asarray(y_pred, dtype=float)
    threshold = np.quantile(y_true_array, upper_quantile)
    mask = y_true_array <= threshold
    metrics = regression_metrics(y_true_array[mask], y_pred_array[mask])
    metrics["excluded_rows"] = int((~mask).sum())
    metrics["upper_threshold"] = float(threshold)
    return metrics


def residual_quantiles(
    y_true: pd.Series | np.ndarray, y_pred: np.ndarray
) -> dict[str, float]:
    residuals = np.asarray(y_true, dtype=float) - np.asarray(y_pred, dtype=float)
    return {
        "p05": float(np.quantile(residuals, 0.05)),
        "p10": float(np.quantile(residuals, 0.10)),
        "p25": float(np.quantile(residuals, 0.25)),
        "p50": float(np.quantile(residuals, 0.50)),
        "p75": float(np.quantile(residuals, 0.75)),
        "p90": float(np.quantile(residuals, 0.90)),
        "p95": float(np.quantile(residuals, 0.95)),
    }


def current_rss_mb() -> float:
    process = psutil.Process()
    return float(process.memory_info().rss) / (1024 * 1024)


_SERVING_MEMORY_SCRIPT = """
import json
import sys

payload = json.load(sys.stdin)

import psutil

from src.prediction.predictor import VehiclePricePredictor

process = psutil.Process()
before = process.memory_info().rss
predictor = VehiclePricePredictor()
after_load = process.memory_info().rss
predictor.predict(payload)
after_predict = process.memory_info().rss

scale = 1024.0 * 1024.0
print(
    json.dumps(
        {
            "model_memory_mb": max(after_load - before, 0) / scale,
            "peak_memory_mb": max(after_predict - before, 0) / scale,
            "load_seconds": predictor.load_seconds,
        }
    )
)
"""


def measure_serving_memory_mb(
    sample_payload: dict[str, Any],
    project_root: str | Path | None = None,
    timeout_seconds: float = 120.0,
) -> dict[str, float] | None:
    """Measure model memory in a fresh interpreter so allocator reuse cannot hide it.

    The child process imports the serving stack, records its resident set size,
    loads the exported model through the real predictor, then records the RSS
    after loading and after the first prediction.  Import overhead is excluded
    from the delta.  Returns ``None`` when the probe cannot be completed.
    """
    root = Path(project_root) if project_root is not None else Path(__file__).resolve().parents[2]
    try:
        completed = subprocess.run(
            [sys.executable, "-c", _SERVING_MEMORY_SCRIPT],
            input=json.dumps(sample_payload),
            capture_output=True,
            text=True,
            cwd=str(root),
            timeout=timeout_seconds,
            check=True,
        )
    except (subprocess.SubprocessError, OSError):
        return None

    output = completed.stdout.strip().splitlines()
    if not output:
        return None
    try:
        result = json.loads(output[-1])
    except json.JSONDecodeError:
        return None
    return {key: float(value) for key, value in result.items()}


def file_size_mb(path: str | Path) -> float:
    return float(Path(path).stat().st_size) / (1024 * 1024)


def benchmark_predictions(
    predict_fn: Callable[[pd.DataFrame], np.ndarray],
    X: pd.DataFrame,
    single_iterations: int = 200,
    batch_size: int = 1000,
) -> dict[str, float]:
    """Measure single-row and batch inference latency after a warm-up."""
    if X.empty:
        raise ValueError("Cannot benchmark on an empty feature frame")

    X = X.reset_index(drop=True)
    # Warm-up (covers lazy initialisation inside the model backends).
    _ = predict_fn(X.iloc[[0]])

    single_rows = min(single_iterations, len(X))
    single_times: list[float] = []
    for i in range(single_rows):
        row = X.iloc[[i % len(X)]]
        start = time.perf_counter()
        _ = predict_fn(row)
        single_times.append((time.perf_counter() - start) * 1000.0)

    batch = X.iloc[: min(batch_size, len(X))]
    start = time.perf_counter()
    _ = predict_fn(batch)
    batch_seconds = time.perf_counter() - start

    return {
        "single_ms_mean": float(np.mean(single_times)),
        "single_ms_p95": float(np.quantile(single_times, 0.95)),
        "single_ms_max": float(np.max(single_times)),
        "batch_rows": int(len(batch)),
        "batch_ms": float(batch_seconds * 1000.0),
        "batch_rows_per_second": float(len(batch) / batch_seconds) if batch_seconds > 0 else 0.0,
    }


def write_json(data: Any, path: str | Path) -> None:
    output_path = Path(path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8") as handle:
        json.dump(data, handle, indent=2, ensure_ascii=False, default=str)
