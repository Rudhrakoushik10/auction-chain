import requests
from oracle.config import AI_SERVICE_URL


def fetch_vehicle_prediction(attributes: dict) -> dict:
    resp = requests.post(
        f"{AI_SERVICE_URL}/predict",
        json=attributes,
        timeout=10,
    )
    resp.raise_for_status()
    return resp.json()
