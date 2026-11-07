import pandas as pd

def inspect_vehicles_dataset(csv_path: str = "datasets/raw/vehicles.csv"):
    df = pd.read_csv(csv_path)
    print("Dataset Shape:", df.shape)
    print("Columns:", list(df.columns))
    print(df.describe())

if __name__ == "__main__":
    inspect_vehicles_dataset()
