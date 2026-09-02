import { describe, it, expect } from 'vitest';
import { buildTrendSeries, hasEnoughTrendData, formatBillions } from './chartData';

describe('buildTrendSeries', () => {
  it('pairs each revenue value with its own year', () => {
    const series = buildTrendSeries({
      annualYears: [2023, 2024, 2025],
      annualRevenues: [10, 20, 30],
      annualFcfYears: [2023, 2024, 2025],
      annualFreeCashFlows: [1, 2, 3],
    });
    expect(series).to.deep.equal([
      { year: 2023, revenue: 10, fcf: 1 },
      { year: 2024, revenue: 20, fcf: 2 },
      { year: 2025, revenue: 30, fcf: 3 },
    ]);
  });

  // NVIDIA has 5 revenue years but only 3 cash-flow years. Joining the two
  // lists by position would shift cash flow onto the wrong years.
  it('joins on the year, not the array position', () => {
    const series = buildTrendSeries({
      annualYears: [2021, 2022, 2023, 2024, 2025],
      annualRevenues: [10, 20, 30, 40, 50],
      annualFcfYears: [2023, 2024, 2025],
      annualFreeCashFlows: [3, 4, 5],
    });
    expect(series.map((r) => r.fcf)).to.deep.equal([null, null, 3, 4, 5]);
    expect(series.map((r) => r.year)).to.deep.equal([2021, 2022, 2023, 2024, 2025]);
  });

  it('leaves a gap rather than a zero for a missing year', () => {
    const series = buildTrendSeries({
      annualYears: [2024, 2025],
      annualRevenues: [10, 20],
      annualFcfYears: [2025],
      annualFreeCashFlows: [5],
    });
    expect(series[0].fcf).to.equal(null);
    expect(series[1].fcf).to.equal(5);
  });

  it('keeps negative cash flow as a real value', () => {
    const series = buildTrendSeries({
      annualYears: [2025],
      annualRevenues: [32_240_000_000],
      annualFcfYears: [2025],
      annualFreeCashFlows: [-1_700_000_000],
    });
    expect(series[0].fcf).to.equal(-1_700_000_000);
  });

  it('sorts oldest to newest', () => {
    const series = buildTrendSeries({
      annualYears: [2025, 2023, 2024],
      annualRevenues: [30, 10, 20],
      annualFcfYears: [],
      annualFreeCashFlows: [],
    });
    expect(series.map((r) => r.year)).to.deep.equal([2023, 2024, 2025]);
  });

  // Older cached stocks were graded before annualYears existed. Without years
  // we cannot say which year a value belongs to, so we show no chart at all
  // rather than guessing and drawing something wrong.
  it('returns nothing when year labels are missing', () => {
    expect(buildTrendSeries({ annualRevenues: [10, 20], annualFreeCashFlows: [1, 2] })).to.deep.equal([]);
  });

  it('returns nothing when years and revenues disagree in length', () => {
    expect(buildTrendSeries({ annualYears: [2024, 2025], annualRevenues: [10] })).to.deep.equal([]);
  });

  it('handles missing or empty input', () => {
    expect(buildTrendSeries(null)).to.deep.equal([]);
    expect(buildTrendSeries({})).to.deep.equal([]);
  });
});

describe('hasEnoughTrendData', () => {
  it('needs at least two years to show a trend', () => {
    expect(hasEnoughTrendData([{ year: 2025 }])).to.equal(false);
    expect(hasEnoughTrendData([{ year: 2024 }, { year: 2025 }])).to.equal(true);
    expect(hasEnoughTrendData([])).to.equal(false);
    expect(hasEnoughTrendData(null)).to.equal(false);
  });
});

describe('formatBillions', () => {
  it('formats billions and millions', () => {
    expect(formatBillions(32_240_000_000)).to.equal('$32.2B');
    expect(formatBillions(450_000_000)).to.equal('$450M');
  });

  it('keeps the minus sign on negative cash flow', () => {
    expect(formatBillions(-1_700_000_000)).to.equal('-$1.7B');
  });

  it('shows a dash for a missing value', () => {
    expect(formatBillions(null)).to.equal('—');
    expect(formatBillions(undefined)).to.equal('—');
  });
});
