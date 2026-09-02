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
