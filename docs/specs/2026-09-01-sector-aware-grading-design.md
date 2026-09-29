# Sector-Aware Grading — Design

**Date:** 2026-09-01 · **Revised:** 2026-09-28 (§4 rewritten before implementation)
**Status:** Feature 1 (bank grading) **built 2026-09-29** — roadmap item 5. Feature 2 — roadmap item 6.

> **What the 2026-09-28 revision changed, and why.** The criteria and N/A rule
> held up, but four things built after this spec was written made parts of §4
> wrong:
>
> 1. **The median pool didn't match the stocks being graded.** The provisional
>    medians came from 16 banks including GS, MS, SCHW, STT and BK — none of which
>    Finnhub labels `Banking`, so the router would never bank-grade them. The pool
>    is now the `Banking`-labelled stocks only (14), and the medians were
>    recomputed from them.
> 2. **The spec never said where medians live.** With the daily refresh (roadmap
>    item 2) re-grading every stock each morning, live-computed medians would let a
>    bank's grade flip because *other* banks moved — and once email alerts exist,
>    that's false "your grade changed" emails. Medians now live in a committed
>    file, updated deliberately.
> 3. **Bank figures can't reuse `parseAnnualReports`,** which drops any year
>    without a matching revenue concept — USB and TFC have none. Banks get their
>    own parser, reusing the year de-duplication and calendar-year window built
>    since.
> 4. **The trend chart (built after this spec) would mislead for banks** — every
>    cash-flow bar missing, with a caption implying broken data. Bank-graded
>    stocks chart revenue and net income instead.
>
> It also surfaced one thing the original argument got wrong — see §4.4.
**Implementation repo:** `stock-advisor-backend` (this doc lives with the other planning docs in the frontend repo)

---

## 1. Goal

Today StockGrader grades every stock on one model: five yes/no criteria built from
revenue and free cash flow. Companies the model doesn't fit — banks above all —
return `N/A` instead of a grade.

This design does two things:

1. **Grade banks** using criteria that suit them, so fewer stocks come back `N/A`.
2. **Add sector context** to stocks that already grade, so a REIT is compared with
   REITs rather than with software companies.

The A–F letter from the existing model is **not replaced**. Sector context is
added alongside it.

---

## 2. Evidence

Measured against the live `stockgrader` MongoDB cache (80 stocks) and the Finnhub
free tier on 2026-09-01. Every number below came from the real data, not estimates.

### 2.1 Why stocks currently fail to grade

| Cause | Count | Share | Fixable? |
| --- | --- | --- | --- |
| Graded today | 59 | 74% | — |
| Insufficient history | 13 | 16% | **No** — see 2.2 |
| No FCF (bank / REIT-like) | 5 | 6% | Yes — this design |
| Stale cache | 3 | 4% | Yes — just re-grade |

The five no-FCF stocks are `JPM`, `BAC`, `NNN`, `SYRE`, `UUU`.
The three stale ones are `DUK`, `NEE`, `B` — these need no new code, only a refresh.

### 2.2 The ceiling this design cannot lift

`RY`, `TD`, `TSM`, `CNQ`, and `BRK.A` return **zero annual reports** from
Finnhub's free tier. They are foreign private issuers filing 40-F / 20-F rather
than 10-K, so no US XBRL data exists at this tier. Every one of the 13
"insufficient history" stocks is this same case.

**Realistic outcome: 74% → ~80% graded.** Going beyond that requires a paid
Finnhub tier or a second provider for foreign listings. That is a data-sourcing
decision, not an engineering one, and is out of scope here.

### 2.3 Peer pools are small

The 80 cached stocks spread across **29** Finnhub industry labels. The largest
pool is 9 (Media, Technology). Finnhub's labels are granular — `Banking` is
separate from `Financial Services`, `Semiconductors` from `Technology` — which
fragments peers badly. This drives two decisions in §5: report a **median**
rather than a percentile, and suppress the comparison below a minimum peer count.

### 2.4 Bank metrics are available and correct

