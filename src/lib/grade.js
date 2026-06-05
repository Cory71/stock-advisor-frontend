// Pure helpers shared by the Grade, Watchlist, and Compare pages.
// Kept here so they can be unit-tested without rendering a component.

// Bootstrap colour variant for a letter grade.
export function gradeColor(grade) {
  switch (grade) {
    case 'A': return 'success';
    case 'B': return 'primary';
    case 'C': return 'warning';
    case 'D': return 'warning';
    case 'F': return 'danger';
    default:  return 'secondary';
  }
}

// Convert a letter grade to a number so two grades can be compared.
// Returns null for anything that isn't a real grade.
export function gradeValue(grade) {
  switch (grade) {
    case 'A': return 5;
    case 'B': return 4;
    case 'C': return 3;
    case 'D': return 2;
    case 'F': return 1;
    default:  return null;
  }
}

// Compare the added grade to the current grade and return a small descriptor
// the UI can render (label + symbol + colour variant). Returns null if either
// grade is missing — the UI shows a "—" instead.
export function gradeChange(added, current) {
  const a = gradeValue(added);
  const c = gradeValue(current);
  if (a == null || c == null) return null;
  if (c > a) return { label: 'Upgraded', symbol: '▲', variant: 'success' };
  if (c < a) return { label: 'Downgraded', symbol: '▼', variant: 'danger' };
  return { label: 'No change', symbol: '—', variant: 'secondary' };
}

// Format the price column — "$451.20 USD" if we have both, "$451.20" if no
// currency, "—" if we don't have a cached price for this ticker yet.
export function formatPrice(price, currency) {
  if (price == null) return '—';
  const value = `$${price.toFixed(2)}`;
  return currency ? `${value} ${currency}` : value;
}
