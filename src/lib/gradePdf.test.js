import { describe, it, expect, afterEach } from 'vitest';
import { buildGradePdf } from './gradePdf';

const B = 1_000_000_000;
const now = new Date('2026-10-19T12:00:00Z');

const result = {
  ticker: 'NVDA', name: 'NVIDIA Corp', price: 214.13, currency: 'USD', model: 'general', grade: 'A',
  gradedAt: '2026-10-19T22:15:00Z',
  criteria: [{ name: 'Net positive free cash flow', passed: true, value: 97 * B, prior: 0, source: 'cash flow statement' }],
  rawData: {
    annualYears: [2023, 2024, 2025], annualRevenues: [27 * B, 61 * B, 130 * B],
    annualFcfYears: [2023, 2024, 2025], annualFreeCashFlows: [4 * B, 27 * B, -2 * B],
  },
  sectorContext: {
    industry: 'Semiconductors',
    metrics: [{ key: 'revenueCagr', label: 'Revenue growth per year', value: 0.68, median: 0.075, peers: 16, position: 'above' }],
  },
};

describe('buildGradePdf', () => {
  afterEach(() => document.documentElement.removeAttribute('data-bs-theme'));

  it('produces a real PDF file', () => {
    expect(buildGradePdf(result, { now }).output().startsWith('%PDF')).toBe(true);
  });

  // The report must look the same whatever theme the visitor uses. A dark page
  // would waste ink and be hard to read on paper.
  it('is identical in dark mode and light mode', () => {
    document.documentElement.setAttribute('data-bs-theme', 'light');
    const light = buildGradePdf(result, { now }).output();
    document.documentElement.setAttribute('data-bs-theme', 'dark');
    const dark = buildGradePdf(result, { now }).output();
    expect(dark).toBe(light);
  });

  it('builds for a bank and for an N/A result without failing', () => {
    const bank = {
      ...result, model: 'bank',
      rawData: { annualBankYears: [2024, 2025], annualBankRevenue: [B, 2 * B], annualNetIncome: [B, B] },
    };
    const notGraded = {
      ...result, grade: 'N/A', criteria: [], reason: 'Financial data looks outdated.', rawData: {}, sectorContext: null,
    };
    expect(buildGradePdf(bank, { now }).getNumberOfPages()).toBeGreaterThanOrEqual(1);
    expect(buildGradePdf(notGraded, { now }).getNumberOfPages()).toBe(1);
  });
});
