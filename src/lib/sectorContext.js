// Helpers for showing how a stock compares with others in its industry.
//
// The backend only sends a comparison when at least 8 stocks in the industry
// have been graded, and it always includes how many — so the page can show
// the peer count beside every comparison instead of a bare claim.

import { formatPercent } from './gradeModel';

// Badge text for where the stock sits against the industry median.
const POSITION_LABELS = {
  above: 'Above median',
  about: 'About median',
  below: 'Below median',
};

// Bootstrap colour for each position. "About" is neutral on purpose.
const POSITION_VARIANTS = {
  above: 'success',
  about: 'secondary',
  below: 'warning',
};

export function positionLabel(position) {
  return POSITION_LABELS[position] || '';
}

export function positionVariant(position) {
  return POSITION_VARIANTS[position] || 'secondary';
}

// Metrics can have different peer counts (a stock whose free cash flow growth
// can't be worked out still counts for the others). Headings use the largest;
// each metric line still shows its own.
export function largestPeerCount(context) {
  return Math.max(...context.metrics.map((m) => m.peers));
}

// Heading for the comparison, e.g. "Compared with 12 Technology stocks".
export function comparisonHeading(context) {
  return `Compared with ${largestPeerCount(context)} ${context.industry} stocks`;
}

// One metric's line, e.g. "18.9% vs median 10.0% (12 stocks)".
export function describeMetric(metric) {
  return `${formatPercent(metric.value)} vs median ${formatPercent(metric.median)} (${metric.peers} stocks)`;
}
