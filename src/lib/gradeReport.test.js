import { describe, it, expect } from 'vitest';
import { gradeReport, reportFileName } from './gradeReport';

const B = 1_000_000_000;

// A graded result shaped like GET /api/grade/:ticker.
function result(overrides = {}) {
  return {
    ticker: 'NVDA',
    name: 'NVIDIA Corp',
    price: 214.13,
    currency: 'USD',
    model: 'general',
    grade: 'B',
    gradedAt: '2026-10-19T22:15:00Z',
    criteria: [
      { name: 'Topline revenue growth (long-term)', passed: true, value: 216 * B, prior: 27 * B, source: 'income statement' },
      { name: 'Recent revenue growth (TTM)', passed: false, value: 200 * B, prior: 216 * B, source: 'income statement TTM' },
    ],
    rawData: {
      annualYears: [2024, 2025], annualRevenues: [100 * B, 216 * B],
      annualFcfYears: [2024, 2025], annualFreeCashFlows: [30 * B, 97 * B],
    },
    sectorContext: null,
    ...overrides,
  };
}
const report = (overrides) => gradeReport(result(overrides), { timeZone: 'UTC' });

describe('gradeReport', () => {
  it('has the ticker, name, price and grading time', () => {
    const r = report();
    expect(r.ticker).toBe('NVDA');
    expect(r.name).toBe('NVIDIA Corp');
    expect(r.details).toBe('$214.13 USD  ·  Graded Oct 19, 2026, 10:15 PM');
    expect(r.grade).toBe('B');
  });

  // The same plain-English sentences as the page, with the numbers under them.
  it('explains each criterion with a sentence and its numbers', () => {
    const [first] = report().criteria;
    expect(first.result).toBe('Pass');
    expect(first.explanation).toBe(
      'Revenue grew from $27.0B to $216.0B over the years we checked.\n$216.0B vs prior $27.0B — income statement'
    );
  });

  it('includes the sector comparison and its sentence when there is one', () => {
    const r = report({
      sectorContext: {
        industry: 'Semiconductors',
        metrics: [{ key: 'fcfMargin', label: 'Free cash flow margin', value: 0.45, median: 0.22, peers: 16, position: 'above' }],
      },
    });
    expect(r.sector.heading).toBe('Compared with 16 Semiconductors stocks');
    expect(r.sector.rows).toEqual([['Free cash flow margin', 'Above median', '45.0% vs median 22.0% (16 stocks)']]);
    expect(r.summary).toContain('its free cash flow margin is above the median');
  });

  it('labels a bank grade and charts net income for it', () => {
    const r = report({
      model: 'bank',
      rawData: { annualBankYears: [2024, 2025], annualBankRevenue: [B, 2 * B], annualNetIncome: [B, B] },
    });
    expect(r.notes[0]).toContain('bank model');
    expect(r.chart.labels).toEqual(['Revenue', 'Net income']);
  });

  it('carries the N/A reason and leaves out the chart without two years', () => {
    const r = report({ grade: 'N/A', criteria: [], reason: 'Financial data looks outdated.', rawData: {} });
    expect(r.notes).toEqual(['Financial data looks outdated.']);
    expect(r.summary).toBeNull();
    expect(r.chart).toBeNull();
  });

  it('names the missing years under the chart', () => {
    const r = report({
      rawData: { annualYears: [2021, 2024], annualRevenues: [B, 2 * B], annualFcfYears: [], annualFreeCashFlows: [] },
    });
    expect(r.chart.caption).toContain('2022 and 2023 are not shown');
  });
});

describe('reportFileName', () => {
  it('names the file after the ticker and the date', () => {
    expect(reportFileName('NVDA', new Date('2026-10-19T12:00:00Z'))).toBe('NVDA-report-2026-10-19.pdf');
  });
});
