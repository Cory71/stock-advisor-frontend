// Plain-English explanations for a grade: one sentence per criterion, a
// one-line summary, and a sentence about how the stock compares with its
// industry. Pure functions, so every wording can be tested.
//
// Terms a beginner might not know (free cash flow, book value, return on
// equity, ...) are explained inside the sentence the first time they appear.

import { formatCurrency, formatPercent } from './gradeModel';
import { comparisonHeading } from './sectorContext';

// ---------- One sentence per criterion ----------

// Each entry turns a criterion into a sentence for pass, fail and N/A.
// `v` is the criterion's value and `p` its prior (the number it's compared
// with), both already formatted. `raw` is the unformatted value, for wording
// that depends on whether it's a loss.
const SENTENCES = {
  // General model
  'Topline revenue growth (long-term)': {
    pass: ({ v, p }) => `Revenue grew from ${p} to ${v} over the years we checked.`,
    fail: ({ v, p }) => `Revenue went from ${p} to ${v} over the years we checked, so it didn't grow.`,
    na: () => "There weren't enough yearly revenue figures to check long-term growth.",
  },
  'Recent revenue growth (TTM)': {
    pass: ({ v, p }) => `Revenue over the last twelve months (${v}) is ahead of the latest full year (${p}), so growth is continuing.`,
    fail: ({ v, p }) => `Revenue over the last twelve months (${v}) is not ahead of the latest full year (${p}).`,
    na: () => "Recent quarterly figures weren't available, so recent growth couldn't be checked.",
  },
  'Net positive free cash flow': {
    pass: ({ v }) => `The company produced ${v} of free cash flow — the cash left over after paying for its operations and investments.`,
    fail: ({ v }) => `Free cash flow — the cash left over after paying for operations and investments — was ${v}, so the company spent more cash than it brought in.`,
    na: () => "Free cash flow — the cash left over after paying for operations and investments — couldn't be worked out from the filings.",
  },
  'Free cash flow growth (long-term)': {
    pass: ({ v, p }) => `Free cash flow grew from ${p} to ${v} over the years we checked.`,
    fail: ({ v, p, raw }) => (raw <= 0
      ? `Free cash flow ended at ${v}. It has to be growing and above zero to pass, and shrinking a loss doesn't count.`
      : `Free cash flow went from ${p} to ${v} over the years we checked, so it didn't grow.`),
    na: () => "There weren't enough yearly free cash flow figures to check long-term growth.",
  },
  'Recent free cash flow growth (TTM)': {
    pass: ({ v, p }) => `Free cash flow over the last twelve months (${v}) is ahead of the latest full year (${p}).`,
    fail: ({ v, p, raw }) => (raw <= 0
      ? `Free cash flow over the last twelve months was ${v}, so the company is currently spending more cash than it brings in.`
      : `Free cash flow over the last twelve months (${v}) is not ahead of the latest full year (${p}).`),
    na: () => "Recent quarterly figures weren't available, so recent free cash flow growth couldn't be checked.",
  },

  // Bank model
  'Book value growth (long-term)': {
    pass: ({ v, p }) => `Book value — what the bank would be worth if it sold everything and paid its debts — grew from ${p} to ${v}.`,
    fail: ({ v, p }) => `Book value — what the bank would be worth if it sold everything and paid its debts — went from ${p} to ${v}, so it didn't grow.`,
    na: () => "Book value — what the bank would be worth if it sold everything and paid its debts — couldn't be read from the filings.",
  },
  'Net income growth (long-term)': {
    pass: ({ v, p }) => `Profit grew from ${p} to ${v} over the years we checked.`,
    fail: ({ v, p, raw }) => (raw <= 0
      ? `The bank made a loss of ${v} in its latest year.`
      : `Profit went from ${p} to ${v} over the years we checked, so it didn't grow.`),
    na: () => "Profit figures couldn't be read from the filings.",
  },
  'Return on equity': {
    pass: ({ v, p }) => `Return on equity — profit as a share of the shareholders' money — was ${v}, in line with or better than the typical U.S. bank (${p}).`,
    fail: ({ v, p }) => `Return on equity — profit as a share of the shareholders' money — was ${v}, clearly below the typical U.S. bank (${p}).`,
    na: () => "Return on equity — profit as a share of the shareholders' money — couldn't be worked out.",
  },
  'Return on assets': {
    pass: ({ v, p }) => `Return on assets — profit as a share of everything the bank owns — was ${v}, in line with or better than the typical U.S. bank (${p}).`,
    fail: ({ v, p }) => `Return on assets — profit as a share of everything the bank owns — was ${v}, clearly below the typical U.S. bank (${p}).`,
    na: () => 'Return on assets — profit as a share of everything the bank owns — couldn\'t be worked out.',
  },
  'Efficiency ratio (lower is better)': {
    pass: ({ v, p }) => `The bank spent ${v} of its revenue on running costs, in line with or better than the typical U.S. bank (${p}). Lower is better here.`,
    fail: ({ v, p }) => `The bank spent ${v} of its revenue on running costs, clearly more than the typical U.S. bank (${p}). Lower is better here.`,
    na: () => "The share of revenue spent on running costs couldn't be worked out.",
  },
};

