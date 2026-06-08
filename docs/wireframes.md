# StockGrader — User Flow and Wireframes

> Visual version: [`wireframes.pdf`](./wireframes.pdf)

Planning artifact for the frontend. Maps every path a user can take through the app, and shows a low-fidelity sketch of every screen.

> The wireframes are deliberately rough — boxes, labels, and notes about behaviour. Visual polish comes from Bootstrap during the build phase, not from these sketches.

---

## User Flow

```mermaid
graph TD
  Start([App opens]) --> AuthCheck{Logged in?}

  AuthCheck -->|No| Login[Login]
  AuthCheck -->|Yes| Home[Home / Search]

  Login -->|Click 'Sign up' link| Signup[Signup]
  Login -->|Submit valid creds| Home
  Signup -->|Submit valid info| Home

  Home -->|Submit ticker in search| GradeDetail[Grade Detail]
  Home -->|Click an item in recent searches| GradeDetail

  GradeDetail -->|Click 'Add to watchlist'| Watchlist[Watchlist]
  GradeDetail -->|Click 'Back' / NavBar 'Home'| Home

  Watchlist -->|Click a ticker row| GradeDetail
  Watchlist -->|Click 'Remove' on a row| Watchlist

  Home -->|NavBar: Compare| Compare[Compare]
  Compare -->|Click a result column header| GradeDetail

  Home -->|NavBar: Logout| Login
  Watchlist -->|NavBar: Logout| Login
  GradeDetail -->|NavBar: Logout| Login
  Compare -->|NavBar: Logout| Login
```

**Navigation rules:**

- NavBar is visible on every screen.
- When **logged out**, NavBar shows: `StockGrader` (brand) · `Log in` · `Sign up`.
- When **logged in**, NavBar shows: `StockGrader` · `Home` · `Watchlist` · `Compare` · `Welcome, <name>` · `Logout`.

**Global page footer (added Class 6 polish):**

- Below the main content on every page, a small muted `StockGrader © <year>` line.
- Year is computed at render time from `new Date().getFullYear()` so it auto-updates each January.

---

## Wireframes

Six screens. For each one: the main element, the actions a user can take, and the four states the instructor requires (happy / loading / empty / error).

### 1. Login `/login`

```
+--------------------------------------------------------------+
| StockGrader                       [Dark]  Log in    Sign up  |  <- NavBar
+--------------------------------------------------------------+
|                                                              |
|   Log in                          |   What is StockGrader?   |
|                                   |                          |
|   [ Error alert (red, auto-       |   A quick fundamental    |
|     dismisses after 5s) ]         |   health check for any   |
|                                   |   publicly traded stock. |
|   [ Sign in with Google ]         |                          |
|   ─────── or ───────              |   Grades A through F     |
|                                   |   based on:              |
|   Email                           |    • Topline rev growth  |
|   [ ________________________ ]    |    • Recent rev (TTM)    |
|                                   |    • Positive FCF        |
|   Password                        |    • FCF growth (LT)     |
|   [ __________________ ] [o]      |    • Recent FCF (TTM)    |
|                          ^eye     |                          |
|   [   Log in   ]                  |   Score: 5 = A · 0–1 = F |
|                                   |                          |
|   Don't have an account? Sign up  |   Data from Finnhub,     |
|                                   |   refreshed every 24h.   |
|                                                              |
|       ░░░▓░▓░░▓░░▓▓░░▓░░░▓░░▓░  <- candlestick band         |
|                                                              |
|                  StockGrader © 2026                          |
+--------------------------------------------------------------+
```

- **Main:** Email + password form on the left, "What is StockGrader?" explainer card on the right. The password field has a **show/hide eye toggle** (`[o]`) at its trailing edge, styled to match the input.
- **Actions:** submit form, click Google button, click the eye to reveal/hide the password, click "Sign up" link.
- **Layout:** form + card side-by-side at ≥768px; stack vertically on phones (form first).
- **States:**
  - *happy* → navigate to Home.
  - *loading* → submit button shows "Logging in…" and disabled.
  - *error* → red alert with backend message, **auto-dismisses after 5 seconds**.
  - *empty* → N/A.

### 2. Signup `/signup`

