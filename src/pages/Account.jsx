// Account page — the signed-in user's own settings: change their display name,
// download or clear their data, and delete their account.
//
// Reached from the menu under the user's name in the navbar.

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { apiFetch } from '../lib/apiFetch';
import { useAuth } from '../context/AuthContext';
import { usePageTitle } from '../lib/usePageTitle';
import { useAutoDismiss } from '../lib/useAutoDismiss';
import { emailMatches, exportFileName } from '../lib/account';

// ---------- Display name ----------

function DisplayNameCard({ user, onSaved }) {
  const [name, setName] = useState(user.displayName || '');
  const [saving, setSaving] = useState(false);
  const [info, setInfo] = useState(null);
  useAutoDismiss(info, setInfo);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setInfo(null);
    try {
      const data = await apiFetch('/api/auth/me', {
        method: 'PATCH',
        body: JSON.stringify({ displayName: name }),
      });
      onSaved(data.user);
      setInfo({ variant: 'success', message: 'Display name saved.' });
    } catch (err) {
      setInfo({ variant: 'danger', message: err.message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="mb-4">
      <Card.Body>
        <Card.Title as="h2" className="h5">Display name</Card.Title>
        <Form onSubmit={handleSave}>
          <Form.Group controlId="displayName" className="mb-2">
            <Form.Label className="small text-body-secondary">
              Shown in the menu at the top. Leave it blank to show your email instead.
            </Form.Label>
            <Form.Control
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={50}
              placeholder={user.email}
            />
          </Form.Group>
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </Form>
        {info && <Alert variant={info.variant} className="mt-3 mb-0">{info.message}</Alert>}
      </Card.Body>
    </Card>
  );
}

// ---------- Your data ----------

function YourDataCard() {
  const [busy, setBusy] = useState(null);                 // 'export' | 'clear' | null
  const [confirmingClear, setConfirmingClear] = useState(false);
  const [info, setInfo] = useState(null);
  useAutoDismiss(info, setInfo);

  async function handleExport() {
    setBusy('export');
    setInfo(null);
    try {
      const data = await apiFetch('/api/auth/me/export');
      // The PDF code is loaded only now, so it never slows the rest of the app.
      const { downloadDataPdf } = await import('../lib/dataPdf');
      downloadDataPdf(data, exportFileName());
    } catch (err) {
      setInfo({ variant: 'danger', message: err.message });
    } finally {
      setBusy(null);
    }
  }

  async function handleClearHistory() {
    setBusy('clear');
    setInfo(null);
    try {
      const { deleted } = await apiFetch('/api/history', { method: 'DELETE' });
      const word = deleted === 1 ? 'search' : 'searches';
      setInfo({ variant: 'success', message: `Cleared ${deleted} ${word} from your history.` });
    } catch (err) {
      setInfo({ variant: 'danger', message: err.message });
    } finally {
      setBusy(null);
      setConfirmingClear(false);
    }
  }

  return (
    <Card className="mb-4">
      <Card.Body>
        <Card.Title as="h2" className="h5">Your data</Card.Title>

        <p className="small text-body-secondary mb-2">
          Download your account details, watchlist and search history as a PDF.
        </p>
        <Button variant="outline-primary" onClick={handleExport} disabled={busy !== null}>
          {busy === 'export' ? 'Preparing…' : 'Download my data'}
        </Button>

        <hr />

        <p className="small text-body-secondary mb-2">
          Remove the record of stocks you've looked up. Your watchlist stays.
        </p>
        {/* A second click confirms, so the history isn't cleared by accident. */}
        {confirmingClear ? (
          <div className="d-flex gap-2">
            <Button variant="danger" onClick={handleClearHistory} disabled={busy !== null}>
              {busy === 'clear' ? 'Clearing…' : 'Yes, clear it'}
            </Button>
            <Button variant="outline-secondary" onClick={() => setConfirmingClear(false)}>
              Cancel
            </Button>
          </div>
        ) : (
          <Button variant="outline-secondary" onClick={() => setConfirmingClear(true)} disabled={busy !== null}>
            Clear search history
          </Button>
        )}

        {info && <Alert variant={info.variant} className="mt-3 mb-0">{info.message}</Alert>}
      </Card.Body>
    </Card>
  );
}

// ---------- Delete account ----------

function DeleteAccountCard({ user, onDeleted }) {
  const [typedEmail, setTypedEmail] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  // The button only unlocks once the email matches — the server checks again.
  const confirmed = emailMatches(typedEmail, user.email);

  async function handleDelete(e) {
    e.preventDefault();
    if (!confirmed) return;
    setDeleting(true);
    setError('');
    try {
      await apiFetch('/api/auth/me', {
        method: 'DELETE',
        body: JSON.stringify({ confirmEmail: typedEmail }),
      });
      onDeleted();
    } catch (err) {
      setError(err.message);
      setDeleting(false);
    }
  }

  return (
    <Card border="danger" className="mb-4">
      <Card.Body>
        <Card.Title as="h2" className="h5 text-danger">Delete account</Card.Title>
        <p className="small mb-2">
          This permanently removes your account, watchlist and search history.
          It can't be undone — download your data first if you want to keep it.
        </p>
        <Form onSubmit={handleDelete}>
          <Form.Group controlId="confirmEmail" className="mb-2">
            <Form.Label className="small">
              Type <strong>{user.email}</strong> to confirm:
            </Form.Label>
            <Form.Control
              value={typedEmail}
              onChange={(e) => setTypedEmail(e.target.value)}
              autoComplete="off"
            />
          </Form.Group>
          <Button type="submit" variant="danger" disabled={!confirmed || deleting}>
            {deleting ? (
              <>
                <Spinner as="span" animation="border" size="sm" className="me-1" />
                Deleting…
              </>
            ) : (
              'Delete my account'
            )}
          </Button>
        </Form>
        {error && <Alert variant="danger" className="mt-3 mb-0">{error}</Alert>}
      </Card.Body>
    </Card>
  );
}

// ---------- Page ----------

function Account() {
  usePageTitle('Account');
  const { user, loading, updateUser, logout } = useAuth();
  const [deleted, setDeleted] = useState(false);

  // Show the goodbye message first, then sign out — otherwise the page would
  // flash the "please log in" prompt instead.
  function handleDeleted() {
    setDeleted(true);
    logout();
  }

  if (deleted) {
    return (
      <Alert variant="success">
        <Alert.Heading className="h5">Your account has been deleted</Alert.Heading>
        <p className="mb-2">Your account, watchlist and search history have been removed.</p>
        <Link to="/" className="btn btn-outline-success btn-sm">Back to home</Link>
      </Alert>
    );
  }

  if (loading) {
    return <p><Spinner animation="border" size="sm" className="me-2" />Loading…</p>;
  }

  if (!user) {
    return (
      <Alert variant="info">
        <Alert.Heading className="h5">Please log in to see your account</Alert.Heading>
        <div className="d-flex gap-2">
          <Link to="/login" className="btn btn-primary btn-sm">Log in</Link>
          <Link to="/signup" className="btn btn-outline-primary btn-sm">Sign up</Link>
        </div>
      </Alert>
    );
  }

  return (
    <div style={{ maxWidth: 640 }}>
      <h1 className="mb-1">Account</h1>
      <p className="text-body-secondary mb-4">{user.email}</p>
      <DisplayNameCard user={user} onSaved={updateUser} />
      <YourDataCard />
      <DeleteAccountCard user={user} onDeleted={handleDeleted} />
    </div>
  );
}

export default Account;
