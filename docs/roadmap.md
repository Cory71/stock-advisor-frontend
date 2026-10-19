# StockGrader — Upgrade Roadmap

The post-MVP improvements, in the order I plan to build them. I check items off as
they ship, then push so the history matches the progress.

> **Status legend:** `[x]` = done, `[ ]` = not started, `[~]` = in progress
> **Repos:** [`stock-advisor-frontend`](https://github.com/Cory71/stock-advisor-frontend) · [`stock-advisor-backend`](https://github.com/Cory71/stock-advisor-backend)
> **Related docs:** [`stock-advisor-plan.md`](./stock-advisor-plan.md) · [`devlog.md`](./devlog.md) · [sector-aware grading spec](./specs/2026-09-01-sector-aware-grading-design.md)

---

## Why this order

The sequence isn't arbitrary — six real dependencies drive it:

1. **Sector baselines need a fresh cache.** Baselines are medians over cached
   `Stock` docs. Stale docs poison the medians, so auto-refresh comes before
   sector context.
2. **Anything computing a peer median needs trustworthy years first.** A stock
   with silently missing years contributes a distorted figure to every median it
   lands in, so the concept-coverage pass comes before bank grading and sector
   context — the two steps that rank stocks against each other.
3. **The Finnhub throttle goes in before features that add API calls.** Bank
   grading, sector context and alerts all increase call volume against one
   shared limit, so the limiter comes first.
4. **Email alerts need auto-refresh.** You can't alert on a grade change if
   grades only recompute when someone clicks.
5. **Email alerts also need somewhere to store an opt-in.** That's the account
   settings menu, so settings comes first — otherwise alerts would have to
   invent a settings screen anyway.
6. **"Why this grade?" and PDF export render everything else.** Building either
   before bank criteria, sector context, and charts exist means rebuilding it
   afterward. They go last.

Everything else is ordered by value-per-hour.

---

## 0. Clear the stale cache ✅

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
- [x] **Copy fix: stop telling REITs and utilities they are financial firms.** The
      "free cash flow can't be computed" message claimed the company was a bank
      or insurer, but of the six stocks that see it only `BAC` and `JPM` are —
      `NNN` is a REIT, `NEE` a utility, `SYRE` biotech, `UUU` electrical
      equipment. Reworded to cover both cases; all six re-graded so the
      corrected text is live.
- [x] 7 unit tests covering both bugs and the reworded message; suite 80 → 87
- [x] Regression check: all 59 currently-graded tickers re-fetched and re-graded
      against live Finnhub — **0 changed, 0 errors**
- [x] Verified end-to-end in the running app (local backend + Vite): `DUK` renders
      **D** with the Utilities caveat and five distinct year-over-year figures

**Outcome:**

| Ticker | Before | After | Notes |
| --- | --- | --- | --- |
| `DUK` | N/A "outdated" | **D** (2/5) | Utilities caveat now attaches correctly |
| `NEE` | N/A "outdated" | **D** (2/5) | Segment capex summed — see below |
| `B` | N/A "outdated" | N/A "outdated" | Correct: Finnhub's newest filing is 2023 |

`B` is not fixable. Barrick took the ticker from Barnes Group, so Finnhub maps it
to a filer that stopped reporting — exactly what the freshness guard exists for.

- [x] **`NEE` capex: sum the segment lines.** NextEra reports no consolidated
      capex concept, splitting it between Florida Power & Light and its
      clean-energy arm. Using only the FPL line halves the total (8.7B vs 24.1B
      for 2025) and flips free cash flow from −11.6B to +3.8B — showing a
      company in a renewables buildout as cash-generative. The rule sums both,
      **requires both to be present** (the 2021 filing omits FPL, and adding up
      the remainder invents an improving trend), and lists parts explicitly
      because `nee_CapitalExpendituresOfPublicUtility` repeats the FPL figure
      and would double-count under a pattern match.
- [x] 5 more tests; suite 87 → **92 passing**
- [x] Regression re-run after the capex change: 60 tickers, **0 changed**

**Known trade-off:** `COMPANY_CAPEX_CONCEPTS` is a per-company exception — it
fixes `NEE` only. Other segment-reporting filers (Southern, Dominion) would each
need their own entry, verified year by year. It follows the existing
`FINANCIALS_SYMBOL_ALIASES` precedent, but the map should stay small and every
entry should be justified by real filings rather than guessed.

*Yield: 2 of 3 stocks graded, plus two latent correctness bugs and one
misleading user-facing message fixed.*

---

## 1. Charts of revenue and free-cash-flow trends ✅

**Assumed pure frontend. It wasn't** — the cached data had no year labels, and
revenue and free cash flow don't always cover the same years, so the chart
needed a small backend addition first.

- [x] Chose **Recharts**, loaded with `React.lazy` so it stays out of the initial
      bundle. Inlined it pushed the entry past Vite's 500 kB warning (194 kB
      gzipped); split out, the entry is **84 kB gz** with a separate 110 kB
      chunk loaded only on a grade page.
