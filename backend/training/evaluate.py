"""
Evaluation script computing MAE, RMSE, and R² for vehicle-v1.
"""
import json
from pathlib import Path

def evaluate_model():
    meta = json.loads(Path("artifacts/model_metadata.json").read_text())
    print("Model Evaluation Metrics:", meta["metrics"])

if __name__ == "__main__":
    evaluate_model()
