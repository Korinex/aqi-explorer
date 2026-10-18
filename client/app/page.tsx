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
type ComparisonRow = {
  city: string;
  days: number;
  average_aqi: number;
  average_category: string;
  highest_aqi: number;
};

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
const pollutantMeta = [
  { key: "PM2.5", name: "Fine particles", unit: "µg/m³", reference: 150 },
  { key: "PM10", name: "Coarse particles", unit: "µg/m³", reference: 250 },
  { key: "NO2", name: "Nitrogen dioxide", unit: "µg/m³", reference: 200 },
  { key: "CO", name: "Carbon monoxide", unit: "mg/m³", reference: 10 },
  { key: "SO2", name: "Sulfur dioxide", unit: "µg/m³", reference: 80 },
  { key: "O3", name: "Ozone", unit: "µg/m³", reference: 180 },
];
const aqiCategories = ["Good", "Satisfactory", "Moderate", "Poor", "Very Poor", "Severe"];
const aqiColors = ["#51a66f", "#a4bd4f", "#e6b84f", "#e78a45", "#d75c48", "#8e3942"];

function categoryClass(category: string) {
  return category.toLowerCase().replaceAll(" ", "-");
}

function categoryIndexForAqi(aqi: number) {
  if (aqi <= 50) return 0;
  if (aqi <= 100) return 1;
  if (aqi <= 200) return 2;
  if (aqi <= 300) return 3;
  if (aqi <= 400) return 4;
  return 5;
}

