// TrendChart — annual revenue and free cash flow, side by side per year.
//
// Both series are dollar amounts, so they share one vertical axis. That is
// deliberate: it shows free cash flow as a real fraction of revenue (Duke
// earning $32B while burning $1.7B). Two separate axes would scale each series
// on its own and could make a small cash burn look bigger than total revenue.
//
// Bars rather than a line, because these are yearly snapshots from separate
// filings, and a negative cash-flow year reads naturally as a bar below zero.

import { Card } from 'react-bootstrap';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer,
} from 'recharts';
import { useTheme } from '../context/ThemeContext';
import {
  buildTrendSeries, hasEnoughTrendData, formatBillions,
  missingYears, describeYears,
} from '../lib/chartData';

// Bootstrap's blue and teal, which already suit both themes.
const REVENUE_COLOR = '#0d6efd';
const FCF_COLOR = '#20c997';

// Axis and grid colors need to follow the theme by hand — Recharts draws SVG,
// so it can't inherit Bootstrap's `data-bs-theme` styling the way markup does.
function chartColors(theme) {
  const dark = theme === 'dark';
  return {
    axis: dark ? '#adb5bd' : '#495057',
    grid: dark ? '#343a40' : '#dee2e6',
    tooltipBg: dark ? '#212529' : '#ffffff',
    tooltipBorder: dark ? '#495057' : '#dee2e6',
    tooltipText: dark ? '#f8f9fa' : '#212529',
  };
}

// One coloured square plus its label.
function LegendKey({ color, label }) {
  return (
    <span className="d-inline-flex align-items-center gap-2 small">
      <span
        aria-hidden="true"
        style={{ width: 12, height: 12, backgroundColor: color, borderRadius: 2 }}
      />
      {label}
    </span>
  );
}

function TrendChart({ rawData }) {
  // Fall back to light if the chart is ever rendered outside ThemeProvider —
  // wrong colors are better than a crash on the grade page.
  const theme = useTheme()?.theme ?? 'light';
  const series = buildTrendSeries(rawData);

  // Nothing worth drawing: a single year shows no trend, and stocks cached
  // before the year labels existed produce an empty series.
  if (!hasEnoughTrendData(series)) return null;

  const colors = chartColors(theme);
  const gaps = missingYears(series);

  return (
    <Card className="mb-4">
      <Card.Body>
        <Card.Title as="h2" className="h5 mb-3">
          Revenue and free cash flow
        </Card.Title>

        <div style={{ width: '100%', height: 260 }}>
          <ResponsiveContainer>
            <BarChart data={series} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
              <CartesianGrid stroke={colors.grid} vertical={false} />
              <XAxis dataKey="year" stroke={colors.axis} tickLine={false} />
              <YAxis
                stroke={colors.axis}
                tickLine={false}
                width={62}
                tickFormatter={formatBillions}
              />
              {/* Makes the boundary explicit when a company burns cash. */}
              <ReferenceLine y={0} stroke={colors.axis} />
              <Tooltip
                formatter={(value) => formatBillions(value)}
                contentStyle={{
                  backgroundColor: colors.tooltipBg,
                  border: `1px solid ${colors.tooltipBorder}`,
                  color: colors.tooltipText,
                }}
                cursor={{ fill: colors.grid, opacity: 0.3 }}
              />
              <Bar dataKey="revenue" name="Revenue" fill={REVENUE_COLOR} />
              <Bar dataKey="fcf" name="Free cash flow" fill={FCF_COLOR} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Plain HTML legend rather than Recharts' own, which lists the series
            in the opposite order from the bars and ignores a custom payload. */}
        <div className="d-flex justify-content-center gap-4 mt-2">
          <LegendKey color={REVENUE_COLOR} label="Revenue" />
          <LegendKey color={FCF_COLOR} label="Free cash flow" />
        </div>

        <p className="text-body-secondary small mb-0 mt-2">
          Full-year figures from each annual report. A missing cash-flow bar means
          that year's filing didn't report capital spending we could read.
          {/* The bars sit evenly apart, so a skipped year would otherwise look
              like a normal one-year step. Name the missing years outright. */}
          {gaps.length > 0 && (
            <>
              {' '}
              <strong>{describeYears(gaps)}</strong>
              {gaps.length === 1 ? ' is' : ' are'} not shown — those filings
              couldn't be read, so the bars skip from one year to the next.
            </>
          )}
        </p>
      </Card.Body>
    </Card>
  );
}

export default TrendChart;
