import { describe, it, expect } from 'vitest';
import {
  isBankModel, modelLabel, formatCurrency, formatPercent,
  describeCriterion, criteriaRows,
} from './gradeModel';

describe('modelLabel', () => {
  it('labels bank-model grades', () => {
    expect(isBankModel({ model: 'bank' })).to.equal(true);
    expect(modelLabel({ model: 'bank' })).to.equal('Bank model');
  });

  it('adds no label for the general model or older results without one', () => {
    expect(modelLabel({ model: 'general' })).to.equal(null);
    expect(modelLabel({})).to.equal(null);
  });
});

describe('formatting', () => {
  it('formats dollars the way the grade page always has', () => {
    expect(formatCurrency(32_240_000_000)).to.equal('$32.2B');
    expect(formatCurrency(-1_700_000_000)).to.equal('$-1.7B');
    expect(formatCurrency(null)).to.equal('—');
  });

  it('shows small ratios with two decimals so 0.99% and 1.00% stay distinct', () => {
    expect(formatPercent(0.157)).to.equal('15.7%');
    expect(formatPercent(0.0099)).to.equal('0.99%');
    expect(formatPercent(null)).to.equal('—');
  });
});

describe('describeCriterion', () => {
  it('describes a bank ratio against the typical bank', () => {
    const text = describeCriterion({ format: 'percent', value: 0.157, prior: 0.105 });
    expect(text).to.equal('15.7% vs typical bank 10.5%');
  });

  it('describes a dollar criterion as before', () => {
    const text = describeCriterion({ value: 32.2e9, prior: 25.1e9, source: 'income statement' });
    expect(text).to.equal('$32.2B vs prior $25.1B — income statement');
  });
});

describe('criteriaRows', () => {
  const apple = { criteria: [{ name: 'Revenue growth' }, { name: 'Free cash flow' }] };
  const jpm = { criteria: [{ name: 'Return on equity' }, { name: 'Free cash flow' }] };

  it('includes every criterion from every stock, once, in first-seen order', () => {
    expect(criteriaRows([apple, jpm])).to.deep.equal(['Revenue growth', 'Free cash flow', 'Return on equity']);
  });

  it('skips stocks that failed to load', () => {
    expect(criteriaRows([{ error: 'nope' }, jpm])).to.deep.equal(['Return on equity', 'Free cash flow']);
  });
});
