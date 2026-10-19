import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import SectorComparison from './SectorComparison';

const context = {
  industry: 'Retail',
  metrics: [
    { key: 'revenueCagr', label: 'Revenue growth per year', value: 0.12, median: 0.06, peers: 9, position: 'above' },
    { key: 'fcfMargin', label: 'Free cash flow margin', value: 0.02, median: 0.04, peers: 9, position: 'below' },
  ],
};

describe('<SectorComparison />', () => {
  it('shows each metric with where it sits and the peer count', () => {
    render(<SectorComparison context={context} />);
    expect(screen.getByText('Compared with 9 Retail stocks')).toBeInTheDocument();
    expect(screen.getByText('Above median')).toBeInTheDocument();
    expect(screen.getByText('Below median')).toBeInTheDocument();
    expect(screen.getByText('12.0% vs median 6.0% (9 stocks)')).toBeInTheDocument();
  });

  // The comparison never changes the letter, and the card says so.
  it('says it is context only', () => {
    render(<SectorComparison context={context} />);
    expect(screen.getByText(/doesn't change the grade/)).toBeInTheDocument();
  });

  it('renders nothing without a comparison', () => {
    const { container } = render(<SectorComparison context={null} />);
    expect(container).toBeEmptyDOMElement();
  });
});
