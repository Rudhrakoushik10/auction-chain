import hashlib
import time


def register_prediction_on_chain(
    predicted_price_usd: float,
    product_data_hash: str,
    model_version: str = "1.0.0",
) -> dict:
    cents = int(round(float(predicted_price_usd) * 100))
    ts = int(time.time())
    tx_hash = (
        "0x"
        + hashlib.sha256(
            f"{cents}:{product_data_hash}:{model_version}:{ts}".encode()
        ).hexdigest()
    )
    return {
        "predicted_price_cents": cents,
        "product_data_hash": product_data_hash,
        "model_version": model_version,
        "timestamp": ts,
        "tx_hash": tx_hash,
    }
