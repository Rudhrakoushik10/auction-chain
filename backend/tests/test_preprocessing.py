"""Unit tests for parsing, normalisation and feature engineering."""
from __future__ import annotations

import math

import pandas as pd
import pytest

from src.data.load_dataset import parse_mileage, parse_price
from src.data.preprocessing import (
    canonicalize_brand_model,
    engineer_features,
    normalise_accident,
    normalise_color,
    normalise_fuel_type,
    normalise_transmission,
    parse_engine,
)


def test_parse_us_price_and_mileage() -> None:
    prices = parse_price(pd.Series(["$10,300", "$1,250", "$2,954,083"]))
    mileage = parse_mileage(pd.Series(["51,000 mi.", "100 mi.", "405,000 mi."]))

    assert prices.tolist() == [10300.0, 1250.0, 2954083.0]
    assert mileage.tolist() == [51000.0, 100.0, 405000.0]


def test_canonicalize_repairs_truncated_brands() -> None:
    assert canonicalize_brand_model("Land", "Rover Range Rover Sport") == (
        "LAND ROVER",
        "RANGE ROVER SPORT",
    )
    assert canonicalize_brand_model("Aston", "Martin DB11") == ("ASTON MARTIN", "DB11")
    assert canonicalize_brand_model("Alfa", "Romeo Giulia") == ("ALFA ROMEO", "GIULIA")
    assert canonicalize_brand_model("Toyota", "Camry") == ("TOYOTA", "CAMRY")


def test_fuel_type_placeholders_and_electric_inference() -> None:
    assert normalise_fuel_type("–", is_electric=True) == "Electric"
    assert normalise_fuel_type("not supported", is_electric=False) == "Unknown"
    assert normalise_fuel_type("Plug-In Hybrid", is_electric=False) == "Plug-in Hybrid"
    assert normalise_fuel_type("Gasoline", is_electric=False) == "Gasoline"


def test_transmission_families_and_speeds() -> None:
    assert normalise_transmission("8-Speed Automatic") == ("Automatic", 8.0)
    assert normalise_transmission("6-Speed Manual") == ("Manual", 6.0)
    assert normalise_transmission("Single-Speed") == ("Single-Speed", 1.0)

    family, speeds = normalise_transmission("CVT")
    assert family == "CVT"
    assert math.isnan(speeds)

    family, speeds = normalise_transmission(None)
    assert family == "Unknown"
    assert math.isnan(speeds)


def test_accident_and_colour_normalisation() -> None:
    assert normalise_accident("None reported") == "None"
    assert normalise_accident("Accident reported") == "Reported"
    assert normalise_accident(None) == "Unknown"

    assert normalise_color("Nero Noctis") == "Black"
    assert normalise_color("Pearl White") == "White"
    assert normalise_color("Mystery paint") == "Other"
    assert normalise_color(None) == "Unknown"


def test_parse_engine_extracts_specs() -> None:
    engine = parse_engine("3.5L V6 300hp Twin Turbo")
    assert engine["displacement_l"] == 3.5
    assert engine["cylinders"] == 6.0
    assert engine["engine_family"] == "V6"
    assert engine["horsepower"] == 300.0
    assert engine["is_turbo"] == 1
    assert engine["is_electric"] == 0
    assert engine["engine_data_missing"] == 0

    electric = parse_engine("Electric Motor")
    assert electric["is_electric"] == 1
    assert electric["displacement_l"] == 0.0
    assert electric["cylinders"] == 0.0
    assert electric["engine_family"] == "Electric"

    missing = parse_engine(None)
    assert missing["engine_family"] == "Unknown"
    assert missing["engine_data_missing"] == 1


def test_engineer_features_builds_model_frame() -> None:
    raw = pd.DataFrame(
        [
            {
                "brand": "Land",
                "model": "Rover Range Rover Sport",
                "model_year": "2020",
                "milage": "30,000 mi.",
                "fuel_type": "Gasoline",
                "engine": "3.0L V6 340hp Turbo",
                "transmission": "8-Speed Automatic",
                "ext_col": "Santorini Black",
                "int_col": "Ebony",
                "accident": "None reported",
                "clean_title": "Yes",
                "price": "$62,000",
            },
            {
                "brand": "Tesla",
                "model": "Model 3 Long Range",
                "model_year": "2022",
                "milage": "15,000 mi.",
                "fuel_type": "–",
                "engine": "Electric Motor",
                "transmission": "Single-Speed",
                "ext_col": "Pearl White",
                "int_col": "Black",
                "accident": None,
                "clean_title": None,
                "price": "$44,000",
            },
        ]
    )

    features = engineer_features(raw, reference_year=2026)

    assert len(features) == 2
    assert features.loc[0, "brand"] == "LAND ROVER"
    assert features.loc[0, "model"] == "RANGE ROVER SPORT"
    assert features.loc[0, "price"] == 62000.0
    assert features.loc[0, "vehicle_age"] == 6.0
    assert features.loc[0, "mileage_per_year"] == 30000.0 / 6.0
    assert features.loc[0, "accident_history"] == "None"
    assert features.loc[0, "engine_family"] == "V6"
    assert features.loc[1, "fuel_type"] == "Electric"
    assert features.loc[1, "is_electric"] == 1
    assert features.loc[1, "accident_history"] == "Unknown"
    assert "clean_title" not in features.columns
    assert "group_id" in features.columns


def test_engineer_features_rejects_unparseable_price() -> None:
    raw = pd.DataFrame(
        [
            {
                "brand": "Toyota",
                "model": "Camry",
                "model_year": "2020",
                "milage": "30,000 mi.",
                "fuel_type": "Gasoline",
                "engine": "2.5L I4",
                "transmission": "Automatic",
                "ext_col": "White",
                "int_col": "Black",
                "accident": "None",
                "clean_title": "Yes",
                "price": "not-a-price",
            }
        ]
    )

    with pytest.raises(ValueError, match="Unparseable price"):
        engineer_features(raw, reference_year=2026)
