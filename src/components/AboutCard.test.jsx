// Quick render test for the "What is StockGrader?" explainer card.
// Verifies the title is present and all 5 grading criteria are listed.

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import AboutCard from './AboutCard';

describe('<AboutCard />', () => {
  it('renders the title and tagline', () => {
    render(<AboutCard />);
    expect(screen.getByText('What is StockGrader?')).toBeInTheDocument();
    expect(screen.getByText(/fundamental health check/i)).toBeInTheDocument();
  });

  it('lists all 5 grading criteria', () => {
    render(<AboutCard />);
    const items = screen.getAllByRole('listitem');
    expect(items.length).toBe(5);
  });

  it('explains the score-to-grade mapping', () => {
    render(<AboutCard />);
    expect(screen.getByText(/5 yeses = A/i)).toBeInTheDocument();
  });
});
