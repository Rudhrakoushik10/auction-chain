"""Report figures generated from the final model and comparison results."""
from __future__ import annotations

from pathlib import Path
from typing import Any

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns

sns.set_theme(style="whitegrid", context="talk")


def plot_actual_vs_predicted(
    y_true: np.ndarray, y_pred: np.ndarray, path: str | Path, title: str
) -> None:
    output = Path(path)
    output.parent.mkdir(parents=True, exist_ok=True)
    fig, ax = plt.subplots(figsize=(8, 7))
    ax.scatter(y_true, y_pred, alpha=0.45, edgecolors="none", s=22, color="#2563eb")
    upper = float(max(np.max(y_true), np.max(y_pred)))
    ax.plot([0, upper], [0, upper], linestyle="--", color="#dc2626", linewidth=1.5)
    ax.set_xlabel("Actual price (USD)")
    ax.set_ylabel("Predicted price (USD)")
    ax.set_title(title)
    ax.set_xlim(left=0)
    ax.set_ylim(bottom=0)
    fig.tight_layout()
    fig.savefig(output, dpi=150)
    plt.close(fig)


def plot_residuals(
    y_true: np.ndarray, y_pred: np.ndarray, path: str | Path, title: str
) -> None:
    output = Path(path)
    output.parent.mkdir(parents=True, exist_ok=True)
    residuals = np.asarray(y_true, dtype=float) - np.asarray(y_pred, dtype=float)
    fig, axes = plt.subplots(1, 2, figsize=(14, 5.5))

    sns.histplot(residuals, bins=50, ax=axes[0], color="#0f766e")
    axes[0].axvline(0, color="#dc2626", linestyle="--", linewidth=1.2)
    axes[0].set_xlabel("Residual (actual - predicted, USD)")
    axes[0].set_ylabel("Listings")
    axes[0].set_title("Residual distribution")

    axes[1].scatter(y_pred, residuals, alpha=0.45, edgecolors="none", s=20, color="#7c3aed")
    axes[1].axhline(0, color="#dc2626", linestyle="--", linewidth=1.2)
    axes[1].set_xlabel("Predicted price (USD)")
    axes[1].set_ylabel("Residual (USD)")
    axes[1].set_title("Residuals vs predicted price")

    fig.suptitle(title)
    fig.tight_layout()
    fig.savefig(output, dpi=150)
    plt.close(fig)


def plot_feature_importance(
    importances: pd.Series, path: str | Path, title: str, top_n: int = 20
) -> None:
    output = Path(path)
    output.parent.mkdir(parents=True, exist_ok=True)
    top = importances.sort_values(ascending=False).head(top_n)[::-1]
    fig, ax = plt.subplots(figsize=(10, 7))
    sns.barplot(x=top.values, y=top.index, ax=ax, color="#0891b2")
    ax.set_xlabel("Importance")
    ax.set_ylabel("")
    ax.set_title(title)
    fig.tight_layout()
    fig.savefig(output, dpi=150)
    plt.close(fig)


def plot_model_comparison(
    comparison: list[dict[str, Any]],
    path: str | Path,
) -> None:
    output = Path(path)
    output.parent.mkdir(parents=True, exist_ok=True)
    frame = pd.DataFrame(
        [
            {
                "name": item["name"],
                "validation_mae": item["validation_metrics"]["mae"],
                "model_size_mb": item["model_size_mb"],
                "single_ms_mean": item["inference"]["single_ms_mean"],
            }
            for item in comparison
        ]
    )
    if frame.empty:
        return

    fig, axes = plt.subplots(1, 3, figsize=(18, 5.5))

    order = frame.sort_values("validation_mae")["name"].tolist()
    sns.barplot(
        data=frame,
        x="validation_mae",
        y="name",
        order=order,
        ax=axes[0],
        color="#2563eb",
    )
    axes[0].set_title("Validation MAE (lower is better)")
    axes[0].set_xlabel("MAE (USD)")
    axes[0].set_ylabel("")

    size_order = frame.sort_values("model_size_mb")["name"].tolist()
    sns.barplot(
        data=frame,
        x="model_size_mb",
        y="name",
        order=size_order,
        ax=axes[1],
        color="#16a34a",
    )
    axes[1].set_title("Model size (MB)")
    axes[1].set_xlabel("MB")
    axes[1].set_ylabel("")

    speed_order = frame.sort_values("single_ms_mean")["name"].tolist()
    sns.barplot(
        data=frame,
        x="single_ms_mean",
        y="name",
        order=speed_order,
        ax=axes[2],
        color="#ea580c",
    )
    axes[2].set_title("Single-row inference latency")
    axes[2].set_xlabel("milliseconds")
    axes[2].set_ylabel("")

    fig.tight_layout()
    fig.savefig(output, dpi=150)
    plt.close(fig)


def save_feature_importance_csv(importances: pd.Series, path: str | Path) -> None:
    output = Path(path)
    output.parent.mkdir(parents=True, exist_ok=True)
    importances.rename("importance").sort_values(ascending=False).to_csv(
        output, header=True, index_label="feature"
    )
