// Login page — email/password form. On success, save the JWT into AuthContext
// (which also stores it in localStorage) and navigate to the Home page.

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Button, Alert } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../lib/apiFetch';
import GoogleSignInButton from '../components/GoogleSignInButton';

function Login() {
  // Form state — controlled inputs.
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // UI state — shown to the user.
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const data = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      // The backend returns { token, user } — hand both to AuthContext.
      login(data.token, data.user);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ maxWidth: 400 }}>
      <h1>Log in</h1>

      {error && <Alert variant="danger">{error}</Alert>}

      {/* Google option first — many users prefer one-click sign-in */}
      <GoogleSignInButton />

      <div className="d-flex align-items-center text-muted my-3">
        <hr className="flex-grow-1" />
        <span className="px-2 small">or</span>
        <hr className="flex-grow-1" />
      </div>

      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3" controlId="loginEmail">
          <Form.Label>Email</Form.Label>
          <Form.Control
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="loginPassword">
          <Form.Label>Password</Form.Label>
          <Form.Control
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </Form.Group>

        <Button type="submit" variant="primary" disabled={submitting}>
          {submitting ? 'Logging in…' : 'Log in'}
        </Button>
      </Form>

      <p className="mt-3">
        Don't have an account? <Link to="/signup">Sign up</Link>
      </p>
    </div>
  );
}

export default Login;
