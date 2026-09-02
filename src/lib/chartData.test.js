import { describe, it, expect } from 'vitest';
import {
  buildTrendSeries, hasEnoughTrendData, formatBillions,
  missingYears, describeYears,
} from './chartData';

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

describe('missingYears', () => {
  const series = (years) => years.map((year) => ({ year, revenue: 1, fcf: 1 }));

  it('finds nothing when the years run consecutively', () => {
    expect(missingYears(series([2023, 2024, 2025]))).to.deep.equal([]);
  });

  it('finds a single skipped year', () => {
    expect(missingYears(series([2021, 2023, 2024]))).to.deep.equal([2022]);
  });

  // Duke Energy: its 2022 and 2023 filings parse as having no revenue.
  it('finds two skipped years', () => {
    expect(missingYears(series([2019, 2020, 2021, 2024, 2025]))).to.deep.equal([2022, 2023]);
  });

  // Coupa: a nine-year hole that the evenly-spaced bars would otherwise hide.
  it('finds a long run of skipped years', () => {
    expect(missingYears(series([2012, 2013, 2022, 2024, 2025])))
      .to.deep.equal([2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2023]);
  });

  it('needs at least two years to report a gap', () => {
    expect(missingYears(series([2025]))).to.deep.equal([]);
    expect(missingYears([])).to.deep.equal([]);
    expect(missingYears(null)).to.deep.equal([]);
  });
});

describe('describeYears', () => {
  it('reads a single year plainly', () => {
    expect(describeYears([2022])).to.equal('2022');
  });

  it('joins two years with "and"', () => {
    expect(describeYears([2022, 2023])).to.equal('2022 and 2023');
  });

  it('collapses a consecutive run into a range', () => {
    expect(describeYears([2014, 2015, 2016, 2017])).to.equal('2014–2017');
  });

  it('separates a range from a stray year', () => {
    expect(describeYears([2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2023]))
      .to.equal('2014–2021, and 2023');
  });

  it('returns an empty string for no years', () => {
    expect(describeYears([])).to.equal('');
    expect(describeYears(null)).to.equal('');
  });
});