```
+---------------------------------------------+
| StockGrader                Log in  Sign up  |
+--------------------------------------------------------------+
| StockGrader                       [Dark]  Log in    Sign up  |
+--------------------------------------------------------------+
|                                                              |
|   Sign up                         |   What is StockGrader?   |
|                                   |                          |
|   [ Error alert (red, auto-       |   A quick fundamental    |
|     dismisses after 5s) ]         |   health check for any   |
|                                   |   publicly traded stock. |
|   [ Sign in with Google ]         |                          |
|   ─────── or ───────              |   Grades A through F     |
|                                   |   based on:              |
|   Display name (optional)         |    • Topline rev growth  |
|   [ ________________________ ]    |    • Recent rev (TTM)    |
|                                   |    • Positive FCF        |
|   Email                           |    • FCF growth (LT)     |
|   [ ________________________ ]    |    • Recent FCF (TTM)    |
|                                   |                          |
|   Password (≥ 6 characters)       |   Score: 5 = A · 0–1 = F |
|   [ __________________ ] [o]      |                          |
|                          ^eye     |   Data from Finnhub,     |
|   [  Create account  ]            |   refreshed every 24h.   |
|                                                              |
|   Already registered? Log in                                 |
|                                                              |
|       ░░░▓░▓░░▓░░▓▓░░▓░░░▓░░▓░  <- candlestick band         |
|                                                              |
|                  StockGrader © 2026                          |
+--------------------------------------------------------------+
```

- **Main:** Registration form on the left, "What is StockGrader?" explainer card on the right. The password field has a **show/hide eye toggle** (`[o]`) at its trailing edge, styled to match the input.
- **Actions:** submit form, click Google button, click the eye to reveal/hide the password, click "Log in" link.
- **Layout:** form + card side-by-side at ≥768px; stack vertically on phones.
- **States:**
  - *happy* → log user in automatically + navigate to Home.
  - *loading* → disabled button.
  - *error* → red alert (e.g. "email already in use"), **auto-dismisses after 5 seconds**.
  - *empty* → N/A.

### 3. Home `/`

Home has two layouts depending on whether the user is signed in. Logged-in users get recent searches; logged-out users get the "What is StockGrader?" pitch card beside the search box.

**Logged-in (recent searches):**

```
+--------------------------------------------------------------+
| StockGrader  Home  Watchlist  Compare  [Dark]        Logout  |
+--------------------------------------------------------------+
|                                                              |
|   Grade a stock                                              |
|                                                              |
|   Enter a ticker symbol or company name to get a letter      |
|   grade and a five-point breakdown.                          |
|                                                              |
|   [ e.g. AAPL or Apple        ] [  Get grade  ]              |
|                                                              |
|   ----------------------------------------------------       |
|                                                              |
|   Recent searches                                            |
|                                                              |
|   - MSFT  Microsoft Corporation              2026-06-04      |
|   - AAPL  Apple Inc.                         2026-06-04      |
|   - GOOG  Alphabet Inc.                      2026-06-01      |
|                                                              |
|       ░░░▓░▓░░▓░░▓▓░░▓░░░▓░░▓░  <- candlestick band         |
|                                                              |
|                  StockGrader © 2026                          |
+--------------------------------------------------------------+
```

**Logged-out (with About card beside search):**

```
+--------------------------------------------------------------+
| StockGrader                       [Dark]  Log in    Sign up  |
+--------------------------------------------------------------+
|                                                              |
|   Grade a stock                   |   What is StockGrader?   |
|                                   |                          |
|   Enter a ticker symbol or        |   A quick fundamental    |
|   company name to get a letter    |   health check for any   |
|   grade and a five-point          |   publicly traded stock. |
|   breakdown.                      |                          |
|                                   |   Grades A through F     |
|   [ e.g. AAPL or Apple ]          |   based on:              |
|   [  Get grade  ]                 |    • Topline rev growth  |
|                                   |    • Recent rev (TTM)    |
|                                   |    • Positive FCF        |
|                                   |    • FCF growth (LT)     |
|                                   |    • Recent FCF (TTM)    |
|                                   |                          |
|                                   |   Score: 5 = A · 0–1 = F |
|                                   |                          |
|                                   |   Data from Finnhub,     |
|                                   |   refreshed every 24h.   |
|                                                              |
|       ░░░▓░▓░░▓░░▓▓░░▓░░░▓░░▓░  <- candlestick band         |
|                                                              |
|                  StockGrader © 2026                          |
+--------------------------------------------------------------+
```

- **Main:** Ticker-or-name search box. Recent searches list when logged in; About card when logged out.
- **Actions:** submit a ticker or company name → navigate to `/grade/:query`. Click a recent search row → navigate to `/grade/:ticker`. Toggle the NavBar dark-mode switch.
- **Layout:** search + About card side-by-side at ≥768px when logged out; stack vertically on phones.
- **States:** *happy* → recent searches list (logged in) or About card (logged out) renders. *loading* → "Loading…" placeholder for recent searches. *empty* → "No searches yet — grade your first ticker above." *error* → "Couldn't load recent searches" inline message.

### 4. Grade Detail `/grade/:query`

