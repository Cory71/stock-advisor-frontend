// Helpers for showing which grading model produced a grade.
//
// Most stocks are graded on revenue and free cash flow. Banks have no free cash
// flow in the usual sense, so they're graded on a separate bank model (book
// value, net income, return on equity, return on assets, efficiency). The same
// letter means something different under each, so the pages say which model
// was used instead of letting a bank's "A" sit beside Apple's as if they matched.

export function isBankModel(result) {
  return result?.model === 'bank';
}

// Short label shown under a bank's grade. Null for the general model, which
// needs no label.
export function modelLabel(result) {
  return isBankModel(result) ? 'Bank model' : null;
}

// One-line explanation shown on a bank's grade page.
export const BANK_MODEL_NOTE =
  "Graded on the bank model. Banks don't have free cash flow in the usual sense, " +
  'so they are judged on book value and earnings growth, and on how their returns ' +
  'and costs compare with the typical U.S. bank.';

// Format a dollar figure: $451.2B, $99.5M, $1,234, or — when missing.
export function formatCurrency(n) {
  if (n == null) return '—';
  if (Math.abs(n) >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  return `$${n.toLocaleString()}`;
}

// Format a ratio as a percentage: 0.157 -> 15.7%, or — when missing.
export function formatPercent(n) {
  if (n == null) return '—';
  return `${(n * 100).toFixed(n < 0.02 ? 2 : 1)}%`;
}

// The line under a criterion. Bank ratios compare against the typical bank;
// everything else compares a figure with an earlier one.
//   percent:  "15.7% vs typical bank 10.5%"
//   currency: "$32.2B vs prior $25.1B — income statement"
export function describeCriterion(criterion) {
  if (criterion.format === 'percent') {
    return `${formatPercent(criterion.value)} vs typical bank ${formatPercent(criterion.prior)}`;
  }
  return `${formatCurrency(criterion.value)} vs prior ${formatCurrency(criterion.prior)} — ${criterion.source}`;
}

// Row names for the compare table: every criterion used by any compared stock,
// in first-seen order. Using only the first stock's list would leave a bank
// blank on every row when it's compared with a non-bank.
export function criteriaRows(results) {
  const names = [];
  for (const result of results) {
    if (result.error || !Array.isArray(result.criteria)) continue;
    for (const criterion of result.criteria) {
      if (!names.includes(criterion.name)) names.push(criterion.name);
    }
  }
  return names;
}
