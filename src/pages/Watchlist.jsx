// Watchlist page — lists the user's saved tickers, lets them add a new one,
// and remove existing ones. Each row also shows the grade at the time of
// adding plus the current grade, so the user can see upgrades/downgrades.

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Table, Alert, Spinner, Form, Button, InputGroup, Badge } from 'react-bootstrap';
import { apiFetch } from '../lib/apiFetch';
import { gradeColor, gradeChange, formatPrice } from '../lib/grade';
import { useAutoDismiss } from '../lib/useAutoDismiss';
import { usePageTitle } from '../lib/usePageTitle';

// Small reusable grade pill — uses the same colour scheme as the Grade Detail page.
function GradeBadge({ grade }) {
  if (!grade) return <span className="text-muted">—</span>;
  return <Badge bg={gradeColor(grade)}>{grade}</Badge>;
}

function Watchlist() {
  usePageTitle('Watchlist');

  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  // Add-form state lives alongside the list state.
  const [newTicker, setNewTicker]   = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [addInfo, setAddInfo]       = useState(null);

  // "Refresh all" state — true while re-grading, plus when it last finished.
  const [refreshing, setRefreshing]   = useState(false);
  const [refreshedAt, setRefreshedAt] = useState(null);

  // Banner auto-dismisses after 5s.
  useAutoDismiss(addInfo, setAddInfo);

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

  // Re-grade every ticker with fresh data (the backend bypasses its cache),
  // then swap in the updated rows and stamp the time. One row failing doesn't
  // stop the rest — the backend skips it.
  async function handleRefreshAll() {
    setRefreshing(true);
    setAddInfo(null);
    try {
      const data = await apiFetch('/api/watchlist/refresh', { method: 'POST' });
      setItems(data);
      setRefreshedAt(new Date());
    } catch (err) {
      setAddInfo({ variant: 'danger', message: err.message });
    } finally {
      setRefreshing(false);
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
        The "Current" grade is the most recent grade we have. Click "Refresh
        all" to update every row with the latest data.
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
        <>
        {/* Refresh-all toolbar — re-grades every row in one click */}
        <div className="d-flex align-items-center gap-3 mb-2">
          <Button
            variant="outline-primary"
            size="sm"
            onClick={handleRefreshAll}
            disabled={refreshing}
          >
            {refreshing ? (
              <>
                <Spinner as="span" animation="border" size="sm" className="me-1" />
                Refreshing all…
              </>
            ) : (
              'Refresh all'
            )}
          </Button>
          {refreshedAt && (
            <span className="text-muted small">
              Updated: {refreshedAt.toLocaleTimeString()}
            </span>
          )}
        </div>

        <Table hover responsive>
          <thead>
            <tr>
              <th>Ticker</th>
              {/* Lower-priority columns are hidden on phones (< 576px) so
                  the essential ones (Ticker, Current, Change, Remove) all
                  fit without horizontal scrolling. */}
              <th className="d-none d-sm-table-cell">Name</th>
              <th className="d-none d-sm-table-cell">Last price</th>
              <th className="d-none d-sm-table-cell">Added</th>
              <th className="d-none d-sm-table-cell text-center">Grade at add</th>
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
                  <td className="d-none d-sm-table-cell text-muted">{item.name || '—'}</td>
                  <td className="d-none d-sm-table-cell">{formatPrice(item.price, item.currency)}</td>
                  <td className="d-none d-sm-table-cell">{new Date(item.createdAt).toLocaleDateString()}</td>
                  <td className="d-none d-sm-table-cell text-center">
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
        </>
      )}
    </div>
  );
}

export default Watchlist;
