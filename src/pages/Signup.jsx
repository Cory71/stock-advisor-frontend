// Signup page — email/password registration form. On success, save the JWT
// into AuthContext (which stores it in localStorage) and navigate to Home.

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Button, Alert, Row, Col } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../lib/apiFetch';
import { useAutoDismiss } from '../lib/useAutoDismiss';
import { usePageTitle } from '../lib/usePageTitle';
import GoogleSignInButton from '../components/GoogleSignInButton';
import CandlestickFooter from '../components/CandlestickFooter';
import AboutCard from '../components/AboutCard';

function Signup() {
  usePageTitle('Sign up');

  // Form state — controlled inputs.
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // UI state — shown to the user.
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Error banner auto-dismisses after 5s.
  useAutoDismiss(error, setError);

  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const data = await apiFetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, displayName })
      });
      // Backend returns { token, user } — log the new user in immediately.
      login(data.token, data.user);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Row className="g-4">
        <Col md={6}>
          <div style={{ maxWidth: 400 }}>
            <h1>Sign up</h1>

      {error && <Alert variant="danger">{error}</Alert>}

      {/* Google option first — fastest path to a new account */}
      <GoogleSignInButton />

      <div className="d-flex align-items-center text-muted my-3">
        <hr className="flex-grow-1" />
        <span className="px-2 small">or</span>
        <hr className="flex-grow-1" />
      </div>

      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3" controlId="signupDisplayName">
          <Form.Label>Display name</Form.Label>
          <Form.Control
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            autoFocus
          />
          <Form.Text className="text-muted">
            Optional — shown on the NavBar after you sign in.
          </Form.Text>
        </Form.Group>

        <Form.Group className="mb-3" controlId="signupEmail">
          <Form.Label>Email</Form.Label>
          <Form.Control
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="signupPassword">
          <Form.Label>Password</Form.Label>
          <Form.Control
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
          <Form.Text className="text-muted">At least 6 characters.</Form.Text>
        </Form.Group>

        <Button type="submit" variant="primary" disabled={submitting}>
          {submitting ? 'Creating account…' : 'Create account'}
        </Button>
      </Form>

      <p className="mt-3">
        Already registered? <Link to="/login">Log in</Link>
      </p>
          </div>
        </Col>
        <Col md={6}>
          <AboutCard />
        </Col>
      </Row>

      <CandlestickFooter />
    </>
  );
}

export default Signup;
