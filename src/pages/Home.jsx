// Home page — landing screen with the ticker search box.
// On mount, fetches the backend health route to confirm the connection.

import { useEffect, useState } from 'react';

// API base URL. Reads from .env in production; falls back to localhost for dev.
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function Home() {
  const [backendStatus, setBackendStatus] = useState('checking…');

  useEffect(() => {
    fetch(`${API_URL}/`)
      .then((res) => res.json())
      .then((data) => setBackendStatus(data.message))
      .catch((err) => setBackendStatus(`error: ${err.message}`));
  }, []);

  return (
    <div>
      <h1>Home</h1>
      <p>Enter a ticker symbol to get a graded result.</p>
      <p>
        Backend says: <strong>{backendStatus}</strong>
      </p>
    </div>
  );
}

export default Home;
