// Grade Detail page — fetches a graded result for the ticker in the URL,
// shows the letter grade as a big card, lists the 5 criteria with the actual
// numbers, and lets the user add the ticker to their watchlist.

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, Alert, Spinner, Button, Badge } from 'react-bootstrap';
import { apiFetch } from '../lib/apiFetch';
import { useAuth } from '../context/AuthContext';
import { useAutoDismiss } from '../lib/useAutoDismiss';
import { usePageTitle } from '../lib/usePageTitle';

// Pick a Bootstrap colour variant for the letter grade.
function gradeColor(grade) {
  switch (grade) {
    case 'A': return 'success';
    case 'B': return 'primary';
    case 'C': return 'warning';
    case 'D': return 'warning';
    case 'F': return 'danger';
    default:  return 'secondary'; // N/A or anything unexpected
  }
}

// Format a dollar figure into something readable ($451B, $99.5M, $1,234, —).
function formatNumber(n) {
  if (n == null) return '—';
  if (Math.abs(n) >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (Math.abs(n) >= 1_000_000)     return `$${(n / 1_000_000).toFixed(1)}M`;
  return `$${n.toLocaleString()}`;
}

// Format a per-share price like "$451.20 USD" — always 2 decimal places.
// Currency code is appended so prices on non-US exchanges (e.g. SHOP.TO is
// quoted in CAD) aren't mistaken for USD.
function formatPrice(n, currency) {
  if (n == null) return null;
  const value = `$${n.toFixed(2)}`;
  return currency ? `${value} ${currency}` : value;
}

// Map a criterion's pass state to a Bootstrap badge label + color.
function passBadge(passed) {
  if (passed === true)  return { variant: 'success',   label: 'Pass' };
  if (passed === false) return { variant: 'danger',    label: 'Fail' };
  return                       { variant: 'secondary', label: 'N/A'  };
}

function GradeDetail() {
  const { ticker } = useParams();
  const upper = ticker?.toUpperCase();
  const { user } = useAuth();

  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  // Add-to-watchlist UI state lives next to the result.
  const [adding, setAdding]     = useState(false);
  const [addInfo, setAddInfo]   = useState(null); // { variant, message } or null

  // Banner auto-dismisses after 5s so the user doesn't have to click the X.
  useAutoDismiss(addInfo, setAddInfo);

  // Tab title shows the canonical ticker once data loads; falls back to the
  // URL fragment while the request is in flight (e.g. "MICROSOFT" briefly
  // until it resolves to "MSFT").
  usePageTitle(data?.ticker || upper);

  // Fetch the graded result when the ticker changes.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    setData(null);
    setAddInfo(null);

    apiFetch(`/api/grade/${upper}`)
      .then((res) => { if (!cancelled) setData(res); })
      .catch((err) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [upper]);

  async function handleAddToWatchlist() {
    setAdding(true);
    setAddInfo(null);
    try {
      // Prefer the canonical ticker from the graded data. If the user landed
      // here via a name search (URL like /grade/Apple), `upper` is just the
      // uppercased URL fragment ("APPLE") — sending that to /api/watchlist
      // would fail because the backend can't grade "APPLE".
      const tickerToAdd = data?.ticker || upper;
      await apiFetch('/api/watchlist', {
        method: 'POST',
        body: JSON.stringify({ ticker: tickerToAdd })
      });
      setAddInfo({ variant: 'success', message: `${tickerToAdd} added to your watchlist.` });
    } catch (err) {
      setAddInfo({ variant: 'danger', message: err.message });
    } finally {
      setAdding(false);
    }
  }

  // Loading state
  if (loading) {
    return (
      <div>
        <h1>{upper}</h1>
        <p>
          <Spinner animation="border" size="sm" className="me-2" />
          Grading {upper}…
        </p>
      </div>
    );
  }

  // Error state — not logged in: show a friendly prompt instead of the raw
  // "Missing or invalid token" backend message. The giant ticker heading is
  // hidden because we can't actually grade it yet.
  if (error && !user) {
    return (
      <div>
        <Alert variant="info">
          <Alert.Heading className="h5">Please log in to grade stocks</Alert.Heading>
          <p className="mb-3">
            Grading is only available to signed-in users. It's free and takes a few seconds.
          </p>
          <div className="d-flex gap-2">
            <Link to="/login" className="btn btn-primary btn-sm">Log in</Link>
            <Link to="/signup" className="btn btn-outline-primary btn-sm">Sign up</Link>
          </div>
        </Alert>
      </div>
    );
  }

  // Error state — logged in but something else went wrong (e.g. stock not found).
  if (error) {
    return (
      <div>
        <h1>{upper}</h1>
        <Alert variant="danger">{error}</Alert>
      </div>
    );
  }

  // Happy path — we have a graded result.
  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <div>
          <div className="d-flex align-items-baseline gap-3 flex-wrap">
            <h1 className="mb-0">{data.ticker || upper}</h1>
            {data.price != null && (
              <span className="h3 text-muted mb-0">{formatPrice(data.price, data.currency)}</span>
            )}
          </div>
          {data.name && <p className="text-muted mb-0">{data.name}</p>}
        </div>
        <Button onClick={handleAddToWatchlist} disabled={adding} variant="outline-primary">
          {adding ? 'Adding…' : 'Add to watchlist'}
        </Button>
      </div>

      {addInfo && (
        <Alert variant={addInfo.variant}>{addInfo.message}</Alert>
      )}

      {/* Big letter-grade card */}
      <Card
        className={`text-center mb-4 border-${gradeColor(data.grade)}`}
        style={{ maxWidth: 220 }}
      >
        <Card.Body>
          <div className={`display-1 fw-bold text-${gradeColor(data.grade)}`}>
            {data.grade}
          </div>
        </Card.Body>
      </Card>

      {/* N/A reason explains why we couldn't grade */}
      {data.reason && (
        <Alert variant="secondary">{data.reason}</Alert>
      )}

      {/* Sector caveat shown alongside a real grade when free cash flow is only
          a rough proxy for the business (REITs, insurers, utilities) */}
      {data.note && (
        <Alert variant="warning">{data.note}</Alert>
      )}

      {/* Criteria — only render when we have any */}
      {Array.isArray(data.criteria) && data.criteria.length > 0 && (
        <>
          <h2 className="h5">Criteria</h2>
          <ul className="list-unstyled">
            {data.criteria.map((c, i) => {
              const badge = passBadge(c.passed);
              return (
                <li key={i} className="mb-3">
                  <div className="d-flex align-items-center gap-2">
                    <Badge bg={badge.variant}>{badge.label}</Badge>
                    <strong>{c.name}</strong>
                  </div>
                  <div className="text-muted small ms-2">
                    {formatNumber(c.value)} vs prior {formatNumber(c.prior)} — {c.source}
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}

      {data.gradedAt && (
        <p className="text-muted small">
          Graded at: {new Date(data.gradedAt).toLocaleString()}
          {data.cached && ' (from cache)'}
        </p>
      )}
    </div>
  );
}

export default GradeDetail;
