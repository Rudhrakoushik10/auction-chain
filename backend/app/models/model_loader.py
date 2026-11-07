from pathlib import Path
import json

def load_vehicle_model_metadata():
    meta_path = Path(__file__).resolve().parents[2] / "artifacts" / "model_metadata.json"
    if meta_path.exists():
        return json.loads(meta_path.read_text())
    return {"model_version": "vehicle-v1", "category": "vehicle"}
