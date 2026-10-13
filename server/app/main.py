from pathlib import Path

import pandas as pd
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from src.aqi_core import get_aqi_advice, get_aqi_category, load_dataset


ROOT_DIR = Path(__file__).resolve().parents[2]
DATASET_PATH = ROOT_DIR / "data" / "city_day.csv"

app = FastAPI(
    title="AQI Explorer API",
    description="API for exploring daily air-quality measurements in Indian cities.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATAFRAME = load_dataset(DATASET_PATH)


@app.get("/api/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/cities")
def list_cities() -> dict[str, list[str]]:
    cities = sorted(DATAFRAME["City"].dropna().unique().tolist())
    return {"cities": cities}


@app.get("/api/aqi")
def get_aqi(
    city: str = Query(..., min_length=2, description="City name, for example Delhi"),
    date: str = Query(..., description="Date in YYYY-MM-DD format"),
) -> dict:
    try:
        requested_date = pd.to_datetime(date, format="%Y-%m-%d")
        row = DATAFRAME[
            (DATAFRAME["City"].str.casefold() == city.strip().casefold())
            & (DATAFRAME["Date"] == requested_date)
        ]
    except (TypeError, ValueError):
        raise HTTPException(status_code=400, detail="Date must use YYYY-MM-DD format")

    if row.empty:
        raise HTTPException(
            status_code=404,
            detail=f"No AQI data found for {city.strip()} on {date}",
        )

    record = row.iloc[0]
    aqi = float(record["AQI"])
    category = get_aqi_category(aqi)

    return {
        "city": str(record["City"]),
        "date": record["Date"].strftime("%Y-%m-%d"),
        "aqi": aqi,
        "category": category,
        "advice": get_aqi_advice(category),
        "pollutants": {
            key: None if record[key] != record[key] else float(record[key])
            for key in ["PM2.5", "PM10", "NO2", "CO", "SO2", "O3"]
        },
    }


@app.get("/api/summary")
def get_summary(
    city: str = Query(..., min_length=2, description="City name, for example Delhi"),
) -> dict:
    matches = DATAFRAME[DATAFRAME["City"].str.casefold() == city.strip().casefold()]

    if matches.empty:
        raise HTTPException(status_code=404, detail=f"Unknown city: {city.strip()}")

    average_aqi = float(matches["AQI"].mean())
    highest = matches.loc[matches["AQI"].idxmax()]
    category = get_aqi_category(average_aqi)

    return {
        "city": str(matches.iloc[0]["City"]),
        "days": int(len(matches)),
        "average_aqi": round(average_aqi, 2),
        "average_category": category,
        "highest": {
            "date": highest["Date"].strftime("%Y-%m-%d"),
            "aqi": float(highest["AQI"]),
        },
    }
