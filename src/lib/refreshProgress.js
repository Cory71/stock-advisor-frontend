// Text for the watchlist's "Refresh all" button while it works through the rows.
// `done` is how many rows have finished, so the row in progress is done + 1.
//   { done: 0,  total: 30 } -> "Refreshing 1 of 30…"
//   { done: 11, total: 30 } -> "Refreshing 12 of 30…"
export function refreshLabel(progress) {
  if (!progress || progress.total === 0) return 'Refreshing…';
  const current = Math.min(progress.done + 1, progress.total);
  return `Refreshing ${current} of ${progress.total}…`;
}

// Message shown after a run where some rows couldn't be refreshed.
// Returns null when everything went through.
export function refreshFailureMessage(failed, total) {
  if (failed === 0) return null;
  if (failed === total) return "Couldn't refresh your watchlist right now. Please try again in a minute.";
  return `${failed} of ${total} couldn't be refreshed right now — the rest are up to date.`;
}
