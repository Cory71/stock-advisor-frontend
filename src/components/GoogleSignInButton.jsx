// Renders the official "Sign in with Google" button from Google Identity
// Services. When the user clicks it and approves, Google returns a short-lived
// "credential" (an ID token). We POST that to our backend, which verifies it
// and gives us back our normal JWT — the rest of the app then treats this
// user exactly like an email/password one.
//
// Used by both Login and Signup pages — Google's flow handles both "new" and
// "returning" users the same way; the backend does the find-or-create.

import { GoogleLogin } from '@react-oauth/google';
import { Alert, Spinner } from 'react-bootstrap';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../lib/apiFetch';
import { useAutoDismiss } from '../lib/useAutoDismiss';
import './GoogleSignInButton.css';

function GoogleSignInButton() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  // True while we exchange Google's credential for our JWT (shows a spinner).
  const [submitting, setSubmitting] = useState(false);

  // Error banner auto-dismisses after 5s.
  useAutoDismiss(error, setError);

  // Skip rendering the button entirely if the Google Client ID isn't configured.
  // This way email/password still works locally even before the .env is wired.
  if (!import.meta.env.VITE_GOOGLE_CLIENT_ID) {
    return null;
  }

  async function handleCredential(credentialResponse) {
    setError('');
    setSubmitting(true);
    try {
      const data = await apiFetch('/api/auth/google', {
        method: 'POST',
        body: JSON.stringify({ credential: credentialResponse.credential })
      });
      login(data.token, data.user);
      navigate('/'); // success — this page unmounts, so no need to reset submitting
    } catch (err) {
      setError(err.message);
      setSubmitting(false); // failed — restore the button so they can retry
    }
  }

  function handleError() {
    setError('Google sign-in was cancelled or failed.');
  }

  return (
    <div className="mb-3 google-signin-wrapper">
      {error && <Alert variant="danger">{error}</Alert>}
      {submitting ? (
        // While our backend verifies the Google credential, swap the button for
        // a spinner — gives feedback (esp. on a cold start) and blocks re-clicks.
        <div className="d-flex align-items-center justify-content-center py-2 text-muted">
          <Spinner as="span" animation="border" size="sm" className="me-2" />
          Signing in with Google…
        </div>
      ) : (
        <GoogleLogin
          onSuccess={handleCredential}
          onError={handleError}
          useOneTap={false}
          width="400"
          logo_alignment="center"
        />
      )}
    </div>
  );
}

export default GoogleSignInButton;
