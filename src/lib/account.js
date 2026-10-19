// Helpers for the Account page.

// True when the email typed to confirm a delete matches the account's email.
// Ignores case and surrounding spaces — the server applies the same rule.
export function emailMatches(typed, accountEmail) {
  if (typeof typed !== 'string' || !accountEmail) return false;
  return typed.trim().toLowerCase() === accountEmail.toLowerCase();
}

// File name for a data export, e.g. "stockgrader-data-2026-10-19.json".
export function exportFileName(today = new Date()) {
  return `stockgrader-data-${today.toISOString().slice(0, 10)}.json`;
}

// Save an object as a .json file through the browser's normal download.
export function downloadJson(data, fileName) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