All required concepts exist on the free tier. Spot-checked across 16 US banks;
the computed figures match reality (Citi's weak 6.7% ROE, Goldman's 0.7% NIM as
an investment bank, JPM's 52.4% efficiency ratio).

### 2.5 Two calibration failures worth recording

Both were found by testing against real filings, and both shaped the final design.

**Attempt 1 — absolute thresholds (ROE > 10%, efficiency < 60%, NIM > 2%):**
produced 7 D's and 2 F's out of 16. Two flaws:

- Missing concepts counted as failures. 9 of 16 banks had 1–2 unresolvable
  criteria, so `TFC` and `STT` scored F largely for *data gaps*, not performance.
- NIM measures business *model*, not quality. `GS` 0.7%, `MS` 0.7%, `STT` 0.8%
  are investment and custody banks that don't do deposit lending.

**Attempt 2 — NIM swapped for ROA, revenue derived as NII + noninterest income:**
concept coverage largely fixed and `STT` correctly returned N/A. But ROA clustered
lethally around the 1.0% threshold:

```text
WFC 0.99   KEY 0.99   GS 0.95   TFC 0.91   BAC 0.89
```

`WFC` and `KEY` scored **F** by missing the bar by 0.01pp. A threshold sitting on
top of the peer cluster is a coin flip, not a grade.

**Conclusion.** The existing five criteria are *growth comparisons*
(`latest > earliest`) with no constant to tune — which is exactly why that model
has never needed calibration. Bank ratios are *threshold tests*, and any constant
picked by hand lands in the middle of the cluster. Therefore ratio criteria
compare against the **peer median**, derived from filings.

---

## 3. Architecture

```text
providers/finnhubProvider.js    MODIFIED  bank parser + additive bank fields
lib/grading.js                  UNCHANGED general model
lib/gradingBank.js              NEW       pure: (bank data, medians) -> grade
lib/selectGrader.js             NEW       pure: industry -> grader
lib/bankMedians.json            NEW       committed medians + the pool they came from
scripts/compute-bank-medians.js NEW       recomputes the file from the cache
models/Stock.js                 MODIFIED  adds `model: 'general' | 'bank'`
routes/grade.js, watchlist.js,  MODIFIED  compose via selectGrader; no grading logic
  compare.js, lib/refreshCache
lib/sectorContext.js            NEW       (Feature 2) pure: (metrics, baseline) -> context
models/SectorBaseline.js        NEW       (Feature 2) per-industry medians
```

Every new unit is a pure function with its own tests, matching how `grading.js`
is already built. `gradingBank` receives the medians as an argument rather than
reading them itself, so it stays pure and tests can pass any medians they like.

**Every place that grades must go through `selectGrader`** — the grade route, the
watchlist, compare, and the daily refresh (`lib/refreshCache.js`). If one path
keeps calling `gradeStock` directly, a bank gets a bank grade on its own page and
N/A on the watchlist.

---

## 4. Feature 1 — Bank grading

### 4.1 Routing (hard constraint)

```js
// lib/selectGrader.js
const BANK_INDUSTRIES = ['Banking'];
```

Routing is by **`industry` label from an explicit allowlist only**. It is never
inferred from data shape.

**This constraint is load-bearing.** Broader rules regress stocks that grade
correctly today:

| Ticker | Industry | Grade today | Under a broad rule |
| --- | --- | --- | --- |
| MA | Financial Services | **A** | would change |
| V | Financial Services | **B** | would change |
| SOFI | Financial Services | **D** | would change |
| NNN | Real Estate | N/A | wrongly bank-graded |
| SYRE | Biotechnology | N/A | wrongly bank-graded |

Visa and Mastercard are payment networks, not banks — real revenue, real FCF.
Investment and custody banks (GS, MS, SCHW, STT) are labelled `Financial
Services` too and stay on the general model (currently N/A). That's accepted:
their economics differ enough (Goldman's net interest margin is 0.7%) that
grading them against deposit banks would be its own mistake.

In today's cache `Banking` holds `JPM`, `BAC`, `RY`, `TD` — all N/A, so **no
currently-graded stock changes**. `RY` and `TD` are Canadian with no filings at
this tier and stay N/A. Seeding (§4.7) adds 12 more.

Widening `BANK_INDUSTRIES` later is a deliberate act that must come with the
regression test in §7.

### 4.2 Provider — a separate bank parser

**Bank figures cannot piggyback on `parseAnnualReports`.** That parser drops any
year without a matching revenue concept, and USB and TFC report none — their
bank arrays would come back empty. Add `parseBankReports(reports)` alongside it.

It must reuse the two safeguards built after this spec:

- **One report per year.** Combined filings return a report per registrant (item
  0). Keep the report with the **largest total assets** — the parent's
  consolidated balance sheet — and take every other bank figure from that same
  report.
- **Calendar-year window.** Pass the result through `withinLookback` (item 1), so
  a bank with a missing year isn't judged over a longer span than its peers.

**`REVENUE_CONCEPTS`, `OCF_CONCEPTS` and `CAPEX_CONCEPTS` are not touched.** Bank
concepts live in their own arrays, so no non-bank's figures can move.

```js
const BANK_NET_INCOME_CONCEPTS = [
  'us-gaap_NetIncomeLoss',
  'NetIncomeLoss',
  'us-gaap_NetIncomeLossAvailableToCommonStockholdersBasic',
];
// Fallback when none match: a company-prefixed
// *_NetIncomeLossAvailableToCommonStockholders concept (PNC files this way).

const BANK_EQUITY_CONCEPTS  = ['us-gaap_StockholdersEquity', 'StockholdersEquity'];
const BANK_ASSETS_CONCEPTS  = ['us-gaap_Assets', 'Assets'];
const BANK_NII_CONCEPTS     = ['us-gaap_InterestIncomeExpenseNet', 'InterestIncomeExpenseNet'];
const BANK_NONINT_INCOME    = ['us-gaap_NoninterestIncome', 'NoninterestIncome'];
const BANK_NONINT_EXPENSE   = ['us-gaap_NoninterestExpense', 'NoninterestExpense'];
const BANK_REVENUE_CONCEPTS = ['us-gaap_RevenuesNetOfInterestExpense', 'us-gaap_Revenues', 'Revenues'];
```

**Bank revenue fallback:** when no revenue concept matches, `revenue = net
interest income + noninterest income` — the standard banking definition. All 14
pool banks resolve every figure with these lists (checked 2026-09-28).

New fields on the provider's return value, additive, oldest → newest, with their
own year list so the chart can join on year:

```text
annualBankYears[]   annualNetIncome[]   annualEquity[]   annualAssets[]
annualBankRevenue[] annualNoninterestExpense[]
```

### 4.3 Criteria

Five, mirroring the general model's shape so the grade card needs no layout
change.

**Growth — absolute, no threshold:**

| # | Criterion | Passes when |
| --- | --- | --- |
| 1 | Book value growth | latest equity > earliest equity (in the window) |
| 2 | Net income growth | latest net income > earliest net income |

**Ratios — against the bank median (§4.5):**

| # | Criterion | Formula | Median (14 banks) |
| --- | --- | --- | --- |
| 3 | Return on equity | net income ÷ equity | 10.5% |
| 4 | Return on assets | net income ÷ total assets | 1.00% |
| 5 | Efficiency ratio *(lower is better)* | noninterest expense ÷ bank revenue | 60.7% |

Ratios use the latest year. Scoring reuses `GRADE_BY_SCORE`: 5=A, 4=B, 3=C,
2=D, 0–1=F.

### 4.4 Decision to confirm before coding — coin flips at the median

The original argument (§2.5) was that medians escape the "knife-edge" of fixed
thresholds, where WFC and KEY failed ROA by 0.01pp. **That's only half true.**
Medians fix *where the line comes from*; they don't fix *coin flips near it*,
because a median sits in the middle of the cluster by definition. With the
Banking-only pool, four banks sit within 0.02pp of the 1.00% ROA median:

```text
HBAN 0.98   WFC 0.99   KEY 0.99   ZION 1.01
```

A strict `> median` rule passes ZION and fails the other three, on differences
that are noise.

**Recommended: a 5% tolerance band.** A ratio passes unless it's *clearly* worse
than the typical bank — ROE and ROA at least 95% of the median, efficiency at
most 105% of it. The criterion then reads "not clearly below the typical bank",
which is what a beginner would expect it to mean.

| Criterion | Strict `> median` passes | With 5% band passes | Still fails with band |
| --- | --- | --- | --- |
| ROE (≥ 9.98%) | 7 of 14 | 8 of 14 | C, CFG, TFC, KEY, HBAN, MTB |
| ROA (≥ 0.95%) | 7 of 14 | 10 of 14 | C, CFG, BAC, TFC |
| Efficiency (≤ 63.7%) | 7 of 14 | 11 of 14 | WFC, C, CFG |

The band is itself a chosen number, but it's a *tolerance relative to the peer
median*, not an absolute bar — it doesn't reintroduce the original problem. The
honest cost: a few more banks pass, so bank grades skew slightly higher than
under a strict median. **Default if not overridden: 5% band.**

### 4.5 Where the medians live — a committed file

```json
{
  "computedAt": "2026-09-28",
  "pool": ["BAC", "C", "CFG", "FITB", "HBAN", "JPM", "KEY", "MTB", "PNC", "RF", "TFC", "USB", "WFC", "ZION"],
  "roe": 0.105,
  "roa": 0.0100,
  "efficiency": 0.607
}
```

Stored as `lib/bankMedians.json` in the backend.

**Why a file, not a live calculation.** The daily refresh re-grades every stock
each morning. If medians were recomputed on the fly, a bank's grade could change
because *other* banks moved, with nothing in its own filings changing — and once
email alerts ship (roadmap item 9), that becomes a stream of false "your grade
changed" emails. A file means:

- grades only move for a bank's own reasons, or on a deliberate median update;
- every median change is a reviewable git diff, with the pool it came from;
- `gradingBank` stays pure — the caller passes the medians in.

`scripts/compute-bank-medians.js` recomputes the file from cached `Banking`
stocks and prints old → new, plus which banks' grades would change.

**Updated automatically once a year** (decided 2026-09-29, replacing a manual
quarterly review): a GitHub Actions job runs it every 15 April, after banks'
annual reports, and commits the file if it changed. Yearly because the medians
come from annual reports and can't meaningfully change more often. The review
step is replaced by a guard: if any median moves more than 25%, the run fails
without committing and GitHub emails the owner — a jump that size means bad
data, not a new year.

The script refuses to write a file from fewer than 8 banks, so a half-seeded
cache can't produce a median from three data points.

### 4.6 N/A policy

**2 or more null criteria → `N/A`** with a reason, not a low grade. Validated
earlier: `STT`-shaped input (2 nulls) returns N/A instead of a fabricated F. A
single null counts as "no", matching the general model. The freshness guard
(`STALE_AFTER_MONTHS = 24`) applies unchanged.

### 4.7 Seeding the bank pool

Seed once, using the existing `scripts/seed-popular.js` pattern:

```text
JPM BAC WFC C USB PNC TFC FITB KEY RF MTB HBAN CFG ZION
```

That's the full `Banking`-labelled pool. The throttle (item 4) means this can't
trip the rate limit, and **the daily refresh (item 2) keeps the seeded banks
fresh from then on** — seeding is a one-off. The only recurring task is
recomputing `bankMedians.json` (§4.5).

Order: seed → compute medians → review → commit the file → deploy the grader.
The grader needs the file to exist, so the file comes first.

### 4.8 Storing which model graded a stock

`Stock` gains `model: 'general' | 'bank'` (default `'general'`, so existing docs
need no migration). The frontend reads it to label the grade card, compare page
and chart. Without it, the UI would have to re-derive the model from the industry
label and could drift from the backend's routing.

---

## 5. Feature 2 — Sector context

### 5.1 What it reports

A **median comparison**, not a percentile.

Per §2.3 the largest peer pool is 9 stocks, where each member moves a percentile
by ~11 points — "72nd percentile" from that sample is false precision. Worse, the
cache holds whatever users happened to search, which is skewed toward large caps
and is not a representative sector sample.

A median is robust at small n and honest about what it claims:

```text
Above the median for Technology (9 peers)
```

**The peer count is always displayed.** It lets the reader judge the comparison's
weight instead of trusting a bare statistic.

### 5.2 Metrics compared

Derived from data already stored in `rawData` — no new provider calls:

- Revenue CAGR over the annual window
- FCF margin (`latest FCF / latest revenue`)
- FCF CAGR

FCF margin is the metric that most justifies the whole feature: software runs
25–30%, grocery runs 2%. Comparing those absolutely is meaningless.

### 5.3 Minimum peer count

**Below 8 peers in an industry, show nothing.** No baseline, no comparison, no
placeholder. Suppressing a weak comparison is more defensible than publishing one
built from three stocks, and it matches how the app already handles N/A and
sector caveats.

On today's cache this means only Media and Technology qualify. That is the honest
current state, and it improves as seeding grows.

### 5.4 Storage

New `SectorBaseline` collection, one document per industry:

```js
{
  industry: 'Technology',
  peerCount: 18,
  medians: { revenueCagr: 0.11, fcfMargin: 0.19, fcfCagr: 0.08 },
  computedAt: Date
}
```

Refreshed by an aggregation over the `Stock` collection grouped by industry.
`industry` is promoted to a real indexed field on `Stock`, backfilled from the
existing `rawData.industry` — **every cached stock already carries it**, so no
refetching is needed.

Baselines are recomputed after each seed run, and later by the scheduled job
already planned for watchlist auto-refresh.

### 5.5 Effect on existing grades

None. Sector context is attached as a separate field beside the grade and never
alters the letter. `AAPL` stays a B whether or not a Technology baseline exists.

---

## 6. What the user sees

**Grade card:** the existing letter and 5-criteria checklist, unchanged. Below
it, when a baseline qualifies: `Above the median for Technology (9 peers)`.

**Bank grade card:** same layout, five bank criteria in the checklist, with the
model named — e.g. `Graded on the bank model`. This matters: a bank's A means
*top half of banks on all five measures*, while AAPL's A means *grew on all five*.
Same letter, different meaning, so the difference is shown rather than hidden.

**Compare page:** where two stocks were graded by different models, the model
label appears on each card. Without it the page would silently invite an invalid
comparison.

**Trend chart (bank model):** plot **revenue and net income** instead of revenue
and free cash flow, using `annualBankYears`. Banks have no capital-expenditure
line by nature, so the general chart would show every cash-flow bar missing,
with a caption saying the filings "didn't report capital spending we could read"
— which reads as broken data. The caption for banks drops that sentence.

---

## 7. Testing

Mirrors the existing suite (Mocha + Chai for pure functions, Supertest for routes).

**Regression test — the safety guarantee.** Run every currently-graded ticker (61 at the last count)
through the new router and assert **byte-identical grades and criteria**. This is
what actually enforces §4.1 and §4.2; without it the guarantee rests on review
alone. It must fail loudly if anyone widens `BANK_INDUSTRIES` or edits a shared
concept list.

**`lib/gradingBank.js`** — each of the 5 criteria; the score→grade mapping; the
2-null N/A rule; the freshness guard; `STT`-shaped input returning N/A rather
than F; the tolerance band at, just inside, and just outside 5% (§4.4); medians
passed in, never read from disk.

**`parseBankReports`** — the derived-revenue fallback; the PNC company-prefix net
income; one report per year keeping the largest-assets report; the calendar-year
window.

**`compute-bank-medians`** — the median of an odd and an even pool; refuses fewer
than 8 banks; only `Banking`-labelled stocks count.

**Every grading path** — the grade route, watchlist, compare and daily refresh
all produce the same bank grade for the same bank.

**`lib/selectGrader.js`** — `Banking` routes to the bank grader; `Financial
Services`, `Real Estate`, `Biotechnology`, and an absent industry all route to
the general grader.

**`lib/sectorContext.js`** — above / at / below median; suppression below 8 peers;
null-safety when a metric is missing.

**Route** — a bank ticker returns a bank-model grade; a non-bank is unaffected;
sector context appears only when a baseline qualifies.

---

## 8. Sequencing

1. ~~**Free win first** — re-grade `DUK`, `NEE`, `B`.~~ Done (roadmap item 0) — and not a free win: it surfaced three provider bugs.
2. **Feature 1** — bank grading. Ships value on its own and creates the bank peer
   pool that Feature 2 needs. Until banks grade, `Banking` has no gradeable members
   to build a baseline from.
3. **Feature 2** — sector context, once pools are seeded.

Each stage is independently shippable and independently revertible.

---

## 9. Accepted trade-offs

- **A bank's letter is not comparable to a general-model letter.** Mitigated by
  labelling the model on the grade card and compare page (§6), not by pretending
  the two are equivalent.
- **Median-derived thresholds pull bank grades toward the centre.** By
  construction roughly half the pool passes each ratio criterion, so A's are
  rarer than under absolute thresholds. Accepted: the alternative is hand-picked
  constants that landed on the cluster twice (§2.5).
- **Medians go stale between deliberate updates.** Because they live in a
  committed file (§4.5), they don't track the pool day to day. Accepted: a
  quarterly update matches how often bank filings change, and the alternative
  lets grades flip for reasons unrelated to the bank itself.
- **Investment and custody banks stay N/A.** GS, MS, SCHW and STT aren't labelled
  `Banking`. Accepted rather than widening the router — see §4.1.
- **~16% of cached stocks stay N/A.** A Finnhub free-tier limit (§2.2), out of
  scope, and honestly reported rather than papered over.

---

## 10. Open questions

1. **Should `SOFI` be bank-graded?** It holds a bank charter but is labelled
   `Financial Services` and grades `D` today. Leaving it alone avoids a
   regression; revisit only with the §7 regression test in place.
2. **Insurers.** `PGR` grades `B` under the general model with a caveat. Whether
   insurers eventually need their own model (combined ratio, book value) is
   deferred — one cached insurer is not enough evidence to design from.
3. **Sector granularity.** 29 labels over 80 stocks fragments peers. If seeding
   doesn't lift enough industries past 8 members, consider rolling granular
   labels into broader groups. Deferred until real seeded counts exist.
