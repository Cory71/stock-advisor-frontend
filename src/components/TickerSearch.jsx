// Ticker search input. On submit, navigates to /grade/<TICKER>.
// Tickers are uppercased and trimmed so the URL is always tidy.

import { useState } from 'react';
import { Form, Button, InputGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

function TickerSearch() {
  const [ticker, setTicker] = useState('');
  const navigate = useNavigate();

  function handleSubmit(e) {
    e.preventDefault();
    const cleaned = ticker.trim().toUpperCase();
    if (!cleaned) return;
    navigate(`/grade/${cleaned}`);
  }

  return (
    <Form onSubmit={handleSubmit}>
      <InputGroup style={{ maxWidth: 400 }}>
        <Form.Control
          type="text"
          placeholder="e.g. AAPL or Apple"
          value={ticker}
          onChange={(e) => setTicker(e.target.value)}
          aria-label="Ticker or company name"
          autoFocus
        />
        <Button type="submit" variant="primary">Get grade</Button>
      </InputGroup>
    </Form>
  );
}

export default TickerSearch;
