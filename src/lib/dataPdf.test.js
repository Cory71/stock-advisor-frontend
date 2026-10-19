import { describe, it, expect } from 'vitest';
import { buildDataPdf } from './dataPdf';

const data = {
  exportedAt: '2026-10-19T15:15:00Z',
  account: { email: 'cory@example.com', displayName: 'Cory', createdAt: '2026-09-01T10:00:00Z', signInMethods: { password: true } },
  watchlist: [{ ticker: 'AAPL', gradeWhenAdded: 'B', addedAt: '2026-10-01T09:00:00Z' }],
  searchHistory: [],
};

describe('buildDataPdf', () => {
  it('produces a real PDF file', () => {
    const bytes = new Uint8Array(buildDataPdf(data).output('arraybuffer'));
    // Every PDF file starts with "%PDF".
    expect(String.fromCharCode(...bytes.slice(0, 4))).toBe('%PDF');
  });

  // A long search history must flow onto extra pages, not run off the first.
  it('adds pages for a long history', () => {
    const searchHistory = Array.from({ length: 120 }, (_, i) => ({
      ticker: `T${i}`, searchedAt: '2026-10-19T15:15:00Z',
    }));
    expect(buildDataPdf({ ...data, searchHistory }).getNumberOfPages()).toBeGreaterThan(1);
  });
});
