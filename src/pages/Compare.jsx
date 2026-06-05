// Compare page — enter 2 or 3 tickers (or company names), see their grades
// side by side. Two view modes:
//   - Cards: one card per stock with the full criteria list inside it.
//   - Table: criteria as rows, stocks as columns — easier to spot where they differ.

import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Form, Button, Card, Alert, Spinner, Badge, Row, Col, Table, ButtonGroup
} from 'react-bootstrap';
import { apiFetch } from '../lib/apiFetch';
import { useAutoDismiss } from '../lib/useAutoDismiss';
import { usePageTitle } from '../lib/usePageTitle';

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

// Map a criterion's pass state to a Bootstrap badge label + colour.
function passBadge(passed) {
  if (passed === true)  return { variant: 'success',   label: 'Yes' };
  if (passed === false) return { variant: 'danger',    label: 'No'  };
  return                       { variant: 'secondary', label: 'N/A' };
}

// Format a per-share price like "$451.20 USD". Returns null if no price.
function formatPrice(price, currency) {
  if (price == null) return null;
  const value = `$${price.toFixed(2)}`;
  return currency ? `${value} ${currency}` : value;
}

// Cards view — original layout, one card per result with the criteria inside.
function CompareCards({ results }) {
  return (
    <Row className="g-3">
      {results.map((r, i) => (
        <Col key={i} xs={12} md={results.length === 2 ? 6 : 4}>
          <Card className={r.error ? 'border-secondary' : `border-${gradeColor(r.grade)}`}>
            <Card.Header className="text-center">
              {r.error ? (
                <strong>{r.ticker}</strong>
              ) : (
                <Link to={`/grade/${r.ticker}`} className="text-decoration-none">
                  <strong>{r.ticker}</strong>
                  {r.name && <div className="small text-muted">{r.name}</div>}
                  {r.price != null && (
                    <div className="small text-muted">{formatPrice(r.price, r.currency)}</div>
                  )}
                </Link>
              )}
            </Card.Header>
            <Card.Body>
              {r.error ? (
                <div className="text-center">
                  <div className="display-2 text-muted">—</div>
                  <small className="text-muted">{r.error}</small>
                </div>
              ) : (
                <>
                  <div className={`display-1 fw-bold text-center text-${gradeColor(r.grade)}`}>
                    {r.grade}
                  </div>
                  <ul className="list-unstyled mt-3 mb-0">
                    {r.criteria.map((c, j) => {
                      const b = passBadge(c.passed);
                      return (
                        <li key={j} className="small d-flex align-items-start gap-2 mb-1">
                          <Badge bg={b.variant}>{b.label}</Badge>
                          <span>{c.name}</span>
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      ))}
    </Row>
  );
}

// Table view — criteria as rows, stocks as columns. Makes side-by-side
// differences pop ("everyone passes except GOOG on this one").
function CompareTable({ results }) {
  // Use the first successful result's criteria list as the row template.
  // If a stock errored out it just shows "—" in every criteria cell.
  const firstOk = results.find((r) => !r.error);
  if (!firstOk) {
    return <Alert variant="secondary">No stocks could be graded.</Alert>;
  }
  const criteriaNames = firstOk.criteria.map((c) => c.name);

  return (
    <Table responsive bordered className="align-middle">
      <thead>
        <tr>
          <th style={{ width: '30%' }}>Criterion</th>
          {results.map((r, i) => (
            <th key={i} className="text-center">
              {r.error ? (
                <div>
                  <strong>{r.ticker}</strong>
                  <div className="small text-muted">{r.error}</div>
                </div>
              ) : (
                <Link to={`/grade/${r.ticker}`} className="text-decoration-none">
                  <strong>{r.ticker}</strong>
                  {r.name && <div className="small text-muted">{r.name}</div>}
                  {r.price != null && (
                    <div className="small text-muted">{formatPrice(r.price, r.currency)}</div>
                  )}
                  <div className={`h3 fw-bold mb-0 mt-2 text-${gradeColor(r.grade)}`}>
                    {r.grade}
                  </div>
                </Link>
              )}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {criteriaNames.map((name, i) => (
          <tr key={i}>
            <td>{name}</td>
            {results.map((r, j) => {
              if (r.error) {
                return <td key={j} className="text-center text-muted">—</td>;
              }
              const criterion = r.criteria.find((c) => c.name === name);
              const b = passBadge(criterion?.passed);
              return (
                <td key={j} className="text-center">
                  <Badge bg={b.variant}>{b.label}</Badge>
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </Table>
  );
}

function Compare() {
  usePageTitle('Compare');

  // Three input slots — third one is optional.
  const [tickers, setTickers] = useState(['AAPL', 'MSFT', 'GOOG']);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  // Which layout to show after results come back.
  const [view, setView]       = useState('cards');

  // Error banner auto-dismisses after 5s.
  useAutoDismiss(error, setError);

  function handleTickerChange(i, value) {
    const next = [...tickers];
    next[i] = value;
    setTickers(next);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    // Trim only — let the backend handle name → ticker resolution.
    const cleaned = tickers.map((t) => t.trim()).filter(Boolean);

    if (cleaned.length < 2 || cleaned.length > 3) {
      setError('Enter 2 or 3 tickers or company names.');
      return;
    }

    setError('');
    setLoading(true);
    setResults(null);
    try {
      const data = await apiFetch(`/api/compare?tickers=${cleaned.join(',')}`);
      setResults(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1>Compare</h1>
      <p>Grade 2 or 3 stocks and see them side by side.</p>

      <Form onSubmit={handleSubmit} className="mb-4">
        <Row className="g-2 align-items-end">
          {[0, 1, 2].map((i) => (
            <Col key={i} xs={12} sm={4} md={3}>
              <Form.Label>Stock {i + 1}</Form.Label>
              <Form.Control
                type="text"
                value={tickers[i] || ''}
                onChange={(e) => handleTickerChange(i, e.target.value)}
                placeholder={i < 2 ? 'required' : 'optional'}
              />
            </Col>
          ))}
          <Col xs={12} sm="auto">
            <Button type="submit" disabled={loading} variant="primary">
              {loading ? 'Comparing…' : 'Compare'}
            </Button>
          </Col>
        </Row>
      </Form>

      {error && <Alert variant="danger">{error}</Alert>}

      {loading && (
        <p>
          <Spinner animation="border" size="sm" className="me-2" />
          Comparing stocks…
        </p>
      )}

      {!loading && results && (
        <>
          {/* View toggle — only relevant once we have results to show */}
          <div className="d-flex justify-content-end mb-3">
            <ButtonGroup size="sm" aria-label="View mode">
              <Button
                variant={view === 'cards' ? 'primary' : 'outline-primary'}
                onClick={() => setView('cards')}
              >
                Cards
              </Button>
              <Button
                variant={view === 'table' ? 'primary' : 'outline-primary'}
                onClick={() => setView('table')}
              >
                Table
              </Button>
            </ButtonGroup>
          </div>

          {view === 'cards'
            ? <CompareCards results={results} />
            : <CompareTable results={results} />}
        </>
      )}
    </div>
  );
}

export default Compare;