- [x] **Backend: send `annualYears` and `annualFcfYears`.** The two value arrays
      can cover different years — a year with no readable CapEx is dropped from
      the cash-flow list, so NVIDIA has revenue for 2022–2026 and cash flow only
      for 2024–2026. Pairing them by position would plot cash flow against the
      wrong years. Purely additive, so grading was untouched.
- [x] `src/lib/chartData.js` — pure `buildTrendSeries()` joins the series **on
      the year, never on array position**; a year with no figure renders as a
      gap, not a misleading zero.
- [x] `<TrendChart />` — grouped bars on **one shared axis**, so cash flow reads
      as a real fraction of revenue. Separate axes would scale each series
      independently and could make a small cash burn look larger than revenue.
- [x] Zero reference line, so a negative cash-flow year reads below the axis
- [x] Hides itself below 2 years of labelled data — N/A stocks and pre-backfill
      docs never show an empty frame
- [x] Dark and light mode verified; 576px verified with no horizontal overflow
- [x] Plain HTML legend replaces Recharts' own, which lists the series in the
      opposite order from the bars and ignores a custom `payload`
- [x] 18 tests (frontend 34 → **52**), including the NVIDIA-shaped mismatch
- [x] Backfilled all 80 cached stocks: **0 grade moves, 0 failures**; 67 carry
      year arrays (the other 13 are the foreign issuers with no filings at all)

**Found while building, then fixed.** Duke's chart x-axis read 2019, 2020, 2021,
**2024, 2025**. (At the time this was put down to unreadable 2022/2023 filings;
item 3 later showed Finnhub simply has no report for those years.) Chasing it
turned up nine cached stocks with year gaps and two real problems:

- [x] **The chart hid its own gaps.** Bars sit evenly apart, so a missing year
      read as a normal one-year step. Coupa charts 2012, 2013, 2022, 2024, 2025
      — a *nine-year* hole that looked like a single step. The caption now names
      the missing years, collapsing runs into ranges ("2014–2021, and 2023").
- [x] **The lookback window was measured in rows, not years.** `slice(-5)` takes
      the last five *entries*, which only equals five years when none are
      missing. Coupa's five rows spanned **thirteen years**, so its long-term
      growth criterion compared 2012 against 2025 while Apple compared five —
      exactly what the cap was written to prevent. Now filtered by calendar year,
      anchored to each stock's own latest filing.
- [x] Grade impact measured across all 80 cached stocks: **1 moved.** Walmart
      C → B, because its window was 2021–2026 (six years) and its FY2021 free
      cash flow was inflated by pandemic inventory swings — a year no other
      stock's window reached. On the standard window (2022–2026, $11.1B →
      $14.9B) the cash-flow growth criterion passes honestly.
- [x] 17 more tests (frontend 52 → 64, backend 92 → 97)

This was the fifth instance in one day of the same root cause: an unmatched XBRL
concept silently dropping a year. Worth a dedicated pass over concept coverage
before it surfaces a sixth time — see the note at the end of this file.

---

## 2. Automatic watchlist refresh ✅

Stops the cache rot that item 0 cleans up by hand, and unblocks email alerts.

