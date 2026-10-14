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
- A FastAPI backend with city/date lookup and summary endpoints
- A Next.js dashboard connected to the AQI lookup endpoint

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
├── server/
│   ├── app/
│   └── tests/
├── client/
│   ├── app/
│   └── public/
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
4. Frontend dashboard shell
5. Connect dashboard to the backend API
6. Add pollutant and historical trend visualizations
7. Add city comparison tools
8. Testing and deployment

## Run locally

Start the backend from the project root:

```bash
python -m venv .venv
# Windows PowerShell: .venv\Scripts\Activate.ps1
# macOS/Linux: source .venv/bin/activate
pip install -r server/requirements.txt
uvicorn server.app.main:app --reload
```

In a second terminal, start the frontend:

```bash
cd client
npm install
npm run dev
```

Run `npm run typecheck` from `client/` to check the frontend TypeScript types.

Open `http://localhost:3000`. The frontend uses
`NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000` by default. Copy
`client/.env.example` to `client/.env.local` if you need to override it.
