"use client";

import { FormEvent, useEffect, useState } from "react";

type AqiReport = {
  aqi: number;
  category: string;
  advice: string;
  city: string;
  date: string;
  pollutants: Record<string, number | null>;
};

type HistoryPoint = { date: string; aqi: number };
type CitySummary = {
  city: string;
  days: number;
  average_aqi: number;
  average_category: string;
  highest: { date: string; aqi: number };
};

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";
const pollutantMeta = [
  { key: "PM2.5", name: "Fine particles", unit: "µg/m³", reference: 150 },
  { key: "PM10", name: "Coarse particles", unit: "µg/m³", reference: 250 },
  { key: "NO2", name: "Nitrogen dioxide", unit: "µg/m³", reference: 200 },
  { key: "CO", name: "Carbon monoxide", unit: "mg/m³", reference: 10 },
  { key: "SO2", name: "Sulfur dioxide", unit: "µg/m³", reference: 80 },
  { key: "O3", name: "Ozone", unit: "µg/m³", reference: 180 },
];

export default function DashboardPage() {
  const [cities, setCities] = useState<string[]>(["Delhi"]);
  const [city, setCity] = useState("Delhi");
  const [date, setDate] = useState("2019-05-01");
  const [report, setReport] = useState<AqiReport | null>(null);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [summary, setSummary] = useState<CitySummary | null>(null);
  const [summaryError, setSummaryError] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadCities() {
      try {
        const response = await fetch(`${apiBaseUrl}/api/cities`);
        if (!response.ok) throw new Error("Could not load cities.");
        const payload: { cities: string[] } = await response.json();
        setCities(payload.cities);
        if (payload.cities.length > 0 && !payload.cities.includes("Delhi")) {
          setCity(payload.cities[0]);
        }
      } catch {
        setError("Could not load the city list. Check that the API is running.");
      }
    }

    void loadCities();
  }, []);

  useEffect(() => {
    if (!report) return;
    const selectedCity = report.city;

    async function loadHistory() {
      setHistoryLoading(true);
      setHistoryError("");
      try {
        const params = new URLSearchParams({ city: selectedCity, limit: "120" });
        const response = await fetch(`${apiBaseUrl}/api/history?${params}`);
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.detail ?? "Could not load history.");
        setHistory(payload.points);
      } catch (requestError) {
        setHistory([]);
        setHistoryError(requestError instanceof Error ? requestError.message : "Could not load history.");
      } finally {
        setHistoryLoading(false);
      }
    }

    void loadHistory();
  }, [report]);

  useEffect(() => {
    if (!report) return;
    const selectedCity = report.city;

    async function loadSummary() {
      setSummaryError("");
      try {
        const params = new URLSearchParams({ city: selectedCity });
        const response = await fetch(`${apiBaseUrl}/api/summary?${params}`);
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.detail ?? "Could not load city summary.");
        setSummary(payload);
      } catch (requestError) {
        setSummary(null);
        setSummaryError(requestError instanceof Error ? requestError.message : "Could not load city summary.");
      }
    }

    void loadSummary();
  }, [report]);

  async function handleLookup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({ city, date });
      const response = await fetch(`${apiBaseUrl}/api/aqi?${params}`);
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.detail ?? "Could not load the AQI report.");
      }

      setReport(payload);
    } catch (requestError) {
      setReport(null);
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not connect to the AQI API."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page-shell">
      <nav className="topbar">
        <a className="brand" href="#top" aria-label="AQI Explorer home">
          <span className="brand-mark">AQ</span>
          <span>AQI Explorer</span>
        </a>
        <div className="topbar-meta">
          <span className="status-dot" /> Historical air-quality intelligence
        </div>
      </nav>

      <section className="hero" id="top">
        <div className="eyebrow">INDIA AIR QUALITY MONITOR</div>
        <h1>Understand the air<br /><em>around you.</em></h1>
        <p className="hero-copy">
          Explore daily AQI readings, pollutant levels, and practical health guidance
          across Indian cities.
        </p>
      </section>

      <section className="search-panel" aria-labelledby="lookup-title">
        <div className="panel-heading">
          <div>
            <span className="section-label">01 / LOOKUP</span>
            <h2 id="lookup-title">Check a city</h2>
          </div>
          <span className="live-pill">Live API lookup</span>
        </div>
        <form className="form-row" onSubmit={handleLookup}>
          <label>
            <span>City</span>
            <select value={city} onChange={(event) => setCity(event.target.value)}>
              {cities.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label>
            <span>Date</span>
            <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          </label>
          <button type="submit" className="primary-button" disabled={loading}>
            {loading ? "Loading..." : "View report"} <span>↗</span>
          </button>
        </form>
        {error && <p className="error-message" role="alert">{error}</p>}
      </section>

      {report ? (
        <>
          <section className="report-grid" aria-label="AQI report">
            <article className="aqi-card">
              <div className="card-topline"><span className="section-label">02 / DAILY READING</span><span className="card-date">{report.date}</span></div>
              <p className="city-name">{report.city}</p>
              <div className="aqi-number">{Math.round(report.aqi)}</div>
              <div className="aqi-category"><span className="category-dot" /> {report.category}</div>
              <div className="scale"><span /><span /><span /><span className="active" /><span /></div>
              <div className="scale-labels"><span>Good</span><span>Severe</span></div>
            </article>

            <article className="advice-card">
              <span className="section-label">03 / HEALTH GUIDANCE</span>
              <div className="advice-icon">✦</div>
              <h2>Take it easy<br />outdoors today.</h2>
              <p>{report.advice}</p>
              <a href="#pollutants" className="text-link">See pollutant breakdown <span>→</span></a>
            </article>
          </section>

          <section className="pollutant-section" aria-labelledby="pollutant-title">
            <div className="section-heading">
              <div><span className="section-label">04 / POLLUTANT BREAKDOWN</span><h2 id="pollutant-title">What&apos;s in the air.</h2></div>
              <p>Measured values from {report.city} on {report.date}. Bars show each reading against a reference level.</p>
            </div>
            <div className="pollutant-grid">
              {pollutantMeta.map((pollutant) => {
                const value = report.pollutants[pollutant.key];
                const percentage = value === null ? 0 : Math.min((value / pollutant.reference) * 100, 100);
                return (
                  <article className="pollutant-card" key={pollutant.key}>
                    <div className="pollutant-topline"><span className="pollutant-name">{pollutant.key}</span><span className="pollutant-unit">{pollutant.unit}</span></div>
                    <div className="pollutant-value">{value === null ? "—" : value.toFixed(1)}</div>
                    <p>{pollutant.name}</p>
                    <div className="pollutant-track"><span style={{ width: `${percentage}%` }} /></div>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="summary-section" aria-labelledby="summary-title">
            <div className="section-heading">
              <div><span className="section-label">05 / CITY SNAPSHOT</span><h2 id="summary-title">The bigger picture.</h2></div>
              <p>{summary ? `A quick read on ${summary.city} across the full dataset.` : summaryError || "Loading city summary..."}</p>
            </div>
            {summary && <div className="summary-grid">
              <article className="summary-card"><span className="section-label">AVERAGE AQI</span><strong>{summary.average_aqi}</strong><span className="summary-note">{summary.average_category}</span></article>
              <article className="summary-card"><span className="section-label">RECORDED DAYS</span><strong>{summary.days.toLocaleString()}</strong><span className="summary-note">with known AQI</span></article>
              <article className="summary-card accent"><span className="section-label">WORST DAY</span><strong>{Math.round(summary.highest.aqi)}</strong><span className="summary-note">{summary.highest.date}</span></article>
            </div>}
          </section>
        </>
      ) : (
        <section className="empty-state" aria-live="polite">
          <span className="section-label">02 / DAILY READING</span>
          <h2>{loading ? "Reading the dataset..." : "Choose a city and date to begin."}</h2>
          <p>Your report will appear here after the API responds.</p>
        </section>
      )}

      <section className="insight-section" id="pollutants">
        <div className="section-heading">
          <div><span className="section-label">06 / HISTORICAL TREND</span><h2>Air over time.</h2></div>
          <p>{report ? `The latest ${history.length} recorded AQI days for ${report.city}.` : "Run a lookup to load a report from the AQI API."}</p>
        </div>
        {history.length > 1 ? (
          <div className="history-chart" aria-label={`Historical AQI trend for ${report?.city}`}>
            {(() => {
              const values = history.map((point) => point.aqi);
              const min = Math.min(...values);
              const max = Math.max(...values);
              const spread = max - min || 1;
              const chartPoints = history.map((point, index) => {
                const x = (index / (history.length - 1)) * 900;
                const y = 220 - ((point.aqi - min) / spread) * 180;
                return `${x},${y}`;
              }).join(" ");
              return <>
                <svg viewBox="0 0 900 260" role="img" aria-label="AQI line chart">
                  <line x1="0" y1="40" x2="900" y2="40" className="chart-grid-line" />
                  <line x1="0" y1="130" x2="900" y2="130" className="chart-grid-line" />
                  <line x1="0" y1="220" x2="900" y2="220" className="chart-grid-line" />
                  <polyline points={chartPoints} className="aqi-line" />
                </svg>
                <div className="chart-labels"><span>{history[0].date}</span><span>Low {Math.round(min)} · High {Math.round(max)}</span><span>{history[history.length - 1].date}</span></div>
              </>;
            })()}
          </div>
        ) : (
          <div className="chart-placeholder"><div className="chart-lines"><span /><span /><span /><span /></div><div className="placeholder-message"><strong>{historyLoading ? "Loading historical data..." : "Historical trend unavailable"}</strong><span>{historyError || "Run a lookup to load this city’s history."}</span></div></div>
        )}
      </section>

      <footer><span>AQI EXPLORER / CLASS PROJECT</span><span>Built from daily city-level air-quality data</span></footer>
    </main>
  );
}