The URL accepts either a ticker (`/grade/AAPL`) or a company name (`/grade/Apple`); the backend resolves names to the canonical ticker before fetching.

```
+--------------------------------------------------------+
| StockGrader  Home  Watchlist  Compare  [Dark]  Logout  |
+--------------------------------------------------------+
|                                                        |
|   AAPL   $310.61 USD              [Add to watchlist]   |
|   Apple Inc.                                           |
|                                                        |
|   +------------------+                                 |
|   |                  |                                 |
|   |        B         |  <- letter grade, big           |
|   |                  |                                 |
|   +------------------+                                 |
|                                                        |
|   Criteria                                             |
|   [x] Topline revenue growth (long-term)               |
|       latest: $416B   vs earliest: $394B               |
|   [x] Recent revenue growth (TTM)                      |
|       TTM: $451B      vs latest: $416B                 |
|   [x] Net positive free cash flow                      |
|       latest FCF: $101B                                |
|   [ ] Free cash flow growth (long-term)                |
|       latest: $99B    vs earliest: $111B               |
|   [x] Recent free cash flow growth (TTM)               |
|       TTM: $112B      vs latest: $101B                 |
|                                                        |
|   Graded at: 2026-06-03 08:13 (from cache)             |
|                                                        |
+--------------------------------------------------------+
```

- **Main:** Canonical ticker + share price + company name header, letter grade card, 5-criteria checklist with the actual numbers. Two optional banners sit just below the grade card:
  - an **N/A reason** (grey) when the stock can't be graded — e.g. *"Free cash flow can't be computed … normal for banks, insurers, and other financial firms"* or *"Financial data looks outdated …"*;
  - a **sector caveat** (amber) on a real grade where free cash flow is only a rough proxy — REITs, insurers, utilities (e.g. *"This is a REIT … judged on Funds From Operations …"*).
