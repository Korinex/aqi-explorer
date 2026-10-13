"use client";

import { useState } from "react";

const cities = ["Delhi", "Mumbai", "Bengaluru", "Chennai", "Kolkata"];

const sampleReport = {
  aqi: 285,
  category: "Poor",
  advice: "Avoid long outdoor exercise. Consider wearing a mask.",
  city: "Delhi",
  date: "2019-05-01",
};

export default function DashboardPage() {
  const [city, setCity] = useState("Delhi");
  const [date, setDate] = useState("2019-05-01");

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
          <span className="live-pill">Dataset: 2015–2020</span>
        </div>
        <div className="form-row">
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
          <button type="button" className="primary-button">View report <span>↗</span></button>
        </div>
      </section>

      <section className="report-grid" aria-label="AQI report preview">
        <article className="aqi-card">
          <div className="card-topline"><span className="section-label">02 / TODAY&apos;S READING</span><span className="card-date">{sampleReport.date}</span></div>
          <p className="city-name">{sampleReport.city}</p>
          <div className="aqi-number">{sampleReport.aqi}</div>
          <div className="aqi-category"><span className="category-dot" /> {sampleReport.category}</div>
          <div className="scale"><span /><span /><span /><span className="active" /><span /></div>
          <div className="scale-labels"><span>Good</span><span>Severe</span></div>
        </article>

        <article className="advice-card">
          <span className="section-label">03 / HEALTH GUIDANCE</span>
          <div className="advice-icon">✦</div>
          <h2>Take it easy<br />outdoors today.</h2>
          <p>{sampleReport.advice}</p>
          <a href="#pollutants" className="text-link">See pollutant breakdown <span>→</span></a>
        </article>
      </section>

      <section className="insight-section" id="pollutants">
        <div className="section-heading">
          <div><span className="section-label">04 / EXPLORE THE DATA</span><h2>More than a number.</h2></div>
          <p>Pollutant trends and city comparisons will appear here in the next milestone.</p>
        </div>
        <div className="chart-placeholder"><div className="chart-lines"><span /><span /><span /><span /></div><div className="placeholder-message"><strong>Historical trend chart</strong><span>Coming next: connect the dashboard to the AQI API</span></div></div>
      </section>

      <footer><span>AQI EXPLORER / CLASS PROJECT</span><span>Built from daily city-level air-quality data</span></footer>
    </main>
  );
}
