// What goes in a stock's PDF report, worked out from the same graded result
// the grade page shows. Plain data only — src/lib/gradePdf.js draws it — so
// every part of the report can be tested without a PDF library.

import { formatPrice } from './grade';
import { BANK_MODEL_NOTE, isBankModel, describeCriterion } from './gradeModel';
import { explainCriterion, summarizeGrade, explainSector } from './explainGrade';
import { comparisonHeading, describeMetric, positionLabel } from './sectorContext';
import {
  buildTrendSeries, buildBankTrendSeries, hasEnoughTrendData, missingYears, describeYears,
} from './chartData';

// Pass / Fail / N/A, as the grade page's badges say it.
function resultLabel(passed) {
  if (passed === true) return 'Pass';
  if (passed === false) return 'Fail';
  return 'N/A';
}

// "Oct 19, 2026, 3:15 PM". `timeZone` is only passed by tests.
function formatDateTime(value, timeZone) {
  if (!value) return null;
  return new Date(value).toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone,
  });
}

// The chart section, or null when there aren't two years to compare.
// Banks chart net income instead of free cash flow, as on the page.
function chartSection(result) {
  const bank = isBankModel(result);
  const series = bank ? buildBankTrendSeries(result.rawData) : buildTrendSeries(result.rawData);
  if (!hasEnoughTrendData(series)) return null;

  const gaps = missingYears(series);
  return {
    title: bank ? 'Revenue and net income' : 'Revenue and free cash flow',
    keys: bank ? ['revenue', 'netIncome'] : ['revenue', 'fcf'],
    labels: bank ? ['Revenue', 'Net income'] : ['Revenue', 'Free cash flow'],
    series,
    caption: gaps.length
      ? `Full-year figures from each annual report. ${describeYears(gaps)} ${gaps.length === 1 ? 'is' : 'are'} not shown — no usable annual report was available.`
      : 'Full-year figures from each annual report.',
  };
}

// The sector comparison as table rows, or null when there isn't one.
function sectorSection(context) {
  if (!context?.metrics?.length) return null;
  return {
    heading: comparisonHeading(context),
    rows: context.metrics.map((m) => [m.label, positionLabel(m.position), describeMetric(m)]),
    footnote: "For context only — this doesn't change the grade.",
  };
}

// Notes shown under the letter: why it couldn't be graded, the bank model,
// and a sector caveat — whichever apply, in the same order as the page.
function notesFor(result) {
  return [result.reason, isBankModel(result) ? BANK_MODEL_NOTE : null, result.note].filter(Boolean);
}

// result: the JSON from GET /api/grade/:ticker.
export function gradeReport(result, { timeZone } = {}) {
  const summary = summarizeGrade(result);
  const sectorSentence = explainSector(result.sectorContext);
  const graded = formatDateTime(result.gradedAt, timeZone);
  const price = result.price != null ? formatPrice(result.price, result.currency) : null;

  return {
    ticker: result.ticker,
    name: result.name || null,
    details: [price, graded && `Graded ${graded}`].filter(Boolean).join('  ·  '),
    grade: result.grade,
    notes: notesFor(result),
    summary: [summary, sectorSentence].filter(Boolean).join(' ') || null,
    sector: sectorSection(result.sectorContext),
    criteria: (result.criteria || []).map((c) => ({
      result: resultLabel(c.passed),
      name: c.name,
      explanation: [explainCriterion(c), describeCriterion(c)].filter(Boolean).join('\n'),
    })),
    chart: chartSection(result),
    // What the letter means, since a printed page has no "How the grade works" card.
    scale: 'One point per check passed: A = 5 · B = 4 · C = 3 · D = 2 · F = 0 or 1.',
    footer: 'StockGrader · Data from Finnhub. A quick health check from public filings, not investment advice.',
  };
}

// File name for the report, e.g. "NVDA-report-2026-10-19.pdf".
export function reportFileName(ticker, today = new Date()) {
  return `${ticker}-report-${today.toISOString().slice(0, 10)}.pdf`;
}