// Format a criterion's numbers the way it says it should be shown.
function formatFor(criterion, n) {
  return criterion.format === 'percent' ? formatPercent(n) : formatCurrency(n);
}

// Which wording to use: 'pass', 'fail' or 'na'.
function outcome(passed) {
  if (passed === true) return 'pass';
  if (passed === false) return 'fail';
  return 'na';
}

// One plain-English sentence for a criterion, or null for a criterion this
// file doesn't know (the page then shows only the numbers).
export function explainCriterion(criterion) {
  const sentences = SENTENCES[criterion.name];
  if (!sentences) return null;
  return sentences[outcome(criterion.passed)]({
    v: formatFor(criterion, criterion.value),
    p: formatFor(criterion, criterion.prior),
    raw: criterion.value,
  });
}

// ---------- One-line summary ----------

const NUMBER_WORDS = ['No', 'One', 'Two', 'Three', 'Four', 'Five'];

// "an A" / "an F" but "a B".
function withArticle(grade) {
  return grade === 'A' || grade === 'F' ? `an ${grade}` : `a ${grade}`;
}

// e.g. "AAPL passed 4 of 5 checks, which earns a B. One check couldn't be
// judged and counts as a miss." Null for an N/A result, which already shows
// its own reason.
export function summarizeGrade(result) {
  const criteria = result?.criteria || [];
  if (!criteria.length || result.grade === 'N/A') return null;

  const passed = criteria.filter((c) => c.passed === true).length;
  const unjudged = criteria.filter((c) => c.passed == null).length;
  const model = result.model === 'bank' ? ' on the bank model' : '';

  let summary = `${result.ticker} passed ${passed} of ${criteria.length} checks${model}, which earns ${withArticle(result.grade)}.`;
  if (unjudged === 1) summary += " One check couldn't be judged and counts as a miss.";
  if (unjudged > 1) summary += ` ${NUMBER_WORDS[unjudged] || unjudged} checks couldn't be judged and count as misses.`;
  return summary;
}

// ---------- Sector sentence ----------

// Short names for the metrics, used inside a sentence.
const METRIC_PHRASES = {
  revenueCagr: 'revenue growth',
  fcfMargin: 'free cash flow margin',
  fcfCagr: 'free cash flow growth',
};

// "a", "a and b", "a, b and c".
function joinWords(words) {
  if (words.length <= 1) return words.join('');
  return `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`;
}

// e.g. "Compared with 12 Technology stocks, its revenue growth is above the
// median and its free cash flow margin is below it." Null with no comparison.
export function explainSector(context) {
  if (!context?.metrics?.length) return null;

  const groups = ['above', 'about', 'below']
    .map((position) => ({
      position,
      names: context.metrics.filter((m) => m.position === position).map((m) => METRIC_PHRASES[m.key] || m.label),
    }))
    .filter((group) => group.names.length);

  const clauses = groups.map(({ position, names }) => {
    const verb = names.length > 1 ? 'are' : 'is';
    const where = position === 'about' ? 'about the median' : `${position} the median`;
    return `its ${joinWords(names)} ${verb} ${where}`;
  });

  return `${comparisonHeading(context)} we've graded, ${joinWords(clauses)}.`;
}
