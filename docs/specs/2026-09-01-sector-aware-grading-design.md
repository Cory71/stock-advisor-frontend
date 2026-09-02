# Sector-Aware Grading — Design

**Date:** 2026-09-01
**Status:** Approved design, not yet implemented
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
providers/finnhubProvider.js   MODIFIED  additive bank fields only
lib/grading.js                 UNCHANGED general model, 30 tests stay green
lib/gradingBank.js             NEW       pure: bank data -> grade
lib/selectGrader.js            NEW       pure: industry -> grader
lib/sectorContext.js           NEW       pure: (metrics, baseline) -> context
models/SectorBaseline.js       NEW       per-industry medians
routes/grade.js                MODIFIED  composes; holds no grading logic
```

Every new unit is a pure function with its own tests, matching how `grading.js`
is already built. The only impure additions are the baseline collection and the
job that refreshes it.

---

## 4. Feature 1 — Bank grading

### 4.1 Routing (hard constraint)

```js
// lib/selectGrader.js
const BANK_INDUSTRIES = ['Banking'];
```

Routing is by **`industry` label from an explicit allowlist only**. It is never
inferred from data shape.

**This constraint is load-bearing.** The tempting broader rules both cause
regressions in stocks that grade correctly today:

| Ticker | Industry | Grade today | Under a broad rule |
| --- | --- | --- | --- |
| MA | Financial Services | **A** | would change |
| V | Financial Services | **B** | would change |
| SOFI | Financial Services | **D** | would change |
| NNN | Real Estate | N/A | wrongly bank-graded |
| SYRE | Biotechnology | N/A | wrongly bank-graded |

Visa and Mastercard are payment networks, not banks — real revenue, real FCF,
grading correctly. A no-FCF-shaped rule would also sweep in a REIT and a biotech.

`Banking` currently contains `JPM`, `BAC`, `RY`, `TD` — all four already `N/A`,
so **zero currently-graded stocks change**.

Of those four, only `JPM` and `BAC` actually become gradeable. `RY` and `TD` are
Canadian and return no filings at this tier (§2.2), so they stay `N/A` regardless
of the model. The bank grader's real yield on the current cache is **2 stocks**;
its wider value is that bank tickers are among the most commonly searched, so the
gap is disproportionately visible relative to its share of the cache.

Adding an industry to `BANK_INDUSTRIES` later is a deliberate act that must be
accompanied by the regression test in §7.

### 4.2 Provider changes (hard constraint)

Bank concepts go in **new, separate** `BANK_*` arrays.

**`REVENUE_CONCEPTS` must not be modified.** Revenue is resolved with
`findLargestValue`, which takes the largest value across all matching concepts —
adding an entry there could silently change a non-bank's revenue and shift its
grade. Same reasoning applies to `OCF_CONCEPTS` and `CAPEX_CONCEPTS`.

New fields are added to the returned object; existing fields and their resolution
logic are untouched.

```js
const BANK_NET_INCOME_CONCEPTS = [
  'us-gaap_NetIncomeLoss',
  'NetIncomeLoss',
  'us-gaap_NetIncomeLossAvailableToCommonStockholdersBasic',
  // PNC and similar file under a company prefix, e.g.
  // pnc_NetIncomeLossAvailableToCommonStockholders — matched by suffix fallback.
];