export default function DashboardPage() {
  const [cities, setCities] = useState<string[]>([]);
  const [city, setCity] = useState("");
  const [date, setDate] = useState("2019-05-01");
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [datesLoading, setDatesLoading] = useState(false);
  const [datesError, setDatesError] = useState("");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState("2019-05");
  const [report, setReport] = useState<AqiReport | null>(null);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [summary, setSummary] = useState<CitySummary | null>(null);
  const [summaryError, setSummaryError] = useState("");
  const [compareCities, setCompareCities] = useState<string[]>([]);
  const [comparison, setComparison] = useState<ComparisonRow[]>([]);
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareError, setCompareError] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const selectedCategoryIndex = report ? aqiCategories.indexOf(report.category) : -1;

  useEffect(() => {
    const elements = document.querySelectorAll<HTMLElement>(".scroll-reveal");
    if (!("IntersectionObserver" in window)) {
      elements.forEach((element) => element.classList.add("is-visible"));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -35px 0px" });
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [report, summary, history, comparison]);

  useEffect(() => {
    async function loadCities() {
      try {
        const response = await fetch(`${apiBaseUrl}/api/cities`);
        if (!response.ok) throw new Error("Could not load cities.");
        const payload: { cities: string[] } = await response.json();
        setCities(payload.cities);
        const initialCity = payload.cities.includes("Delhi") ? "Delhi" : payload.cities[0] ?? "";
        setCity(initialCity);
        const initialComparisonCities = ["Delhi", "Mumbai"].every((item) => payload.cities.includes(item))
          ? ["Delhi", "Mumbai"]
          : payload.cities.slice(0, 2);
        setCompareCities(initialComparisonCities);
      } catch {
        setError("Could not load the city list. Check that the API is running.");
      }
    }

    void loadCities();
  }, []);

  useEffect(() => {
    if (!city) {
      setAvailableDates([]);
      return;
    }

    const controller = new AbortController();
    async function loadDates() {
      setDatesLoading(true);
      setDatesError("");
      try {
        const params = new URLSearchParams({ city });
        const response = await fetch(`${apiBaseUrl}/api/dates?${params}`, { signal: controller.signal });
        const payload: { dates: string[]; detail?: string } = await response.json();
        if (!response.ok) throw new Error(payload.detail ?? "Could not load dates.");
        if (payload.dates.length === 0) throw new Error(`No dataset dates found for ${city}.`);
        setAvailableDates(payload.dates);
        const selectedDate = payload.dates.includes(date)
          ? date
          : payload.dates.reduce((nearest, candidate) =>
              Math.abs(Date.parse(`${candidate}T00:00:00Z`) - Date.parse(`${date}T00:00:00Z`))
                < Math.abs(Date.parse(`${nearest}T00:00:00Z`) - Date.parse(`${date}T00:00:00Z`))
                ? candidate
                : nearest
            , payload.dates[0]);
        setDate(selectedDate);
        setCalendarMonth(selectedDate.slice(0, 7));
      } catch (requestError) {
        if (controller.signal.aborted) return;
        setAvailableDates([]);
        setDatesError(requestError instanceof Error ? requestError.message : "Could not load dates.");
      } finally {
        if (!controller.signal.aborted) setDatesLoading(false);
      }
    }

    void loadDates();
    return () => controller.abort();
  }, [city]);

  useEffect(() => {
    if (!report) return;
    const selectedCity = report.city;
    const selectedDate = report.date;

    async function loadHistory() {
      setHistoryLoading(true);
      setHistoryError("");
      try {
        const params = new URLSearchParams({ city: selectedCity, limit: "120", through: selectedDate });
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

  async function handleCompare(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCompareLoading(true);
    setCompareError("");
    try {
      const params = new URLSearchParams();
      compareCities.forEach((item) => params.append("cities", item));
      const response = await fetch(`${apiBaseUrl}/api/compare?${params}`);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.detail ?? "Could not compare cities.");
      setComparison(payload.cities);
    } catch (requestError) {
      setComparison([]);
      setCompareError(requestError instanceof Error ? requestError.message : "Could not compare cities.");
    } finally {
      setCompareLoading(false);
    }
  }

  const [year, month] = calendarMonth.split("-").map(Number);
  const monthStart = new Date(Date.UTC(year, month - 1, 1));
  const monthLength = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const firstWeekday = monthStart.getUTCDay();
  const availableMonths = [...new Set(availableDates.map((item) => item.slice(0, 7)))];
  const currentMonthIndex = availableMonths.indexOf(calendarMonth);
  const availableYears = [...new Set(availableMonths.map((item) => item.slice(0, 4)))];
  const monthsInSelectedYear = availableMonths.filter((item) => item.startsWith(`${year}-`));
  const firstAvailableMonth = availableMonths[0] ?? calendarMonth;
  const lastAvailableMonth = availableMonths[availableMonths.length - 1] ?? calendarMonth;
  const availableDateSet = new Set(availableDates);
  const formattedDate = date
    ? new Date(`${date}T00:00:00Z`).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "UTC",
      })
    : "Choose a date";

  function moveCalendarMonth(offset: number) {
    const nextMonth = availableMonths[currentMonthIndex + offset];
    if (nextMonth) setCalendarMonth(nextMonth);
  }

  function selectCalendarYear(selectedYear: string) {
    const monthsInYear = availableMonths.filter((item) => item.startsWith(`${selectedYear}-`));
    const selectedMonth = monthsInYear.find((item) => item >= calendarMonth) ?? monthsInYear[monthsInYear.length - 1];
    if (selectedMonth) setCalendarMonth(selectedMonth);
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

      <section
        className={`search-panel scroll-reveal${calendarOpen ? " calendar-open" : ""}`}
        aria-labelledby="lookup-title"
      >
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
            <select value={city} onChange={(event) => {
              setCity(event.target.value);
              setCalendarOpen(false);
            }} disabled={cities.length === 0}>
              {cities.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label className="date-picker-field">
            <span>Date</span>
            <button
              type="button"
              className="date-picker-trigger"
              aria-haspopup="dialog"
              aria-expanded={calendarOpen}
              disabled={datesLoading || availableDates.length === 0}
              onClick={() => setCalendarOpen(!calendarOpen)}
            >
              {datesLoading ? "Loading dates..." : formattedDate}
            </button>
            {calendarOpen && <div className="calendar-popover" role="dialog" aria-label="Choose an available dataset date">
              <div className="calendar-header">
                <button type="button" aria-label="Previous month" disabled={calendarMonth <= firstAvailableMonth} onClick={() => moveCalendarMonth(-1)}>‹</button>
                <div className="calendar-selectors">
                  <select
                    className="calendar-select"
                    aria-label="Select year"
                    value={year}
                    onChange={(event) => selectCalendarYear(event.target.value)}
                  >
                    {availableYears.map((availableYear) => <option key={availableYear} value={availableYear}>{availableYear}</option>)}
                  </select>
                  <select
                    className="calendar-select"
                    aria-label="Select month"
                    value={calendarMonth}
                    onChange={(event) => setCalendarMonth(event.target.value)}
                  >
                    {monthsInSelectedYear.map((availableMonth) => <option key={availableMonth} value={availableMonth}>
                      {new Date(`${availableMonth}-01T00:00:00Z`).toLocaleDateString(undefined, { month: "long", timeZone: "UTC" })}
                    </option>)}
                  </select>
                </div>
                <button type="button" aria-label="Next month" disabled={calendarMonth >= lastAvailableMonth} onClick={() => moveCalendarMonth(1)}>›</button>
              </div>
              <div className="calendar-grid calendar-weekdays" aria-hidden="true">
                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((weekday) => <span key={weekday}>{weekday}</span>)}
              </div>
              <div className="calendar-grid">
                {Array.from({ length: firstWeekday }, (_, index) => <span key={`empty-${index}`} />)}
                {Array.from({ length: monthLength }, (_, index) => {
                  const day = String(index + 1).padStart(2, "0");
                  const monthString = String(month).padStart(2, "0");
                  const candidateDate = `${year}-${monthString}-${day}`;
                  const isAvailable = availableDateSet.has(candidateDate);
                  return <button
                    key={candidateDate}
                    type="button"
                    disabled={!isAvailable}
                    aria-pressed={date === candidateDate}
                    onClick={() => {
                      setDate(candidateDate);
                      setCalendarOpen(false);
                    }}
                  >{index + 1}</button>;
                })}
              </div>
            </div>}
          </label>
          <button type="submit" className="primary-button" disabled={loading || datesLoading || cities.length === 0 || !date}>
            {loading ? "Loading..." : "View report"} <span>↗</span>
          </button>
        </form>
        {error && <p className="error-message" role="alert">{error}</p>}
        {datesError && <p className="error-message" role="alert">{datesError}</p>}
      </section>

      {report ? (
        <>
          <section className="report-grid scroll-reveal" aria-label="AQI report">
            <article className="aqi-card">
              <div className="card-topline"><span className="section-label">02 / DAILY READING</span><span className="card-date">{report.date}</span></div>
              <p className="city-name">{report.city}</p>
              <div className="aqi-number" style={{ color: aqiColors[Math.max(0, selectedCategoryIndex)] }}>{Math.round(report.aqi)}</div>
              <div className="aqi-category"><span className="category-dot" style={{ backgroundColor: aqiColors[Math.max(0, selectedCategoryIndex)] }} /> {report.category}</div>
              <div className="scale" aria-label={`AQI category: ${report.category}`}>
                {aqiCategories.map((category, index) => <span key={category} className={index === selectedCategoryIndex ? "active" : ""} style={{ backgroundColor: aqiColors[index] }} />)}
              </div>
              <div className="scale-labels"><span>Clean</span><span>Hazardous</span></div>
            </article>

            <article className="advice-card">
              <span className="section-label">03 / HEALTH GUIDANCE</span>
              <div className="advice-topline"><span className="advice-icon">✦</span><span className={`advice-category ${categoryClass(report.category)}`}>{report.category} air</span></div>
              <h2>What this means<br />for your health</h2>
              <p className="advice-copy">{report.advice}</p>
              <a href="#pollutants" className="text-link">See pollutant breakdown <span>→</span></a>
            </article>
          </section>

          <section className="pollutant-section scroll-reveal" aria-labelledby="pollutant-title">
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

          <section className="summary-section scroll-reveal" aria-labelledby="summary-title">
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

      <section className="comparison-section scroll-reveal" aria-labelledby="comparison-title">
        <div className="section-heading">
          <div><span className="section-label">06 / CITY COMPARISON</span><h2 id="comparison-title">Which city breathes easier?</h2></div>
          <p>Lower is cleaner. Results are ranked from cleanest to most polluted using each city&apos;s full dataset average.</p>
        </div>
        <div className="comparison-panel">
        <form className="comparison-form" onSubmit={handleCompare}>
          <label><span>City one</span><select value={compareCities[0] ?? ""} onChange={(event) => setCompareCities([event.target.value, compareCities[1] ?? ""])} disabled={cities.length === 0}>{cities.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label><span>City two</span><select value={compareCities[1] ?? compareCities[0] ?? ""} onChange={(event) => setCompareCities([compareCities[0] ?? "", event.target.value])} disabled={cities.length < 2}>{cities.map((item) => <option key={item} disabled={item === compareCities[0]}>{item}</option>)}</select></label>
          <button type="submit" className="secondary-button" disabled={compareLoading || cities.length < 2 || compareCities[0] === compareCities[1]}>{compareLoading ? "Comparing..." : "Compare cities"}</button>
        </form>
        {compareError && <p className="error-message" role="alert">{compareError}</p>}
        {comparison.length > 0 && <div className="comparison-list">
          {[...comparison].sort((a, b) => a.average_aqi - b.average_aqi).map((item, index) => <article className={`comparison-row ${index === 0 ? "cleanest-row" : ""}`} key={item.city}>
            <span className="rank">0{index + 1}</span><strong>{item.city}{index === 0 && <small className="cleanest-badge">Cleanest</small>}</strong><span className={`comparison-category ${categoryClass(item.average_category)}`}>{item.average_category}</span><div className="comparison-score"><span className="comparison-aqi">{item.average_aqi}<small> avg AQI</small></span><span className="comparison-track"><span style={{ width: `${Math.min(item.average_aqi / 5, 100)}%`, backgroundColor: aqiColors[Math.max(0, aqiCategories.indexOf(item.average_category))] }} /></span></div>
          </article>)}
        </div>}
        {!comparison.length && !compareError && <p className="comparison-hint">Choose two cities to see which has cleaner air on average.</p>}
        </div>
      </section>

      <section className="insight-section scroll-reveal" id="pollutants">
        <div className="section-heading">
          <div><span className="section-label">07 / HISTORICAL TREND</span><h2>Air over time.</h2></div>
          <p>{report ? `Daily AQI for ${report.city}. Higher points mean worse air; line colors and shaded bands show the category. Hover over the chart to inspect a reading.` : "Run a lookup to load a report from the AQI API."}</p>
        </div>
        {history.length > 1 ? (
          <div className="history-chart" aria-label={`Historical AQI trend for ${report?.city}`}>
            {(() => {
              const values = history.map((point) => point.aqi);
              const min = Math.min(...values);
              const max = Math.max(...values);
              const chartMax = Math.max(500, Math.ceil(max / 100) * 100);
              const chartTop = 24;
              const chartBottom = 232;
              const chartLeft = 70;
              const chartRight = 940;
              const yFor = (value: number) => chartBottom - (value / chartMax) * (chartBottom - chartTop);
              const xFor = (index: number) => chartLeft + (index / (history.length - 1)) * (chartRight - chartLeft);
              const latest = history[history.length - 1];
              const dateTickCount = Math.min(6, history.length);
              const dateTicks = Array.from({ length: dateTickCount }, (_, tickIndex) => Math.round(tickIndex * (history.length - 1) / (dateTickCount - 1)));
              const hoveredPoint = hoveredPointIndex === null ? null : history[hoveredPointIndex];
              const hoverX = hoveredPointIndex === null ? 0 : xFor(hoveredPointIndex);
              const hoverY = hoveredPoint ? yFor(hoveredPoint.aqi) : 0;
              const tooltipX = Math.max(chartLeft + 4, Math.min(hoverX + 12, chartRight - 178));
              const tooltipY = Math.max(chartTop + 4, hoverY - 56);
              return <>
                <div className="chart-topline">
                  <div className="chart-legend" aria-label="AQI category colors">
                    {aqiCategories.map((category, index) => <span key={category}><i style={{ backgroundColor: aqiColors[index] }} />{category}</span>)}
                  </div>
                  <span className="latest-reading"><i style={{ backgroundColor: aqiColors[categoryIndexForAqi(latest.aqi)] }} />Latest <strong>{Math.round(latest.aqi)}</strong> · {aqiCategories[categoryIndexForAqi(latest.aqi)]}</span>
                </div>
                <svg
                  viewBox="0 0 980 300"
                  role="img"
                  tabIndex={0}
                  aria-label={`Historical AQI for ${report?.city}; vertical axis is AQI, horizontal axis is date. Move over the chart to inspect a date.`}
                  onFocus={() => setHoveredPointIndex((index) => index ?? history.length - 1)}
                  onKeyDown={(event) => {
                    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
                      event.preventDefault();
                      setHoveredPointIndex((index) => Math.max(0, Math.min(history.length - 1, (index ?? history.length - 1) + (event.key === "ArrowRight" ? 1 : -1))));
                    }
                  }}
                  onMouseMove={(event) => {
                    const bounds = event.currentTarget.getBoundingClientRect();
                    const svgX = ((event.clientX - bounds.left) / bounds.width) * 980;
                    const ratio = Math.max(0, Math.min(1, (svgX - chartLeft) / (chartRight - chartLeft)));
                    setHoveredPointIndex(Math.round(ratio * (history.length - 1)));
                  }}
                  onMouseLeave={() => setHoveredPointIndex(null)}
                >
                  {[
                    { from: 0, to: 50, color: aqiColors[0] }, { from: 50, to: 100, color: aqiColors[1] },
                    { from: 100, to: 200, color: aqiColors[2] }, { from: 200, to: 300, color: aqiColors[3] },
                    { from: 300, to: 400, color: aqiColors[4] }, { from: 400, to: chartMax, color: aqiColors[5] },
                  ].map((band) => <rect key={band.from} x={chartLeft} y={yFor(band.to)} width={chartRight - chartLeft} height={Math.max(0, yFor(band.from) - yFor(band.to))} fill={band.color} opacity=".09" />)}
                  {Array.from({ length: chartMax / 100 + 1 }, (_, index) => index * 100).map((tick) => <g key={tick}>
                    <line x1={chartLeft} y1={yFor(tick)} x2={chartRight} y2={yFor(tick)} className="chart-grid-line" />
                    <text x={chartLeft - 12} y={yFor(tick) + 4} className="chart-axis-label" textAnchor="end">{tick}</text>
                  </g>)}
                  {dateTicks.map((index, tickNumber) => <g key={history[index].date}>
                    <line x1={xFor(index)} y1={chartTop} x2={xFor(index)} y2={chartBottom} className="chart-date-grid-line" />
                    <text x={xFor(index)} y="251" className="chart-date-label" textAnchor={tickNumber === 0 ? "start" : tickNumber === dateTicks.length - 1 ? "end" : "middle"}>{history[index].date.slice(5)}</text>
                  </g>)}
                  <text x="16" y="15" className="chart-axis-title">AQI</text>
                  <text x={chartRight} y="289" className="chart-axis-title" textAnchor="end">DATE · MM-DD</text>
                  {history.slice(1).map((point, index) => {
                    const previous = history[index];
                    const segmentCategory = categoryIndexForAqi((previous.aqi + point.aqi) / 2);
                    return <line key={`${previous.date}-${point.date}`} x1={xFor(index)} y1={yFor(previous.aqi)} x2={xFor(index + 1)} y2={yFor(point.aqi)} stroke={aqiColors[segmentCategory]} className="aqi-segment" />;
                  })}
                  {history.map((point, index) => <circle key={point.date} cx={xFor(index)} cy={yFor(point.aqi)} r={index === history.length - 1 ? 5 : 2.2} fill={aqiColors[categoryIndexForAqi(point.aqi)]} className="chart-point">
                    <title>{`${point.date}: AQI ${Math.round(point.aqi)} (${aqiCategories[categoryIndexForAqi(point.aqi)]})`}</title>
                  </circle>)}
                  {hoveredPoint && <g className="chart-hover-tooltip" pointerEvents="none">
                    <line x1={hoverX} y1={chartTop} x2={hoverX} y2={chartBottom} className="chart-crosshair" />
                    <circle cx={hoverX} cy={hoverY} r="7" fill={aqiColors[categoryIndexForAqi(hoveredPoint.aqi)]} className="chart-hover-point" />
                    <rect x={tooltipX} y={tooltipY} width="170" height="46" rx="7" className="chart-tooltip-box" />
                    <text x={tooltipX + 10} y={tooltipY + 17} className="chart-tooltip-date">{hoveredPoint.date}</text>
                    <text x={tooltipX + 10} y={tooltipY + 35} className="chart-tooltip-value">AQI {Math.round(hoveredPoint.aqi)} · {aqiCategories[categoryIndexForAqi(hoveredPoint.aqi)]}</text>
                  </g>}
                </svg>
                <div className="chart-labels"><span>{history[0].date}</span><span>{history.length} daily readings · Low {Math.round(min)} · High {Math.round(max)}</span><span>{history[history.length - 1].date}</span></div>
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
