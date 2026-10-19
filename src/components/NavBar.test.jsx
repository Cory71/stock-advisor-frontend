// Tests for the navbar: signed-in users get an account menu holding dark mode,
// account settings and log out; logged-out visitors keep an inline dark-mode
// toggle, since they have no account menu.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '../context/ThemeContext';

const authState = { user: null, logout: vi.fn() };
vi.mock('../context/AuthContext', () => ({ useAuth: () => authState }));

import NavBar from './NavBar';

function renderNavBar() {
  return render(
    <MemoryRouter>
      <ThemeProvider>
        <NavBar />
      </ThemeProvider>
    </MemoryRouter>
  );
}

describe('<NavBar />', () => {
  beforeEach(() => {
    authState.user = null;
    authState.logout = vi.fn();
  });

  it('shows an inline dark-mode toggle and auth links when logged out', () => {
    renderNavBar();
    expect(screen.getByLabelText('Dark mode')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Log in' })).toBeInTheDocument();
    expect(screen.queryByText('Account settings')).not.toBeInTheDocument();
  });

  it('puts dark mode, account settings and log out in a menu under the name', async () => {
    authState.user = { email: 'cory@example.com', displayName: 'Cory' };
    renderNavBar();

    await userEvent.click(screen.getByRole('button', { name: 'Cory' }));

    expect(screen.getByLabelText('Dark mode')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Account settings' })).toHaveAttribute('href', '/account');
    expect(screen.getByRole('button', { name: 'Log out' })).toBeInTheDocument();
  });

  it('falls back to the email when there is no display name', () => {
    authState.user = { email: 'cory@example.com', displayName: null };
    renderNavBar();
    expect(screen.getByRole('button', { name: 'cory@example.com' })).toBeInTheDocument();
  });

  it('logs out from the menu', async () => {
    authState.user = { email: 'cory@example.com', displayName: 'Cory' };
    renderNavBar();

    await userEvent.click(screen.getByRole('button', { name: 'Cory' }));
    await userEvent.click(screen.getByRole('button', { name: 'Log out' }));

    expect(authState.logout).toHaveBeenCalledOnce();
  });
});
