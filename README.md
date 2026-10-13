# AQI Explorer

AQI Explorer is a class project that analyzes air-quality data from Indian cities
and presents the results through an interactive web platform.

## Current project stage

The initial version contains:

- AQI analysis notebooks
- Data cleaning exercises
- Python data structures demonstrations
- Pandas and NumPy analysis
- AQI category and health-advice logic
- The original `city_day.csv` dataset
- The project report

## Planned platform features

- Search AQI by city and date
- Display AQI category and health advice
- Show pollutant values
- Compare cities
- Display historical AQI trends
- Provide a clean dashboard interface

## Dataset

The dataset contains daily air-quality measurements for multiple Indian cities,
including AQI, PM2.5, PM10, NO2, CO, SO2, O3 and other pollutants.

## Project structure

```text
aqi-explorer/
├── data/
├── notebooks/
│   ├── part1_core.ipynb
│   ├── part2_structures.ipynb
│   ├── part3_numpy_cleaning.ipynb
│   └── part4_pandas.ipynb
├── reports/
│   └── Report.pdf
└── src/
    └── aqi_core/
        ├── __init__.py
        ├── categories.py
        └── dataset.py
```

The platform will gradually be developed in the following stages:

1. Data analysis foundation
2. Reusable Python AQI logic
3. Backend API
4. Frontend dashboard
5. Charts and comparison tools
6. Testing and deployment
