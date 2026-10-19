// Helpers for the Account page.

import { gradeChange } from './grade';

// True when the email typed to confirm a delete matches the account's email.
// Ignores case and surrounding spaces — the server applies the same rule.
export function emailMatches(typed, accountEmail) {
  if (typeof typed !== 'string' || !accountEmail) return false;
  return typed.trim().toLowerCase() === accountEmail.toLowerCase();
}

// File name for a data export, e.g. "stockgrader-data-2026-10-19.pdf".
export function exportFileName(today = new Date()) {
  return `stockgrader-data-${today.toISOString().slice(0, 10)}.pdf`;
}

// ---------- What goes in the data report ----------

// "Oct 19, 2026", or with the time: "Oct 19, 2026, 3:15 PM".
// `timeZone` is only passed by tests; real users see their own local time.
function formatDate(value, { withTime = false, timeZone } = {}) {
  if (!value) return '—';
  const options = { year: 'numeric', month: 'short', day: 'numeric', timeZone };
  if (withTime) Object.assign(options, { hour: 'numeric', minute: '2-digit' });
  return new Date(value).toLocaleString('en-US', options);
}

// "Email and password", "Google", or both.
function describeSignIn({ password, google } = {}) {
  const methods = [];
  if (password) methods.push('Email and password');
  if (google) methods.push('Google');
  return methods.join(' and ') || '—';
}

// Turn the export from GET /api/auth/me/export into the report's content:
// a title, the export date, and one section per kind of data. Each section
// is a small table, or a sentence when there's nothing to list. Kept apart
// from the PDF drawing so it can be tested without a PDF library.
export function dataReport(data, { timeZone } = {}) {
  const account = data.account || {};
  const watchlist = data.watchlist || [];
  const history = data.searchHistory || [];

  return {
    title: 'Your StockGrader data',
    exportedOn: `Exported ${formatDate(data.exportedAt, { withTime: true, timeZone })}`,
    sections: [
      {
        heading: 'Account',
        head: null,
        rows: [
          ['Email', account.email || '—'],
          ['Display name', account.displayName || 'Not set'],
          ['Account created', formatDate(account.createdAt, { timeZone })],
          ['Sign-in methods', describeSignIn(account.signInMethods)],
        ],
      },
      {
        heading: `Watchlist (${watchlist.length})`,
        head: ['Ticker', 'Grade when added', 'Current grade', 'Change', 'Added on'],
        rows: watchlist.map((item) => [
          item.ticker,
          item.gradeWhenAdded || '—',
          item.currentGrade || '—',
          // Same Upgraded / Downgraded / No change wording as the watchlist page.
          gradeChange(item.gradeWhenAdded, item.currentGrade)?.label || '—',
          formatDate(item.addedAt, { timeZone }),
        ]),
        empty: 'Your watchlist is empty.',
      },
      {
        heading: `Search history (${history.length})`,
        head: ['Ticker', 'Searched on'],
        rows: history.map((item) => [
          item.ticker, formatDate(item.searchedAt, { withTime: true, timeZone }),
        ]),
        empty: 'No searches saved.',
      },
    ],
  };
}
