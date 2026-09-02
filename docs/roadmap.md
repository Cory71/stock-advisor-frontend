# StockGrader — Upgrade Roadmap

The post-MVP improvements, in the order I plan to build them. I check items off as
they ship, then push so the history matches the progress.

> **Status legend:** `[x]` = done, `[ ]` = not started, `[~]` = in progress
> **Repos:** [`stock-advisor-frontend`](https://github.com/Cory71/stock-advisor-frontend) · [`stock-advisor-backend`](https://github.com/Cory71/stock-advisor-backend)
> **Related docs:** [`stock-advisor-plan.md`](./stock-advisor-plan.md) · [`devlog.md`](./devlog.md) · [sector-aware grading spec](./specs/2026-09-01-sector-aware-grading-design.md)

---

## Why this order

The sequence isn't arbitrary — three real dependencies drive it:

1. **Sector baselines need a fresh cache.** Baselines are medians over cached
   `Stock` docs. Stale docs poison the medians, so auto-refresh comes before
   sector context.
2. **Email alerts need auto-refresh.** You can't alert on a grade change if
   grades only recompute when someone clicks.
3. **"Why this grade?" and PDF export render everything else.** Building either
   before bank criteria, sector context, and charts exist means rebuilding it
   afterward. They go last.

Everything else is ordered by value-per-hour.

---

## 0. Clear the stale cache

**Assumed to be a no-code refresh. It wasn't** — re-grading surfaced two real
provider bugs. The three stocks were not stale upstream; the provider was
misreading their filings.

- [x] Re-grade `DUK`, `NEE`, `B` against current Finnhub data
- [x] **Bug: regulated utilities parsed as having no revenue.** Duke reports only
      `us-gaap_RegulatedAndUnregulatedOperatingRevenue`, which wasn't in
      `REVENUE_CONCEPTS`, so every filing from 2017 on was dropped and 2016
      became the "latest annual" — tripping the freshness guard. Concept added.
- [x] **Bug: combined 10-K filings duplicated years.** Utilities filing for the
      parent plus subsidiary registrants (DUK 6/yr, AEP 6/yr, SO 3–4/yr, D 2/yr,
      NEE 2/yr) returned one Finnhub report per registrant. `parseAnnualReports`
      had no dedup, so "5 annual values" could be 5 rows of the *same* year —
      making long-term growth compare a year against itself and always fail.
      Now keeps one report per year (largest revenue = parent consolidated),
      taking its cash-flow figures from that same filing.
- [x] 6 unit tests covering both bugs; full suite 80 → 86 passing
- [x] Regression check: all 59 currently-graded tickers re-fetched and re-graded
      against live Finnhub — **0 changed, 0 errors**
- [x] Verified end-to-end in the running app (local backend + Vite): `DUK` renders
      **D** with the Utilities caveat and five distinct year-over-year figures

**Outcome:**

| Ticker | Before | After | Notes |
| --- | --- | --- | --- |
| `DUK` | N/A "outdated" | **D** (2/5) | Utilities caveat now attaches correctly |
| `NEE` | N/A "outdated" | N/A "no FCF" | Now fails for the *right* reason — see below |
| `B` | N/A "outdated" | N/A "outdated" | Correct: Finnhub's newest filing is 2023 |

`B` is not fixable. Barrick took the ticker from Barnes Group, so Finnhub maps it
to a filer that stopped reporting — exactly what the freshness guard exists for.

**Follow-up not done:** `NEE` reports capital expenditure only under
company-prefixed tags (`nee_CapitalExpendituresOfFPL`,
`nee_CapitalExpendituresOfPublicUtility`). The one standard concept present,
`us-gaap_CapitalExpendituresIncurredButNotYetPaid`, is an accrual disclosure and
**not** a cash outflow — using it would produce a wrong free-cash-flow figure.
Needs a deliberate decision about which company-specific concepts are safe and
whether they sum to consolidated CapEx. Left alone rather than guessed.

*Yield: 1 of 3 stocks graded, plus two latent correctness bugs fixed.*

---

## 1. Charts of revenue and free-cash-flow trends

Best value-per-hour on the list. The data is **already in `rawData`** on every
cached stock — no new API calls, no backend work, no rate-limit exposure. Pure
frontend, entirely in this repo.

- [ ] Choose a chart library (Recharts vs. Chart.js — check bundle size against the Vite build)
- [ ] Build `<TrendChart />` — annual revenue + FCF series, oldest → newest
- [ ] Add it to the Grade Detail page below the criteria checklist
- [ ] Handle short series gracefully (some stocks have only 2 annual columns)
- [ ] Respect dark mode (`data-bs-theme`) — axis, grid, and series colors
- [ ] Responsive down to 576px, matching the watchlist's column-hiding approach
- [ ] Vitest + RTL coverage for the component

---

## 2. Automatic watchlist refresh

Stops the cache rot that item 0 cleans up by hand, and unblocks email alerts.
The backend work is largely done — `POST /api/watchlist/refresh` already
re-grades every saved ticker one at a time, respecting the rate limit.

- [ ] Decide the schedule (daily is plenty — filings update quarterly)
- [ ] Create a Render cron job hitting the refresh endpoint
- [ ] Add auth for the cron caller (a shared secret header, not a user JWT)
- [ ] Handle partial failure — one bad ticker must not abort the run
- [ ] Log outcomes so a silent failure is visible
- [ ] Confirm the free-tier spin-down doesn't drop the job

---

## 3. Bank grading

Full design: [sector-aware grading spec](./specs/2026-09-01-sector-aware-grading-design.md) §4.

Turns `N/A` into a real grade for banks, and creates the bank peer pool that
item 4 needs. Yield on the current cache is small (`JPM`, `BAC`), but bank
tickers are searched far more often than their share of the cache suggests.

- [ ] `lib/gradingBank.js` — 5 criteria, 2 growth + 3 ratio-vs-median
- [ ] `lib/selectGrader.js` — route on `industry === 'Banking'` only
- [ ] Add `BANK_*` concept lists to the provider (do **not** touch `REVENUE_CONCEPTS`)
- [ ] Derived revenue fallback: net interest income + noninterest income
- [ ] N/A policy: 2+ null criteria → `N/A`, not a low grade
- [ ] Seed ~25–30 US banks to establish real medians
- [ ] Recompute the provisional medians from the seeded pool
- [ ] **Regression test: all 59 currently-graded tickers keep identical grades**
- [ ] Label the model on the grade card and compare page

---

## 4. Sector-relative context

Full design: [sector-aware grading spec](./specs/2026-09-01-sector-aware-grading-design.md) §5.

Compares a stock against its own sector's median rather than against every
company. Answers the question the app currently gets wrong by implication:
*is a 2% FCF margin bad?* For a grocer, no.

- [ ] Promote `industry` to an indexed field on `Stock`, backfilled from `rawData.industry`
- [ ] `models/SectorBaseline.js` — per-industry medians + peer count
- [ ] Aggregation job to compute baselines, run after each seed
- [ ] `lib/sectorContext.js` — above / at / below median
- [ ] Suppress the comparison below 8 peers (show nothing, never a weak claim)
- [ ] Always display the peer count alongside the comparison
- [ ] Seed broadly enough to lift more industries past the 8-peer floor
- [ ] Surface on the grade card, beneath the letter

---

## 5. Richer "Why this grade?" explanations

Extends today's N/A reasons and sector caveats into a plain-English explanation
generated from the criteria. Sits here because it can now describe *both* grading
models and a stock's sector standing.

- [ ] Generate a sentence per criterion from its name, value, and prior
- [ ] Summarize the overall grade in one line
- [ ] Cover the bank model's criteria too
- [ ] Fold in sector context when a baseline exists
- [ ] Keep the wording beginner-friendly — no jargon without a gloss

---

## 6. Email alerts on grade change

Depends on item 2 — without scheduled re-grading there is no change to alert on.
The watchlist already snapshots the grade at add-time and compares it to the
current one (▲ Upgraded / ▼ Downgraded / — No change), so the detection logic
largely exists.

- [ ] Choose an email provider (free tier, low volume)
- [ ] Store per-user alert preferences (opt-in, default off)
- [ ] Detect upgrade/downgrade during the scheduled refresh
- [ ] Send on change only — never on an unchanged grade
- [ ] Include an unsubscribe link
- [ ] Rate-limit so one bad refresh can't spam a user

---

## 7. Export a graded report as PDF

Last deliberately: it renders whatever the grade card contains, so it should be
built once, after the card is final. *(This was in the original stretch list but
dropped off the README's Future Improvements — worth restoring there.)*

- [ ] Choose the approach (client-side print stylesheet vs. a PDF library)
- [ ] Include the letter, criteria checklist, the numbers used, and the chart
- [ ] Include sector context and the model label where present
- [ ] Confirm dark mode doesn't leak into the printed output

---

## Known limitation — not fixable in code

**~16% of cached stocks can't be graded at any effort.** `RY`, `TD`, `TSM`,
`CNQ`, `BRK.A` and similar return **zero** annual reports from Finnhub's free
tier — they're foreign private issuers filing 40-F / 20-F rather than 10-K, so
no US XBRL data exists to grade.

Closing that gap means a paid Finnhub tier or a second provider for foreign
listings. That's a data-sourcing decision, not an engineering one. The provider
abstraction makes the swap a one-file change if it's ever worth doing.

Realistic ceiling with everything above shipped: **~80% of cached stocks graded**,
up from 74% today.
