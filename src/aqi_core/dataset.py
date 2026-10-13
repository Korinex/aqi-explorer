from pathlib import Path

import pandas as pd


def load_dataset(path: str | Path) -> pd.DataFrame:
    """Load the AQI dataset and keep rows with a known AQI value."""
    dataframe = pd.read_csv(path)
    dataframe = dataframe.dropna(subset=["AQI"]).copy()
    dataframe["Date"] = pd.to_datetime(dataframe["Date"])
    return dataframe


def find_city_day(
    dataframe: pd.DataFrame,
    city: str,
    date: str,
) -> pd.Series | None:
    """Find one city's AQI record for a specific date."""
    requested_date = pd.to_datetime(date)
    matches = dataframe[
        (dataframe["City"].str.casefold() == city.casefold())
        & (dataframe["Date"] == requested_date)
    ]

    if matches.empty:
        return None

    return matches.iloc[0]
