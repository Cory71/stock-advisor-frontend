// Lightweight render test for the decorative candlestick footer.
// We don't assert pixel-level visuals (that's what the eye is for) — just
// that the SVG is in the DOM with the expected number of candle groups and
// the right accessibility attributes.

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import CandlestickFooter from './CandlestickFooter';

describe('<CandlestickFooter />', () => {
  it('renders an SVG inside an aria-hidden container', () => {
    const { container } = render(<CandlestickFooter />);
    const wrapper = container.querySelector('.candlestick-footer');
    expect(wrapper).toBeInTheDocument();
    expect(wrapper).toHaveAttribute('aria-hidden', 'true');
    expect(wrapper.querySelector('svg')).toBeInTheDocument();
  });

  it('renders at least 15 candle groups', () => {
    const { container } = render(<CandlestickFooter />);
    const groups = container.querySelectorAll('svg g');
    expect(groups.length).toBeGreaterThanOrEqual(15);
  });
});
