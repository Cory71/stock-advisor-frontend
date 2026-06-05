// Renders the official "Sign in with Google" button from Google Identity
// Services. When the user clicks it and approves, Google returns a short-lived
// "credential" (an ID token). We POST that to our backend, which verifies it
// and gives us back our normal JWT — the rest of the app then treats this
// user exactly like an email/password one.
//
// Used by both Login and Signup pages — Google's flow handles both "new" and
// "returning" users the same way; the backend does the find-or-create.

import { GoogleLogin } from '@react-oauth/google';
import { Alert } from 'react-bootstrap';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../lib/apiFetch';
import { useAutoDismiss } from '../lib/useAutoDismiss';

function GoogleSignInButton() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  // Error banner auto-dismisses after 5s.
  useAutoDismiss(error, setError);

  // Skip rendering the button entirely if the Google Client ID isn't configured.
  // This way email/password still works locally even before the .env is wired.
  if (!import.meta.env.VITE_GOOGLE_CLIENT_ID) {
    return null;
  }

  async function handleCredential(credentialResponse) {
    setError('');
    try {
      const data = await apiFetch('/api/auth/google', {
        method: 'POST',
        body: JSON.stringify({ credential: credentialResponse.credential })
      });
      login(data.token, data.user);
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  }

  function handleError() {
    setError('Google sign-in was cancelled or failed.');
  }

  return (
    <div className="mb-3">
      {error && <Alert variant="danger">{error}</Alert>}
      <GoogleLogin
        onSuccess={handleCredential}
        onError={handleError}
        useOneTap={false}
      />
    </div>
  );
}

export default GoogleSignInButton;
