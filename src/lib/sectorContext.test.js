import { describe, it, expect } from 'vitest';
import { comparisonHeading, describeMetric, positionLabel, positionVariant } from './sectorContext';

const context = {
  industry: 'Technology',
  metrics: [
    { key: 'revenueCagr', value: 0.189, median: 0.1, peers: 12, position: 'above' },
    { key: 'fcfCagr', value: 0.05, median: 0.11, peers: 10, position: 'below' },
  ],
};

describe('sectorContext helpers', () => {
  // Metrics can have different counts; the heading uses the largest.
  it('headlines the largest peer count', () => {
    expect(comparisonHeading(context)).toBe('Compared with 12 Technology stocks');
  });

  // The peer count is always shown beside the comparison.
  it('describes a metric with its own peer count', () => {
    expect(describeMetric(context.metrics[1])).toBe('5.0% vs median 11.0% (10 stocks)');
  });

  it('shows negative growth with one decimal place', () => {
    expect(describeMetric({ value: -0.109, median: 0.02, peers: 8 })).toBe('-10.9% vs median 2.0% (8 stocks)');
  });

  it('turns a position into a label and a colour', () => {
    expect(positionLabel('above')).toBe('Above median');
    expect(positionVariant('about')).toBe('secondary');
    expect(positionVariant('below')).toBe('warning');
  });
});
