// Decorative candlestick silhouette for the bottom of the Home page.
// Pure presentation — no props, no state, no data. Marked aria-hidden so
// screen readers skip it. Colours use Bootstrap's --bs-success / --bs-danger
// CSS variables so the dark-mode tints come along for free.

import './CandlestickFooter.css';

const CANDLE_COUNT       = 22;
const VIEWBOX_HEIGHT     = 100;
const SLOT_WIDTH         = 10;                      // each candle gets a 10-unit slot
const VIEWBOX_WIDTH      = CANDLE_COUNT * SLOT_WIDTH;

// Build the candle shapes once at module load so the silhouette stays still
// across re-renders. The candle centers follow a smooth J-shaped curve:
//   - first ~20% dips slightly downward,
//   - middle ~20% plateaus at the bottom,
//   - last ~60% rises sharply toward the top.
//
// Each candle's colour is decided by whether it stepped up or down from the
// previous one, so red candles only show up where price actually fell —
// usually during the initial dip and the occasional noisy step during the
// rise. That matches how a real chart looks.
//
// SVG y-axis reminder: y=0 is the TOP of the viewBox, y=100 is the BOTTOM.
// "Going up on the chart" means y decreases as i grows.
function generateCandles() {
  const candles = [];
  let prevCenterY = null;

  for (let i = 0; i < CANDLE_COUNT; i++) {
    const t = i / (CANDLE_COUNT - 1);                 // 0 → 1 across the band

    // Three-phase J-shape with eased transitions:
    //   t < 0.30  — dip from y=55 down to y=80 (deep dip)
    //   t < 0.45  — plateau at the bottom
    //   t >= 0.45 — rise from y=80 up to y=12 (steep recovery)
    // smoothstep easing gives natural curve corners.
    let baseY;
    if (t < 0.30) {
      const phase = t / 0.30;
      const eased = phase * phase * (3 - 2 * phase);
      baseY = 55 + eased * 25;
    } else if (t < 0.45) {
      baseY = 80;
    } else {
      const phase = (t - 0.45) / 0.55;
      const eased = phase * phase * (3 - 2 * phase);
      baseY = 80 - eased * 68;
    }

    // Small noise so candles aren't perfectly on the curve.
    const noise   = (Math.random() - 0.5) * 3;
    const centerY = baseY + noise;

    // Taller proportions so candles read as stick-shaped, not chunky squares.
    const wickHeight = 26 + Math.random() * 18;       // 26..44
    const bodyHeight = 15 + Math.random() * 13;       // 15..28
    const wickTop    = centerY - wickHeight / 2;
    const wickBottom = centerY + wickHeight / 2;
    const bodyTop    = centerY - bodyHeight / 2;

    // Green if this candle is higher (lower y) than the previous one.
    const isUp = prevCenterY === null ? true : centerY < prevCenterY;

    candles.push({ wickTop, wickBottom, bodyTop, bodyHeight, isUp });
    prevCenterY = centerY;
  }
  return candles;
}

const CANDLES = generateCandles();

function CandlestickFooter() {
  return (
    <div className="candlestick-footer" aria-hidden="true">
      <svg
        viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
        preserveAspectRatio="none"
        width="100%"
        height="100%"
      >
        {CANDLES.map((c, i) => {
          const cx    = i * SLOT_WIDTH + SLOT_WIDTH / 2;
          const color = c.isUp ? 'var(--bs-success)' : 'var(--bs-danger)';

          return (
            <g key={i} fill={color} stroke={color}>
              {/* Wick — a thin vertical line spanning the candle's range */}
              <line
                x1={cx}
                x2={cx}
                y1={c.wickTop}
                y2={c.wickBottom}
                strokeWidth="0.6"
              />
              {/* Body — a slim filled rectangle around the candle's center */}
              <rect
                x={cx - SLOT_WIDTH * 0.18}
                y={c.bodyTop}
                width={SLOT_WIDTH * 0.36}
                height={c.bodyHeight}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default CandlestickFooter;
