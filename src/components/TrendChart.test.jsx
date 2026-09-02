// Render tests for the revenue / free-cash-flow trend chart.
//
// Recharts measures its container to lay out the SVG, and jsdom reports every
// element as 0x0, so the bars themselves never draw in tests. These tests check
// the decisions the component makes — whether to render at all, and what it
// tells the user — rather than the drawn geometry. The data shaping is covered
// separately in src/lib/chartData.test.js.

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '../context/ThemeContext';
import TrendChart from './TrendChart';

function renderChart(rawData) {
  return render(
    <ThemeProvider>
      <TrendChart rawData={rawData} />
    </ThemeProvider>
  );
}

const threeYears = {
  annualYears: [2023, 2024, 2025],
  annualRevenues: [10e9, 20e9, 30e9],
  annualFcfYears: [2023, 2024, 2025],
  annualFreeCashFlows: [1e9, 2e9, 3e9],
};

describe('<TrendChart />', () => {
  it('renders a titled card when there are at least two years', () => {
    renderChart(threeYears);
    expect(screen.getByText('Revenue and free cash flow')).toBeInTheDocument();
  });

  it('explains what a missing cash-flow bar means', () => {
    renderChart(threeYears);
    expect(screen.getByText(/didn't report capital spending/i)).toBeInTheDocument();
  });

  it('renders nothing for a single year, which shows no trend', () => {
    const { container } = renderChart({
      annualYears: [2025],
      annualRevenues: [30e9],
      annualFcfYears: [2025],
      annualFreeCashFlows: [3e9],
    });
    expect(container).toBeEmptyDOMElement();
  });

  // Stocks cached before the backend sent year labels, and N/A stocks with no
  // financials, must not leave an empty chart frame on the page.
  it('renders nothing when year labels are missing', () => {
    const { container } = renderChart({
      annualRevenues: [10e9, 20e9],
      annualFreeCashFlows: [1e9, 2e9],
    });
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when there is no data at all', () => {
    expect(renderChart(null).container).toBeEmptyDOMElement();
    expect(renderChart({}).container).toBeEmptyDOMElement();
  });

  it('still renders when a year has no cash-flow figure', () => {
    renderChart({
      annualYears: [2023, 2024, 2025],
      annualRevenues: [10e9, 20e9, 30e9],
      annualFcfYears: [2025],
      annualFreeCashFlows: [3e9],
    });
    expect(screen.getByText('Revenue and free cash flow')).toBeInTheDocument();
  });
});
