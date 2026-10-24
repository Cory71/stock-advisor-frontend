// Tests for the grade page. The server call is stubbed; these check what a
// logged-out visitor and a signed-in user each see.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

const authState = {};
vi.mock('../context/AuthContext', () => ({ useAuth: () => authState }));

const apiFetch = vi.fn();
vi.mock('../lib/apiFetch', () => ({ apiFetch: (...args) => apiFetch(...args) }));

import GradeDetail from './GradeDetail';

// A graded result shaped like GET /api/grade/:ticker.
const graded = {
  ticker: 'MSFT',
  name: 'Microsoft Corporation',
  price: 512.3,
  currency: 'USD',
  model: 'general',
  grade: 'B',
  criteria: [
    { name: 'Topline revenue growth (long-term)', passed: true, value: 2e9, prior: 1e9, source: 'income statement' },
  ],
  gradedAt: '2026-10-23T12:00:00Z',
  rawData: {},
  sectorContext: null,
};

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/grade/MSFT']}>
      <Routes>
        <Route path="/grade/:ticker" element={<GradeDetail />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('<GradeDetail />', () => {
  beforeEach(() => {
    apiFetch.mockReset();
    Object.assign(authState, { user: null, loading: false });
  });
  afterEach(() => vi.useRealTimers());

  // Anyone can try the app — no account needed to see a grade.
  it('shows a logged-out visitor the grade', async () => {
    apiFetch.mockResolvedValue(graded);
    renderPage();

    // The summary line names the grade, so it proves the letter is shown.
    expect(await screen.findByText('MSFT passed 1 of 1 checks, which earns a B.')).toBeInTheDocument();
    expect(screen.getByText('Microsoft Corporation')).toBeInTheDocument();
    expect(screen.getByText('Why this grade?')).toBeInTheDocument();
    expect(apiFetch).toHaveBeenCalledWith('/api/grade/MSFT');
  });

  it('offers a logged-out visitor a log-in link instead of saving or refreshing', async () => {
    apiFetch.mockResolvedValue(graded);
    renderPage();
    await screen.findByText('Microsoft Corporation');

    expect(screen.getByRole('link', { name: 'Log in to save to your watchlist' })).toHaveAttribute('href', '/login');
    expect(screen.getByText('Free account: watchlist, search history, compare stocks')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Add to watchlist' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Refresh' })).not.toBeInTheDocument();
  });

  it('gives a signed-in user the watchlist button and Refresh', async () => {
    authState.user = { email: 'cory@example.com', displayName: 'Cory' };
    apiFetch.mockResolvedValue(graded);
    renderPage();
    await screen.findByText('Microsoft Corporation');

    expect(screen.getByRole('button', { name: 'Add to watchlist' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Refresh' })).toBeInTheDocument();
    expect(screen.queryByText('Log in to save to your watchlist')).not.toBeInTheDocument();
    expect(screen.queryByText(/free account/i)).not.toBeInTheDocument();
  });

  // The free-tier server can take up to a minute to wake; say so after a few seconds.
  it('explains a slow first load instead of only spinning', () => {
    vi.useFakeTimers();
    apiFetch.mockReturnValue(new Promise(() => {}));   // never answers
    renderPage();

    expect(screen.getByText('Grading MSFT…')).toBeInTheDocument();
    expect(screen.queryByText(/waking up the server/i)).not.toBeInTheDocument();

    act(() => vi.advanceTimersByTime(4000));

    expect(screen.getByText(/waking up the server/i)).toBeInTheDocument();
  });

  // A guest who hits the rate limit sees the server's message, not a log-in wall.
  it("shows the server's message when grading fails", async () => {
    apiFetch.mockRejectedValue(new Error('Too many lookups from this connection.'));
    renderPage();

    expect(await screen.findByText('Too many lookups from this connection.')).toBeInTheDocument();
  });
});