**The original plan was wrong for this codebase.** It assumed a cron job calling
`POST /api/watchlist/refresh` with a shared secret. That endpoint is scoped to
one user's watchlist, but the `Stock` cache is shared per ticker — refreshing
the *cache* once updates every user at the same time. So the job runs a script
straight against MongoDB instead: no endpoint, no secret header, no dependence on
the Render server being awake.

**Why a schedule, not refresh-on-login.** Considered and rejected: email alerts
(item 9) must notice a change while you're *not* in the app; every user shares
one Finnhub key (60 calls/min), so simultaneous logins would collide; and a
10-stock watchlist is ~45 seconds of work nobody should wait through. The daily
run also fixes the real gap behind the idea — the watchlist page shows cached
grades as-is, while the grade page already refreshes anything over 24 hours old
on view.

- [x] `lib/refreshCache.js` — re-grades stocks older than 20 hours, 4.5s apart
      to stay under Finnhub's limit; skips anything a user refreshed recently
- [x] One bad ticker never stops the run — failures are recorded and listed
- [x] `scripts/refresh-cache.js` (`npm run refresh`) prints a summary of grade
      changes and failures; exits non-zero only if it can't connect or *every*
      ticker fails, so an outage or bad key gets flagged but one delisted
      symbol doesn't
- [x] Schedule: **GitHub Actions**, daily at 09:00 UTC, plus a manual
      "Run workflow" button. Chosen over a Render cron job because it's free,
      logs every run, and emails on failure. Runs can't overlap.
- [x] 6 tests (backend 97 → **103**)
- [x] Real run against the live cache: 75 stale, **74 refreshed, 0 grade
      changes**, 1 failure (`IEC.AQ`, a foreign listing Finnhub refuses) —
      recorded without stopping the run, exit code 0 as intended. 353 seconds.
- [x] Added `MONGO_URI` and `FINNHUB_API_KEY` as repository secrets
- [x] First CI run **failed — and exposed a flaw in the failure rule.** The only
      stale stock was `IEC.AQ`, a foreign listing Finnhub refuses with a 403, so
      one attempt with zero successes read as an outage. A 403 can never
      succeed on retry, so it's now reported as *skipped*; the run is flagged
      only when something that could have worked didn't. Re-run passed (exit 0).
      Test suite 103 → **104**.

**Known caveat:** GitHub pauses scheduled workflows after 60 days with no repo
activity. It emails a warning first, and one click re-enables it.

**Follow-up, 19 October — grades flipping between days.** On 7–9 October the
daily run changed 18, 18 and 13 grades, many flipping straight back (NVIDIA
A → C → A, MongoDB C → A → C), then nothing changed for ten days. No code had
changed and no company had filed anything new, so Finnhub's data moved.

- [x] Ruled out duplicate quarterly reports (the first lead): none of the
      flipped stocks has any in the recent period.
- [x] Found the fragile part: every flipped stock currently fails only the two
      **TTM** criteria, or none. TTM is built from whichever quarterly report
      Finnhub returns as newest, with no check that it's the expected one — a
      quarter briefly missing from the feed shifts or nulls those two criteria.
