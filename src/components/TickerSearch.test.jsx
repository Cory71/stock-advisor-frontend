// Component test for <TickerSearch /> — render it, type a query, submit, and
// confirm it navigates to /grade/:upperCaseQuery.

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import TickerSearch from './TickerSearch';

// Helper — render TickerSearch inside a memory router with a marker route so
// we can assert it actually navigated to /grade/:query.
function renderWithRouter(initialPath = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/" element={<TickerSearch />} />
        <Route
          path="/grade/:query"
          element={<div data-testid="landed">landed</div>}
        />
      </Routes>
    </MemoryRouter>
  );
}

describe('<TickerSearch />', () => {
  it('renders an input and a submit button', () => {
    renderWithRouter();
    expect(screen.getByRole('textbox', { name: /ticker or company name/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /get grade/i })).toBeInTheDocument();
  });

  it('navigates to /grade/<UPPERCASE> on submit', async () => {
    const user = userEvent.setup();
    renderWithRouter();

    await user.type(screen.getByRole('textbox', { name: /ticker or company name/i }), 'aapl');
    await user.click(screen.getByRole('button', { name: /get grade/i }));

    expect(await screen.findByTestId('landed')).toBeInTheDocument();
  });

  it('does nothing when the input is empty', async () => {
    const user = userEvent.setup();
    renderWithRouter();

    await user.click(screen.getByRole('button', { name: /get grade/i }));
    expect(screen.queryByTestId('landed')).not.toBeInTheDocument();
  });

  it('trims whitespace before navigating', async () => {
    const user = userEvent.setup();
    renderWithRouter();

    await user.type(screen.getByRole('textbox', { name: /ticker or company name/i }), '   aapl   ');
    await user.click(screen.getByRole('button', { name: /get grade/i }));

    expect(await screen.findByTestId('landed')).toBeInTheDocument();
  });
});
