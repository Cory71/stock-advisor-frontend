// GradeDetail page — shows the letter grade, 5-criteria breakdown,
// and "Add to watchlist" button for a single ticker.
// The ticker comes from the URL (/grade/:ticker).

import { useParams } from 'react-router-dom';

function GradeDetail() {
  const { ticker } = useParams();

  return (
    <div>
      <h1>Grade: {ticker?.toUpperCase()}</h1>
      <p>Letter grade and 5-criteria breakdown will appear here once the grading endpoint is wired up.</p>
    </div>
  );
}

export default GradeDetail;
