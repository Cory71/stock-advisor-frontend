// How a stock compares with others in its industry, shown under the letter
// grade. Only rendered when the backend sent a comparison — it does that only
// when at least 8 stocks in the industry have been graded.

import { Card, Badge } from 'react-bootstrap';
import { comparisonHeading, describeMetric, positionLabel, positionVariant } from '../lib/sectorContext';

function SectorComparison({ context }) {
  if (!context?.metrics?.length) return null;

  return (
    <Card className="mb-4">
      <Card.Body>
        <Card.Title as="h2" className="h6 mb-3">{comparisonHeading(context)}</Card.Title>
        <ul className="list-unstyled mb-2">
          {context.metrics.map((metric) => (
            <li key={metric.key} className="mb-2">
              <div className="d-flex align-items-center gap-2 flex-wrap">
                {/* Dark text on the yellow "below" badge so it stays readable. */}
                <Badge
                  bg={positionVariant(metric.position)}
                  text={positionVariant(metric.position) === 'warning' ? 'dark' : undefined}
                >
                  {positionLabel(metric.position)}
                </Badge>
                <span>{metric.label}</span>
              </div>
              <div className="text-muted small ms-2">{describeMetric(metric)}</div>
            </li>
          ))}
        </ul>
        {/* Make clear this is extra context, not part of the letter. */}
        <p className="text-muted small mb-0">For context only — this doesn't change the grade.</p>
      </Card.Body>
    </Card>
  );
}

export default SectorComparison;
