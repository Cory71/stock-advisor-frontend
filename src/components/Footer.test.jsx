// Quick render test for the footer — makes sure the copyright line shows up
// with the current year. Year is computed in JS so this test stays correct
// every January 1st without anyone touching it.

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Footer from './Footer';

describe('<Footer />', () => {
  it('renders StockGrader with the current year', () => {
    render(<Footer />);
    const year = new Date().getFullYear();
    expect(screen.getByText(new RegExp(`StockGrader.*${year}`))).toBeInTheDocument();
  });
});
