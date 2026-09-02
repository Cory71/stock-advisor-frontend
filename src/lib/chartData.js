// Helpers for the revenue / free-cash-flow trend chart.
//
// The backend sends four parallel-ish arrays. Revenue and free cash flow do NOT
// always cover the same years: a year with no readable capital-expenditure data
// is dropped from the cash-flow list, so NVIDIA can have 5 revenue years but
// only 3 cash-flow years. Each list therefore comes with its own list of years,
// and we join on the year rather than on array position.

// Turn the backend's arrays into one row per year, sorted oldest to newest.
// A year with no cash-flow figure gets `fcf: null`, which the chart renders as
// a gap instead of a misleading zero.
export function buildTrendSeries(rawData) {
  if (!rawData) return [];

  const years = toArray(rawData.annualYears);
  const revenues = toArray(rawData.annualRevenues);
  const fcfYears = toArray(rawData.annualFcfYears);
  const fcfs = toArray(rawData.annualFreeCashFlows);

  // Without year labels we can't say which year a value belongs to, and
  // guessing would put cash flow on the wrong bar. Show nothing instead.
  if (years.length === 0 || years.length !== revenues.length) return [];

  const fcfByYear = new Map();
  fcfYears.forEach((year, i) => {
    if (typeof fcfs[i] === 'number') fcfByYear.set(year, fcfs[i]);
  });

  return years
    .map((year, i) => ({
      year,
      revenue: typeof revenues[i] === 'number' ? revenues[i] : null,
      fcf: fcfByYear.has(year) ? fcfByYear.get(year) : null,
    }))
    .sort((a, b) => a.year - b.year);
}

// The chart only says something useful with at least two years to compare.
export function hasEnoughTrendData(series) {
  return Array.isArray(series) && series.length >= 2;
}

// Years between the first and last bar that have no data at all.
//
// The bars are evenly spaced, so a stock missing a year looks continuous unless
// we say otherwise — Coupa (CCC) charts 2012, 2013, 2022, 2024, 2025, and a
// nine-year hole would otherwise read as one step. Returns [] when the years
// run consecutively.
export function missingYears(series) {
  if (!Array.isArray(series) || series.length < 2) return [];

  const present = new Set(series.map((row) => row.year));
  const first = series[0].year;
  const last = series[series.length - 1].year;

  const gaps = [];
  for (let year = first + 1; year < last; year += 1) {
    if (!present.has(year)) gaps.push(year);
  }
  return gaps;
}

// Turn a list of years into something readable: "2023", "2022 and 2023", or
// "2014-2021, and 2023" for longer runs.
export function describeYears(years) {
  if (!Array.isArray(years) || years.length === 0) return '';
  if (years.length === 1) return String(years[0]);
  if (years.length === 2) return `${years[0]} and ${years[1]}`;

  // Collapse consecutive runs so a long gap reads as a range.
  const runs = [];
  let start = years[0];
  let prev = years[0];
  for (const year of years.slice(1)) {
    if (year !== prev + 1) {
      runs.push(start === prev ? `${start}` : `${start}–${prev}`);
      start = year;
    }
    prev = year;
  }
  runs.push(start === prev ? `${start}` : `${start}–${prev}`);

  if (runs.length === 1) return runs[0];
  return `${runs.slice(0, -1).join(', ')}, and ${runs[runs.length - 1]}`;
}

// Format a dollar amount as a short label for axis ticks and tooltips,
// e.g. 32_240_000_000 -> "$32.2B", -1_700_000_000 -> "-$1.7B".
export function formatBillions(value) {
  if (typeof value !== 'number') return '—';
  const sign = value < 0 ? '-' : '';
  const abs = Math.abs(value);
  if (abs >= 1e9) return `${sign}$${(abs / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(0)}M`;
  return `${sign}$${abs.toFixed(0)}`;
}

// Always return an array so callers don't have to null-check every field.
function toArray(value) {
  return Array.isArray(value) ? value : [];
}
