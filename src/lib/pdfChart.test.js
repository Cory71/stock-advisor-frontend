import { describe, it, expect } from 'vitest';
import { chartLayout } from './pdfChart';

const B = 1_000_000_000;
const box = { x: 0, y: 0, width: 100, height: 50 };

describe('chartLayout', () => {
  const series = [
    { year: 2024, revenue: 100 * B, fcf: 20 * B },
    { year: 2025, revenue: 200 * B, fcf: -40 * B },
  ];

  it('draws one bar per value, side by side within each year', () => {
    const { bars } = chartLayout(series, ['revenue', 'fcf'], box);
    expect(bars).toHaveLength(4);
    expect(bars[1].x).toBeGreaterThan(bars[0].x);   // fcf sits right of revenue
    expect(bars[2].x).toBeGreaterThan(bars[1].x);   // the next year sits further right
  });

  // The axis ends on round numbers and always includes zero.
  it('uses round gridline steps that include zero', () => {
    const { gridlines } = chartLayout(series, ['revenue', 'fcf'], box);
    expect(gridlines.map((g) => g.label)).toEqual(['-$100.0B', '$0', '$100.0B', '$200.0B']);
  });

  // A negative value hangs below the zero line instead of rising above it.
  it('draws a negative value below the zero line', () => {
    const { bars, zeroY } = chartLayout(series, ['revenue', 'fcf'], box);
    const burn = bars.find((b) => b.year === 2025 && b.key === 'fcf');
    expect(burn.y).toBeCloseTo(zeroY);
    expect(burn.height).toBeGreaterThan(0);
    const revenue = bars.find((b) => b.year === 2025 && b.key === 'revenue');
    expect(revenue.y + revenue.height).toBeCloseTo(zeroY);
  });

  it('leaves a gap for a missing value rather than a zero bar', () => {
    const gappy = [{ year: 2024, revenue: B, fcf: null }, { year: 2025, revenue: 2 * B, fcf: B }];
    expect(chartLayout(gappy, ['revenue', 'fcf'], box).bars).toHaveLength(3);
  });

  it('labels each year under its bars', () => {
    const { years } = chartLayout(series, ['revenue', 'fcf'], box);
    expect(years).toEqual([{ x: 25, label: '2024' }, { x: 75, label: '2025' }]);
  });
});
