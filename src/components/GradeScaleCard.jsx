// Small "How the grade works" card shown beside a graded result. Explains the
// A–F scale so a viewer knows what the letter means. Pure presentation — no
// props, no state. The five criteria themselves are already listed on the
// grade page, so this card focuses on how the score maps to a letter.

import { Card } from 'react-bootstrap';

function GradeScaleCard() {
  return (
    <Card>
      <Card.Body>
        <Card.Title as="h2" className="h5 mb-3">
          How the grade works
        </Card.Title>

        <p className="text-muted small">
          Each stock earns one point for every criterion it passes. The total
          maps to a letter grade:
        </p>

        <ul className="list-unstyled small mb-3">
          <li className="mb-1"><strong>A</strong> — all 5 criteria pass</li>
          <li className="mb-1"><strong>B</strong> — 4 of 5</li>
          <li className="mb-1"><strong>C</strong> — 3 of 5</li>
          <li className="mb-1"><strong>D</strong> — 2 of 5</li>
          <li><strong>F</strong> — 0 or 1 of 5</li>
        </ul>

        <p className="text-muted small mb-0">
          Data from Finnhub, refreshed every 24 hours.
        </p>
      </Card.Body>
    </Card>
  );
}

export default GradeScaleCard;
