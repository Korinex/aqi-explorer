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

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

export default function DashboardPage() {
  const [cities, setCities] = useState<string[]>(["Delhi"]);
  const [city, setCity] = useState("Delhi");
  const [date, setDate] = useState("2019-05-01");
  const [report, setReport] = useState<AqiReport | null>(null);
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
      ) : (
        <section className="empty-state" aria-live="polite">
          <span className="section-label">02 / DAILY READING</span>
          <h2>{loading ? "Reading the dataset..." : "Choose a city and date to begin."}</h2>
          <p>Your report will appear here after the API responds.</p>
        </section>
      )}

      <section className="insight-section" id="pollutants">
        <div className="section-heading">
          <div><span className="section-label">04 / EXPLORE THE DATA</span><h2>More than a number.</h2></div>
          <p>{report ? "Pollutant breakdown and historical trends are the next layer of the platform." : "Run a lookup to load a report from the AQI API."}</p>
        </div>
        <div className="chart-placeholder"><div className="chart-lines"><span /><span /><span /><span /></div><div className="placeholder-message"><strong>Historical trend chart</strong><span>Next milestone: add real pollutant and trend visualizations</span></div></div>
      </section>

      <footer><span>AQI EXPLORER / CLASS PROJECT</span><span>Built from daily city-level air-quality data</span></footer>
    </main>
  );
}
