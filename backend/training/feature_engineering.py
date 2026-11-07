import pandas as pd

CURRENT_YEAR = 2026

def add_engineered_features(df: pd.DataFrame) -> pd.DataFrame:
    out = df.copy()
    out["vehicle_age_years"] = (CURRENT_YEAR - out["manufacturing_year"]).clip(lower=0)
    out["km_per_year"] = out["mileage_km"] / (out["vehicle_age_years"] + 1)
    return out
