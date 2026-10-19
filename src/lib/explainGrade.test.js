import { describe, it, expect } from 'vitest';
import { explainCriterion, summarizeGrade, explainSector } from './explainGrade';

const B = 1_000_000_000;

// The exact criterion names the backend sends (lib/grading.js and
// lib/gradingBank.js). If one is renamed there, this list must change too.
const GENERAL_NAMES = [
  'Topline revenue growth (long-term)',
  'Recent revenue growth (TTM)',
  'Net positive free cash flow',
  'Free cash flow growth (long-term)',
  'Recent free cash flow growth (TTM)',
];
const BANK_NAMES = [
  'Book value growth (long-term)',
  'Net income growth (long-term)',
  'Return on equity',
  'Return on assets',
  'Efficiency ratio (lower is better)',
];

describe('explainCriterion', () => {
  it('has a sentence for every criterion, whether it passed, failed or was N/A', () => {
    for (const name of [...GENERAL_NAMES, ...BANK_NAMES]) {
      for (const passed of [true, false, null]) {
        expect(explainCriterion({ name, passed, value: 2 * B, prior: B })).toMatch(/\.$/);
      }
    }
  });

  it('puts the formatted numbers in the sentence', () => {
    const sentence = explainCriterion({
      name: 'Topline revenue growth (long-term)', passed: true, value: 416 * B, prior: 366 * B,
    });
    expect(sentence).toBe('Revenue grew from $366.0B to $416.0B over the years we checked.');
  });

  // Free cash flow is jargon, so the first mention explains it.
  it('explains free cash flow in plain words', () => {
    const sentence = explainCriterion({ name: 'Net positive free cash flow', passed: true, value: 99 * B, prior: 0 });
    expect(sentence).toContain('the cash left over after paying for its operations and investments');
  });

  // Shrinking a loss isn't growth; the sentence should say why it failed.
  it('says why a still-negative free cash flow fails', () => {
    const sentence = explainCriterion({
      name: 'Free cash flow growth (long-term)', passed: false, value: -2 * B, prior: -4 * B,
    });
    expect(sentence).toContain("shrinking a loss doesn't count");
  });

  it('shows bank ratios as percentages against the typical bank', () => {
    const sentence = explainCriterion({
      name: 'Return on equity', passed: false, value: 0.067, prior: 0.105, format: 'percent',
    });
    expect(sentence).toContain('6.7%');
    expect(sentence).toContain('typical U.S. bank (10.5%)');
  });

  it('returns null for a criterion it does not know', () => {
    expect(explainCriterion({ name: 'Something new', passed: true })).toBeNull();
  });
});

describe('summarizeGrade', () => {
  const criteria = (passes) => passes.map((passed, i) => ({ name: `c${i}`, passed }));

  it('says how many checks passed and the letter that earns', () => {
    expect(summarizeGrade({ ticker: 'AAPL', grade: 'B', criteria: criteria([true, true, true, true, false]) }))
      .toBe('AAPL passed 4 of 5 checks, which earns a B.');
  });

  it('uses "an" before A and F', () => {
    expect(summarizeGrade({ ticker: 'X', grade: 'A', criteria: criteria([true, true, true, true, true]) }))
      .toContain('earns an A.');
    expect(summarizeGrade({ ticker: 'X', grade: 'F', criteria: criteria([false, false, false, false, false]) }))
      .toContain('earns an F.');
  });

  it('points out checks that could not be judged', () => {
    expect(summarizeGrade({ ticker: 'X', grade: 'C', criteria: criteria([true, true, true, null, false]) }))
      .toContain("One check couldn't be judged and counts as a miss.");
    expect(summarizeGrade({ ticker: 'X', grade: 'D', criteria: criteria([true, true, null, null, false]) }))
      .toContain("Two checks couldn't be judged and count as misses.");
  });

  it('names the bank model', () => {
    expect(summarizeGrade({ ticker: 'JPM', grade: 'B', model: 'bank', criteria: criteria([true, true, true, true, false]) }))
      .toBe('JPM passed 4 of 5 checks on the bank model, which earns a B.');
  });

  it('returns null for an N/A result', () => {
    expect(summarizeGrade({ ticker: 'X', grade: 'N/A', criteria: [] })).toBeNull();
  });
});

describe('explainSector', () => {
  const metric = (key, position, peers = 12) => ({ key, position, peers, value: 0.1, median: 0.1 });

  it('groups the metrics by where they sit against the median', () => {
    const context = {
      industry: 'Technology',
      metrics: [metric('revenueCagr', 'above'), metric('fcfMargin', 'above'), metric('fcfCagr', 'below')],
    };
    expect(explainSector(context)).toBe(
      "Compared with 12 Technology stocks we've graded, its revenue growth and free cash flow margin are above the median and its free cash flow growth is below the median."
    );
  });

  it('handles a single metric', () => {
    const context = { industry: 'Retail', metrics: [metric('fcfMargin', 'about', 9)] };
    expect(explainSector(context)).toBe(
      "Compared with 9 Retail stocks we've graded, its free cash flow margin is about the median."
    );
  });

  it('returns null with no comparison', () => {
    expect(explainSector(null)).toBeNull();
    expect(explainSector({ industry: 'Retail', metrics: [] })).toBeNull();
  });
});
