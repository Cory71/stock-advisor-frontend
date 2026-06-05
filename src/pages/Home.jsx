// Home page — ticker search box on top, the user's recent searches below it.

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ListGroup, Spinner, Row, Col } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../lib/apiFetch';
import TickerSearch from '../components/TickerSearch';
import CandlestickFooter from '../components/CandlestickFooter';
import AboutCard from '../components/AboutCard';
import { usePageTitle } from '../lib/usePageTitle';

function Home() {
  const { user, loading: authLoading } = useAuth();
  // Home keeps just the brand in the tab — no prefix needed.
  usePageTitle();

  const [history, setHistory]               = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError]     = useState('');

  // Only fetch history when we know there's a logged-in user.
  useEffect(() => {
    if (authLoading || !user) return;

    let cancelled = false;
    setHistoryLoading(true);
    setHistoryError('');
    apiFetch('/api/history')
      .then((rows) => { if (!cancelled) setHistory(rows); })
      .catch((err) => { if (!cancelled) setHistoryError(err.message); })
      .finally(() => { if (!cancelled) setHistoryLoading(false); });

    return () => { cancelled = true; };
  }, [user, authLoading]);

  // Show each ticker at most once — most recent occurrence wins.
  // Backend returns newest-first, so the first time we see a ticker is the
  // one to keep.
  const seen = new Set();
  const uniqueHistory = history.filter((row) => {
    if (seen.has(row.ticker)) return false;
    seen.add(row.ticker);
    return true;
  });

  return (
    <div>
      <Row className="g-4">
        {/* Search + heading column. Takes full width when logged in, half when
            logged out (so the About card can sit beside it on desktop). */}
        <Col md={!user ? 6 : 12}>
          <h1>Grade a stock</h1>
          <p>Enter a ticker symbol or company name to get a letter grade and a five-point breakdown.</p>
          <TickerSearch />
        </Col>

        {/* About card — only shown to logged-out visitors as a "what is this?" pitch */}
        {!user && (
          <Col md={6}>
            <AboutCard />
          </Col>
        )}
      </Row>

      {/* Recent searches are personal — only show when someone's logged in */}
      {user && (
        <div className="mt-4">
          <h2 className="h5">Recent searches</h2>

          {historyLoading && (
            <p className="text-muted small">
              <Spinner animation="border" size="sm" className="me-2" />
              Loading…
            </p>
          )}

          {!historyLoading && historyError && (
            <p className="text-muted small">Couldn't load recent searches.</p>
          )}

          {!historyLoading && !historyError && uniqueHistory.length === 0 && (
            <p className="text-muted small">No searches yet — grade your first ticker above.</p>
          )}

          {!historyLoading && !historyError && uniqueHistory.length > 0 && (
            <ListGroup style={{ maxWidth: 400 }}>
              {uniqueHistory.map((row) => (
                <ListGroup.Item
                  key={row._id}
                  action
                  as={Link}
                  to={`/grade/${row.ticker}`}
                  className="d-flex justify-content-between align-items-center"
                >
                  <span>
                    <span className="fw-semibold">{row.ticker}</span>
                    {row.name && (
                      <span className="text-muted small ms-2">{row.name}</span>
                    )}
                  </span>
                  <span className="text-muted small">
                    {new Date(row.createdAt).toLocaleDateString()}
                  </span>
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
        </div>
      )}

      {/* Decorative candlestick band — fills the dead space at the bottom */}
      <CandlestickFooter />
    </div>
  );
}

export default Home;