- [x] What Finnhub sent on those days can't be recovered, so the next
      occurrence now explains itself: the daily log records which criteria
      changed and which quarter TTM was built from ("TTM built from 2027Q2 →
      2027Q1"). Backend tests 151 → 154.
- [ ] **If it recurs:** read the log. If the TTM quarter shifted, the fix is to
      check the newest quarterly report is the expected one before trusting it.

Most likely window for a repeat: late October to mid-November, when companies
file their next quarterly reports.

**Not fixed, noticed along the way:** the watchlist's manual **Refresh all**
re-grades tickers back to back with no pause. Finnhub allows 60 calls/min and
each ticker costs 4, so a watchlist of more than ~15 stocks would start getting
rate-limited. Nobody has hit it because watchlists are small; adding the pause
would make the button noticeably slower, so it's a trade-off worth deciding
deliberately rather than slipping in here. **Decided: see item 4.**

---

## 3. XBRL concept coverage pass ✅

Five times in one day a stock's data turned out silently wrong or missing, each
found by accident. This step measured the real size of that problem instead of
guessing — and the answer **overturned the assumption behind it.**

### Diagnosis — what the report found

A read-only script compared, for every cached stock, the years Finnhub returns
against the years that parse, and recorded the candidate concepts in any filing
that didn't.

| Cause | Stocks | Fixable in code? |
| --- | --- | --- |
| **Year absent from Finnhub entirely** | 13 — DUK, CCC, AMD, WMT, SHOP, MDB, HHH, VVV, DDD, NNN, UUU, SYRE, PSKY | No |
| No filings at all (foreign listings, BRK.A) | 11 | No — known limit |
| Revenue concept unmatched | 1 — PSKY 2025 | Not worth it: its only year |
| Capex concept unmatched | NVDA, NEE, NNN, SYRE, UUU | Two of them |
| Banks, no capex by nature | BAC, JPM | Item 5 |

- [x] For each cached stock, list the years that parse vs. the years Finnhub returns
- [x] Group the gaps by cause
- [x] **Correction:** the "Duke 2022/2023 revenue still unmatched" case listed
      here before was wrong. Finnhub has no Duke report for those years at all,
      so no concept could fix it. The chart caption, which told users those
      filings "couldn't be read", now says no usable annual report was available.

**The lesson is the opposite of the premise.** Concept coverage is now in good
shape — only one revenue gap remains inside any stock's window. The dominant
cause of missing years is upstream: Finnhub's free tier simply lacks some
annual reports. That can't be fixed in code, and it's why the calendar-year
lookback window (item 1) and the chart's gap caption matter: they make the app
honest about data it doesn't have.

### Fixes — what was safe, and what wasn't

- [x] **NVDA fiscal 2022–2023:** capex filed under NVIDIA's own
      `nvda_PurchasesOfPropertyAndEquipmentAndIntangibleAssets`. Added. It
      includes intangibles, so it slightly overstates capex — the cautious
      direction for free cash flow. Cash-flow years 3 → 5.
- [x] **NEE 2021:** that year FPL used a different concept name and Gulf Power
      was still reported separately. Added as a second variant — company rules
      now list variants and use the first whose required parts are all present.
      `PublicUtility` (7.41B) equals FPL segment + Gulf Power, so it stays out,
      same trap as before. Cash-flow years 4 → 5.
- [x] **Documented, not added:**
      - **NNN (REIT)** — its only candidate is *property acquisitions*: growth
        buying, not capex. Counting it would invent a free-cash-flow figure REIT
        analysts don't use. N/A plus the REIT note is the honest answer.
      - **SYRE, UUU** — no capex-like concept filed at all.
      - **PSKY** — one year in Finnhub, no revenue concept; nothing to grade.
- [x] Grade impact: the rules are keyed to NEE and NVDA, so only those two could
      move. Measured against live data: **neither did** (NVDA A, NEE D), both now
      with five years of cash flow.
- [x] 2 tests (backend 104 → **106**)

---

## 4. Throttle Finnhub calls across the whole app ✅

**The problem isn't the Refresh all button — it's that nothing paces calls.**
Every user shares one Finnhub key and one limit of 60 calls a minute, but each
request fires its calls as fast as it can. The watchlist's **Refresh all** is
just the easiest way to cross the line: a watchlist over ~15 stocks errors
partway through. Two people refreshing 8-stock watchlists at once would too,
and so would a burst of grade-page visits.

**The fix: one throttle inside `finnhubGet`.** Every Finnhub call already goes
through that single function, so a small queue there holding calls to 60 a
minute protects every feature at once — the button, the grade page, compare,
and simultaneous users. Calls wait their turn instead of failing.

| Watchlist | Refresh all today | With the throttle |
| --- | --- | --- |
| 5 stocks | ~2s | ~2s |
| 15 stocks | ~5s | ~5s |
| 30 stocks | errors partway through | ~2 minutes, all succeed |

**Why here.** Nobody has hit it yet — watchlists are small and users are few —
and a failure only means an error and a retry, nothing corrupted. So it waits
for the concept pass, which affects data users see today. But it goes before
bank grading and everything after, since those all add Finnhub calls and the
limiter should be in place before anything can push past it. Small and bounded:
about 30–45 minutes.

- [x] `lib/rateLimiter.js` — a first-come, first-served queue; `finnhubGet`
      waits for a slot before every call. Set to **55**/min rather than 60 to
      leave headroom for the daily job, which runs on GitHub and doesn't share it.
- [x] **Refresh all** skips stocks graded in the last hour, so a double click or a
      click right after the daily run costs nothing
- [x] Progress: a new `POST /api/watchlist/:ticker/refresh` refreshes one row, so
      the page calls it per row and shows "Refreshing 12 of 30…", then reloads the
      list once. Only rows on the caller's own watchlist are accepted. Partial
      failures show a calm warning ("2 of 12 couldn't be refreshed right now")
      instead of an error.
- [x] Tests: backend 106 → **115** (limiter with a fake clock, one-hour skip,
      per-row endpoint); frontend 64 → **71** (progress label and messages)
- [x] Live burst against the real API: 15 stocks at once = **60 calls, 15/15
      succeeded, 0 failed, 60.3s** — 55 went straight through and the last 5
      waited for the minute to roll over. Before this, that burst would error.
- [x] Checked in the browser: the button counted 1 of 3 → 2 of 3 → 3 of 3 and
      stamped "Updated" with no errors

One existing test changed on purpose: it added a stock and refreshed it
immediately, expecting a fresh fetch — exactly the case the one-hour rule now
skips. It backdates the stock first instead.

**Known limit:** the daily refresh (item 2) runs on GitHub's machines, not the
server, so it doesn't share this queue. It runs at 09:00 UTC and paces itself,
so a clash is unlikely but not impossible.

---

## 5. Bank grading ✅

Full design: [sector-aware grading spec](./specs/2026-09-01-sector-aware-grading-design.md) §4
(revised 2026-09-28, before any code, after four parts of the original plan were
overtaken by items 0–4).

Banks have no free cash flow in the usual sense, so the general model returned
N/A for every one of them. They now get a grade from their own model.

**Result — the 14 `Banking`-labelled banks:**

| Grade | Banks |
| --- | --- |
| A | JPM, PNC |
| B | USB, RF, MTB, HBAN |
| C | BAC, FITB, KEY, ZION |
| D | WFC |
| F | C, TFC, CFG |

RY and TD stay N/A — Canadian, no filings at this tier. Many banks fail net
income growth because 2021 was a record year (reserve releases after COVID), and
the five-year window starts there; that's accurate, not a bug.

- [x] **Step 1 — one shared grade-and-save function** (`lib/gradeAndSave.js`)
      replacing five hand-copied versions. Done first as a pure refactor: 81
      stocks re-graded through it, **0 grades moved**. Merging turned up three
      small differences between the copies (name fallback, the daily refresh not
      saving `ticker`, an old Mongoose option name) — none affected a grade.
- [x] Safety-net test: fails if anything but `gradeAndSave` calls a grader.
      Checked it really fails by planting a stray call. The one allowed
      exception is the medians script, which only *previews* grade changes.
- [x] `parseBankReports` — its own parser (USB and TFC have no revenue concept,
      so the general parser would drop every year); one report per year by
      largest total assets; the calendar-year window. Bank fields are attached
      only to `Banking` stocks, so no other stock's cached data changed.
- [x] Revenue fallback (net interest + noninterest income) and PNC's
      company-prefixed net income. **Found while checking the grades:** FITB and
      TFC file some years only as equity *including* noncontrolling interest,
      which left book value growth unreadable. Added as a fallback — for banks
      that stake is tiny. No letters changed (both banks' equity fell either way).
- [x] Seeded the 14 banks once (`npm run seed:banks`); the daily refresh keeps
      them current from here.
- [x] `lib/bankMedians.json`, written by `npm run bank-medians`: ROE **10.5%**,
      ROA **1.00%**, efficiency **60.7%** — matching the hand calculation, which
      confirmed the parser reads the filings correctly. Refuses fewer than 8 banks.
- [x] `lib/gradingBank.js` — pure, medians passed in; **5% tolerance band**
      (spec §4.4) so a ratio passes unless clearly worse than the typical bank;
      2+ unreadable criteria → N/A. Uses the banks' own report dates for the
      freshness check, since the general parser may find none.
- [x] `Stock.model` (`'general' | 'bank'`) saved with every grade and sent by
      the grade and compare routes
- [x] **Frontend:** bank-model note on the grade page; ratios printed as
      percentages ("15.7% vs typical bank 10.5%") instead of dollars; bank
      chart shows revenue + net income without the capital-spending caption
- [x] **Compare table fix, found along the way:** rows came from the *first*
      stock's criteria, so a bank compared with a non-bank showed "—" on every
      row. Rows now cover every compared stock's criteria, a stock shows "—" only
      on the other model's rows, and bank grades carry a "Bank model" tag.
- [x] **Final regression: 93 stocks re-graded, 0 non-bank grades moved**
- [x] Checked in the browser: JPM's page and an AAPL-vs-JPM compare table
- [x] Tests: backend 115 → **145**, frontend 71 → **83**

- [x] **No recurring task.** The medians update themselves once a year
      (`.github/workflows/bank-medians.yml`, 15 April, after annual reports).
      Unchanged medians → no commit. A normal change → committed automatically
      by GitHub's bot, with old → new values in the message; Render deploys it
      and the next daily refresh re-grades the banks. **Any median moving more
      than 25% → the run fails without committing** — that size of jump means
      bad data — and GitHub emails you. Yearly, not quarterly: the medians come
      from annual reports, so they can only really change once a year.

---

## 6. Sector-relative context ✅

Full design: [sector-aware grading spec](./specs/2026-09-01-sector-aware-grading-design.md) §5.

Compares a stock against its own sector's median rather than against every
company. Answers the question the app currently gets wrong by implication:
*is a 2% FCF margin bad?* For a grocer, no.

- [x] Promote `industry` to an indexed field on `Stock`, backfilled from `rawData.industry`
- [x] `models/SectorBaseline.js` — per-industry medians + peer count
- [x] Aggregation job to compute baselines, run after each seed — and after
      every daily refresh too (`npm run sector-baselines` runs it by hand)
- [x] `lib/sectorContext.js` — above / at / below median
- [x] Suppress the comparison below 8 peers (show nothing, never a weak claim)
- [x] Always display the peer count alongside the comparison
- [x] Seed broadly enough to lift more industries past the 8-peer floor
- [x] Surface on the grade card, beneath the letter

**Result: 2 industries → 9.** Before seeding, only Technology and Media had
8 graded stocks. `npm run seed:sectors` added 72 stocks (69 graded; PSX, CI
and DE came back N/A), all checked against Finnhub's industry label first.
Now shown: Semiconductors (16), Technology (15), Hotels, Restaurants & Leisure
(14), Retail (12), Energy (11), Aerospace & Defense (9), Health Care (9),
Machinery (9), Media (8). The medians look like the real world — Retail runs a
4.3% free cash flow margin, Technology 23.7%.

**Decisions.**

- *Three metrics:* revenue growth per year, free cash flow margin, free cash
  flow growth per year — all worked out from cached numbers, no new Finnhub
  calls. Growth uses the real span of years, so a missing year (Walmart has
  no 2023 report) doesn't inflate it. Growth from or to a loss has no honest
  percentage, so it's left out rather than guessed.
- *Peers counted per metric.* A stock whose free cash flow growth can't be
  worked out still counts towards the other two. Each line shows its own
  count, and a metric under 8 is hidden on its own — Media currently shows
  two lines because only 7 stocks have a usable FCF growth figure.
- *"About the median" means within one percentage point,* so a stock isn't
  called above or below over a rounding-sized gap.
- *One company counts once.* GOOG and GOOGL are both Alphabet; counting both
  would weigh it twice in an 8-stock pool. Found in the preview before seeding.
- *Only general-model stocks with a real grade.* Banks are already compared
  with banks inside their own grade, and N/A stocks have nothing to compare.
- *Looked up when the page loads, never stored on the stock,* so a cached
  grade picks up new baselines without being re-graded. It never changes the
  letter, and the card says so.

**Cost:** the daily refresh now covers ~165 stocks instead of ~93, so it takes
about 13 minutes instead of 7. The workflow's time limit went from 20 to 30
minutes.

Tests: backend 167 → **192**. Checked in the browser against real data: NVDA
(above on all three), COST (above on growth, below on margin), JPM (bank — no
comparison), F (4 Automobiles peers — hidden), PSX (N/A — hidden).

---

## 7. Richer "Why this grade?" explanations ✅

Extends today's N/A reasons and sector caveats into a plain-English explanation
generated from the criteria. Sits here because it can now describe *both* grading
models and a stock's sector standing.

- [x] Generate a sentence per criterion from its name, value, and prior
- [x] Summarize the overall grade in one line
- [x] Cover the bank model's criteria too
- [x] Fold in sector context when a baseline exists
- [x] Keep the wording beginner-friendly — no jargon without a gloss

**What it looks like.** The old "Criteria" heading is now **Why this grade?**
It opens with one line — *"NVDA passed 5 of 5 checks, which earns an A"* — plus
the sector sentence when there is one. Each criterion then gets a sentence
above its numbers, e.g. *"Free cash flow — the cash left over after paying for
operations and investments — was −$2.0B, so the company spent more cash than
it brought in."*

All of it lives in `src/lib/explainGrade.js` as pure functions. A test lists
every criterion name the backend sends and fails if one has no sentence for
pass, fail or N/A, so renaming a criterion on the backend can't quietly leave
it unexplained. Checks that couldn't be judged are called out in the summary
("counts as a miss"), because N/A scoring as zero isn't obvious.

Tests: frontend 97 → **118**.

---

## 8. Account settings menu ✅

An **Options** dropdown in the navbar gathering the controls that belong to the
person rather than to a stock — starting with the dark-mode toggle that already
exists, and adding the account actions the app currently has no home for.

Sits before email alerts on purpose: alerts need a per-user opt-in stored
somewhere, and this is the screen that owns it. Building alerts first would mean
inventing a settings surface anyway.

- [x] Options dropdown in the navbar, replacing the inline Dark toggle — the
      menu sits under the user's name and replaces the old "Welcome, …" text
- [x] Move the dark-mode toggle into it (see the discoverability note below)
- [x] **Delete my account** — with a real confirmation step
- [x] Cascade the delete: `User`, `SearchHistory`, `WatchlistItem`
- [x] Export my data — watchlist and search history, downloaded as a PDF
- [x] Clear search history — one action, keeps the account
- [x] Change display name (the field exists; only settable at signup today)
- [x] `DELETE /api/auth/me` + tests; confirm a deleted user's token stops working

**What was built.** The menu holds Dark mode, **Account settings** and Log out.
The actions live on a new `/account` page rather than in the menu itself, so
the delete has room to explain itself. New endpoints are `PATCH /api/auth/me`
(display name), `GET /api/auth/me/export` and `DELETE /api/auth/me` (both in
`routes/auth.js`, helpers in `lib/account.js`), and `DELETE /api/history`.

**Decisions.**

- *Dark toggle:* moved into the menu for signed-in users. Logged-out visitors
  have no menu, so they keep the inline switch. Flipping it inside the menu
  leaves the menu open.
- *Delete confirmation:* type the account email. The button stays disabled until
  it matches, and the server checks again (case and spaces ignored). This works
  the same way for Google and password accounts.
- *Clear history:* a second click ("Yes, clear it") confirms it.
- *Export:* never includes `passwordHash`. It records which sign-in methods the
  account has instead.
- *Export format — PDF, changed from JSON the same day.* JSON is the usual
  format for data exports, but most people can't open a .json file. The
  backend still sends JSON; the browser turns it into a PDF with readable
  dates and a table per section (`src/lib/dataPdf.js`). The PDF library
  (~139 kB compressed) loads only when the button is clicked, so it adds
  nothing to normal page loads.

Tests: 13 backend tests (suite **167**) and 14 frontend tests (suite **97**).
Checked by hand in the browser at desktop and phone widths, including a real
signup → rename → export → clear → delete run. Logging back in afterwards was
refused.

### Things to get right

**The delete must cascade, and must stop at the right boundary.** Three
collections hold per-user data — `User`, `SearchHistory`, `WatchlistItem`. The
`Stock` cache must NOT be touched: it is keyed by ticker and shared by everyone,
so deleting a user's cached grades would remove other people's data too.

**Confirmation can't rely on a password.** Google users have no `passwordHash`
at all, so "re-enter your password to confirm" fails for them. Use something
both paths share — typing the account email, or a plain two-step confirm.

**Moving the dark toggle is a real trade-off.** It's currently always visible in
the navbar, on both desktop and mobile. A dropdown tidies the bar but hides a
control people use often, and the mobile navbar layout took two rounds of fixes
already (see [`devlog.md`](./devlog.md) Week 3). Worth deciding deliberately
rather than by default — one option is to keep the toggle inline and put only
the account actions in the dropdown.

**Deleting an account is irreversible and the app has no undo.** Offering the
data export in the same menu is the honest pairing: let someone take their
watchlist and history before they remove them.

### Considered and left out for now

- **Change password** — only meaningful for email/password users, so it needs a
  branch for Google accounts that have none. Revisit if anyone asks.
- **Compare-page default view (Cards vs. Table)** — a `localStorage` nicety, not
  an account setting. Cheap, but it doesn't belong in this menu.

---

## 9. Email alerts on grade change

Depends on item 2 — without scheduled re-grading there is no change to alert on.
Also depends on item 8, which owns the per-user opt-in toggle.
The watchlist already snapshots the grade at add-time and compares it to the
current one (▲ Upgraded / ▼ Downgraded / — No change), so the detection logic
largely exists.

- [ ] Choose an email provider (free tier, low volume)
- [ ] Add the alert opt-in to the settings menu from item 8
- [ ] Detect upgrade/downgrade during the scheduled refresh
- [ ] **Only alert on a change that lasts.** On 7–9 October 2026 grades flipped
      for three days on unstable data (see item 2's follow-up). Alerting on
      every daily change would have sent dozens of false emails; waiting for a
      grade to hold for a second day before emailing filters that out.
- [ ] Send on change only — never on an unchanged grade
- [ ] Include an unsubscribe link
- [ ] Rate-limit so one bad refresh can't spam a user

---

## 10. Export a graded report as PDF ✅

Last deliberately: it renders whatever the grade card contains, so it should be
built once, after the card is final.

- [x] Choose the approach (client-side print stylesheet vs. a PDF library) —
      **a PDF library (jsPDF + jspdf-autotable)**, decided when the item 8 data
      export moved to PDF. A print stylesheet opens the print dialog and asks
      the user to pick "Save as PDF", which is confusing; the library gives a
      normal file download. Reuse `src/lib/dataPdf.js`'s pattern: build the
      content as plain data first, then draw it, loaded only on click.
- [x] Include the letter, criteria checklist, the numbers used, and the chart
- [x] Include sector context and the model label where present
- [x] Confirm dark mode doesn't leak into the printed output

**What was built.** A **Download PDF** button beside "Add to watchlist" on
every grade page saves a report such as `NVDA-report-2026-10-19.pdf`: ticker,
company, price and grading time, the letter in a coloured box, any notes (N/A
reason, bank model, sector caveat), the one-line summary, the sector comparison
table, every criterion with its "Why this grade?" sentence and numbers (Pass /
Fail coloured as on the page), the trend chart, the grade scale, and a footer
on each page. A typical report fits on one page.

**Decisions.**

- *The chart is drawn, not screenshotted.* `src/lib/pdfChart.js` works out the
  bar positions from the yearly numbers, with round gridline steps and a zero
  line, and the PDF draws plain rectangles. It stays sharp when printed, and a
  missing year is a gap rather than a zero bar, as on the page.
- *Dark mode can't leak in,* because nothing is copied from the screen and the
  colours are fixed for a white page. A test builds the same report under the
  light and dark themes and checks the files are byte-for-byte identical.
- *Content first, drawing second.* `src/lib/gradeReport.js` decides what goes
  in as plain data, reusing the page's own wording, so the report can't drift
  from what the page says. Only `src/lib/gradePdf.js` touches the PDF library,
  and it loads on click.

Tests: frontend 125 → **140**. Checked by downloading real reports for NVDA
(general model, sector comparison) and JPM (bank model, net income chart).

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
