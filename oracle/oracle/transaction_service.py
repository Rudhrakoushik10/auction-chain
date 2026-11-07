import hashlib
import time

def register_prediction_on_chain(predicted_price_inr: int, product_data_hash: str, model_version: str = "vehicle-v1") -> dict:
    paise = int(predicted_price_inr) * 100
    ts = int(time.time())
    tx_hash = "0x" + hashlib.sha256(f"{paise}:{product_data_hash}:{model_version}:{ts}".encode()).hexdigest()
    return {
        "predicted_price_paise": paise,
        "product_data_hash": product_data_hash,
        "model_version": model_version,
        "timestamp": ts,
        "tx_hash": tx_hash,
    }
