// "What is StockGrader?" explainer card. Shown next to the form on Login and
// Signup, and on Home for logged-out visitors. Pure presentation — no props,
// no state. Easy to drop into any layout column.

import { Card } from 'react-bootstrap';

function AboutCard() {
  return (
    <Card>
      <Card.Body>
        <Card.Title as="h2" className="h5 mb-3">
          What is StockGrader?
        </Card.Title>

        <p className="text-muted">
          A quick fundamental health check for any publicly traded stock.
        </p>

        <p className="mb-2">Grades <strong>A through F</strong> based on:</p>
        <ul className="small mb-3">
          <li>Topline revenue growth (long-term)</li>
          <li>Recent revenue growth (TTM)</li>
          <li>Positive free cash flow</li>
          <li>Free cash flow growth (long-term)</li>
          <li>Recent FCF growth (TTM)</li>
        </ul>

        <p className="small mb-2">
          <strong>Score:</strong> 5 yeses = A &middot; 4 = B &middot; 3 = C &middot; 2 = D &middot; 0–1 = F
        </p>

        <p className="text-muted small mb-0">
          Data from Finnhub, refreshed every 24 hours.
        </p>
      </Card.Body>
    </Card>
  );
}

export default AboutCard;
