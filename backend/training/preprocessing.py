import pandas as pd

REQUIRED_COLUMNS = [
    "brand",
    "model",
    "manufacturing_year",
    "mileage_km",
    "fuel_type",
    "transmission",
    "condition",
    "original_price_inr",
]

def clean_vehicle_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    df = df.dropna(subset=REQUIRED_COLUMNS).copy()
    for col in ["brand", "model", "fuel_type", "transmission", "condition"]:
        df[col] = df[col].astype(str).str.strip()
    return df