- **Actions:** "Add to watchlist" → POST `/api/watchlist` then show inline success/failure alert.
- **States:**
  - *happy* → grade + criteria render (with a sector caveat banner for REITs/insurers/utilities).
  - *N/A* → letter card shows `N/A` and the grey reason banner explains why (stale data, or a sector the revenue/FCF model doesn't fit). No criteria list.
  - *loading* → spinner with "Grading `<ticker>`…".
  - *empty* → N/A (a query is always specified by URL).
  - *error (logged out)* → friendly info alert: "Please log in to grade stocks" with Log in / Sign up buttons (no scary heading).
  - *error (logged in)* → "Couldn't grade …" red alert.

### 5. Watchlist `/watchlist`

```
+------------------------------------------------------------------------------+
| StockGrader  Home  Watchlist  Compare  [Dark]  Welcome, Cory          Logout |
+------------------------------------------------------------------------------+
|                                                                              |
|   Your watchlist                                                             |
|   The "Current" grade reflects the latest cached grade. To refresh a         |
|   ticker, open its page from the Ticker column.                              |
|                                                                              |
|   Add:  [ e.g. MSFT or Microsoft ] [ Add ]                                   |
|                                                                              |
|   Ticker | Name              | Last price   | Added     | At add | Now | Change       | |
|   ------ | ----------------- | ------------ | --------- | ------ | --- | ------------ | |
|   MSFT   | Microsoft Corp.   | $426.28 USD  | 6/3/2026  |   B    |  A  | ▲ Upgraded   | [Remove] |
|   AAPL   | Apple Inc.        | $310.61 USD  | 6/3/2026  |   B    |  B  | — No change  | [Remove] |
|   TSLA   | Tesla, Inc.       | $228.50 USD  | 6/1/2026  |   B    |  D  | ▼ Downgraded | [Remove] |
|   GOOG   | Alphabet Inc.     | —            | 5/28/2026 |   —    |  C  | — (legacy)   | [Remove] |
|                                                                              |
+------------------------------------------------------------------------------+
```

- **Main:** Table of saved tickers with company name, last cached price + currency, added date, the grade captured at add time, current cached grade, and an upgrade / downgrade / no-change indicator.
- **Actions:**
  - **Add by ticker or name** (POST `/api/watchlist`) — backend resolves names to canonical tickers and freezes the current grade as `gradeAtAdd`.
  - **Remove** a row (DELETE `/api/watchlist/:ticker`).
  - Click the ticker link → navigate to its Grade Detail (this also refreshes the cache, which propagates back to the Watchlist on next load).
- **Responsive behavior:** at phone width (`< 576px`) the four lower-priority columns (Name, Last price, Added, Grade at add) are hidden — only Ticker, Current, Change, and Remove remain visible so the table fits a 360px viewport without horizontal scroll. All 8 columns return at ≥576px.
- **States:** *happy* → table renders. *loading* → "Loading your watchlist…" *empty* → "Your watchlist is empty. Add a ticker above." *error* → red Bootstrap Alert with the failure reason.

### 6. Compare `/compare`

Two view modes once results have loaded — toggle with the **Cards / Table** buttons.

**Cards view** (default — full breakdown per stock):

```
+--------------------------------------------------------------+
| StockGrader  Home  Watchlist  Compare  [Dark]        Logout  |
+--------------------------------------------------------------+
|                                                              |
|   Compare                                                    |
|   Grade 2 or 3 stocks and see them side by side.             |
|                                                              |
|   Stock 1 [ AAPL ]  Stock 2 [ MSFT ]  Stock 3 [ GOOG ]       |
|                                       [  Compare  ]          |
|                                                              |
|                                  [ Cards ] [ Table ]         |
|                                                              |
|   +-----------------+  +-------------------+  +------------+ |
|   |  AAPL           |  |  MSFT             |  |  GOOG      | |
|   |  Apple Inc.     |  |  Microsoft Corp.  |  |  Alphabet  | |
|   |  $310.61 USD    |  |  $426.28 USD      |  |  $355.50…  | |
|   |       B         |  |        B          |  |     B      | |
|   |---------------- |  |------------------ |  |----------- | |
|   | [x] R1          |  | [x] R1            |  | [x] R1     | |
|   | [x] R2          |  | [x] R2            |  | [x] R2     | |
|   | [x] R3          |  | [x] R3            |  | [x] R3     | |
|   | [ ] R4          |  | [x] R4            |  | [x] R4     | |
|   | [x] R5          |  | [ ] R5            |  | [ ] R5     | |
|   +-----------------+  +-------------------+  +------------+ |
|                                                              |
+--------------------------------------------------------------+
```

**Table view** (criteria as rows, stocks as columns — easier to spot where they differ):

```
+--------------------------------------------------------------+
|                                  [ Cards ] [ Table ]         |
|                                                              |
| Criterion                       | AAPL    | MSFT    | GOOG    |
|                                 | Apple…  | Micros… | Alpha…  |
|                                 | $310.61 | $426.28 | $355.50 |
|                                 |   B     |   B     |   B     |
| ------------------------------- | ------- | ------- | ------- |
| Topline revenue growth (LT)     |  Yes    |  Yes    |  Yes    |
| Recent revenue growth (TTM)     |  Yes    |  Yes    |  Yes    |
| Net positive free cash flow     |  Yes    |  Yes    |  Yes    |
| Free cash flow growth (LT)      |  No     |  Yes    |  Yes    |
| Recent free cash flow growth    |  Yes    |  No     |  No     |
+--------------------------------------------------------------+
```

- **Main:** 2–3 tickers (or company names) compared side-by-side. Toggle between **Cards** (one card per stock with full criteria list) and **Table** (criteria as rows, stocks as columns).
- **Actions:**
  - Type tickers/names + submit → fetch via `GET /api/compare?tickers=…` and render.
  - Click **Cards** / **Table** to switch view.
  - Click any stock's column header (Table) or card header (Cards) → navigate to that ticker's Grade Detail.
- **States:** *happy* → toggle + chosen view render. *loading* → spinner with "Comparing stocks…". *empty* → form sits with defaults until submitted. *error* → if one ticker fails, that single card/column shows the error message; the others still render normally.

---

## Consistency rules across all screens

- **NavBar** is identical on every screen and reflects login state.
- **Primary action button** uses the Bootstrap `primary` variant; destructive actions (`Remove`, `Logout`) use a muted style.
- **Error alerts** are a red Bootstrap `Alert` directly above the form or below the page heading.
- **Success alerts** are a green Bootstrap `Alert` directly above the affected element (e.g. "AAPL added to your watchlist.").
- **Banner auto-dismiss:** every Alert (success or error) automatically clears itself after 5 seconds via the shared `useAutoDismiss` hook, so banners never linger on screen.
- **Loading states** prefer disabling buttons + showing inline spinners over full-page blockers — feels snappier.
- **Empty states** explain *why* the list is empty and what to do next (never just a blank screen).
- **Mobile-first:** every screen should be usable at ~360px wide. Compare cards stack vertically and the Watchlist hides its lower-priority columns below 576px.
- **Decorative candlestick band** appears below the form on Home (logged out), Login, and Signup — sparse-content pages where it fills the dead space. Data-dense pages (Watchlist, Compare, Grade Detail) skip it.
- **Page footer** (`StockGrader © <year>`, muted text, year dynamic) sits at the bottom of every page.
