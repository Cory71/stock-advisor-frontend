// Works out where to draw the trend chart's bars in a PDF report.
//
// The grade page draws its chart with Recharts, but a PDF can't hold a live
// chart, and a screenshot would be blurry when printed and would copy dark
// mode onto the page. So the report draws plain rectangles from the yearly
// numbers instead. This file is only the maths — positions and labels — so it
// can be tested without a PDF; src/lib/gradePdf.js does the drawing.

import { formatBillions } from './chartData';

// Gridlines aim for about this many steps between the lowest and highest value.
const TARGET_STEPS = 4;

// A "round" step size near `rough`: 1, 2, 2.5 or 5 times a power of ten, so
// axis labels read $50.0B, $100.0B, ... rather than $47.3B, $94.6B, ...
function niceStep(rough) {
  const power = 10 ** Math.floor(Math.log10(rough));
  const multiple = [1, 2, 2.5, 5, 10].find((m) => m * power >= rough);
  return multiple * power;
}

// The value range the axis covers: always includes zero, so a cash-burning
// year shows as a bar below the line, and ends on round steps.
function axisRange(values) {
  const max = Math.max(0, ...values);
  const min = Math.min(0, ...values);
  if (max === min) return { top: 1, bottom: 0, step: 1 };

  const step = niceStep((max - min) / TARGET_STEPS);
  return { top: Math.ceil(max / step) * step, bottom: Math.floor(min / step) * step, step };
}

// series: rows like { year, revenue, fcf } (from chartData.js).
// keys: the two value fields to draw, e.g. ['revenue', 'fcf'].
// box: { x, y, width, height } — the plotting area on the page.
// Returns everything the drawing code needs: bar rectangles, the zero line,
// gridline labels and year labels.
export function chartLayout(series, keys, box) {
  const values = series.flatMap((row) => keys.map((k) => row[k])).filter((v) => typeof v === 'number');
  const { top, bottom, step } = axisRange(values);

  // Page position (y grows downward) for a dollar value.
  const yFor = (value) => box.y + (box.height * (top - value)) / (top - bottom);

  const slot = box.width / series.length;   // space for one year
  const barWidth = slot * 0.32;
  const bars = [];
  series.forEach((row, i) => {
    keys.forEach((key, k) => {
      const value = row[key];
      if (typeof value !== 'number') return;  // a missing year is a gap, not zero
      const yTop = yFor(Math.max(value, 0));
      bars.push({
        key,
        year: row.year,
        x: box.x + slot * i + slot * 0.16 + barWidth * k * 1.06,
        y: yTop,
        width: barWidth,
        height: yFor(Math.min(value, 0)) - yTop,
      });
    });
  });

  const gridlines = [];
  for (let value = bottom; value <= top + step / 2; value += step) {
    gridlines.push({ y: yFor(value), label: formatBillions(value) });
  }

  const years = series.map((row, i) => ({ x: box.x + slot * (i + 0.5), label: String(row.year) }));

  return { bars, zeroY: yFor(0), gridlines, years };
}