const BANK_EQUITY_CONCEPTS = ['us-gaap_StockholdersEquity', 'StockholdersEquity'];
const BANK_ASSETS_CONCEPTS = ['us-gaap_Assets', 'Assets'];
const BANK_NII_CONCEPTS    = ['us-gaap_InterestIncomeExpenseNet', 'InterestIncomeExpenseNet'];
const BANK_NONINT_INCOME   = ['us-gaap_NoninterestIncome', 'NoninterestIncome'];
const BANK_NONINT_EXPENSE  = ['us-gaap_NoninterestExpense', 'NoninterestExpense'];
const BANK_REVENUE_CONCEPTS = [
  'us-gaap_RevenuesNetOfInterestExpense',
  'us-gaap_Revenues',
  'Revenues',
];
```

**Bank revenue fallback.** When no consolidated revenue tag resolves, compute
`revenue = netInterestIncome + noninterestIncome`. This is the standard banking
definition and closed nearly every gap in testing (`USB`, `TFC`, `COF`, `FITB`,
`KEY`, `RF`, `BK` all resolved).

New fields on the provider's return value, each an array oldest → newest to match
the existing `annualRevenues` shape:

```text
annualNetIncome[]      annualEquity[]      annualAssets[]
annualBankRevenue[]    annualNoninterestExpense[]
```

### 4.3 Criteria

Five criteria, mirroring the existing model's shape so the frontend needs no
changes. Split by type, per §2.5:

**Growth criteria — absolute, no threshold:**

| # | Criterion | Test |
| --- | --- | --- |
| 1 | Book value growth | `latest equity > earliest equity` |
| 2 | Net income growth | `latest net income > earliest net income` |

**Ratio criteria — compared against the bank peer median:**

| # | Criterion | Test | Provisional median |
| --- | --- | --- | --- |
| 3 | Return on equity | `ROE > median` | 11.6% |
| 4 | Return on assets | `ROA > median` | 1.04% |
| 5 | Efficiency ratio | `efficiency < median` (lower is better) | 60.8% |

```text
ROE        = netIncome / stockholdersEquity
ROA        = netIncome / totalAssets
Efficiency = noninterestExpense / bankRevenue
```

The provisional medians are the sample medians of the 16 banks tested on
2026-09-01. They are **seed values only** — replaced by medians computed from the
seeded bank pool (§4.5) as soon as one exists, and refreshed with it thereafter.

Scoring reuses the existing `GRADE_BY_SCORE` map: 5=A, 4=B, 3=C, 2=D, 0–1=F.

### 4.4 N/A policy

The general model treats a null criterion as "no". That is safe there because
nulls are rare; it is **not** safe here, where missing concepts caused the
attempt-1 failures in §2.5.

**Rule: 2 or more null criteria → return `N/A`** with a reason, rather than a
low grade. Validated — `STT` (2 nulls) correctly returns N/A instead of a
fabricated F.

A single null still counts as "no", matching existing behaviour.

The existing freshness guard (`STALE_AFTER_MONTHS = 24`) applies unchanged.

### 4.5 Seeding the bank pool

The medians need a real pool. Extend `scripts/seed-popular.js` with ~25–30 US
banks across tiers — money-center (`JPM`, `BAC`, `WFC`, `C`), investment
(`GS`, `MS`), custody (`BK`, `STT`), and regional (`USB`, `PNC`, `TFC`, `COF`,
`SCHW`, `FITB`, `KEY`, `RF`, …).

At the existing 5s spacing this is a ~2.5 minute run, well inside the 60 calls/min
free-tier limit. Re-run when filings update, roughly quarterly.

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

---

## 7. Testing

Mirrors the existing suite (Mocha + Chai for pure functions, Supertest for routes).

**Regression test — the safety guarantee.** Run all 59 currently-graded tickers
through the new router and assert **byte-identical grades and criteria**. This is
what actually enforces §4.1 and §4.2; without it the guarantee rests on review
alone. It must fail loudly if anyone widens `BANK_INDUSTRIES` or edits a shared
concept list.

**`lib/gradingBank.js`** — each of the 5 criteria; the score→grade mapping; the
2-null N/A rule; the freshness guard; the NII + noninterest-income revenue
fallback; `STT`-shaped input returning N/A rather than F.

**`lib/selectGrader.js`** — `Banking` routes to the bank grader; `Financial
Services`, `Real Estate`, `Biotechnology`, and an absent industry all route to
the general grader.

**`lib/sectorContext.js`** — above / at / below median; suppression below 8 peers;
null-safety when a metric is missing.

**Provider** — bank concept resolution including the PNC company-prefix fallback
and the derived-revenue path.

**Route** — a bank ticker returns a bank-model grade; a non-bank is unaffected;
sector context appears only when a baseline qualifies.

---

## 8. Sequencing

1. **Free win first** — re-grade `DUK`, `NEE`, `B` to clear the stale cache. No code.
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
- **Medians shift as the pool grows.** A bank's grade can change without its
  filings changing. Mitigated by recomputing only on scheduled refreshes, never
  per request, and by storing `computedAt` on the baseline.
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
