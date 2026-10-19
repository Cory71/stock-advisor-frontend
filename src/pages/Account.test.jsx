// Tests for the Account page. The server calls are stubbed; these check what
// the page lets the user do and what it sends.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

const authState = {};
vi.mock('../context/AuthContext', () => ({ useAuth: () => authState }));

const apiFetch = vi.fn();
vi.mock('../lib/apiFetch', () => ({ apiFetch: (...args) => apiFetch(...args) }));

// The real PDF is tested in dataPdf.test.js; here we only check it's asked for.
const downloadDataPdf = vi.fn();
vi.mock('../lib/dataPdf', () => ({ downloadDataPdf: (...args) => downloadDataPdf(...args) }));

import Account from './Account';

function renderPage() {
  return render(
    <MemoryRouter>
      <Account />
    </MemoryRouter>
  );
}

describe('<Account />', () => {
  beforeEach(() => {
    apiFetch.mockReset();
    downloadDataPdf.mockReset();
    Object.assign(authState, {
      user: { email: 'cory@example.com', displayName: 'Cory' },
      loading: false,
      updateUser: vi.fn(),
      logout: vi.fn(),
    });
  });

  it('asks a logged-out visitor to log in', () => {
    authState.user = null;
    renderPage();
    expect(screen.getByText(/please log in/i)).toBeInTheDocument();
  });

  it('saves a new display name and updates the signed-in user', async () => {
    const saved = { email: 'cory@example.com', displayName: 'Cory C' };
    apiFetch.mockResolvedValue({ user: saved });
    renderPage();

    const input = screen.getByLabelText(/shown in the menu/i);
    await userEvent.clear(input);
    await userEvent.type(input, 'Cory C');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(apiFetch).toHaveBeenCalledWith('/api/auth/me', expect.objectContaining({ method: 'PATCH' }));
    expect(authState.updateUser).toHaveBeenCalledWith(saved);
    expect(await screen.findByText('Display name saved.')).toBeInTheDocument();
  });

  // Deleting is permanent, so the button stays locked until the email matches.
  it('keeps the delete button disabled until the email is typed', async () => {
    renderPage();
    const button = screen.getByRole('button', { name: 'Delete my account' });
    expect(button).toBeDisabled();

    await userEvent.type(screen.getByLabelText(/to confirm/i), 'cory@example.co');
    expect(button).toBeDisabled();

    await userEvent.type(screen.getByLabelText(/to confirm/i), 'm');
    expect(button).toBeEnabled();
  });

  it('deletes the account, signs out and says goodbye', async () => {
    apiFetch.mockResolvedValue({});
    renderPage();

    await userEvent.type(screen.getByLabelText(/to confirm/i), 'cory@example.com');
    await userEvent.click(screen.getByRole('button', { name: 'Delete my account' }));

    expect(apiFetch).toHaveBeenCalledWith('/api/auth/me', expect.objectContaining({
      method: 'DELETE',
      body: JSON.stringify({ confirmEmail: 'cory@example.com' }),
    }));
    expect(authState.logout).toHaveBeenCalledOnce();
    expect(await screen.findByText('Your account has been deleted')).toBeInTheDocument();
  });

  it('keeps the account and shows the error if the delete fails', async () => {
    apiFetch.mockRejectedValue(new Error('Could not delete the account. Please try again.'));
    renderPage();

    await userEvent.type(screen.getByLabelText(/to confirm/i), 'cory@example.com');
    await userEvent.click(screen.getByRole('button', { name: 'Delete my account' }));

    expect(await screen.findByText(/could not delete/i)).toBeInTheDocument();
    expect(authState.logout).not.toHaveBeenCalled();
  });

  // Clearing history takes a second click, so it can't happen by accident.
  it('asks for a second click before clearing search history', async () => {
    apiFetch.mockResolvedValue({ deleted: 7 });
    renderPage();

    await userEvent.click(screen.getByRole('button', { name: 'Clear search history' }));
    expect(apiFetch).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Yes, clear it' }));
    expect(apiFetch).toHaveBeenCalledWith('/api/history', { method: 'DELETE' });
    expect(await screen.findByText('Cleared 7 searches from your history.')).toBeInTheDocument();
  });

  it('downloads the data as a PDF', async () => {
    const exported = { account: { email: 'cory@example.com' }, watchlist: [], searchHistory: [] };
    apiFetch.mockResolvedValue(exported);
    renderPage();

    await userEvent.click(screen.getByRole('button', { name: 'Download my data' }));

    expect(apiFetch).toHaveBeenCalledWith('/api/auth/me/export');
    await vi.waitFor(() => expect(downloadDataPdf).toHaveBeenCalled());
    expect(downloadDataPdf.mock.calls[0][0]).toBe(exported);
    expect(downloadDataPdf.mock.calls[0][1]).toMatch(/^stockgrader-data-\d{4}-\d{2}-\d{2}\.pdf$/);
  });
});
