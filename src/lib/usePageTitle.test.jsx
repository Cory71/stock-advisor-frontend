// Tests for the usePageTitle hook. We render a tiny harness component that
// calls the hook, then read document.title to confirm it changed.

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { usePageTitle } from './usePageTitle';

function TitleHarness({ title }) {
  usePageTitle(title);
  return null;
}

describe('usePageTitle', () => {
  it('appends the brand when a title is given', () => {
    render(<TitleHarness title="Watchlist" />);
    expect(document.title).toBe('Watchlist · StockGrader');
  });

  it('shows just the brand when no title is given', () => {
    render(<TitleHarness title={null} />);
    expect(document.title).toBe('StockGrader');
  });

  it('updates the title when the prop changes', () => {
    const { rerender } = render(<TitleHarness title="Login" />);
    expect(document.title).toBe('Login · StockGrader');

    rerender(<TitleHarness title="Compare" />);
    expect(document.title).toBe('Compare · StockGrader');
  });
});
