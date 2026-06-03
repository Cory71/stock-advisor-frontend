// Watchlist page — lists the user's saved tickers, lets them add a new one,
// and remove existing ones. Each row also shows the grade at the time of
// adding plus the current grade, so the user can see upgrades/downgrades.

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Table, Alert, Spinner, Form, Button, InputGroup, Badge } from 'react-bootstrap';
import { apiFetch } from '../lib/apiFetch';

// Bootstrap colour for a letter grade — matches the Grade Detail page.
function gradeColor(grade) {
  switch (grade) {
    case 'A': return 'success';
    case 'B': return 'primary';
    case 'C': return 'warning';
    case 'D': return 'warning';
    case 'F': return 'danger';
    default:  return 'secondary';
  }
}

// Convert a letter grade to a number so we can compare two grades.
function gradeValue(grade) {
  switch (grade) {
    case 'A': return 5;
    case 'B': return 4;
    case 'C': return 3;
    case 'D': return 2;
    case 'F': return 1;
    default:  return null;
  }
}

// Compare the added grade to the current grade and pick a label + colour.
function gradeChange(added, current) {
  const a = gradeValue(added);
  const c = gradeValue(current);
  if (a == null || c == null) return null;
  if (c > a) return { label: 'Upgraded', symbol: '▲', variant: 'success' };
  if (c < a) return { label: 'Downgraded', symbol: '▼', variant: 'danger' };
  return { label: 'No change', symbol: '—', variant: 'secondary' };
}

// Small reusable grade pill — uses the same colour scheme as the Grade Detail page.
function GradeBadge({ grade }) {
  if (!grade) return <span className="text-muted">—</span>;
  return <Badge bg={gradeColor(grade)}>{grade}</Badge>;
}

// Format the price column — "$451.20 USD" if we have both, "$451.20" if no
// currency, "—" if we don't have a cached price for this ticker yet.
function formatPrice(price, currency) {
  if (price == null) return '—';
  const value = `$${price.toFixed(2)}`;
  return currency ? `${value} ${currency}` : value;
}

function Watchlist() {
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  // Add-form state lives alongside the list state.
  const [newTicker, setNewTicker]   = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [addInfo, setAddInfo]       = useState(null);

  // Load the user's watchlist on mount.
  useEffect(() => {
    loadWatchlist();
  }, []);

  async function loadWatchlist() {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch('/api/watchlist');
      setItems(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(e) {
    e.preventDefault();
    // Trim but don't uppercase — the backend handles names ("Microsoft") and
    // returns the canonical ticker, which we use for the success message.
    const cleaned = newTicker.trim();
    if (!cleaned) return;

    setSubmitting(true);
    setAddInfo(null);
    try {
      const created = await apiFetch('/api/watchlist', {
        method: 'POST',
        body: JSON.stringify({ ticker: cleaned })
      });
      setNewTicker('');
      setAddInfo({ variant: 'success', message: `${created.ticker} added.` });
      await loadWatchlist();
    } catch (err) {
      setAddInfo({ variant: 'danger', message: err.message });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRemove(ticker) {
    try {
      await apiFetch(`/api/watchlist/${ticker}`, { method: 'DELETE' });
      // Drop the row from local state — no need to re-fetch.
      setItems((current) => current.filter((item) => item.ticker !== ticker));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <h1>Your watchlist</h1>
      <p className="text-muted">
        The "Current" grade reflects the latest cached grade. To refresh a
        ticker, open its page from the Ticker column.
      </p>

      {/* Add-ticker form */}
      <Form onSubmit={handleAdd} className="mb-3">
        <InputGroup style={{ maxWidth: 400 }}>
          <Form.Control
            type="text"
            placeholder="e.g. MSFT or Microsoft"
            value={newTicker}
            onChange={(e) => setNewTicker(e.target.value)}
            aria-label="Ticker or company name"
            disabled={submitting}
          />
          <Button type="submit" variant="primary" disabled={submitting}>
            {submitting ? 'Adding…' : 'Add'}
          </Button>
        </InputGroup>
      </Form>

      {addInfo && (
        <Alert
          variant={addInfo.variant}
          dismissible
          onClose={() => setAddInfo(null)}
        >
          {addInfo.message}
        </Alert>
      )}

      {/* Loading state */}
      {loading && (
        <p>
          <Spinner animation="border" size="sm" className="me-2" />
          Loading your watchlist…
        </p>
      )}

      {/* Error state */}
      {!loading && error && (
        <Alert variant="danger">{error}</Alert>
      )}

      {/* Empty state */}
      {!loading && !error && items.length === 0 && (
        <Alert variant="secondary">
          Your watchlist is empty. Add a ticker above, or{' '}
          <Link to="/">grade a stock</Link> and save it from there.
        </Alert>
      )}

      {/* Happy path — table of saved tickers */}
      {!loading && !error && items.length > 0 && (
        <Table hover responsive>
          <thead>
            <tr>
              <th>Ticker</th>
              <th>Name</th>
              <th>Last price</th>
              <th>Added</th>
              <th className="text-center">Grade at add</th>
              <th className="text-center">Current</th>
              <th>Change</th>
              <th aria-label="Remove" />
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const change = gradeChange(item.gradeAtAdd, item.currentGrade);
              return (
                <tr key={item._id}>
                  <td>
                    <Link to={`/grade/${item.ticker}`}>{item.ticker}</Link>
                  </td>
                  <td className="text-muted">{item.name || '—'}</td>
                  <td>{formatPrice(item.price, item.currency)}</td>
                  <td>{new Date(item.createdAt).toLocaleDateString()}</td>
                  <td className="text-center">
                    <GradeBadge grade={item.gradeAtAdd} />
                  </td>
                  <td className="text-center">
                    <GradeBadge grade={item.currentGrade} />
                  </td>
                  <td>
                    {change ? (
                      <span className={`text-${change.variant}`}>
                        {change.symbol} {change.label}
                      </span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td className="text-end">
                    <Button
                      size="sm"
                      variant="outline-danger"
                      onClick={() => handleRemove(item.ticker)}
                    >
                      Remove
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      )}
    </div>
  );
}

export default Watchlist;
