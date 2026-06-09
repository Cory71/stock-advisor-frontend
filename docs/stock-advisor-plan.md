# StockGrader — Capstone Project Plan

> **Repos:** [`stock-advisor-frontend`](https://github.com/Cory71/stock-advisor-frontend) (React + Vite) and [`stock-advisor-backend`](https://github.com/Cory71/stock-advisor-backend) (Express API). User-facing product name: **StockGrader**.
>
> **Live app:** <https://stock-advisor-frontend.vercel.app>
> **Live API:** <https://stock-advisor-backend-j9gw.onrender.com>

## 1. Project Overview

A web application that grades publicly traded stocks on an **A–F scale** based on five fundamental financial criteria sourced from [Finnhub](https://finnhub.io/). The user enters a ticker symbol (e.g. `AAPL`), the app fetches the relevant financial data, evaluates the five criteria, and returns a clear letter grade with the underlying yes/no answers and supporting numbers.

> The project originally used Yahoo Finance via `yahoo-finance2`; it migrated to Finnhub in Week 4 after Yahoo's unofficial endpoints began rate-limiting the deployed backend. The thin provider abstraction (below) made the swap a one-file change. See [`devlog.md`](./devlog.md) Week 4.

The goal is to give a non-expert investor a fast, opinionated, easy-to-read read on a stock's fundamental health without having to interpret financial statements themselves.

## 2. Problem & Target Audience

- **Problem:** Retail investors are flooded with noisy data on Yahoo Finance, but most don't know which numbers actually matter or how to combine them into a decision.
- **Target audience:** Beginner-to-intermediate retail investors who want a quick "is this stock fundamentally healthy?" check before researching further.
- **Value:** Reduces 5 different financial-statement questions into one letter grade plus a transparent breakdown.

## 3. The Grading Algorithm

All five criteria come from a company's income statement and cash flow statement — the same numbers a human user would read off a stock's financials — applying the rules below. Finnhub returns these as raw XBRL concepts from SEC filings, which the provider normalizes into annual revenue, free cash flow, and TTM figures.

### 3.1 The five criteria (each is a yes/no)

1. **Topline revenue growth (long-term):** Is the **latest** annual revenue greater than the **earliest** annual revenue available? (income statement, annual columns)
2. **Recent revenue growth (TTM):** Is the **TTM** revenue column higher than the most recent full fiscal year? (income statement, TTM vs latest annual column)
3. **Net positive free cash flow:** Is the most recent **Free Cash Flow** value positive? (cash flow statement, "Free Cash Flow" row, latest column)
4. **Free cash flow growth (long-term):** Is the **latest** annual Free Cash Flow greater than the **earliest** annual Free Cash Flow available **and** positive? (A company that merely shrank a loss — still cash-negative — does not pass.)
5. **Recent free cash flow growth (TTM):** Is the **TTM** Free Cash Flow higher than the most recent full fiscal year **and** positive?

**"Growth" rule (criteria 1 and 4):** "latest annual > earliest annual" over the most recent **5** annual periods (capped so the long-term window is the same for every stock). We chose this over strict every-year-up because it still rewards companies that had a single down year (e.g. Apple's 2018→2019 free cash flow dip) without giving them a free pass on their overall direction.

**Free cash flow** = operating cash flow − capital expenditure. Finnhub reports CapEx as a positive amount, so FCF subtracts its magnitude. **TTM** is derived from quarterly (YTD) filings: `TTM = current YTD + (prior-year annual − prior-year same-period YTD)`.

### 3.2 Score → grade mapping

| Yes count | Grade                          |
| --------- | ------------------------------ |
| 5         | A                              |
| 4         | B                              |
| 3         | C                              |
| 2         | D                              |
| 0–1       | F                              |
| N/A       | N/A (not enough data to grade) |

### 3.3 Output for the user

For every graded stock the UI shows:

- The canonical ticker symbol (so "Apple" still resolves to `AAPL`).
- The company name and the latest share price + listing currency (e.g. `$310.61 USD`, `$112.50 CAD`).
- The letter grade (large, color-coded).
- All five criteria as a checklist with ✓ / ✗.
- The actual numbers used for each check (so the user can verify and learn).
- The data source / "as of" date.
- When applicable, a short **reason** (why a stock is N/A) or a **sector caveat note** (see §3.4).

### 3.4 Data-quality safeguards

Real-world provider data is messy, so the grader guards against misleading output:

- **Freshness guard:** if the most recent annual report is more than ~2 years old (measured from its period-end date), the data likely belongs to a defunct SEC filer — e.g. a ticker that changed hands. The stock is returned **N/A** with an explanatory `reason` rather than a stale grade.
- **Sector fit:** banks, insurers, and other financial firms have no capital expenditure, so free cash flow can't be computed — they return **N/A** with a `reason`. REITs, insurers, and utilities that *do* grade carry a `note` caveat, because revenue/FCF is only a rough proxy for those business models (they're judged on FFO, book value, regulated returns, etc.).
- **Concept robustness:** revenue uses the largest matching XBRL concept (avoids grabbing a sub-line), with a fallback for filers that only report gross "including assessed tax" revenue; CapEx matches a range of us-gaap concept variants across industries.
- **Coverage / non-US symbols:** the Finnhub free tier covers U.S.-listed stocks (NYSE/Nasdaq). A non-US symbol — e.g. a Toronto `.TO` listing — returns a clear "StockGrader currently only supports U.S.-listed stocks" message rather than a confusing error. (A shared `friendlyError` helper keeps provider internals — HTTP codes, the provider name — out of every user-facing message.)

## 4. Core Features (MVP)

- **User accounts:** Email/password sign-up and login **plus Google sign-in** via Google Identity Services. Both paths end at the same signed JWT. All history and watchlists are scoped per-user.
- **Ticker or name lookup:** Enter a ticker (`AAPL`) **or a company name** (`Apple`); the backend resolves names to canonical tickers via Finnhub's search endpoint.
- **Grade card:** Canonical ticker, company name, share price + currency, letter grade, and 5-criteria breakdown with the raw numbers used.
- **Saved watchlist:** Add a ticker; each row tracks the grade at the moment it was added vs. the current cached grade, with an upgrade / downgrade / no-change indicator, plus the company name and last known price.
- **Recent searches / history:** Last 20 tickers the user looked up (per user). Recent search rows also show the company name beside the ticker.
- **Comparison view:** Look up 2–3 tickers side-by-side. Two view modes: a **Cards** view (one card per stock with the criteria inside) and a **Table** view (criteria as rows × stocks as columns) for spotting differences at a glance.
- **Dark mode:** Bootstrap 5.3 `data-bs-theme` toggle in the NavBar; respects OS preference on first visit and persists to `localStorage`. Light mode uses a soft grey body so white cards lift off the page.
- **Responsive UI:** Works on desktop and mobile browsers; Watchlist drops lower-priority columns below 576px so the table fits a phone viewport.
- **Onboarding card:** An "About StockGrader" explainer sits beside the form on Login, Signup, and the logged-out Home — so first-time visitors immediately see the 5 criteria, score scale, and data source.
- **Auto-dismissing alerts:** Every success / error banner self-clears after 5 seconds via a shared `useAutoDismiss` hook.
- **Page footer:** `StockGrader © <year>` on every page; year computed at render time so it auto-updates each January.

## 5. Stretch Features (post-MVP)

- Watchlist auto-refresh / re-grade on a schedule.
- Charts of revenue and cash flow trends.
- Export a graded report as PDF.
- "Why this grade?" plain-English explanation generated from the criteria.
- Sector-relative grading.
- Email alerts when a watchlist ticker's grade changes.

## 6. Technology Stack

Per the capstone requirements (React, Node.js, Express, MongoDB):

- **Frontend:** React (Vite), React Router, Bootstrap (via `react-bootstrap`), fetch/axios for API calls.
- **State management:** React Context + hooks — no Redux/Zustand. An `AuthContext` holds the current user and login/logout helpers; per-page server data (grades, watchlist, history) is fetched on mount and held in local component state. Form inputs use `useState`. The persistent cache lives server-side in MongoDB, so the browser doesn't need a global store for it.
- **Backend:** Node.js + Express REST API.
- **Database:** MongoDB (via Mongoose) — stores users, cached stock data, per-user search history, and per-user watchlists.
- **Auth:** JWT-based and stateless. Two sign-in paths both end in the same signed JWT:
  - **Email + password:** [`bcryptjs`](https://www.npmjs.com/package/bcryptjs) hashes the password on sign-up; on login we compare with bcrypt, then issue a JWT signed with [`jsonwebtoken`](https://www.npmjs.com/package/jsonwebtoken).
  - **Google sign-in:** the official [Google Identity Services](https://developers.google.com/identity/gsi/web) button on the frontend returns a Google ID token; the backend verifies it with [`google-auth-library`](https://www.npmjs.com/package/google-auth-library), either creates a user (first-time Google login) or finds the existing one (matched on email or `googleId`), and issues our own JWT.
  - **Verification:** Protected routes use [Passport.js](https://www.passportjs.org/) with the [`passport-jwt`](https://www.passportjs.org/packages/passport-jwt/) strategy. Passport reads the `Authorization: Bearer <token>` header, verifies the signature with `JWT_SECRET`, looks up the user by `payload.id`, and attaches the full Mongoose user document (minus `passwordHash`) to `req.user`.
  - **Storage:** Frontend keeps the JWT in `localStorage`; every protected request sends it as `Authorization: Bearer <token>`. No sessions, no cookies, no `connect-mongo` — works cleanly across the Vercel/Render split.
- **Data source:** [Finnhub](https://finnhub.io/) via its REST API (official, free tier, 60 calls/minute with an API key). Endpoints used: `/quote` (price), `/stock/profile2` (name, currency, industry), `/stock/financials-reported` (annual + quarterly XBRL financials), `/search` (name→ticker). Accessed with the built-in global `fetch` — no SDK dependency.
- **Provider abstraction:** All data-source calls live behind a thin provider interface (`getStockData`, `resolveTicker`). The grading logic depends on the interface, not the provider. This was exercised for real in Week 4: migrating from `yahoo-finance2` to Finnhub meant writing one new file (`finnhubProvider.js`) — the grader, routes, and tests were untouched.
- **Testing:** Vitest + React Testing Library on the frontend (Vite-native, Jest-compatible syntax — chose Vitest over Jest because it integrates with the existing Vite config and runs faster). Mocha + Chai + Supertest on the backend, with `mongodb-memory-server` for isolation and `sinon` for stubbing the Finnhub provider.
- **Deployment:** Frontend on **Vercel** (free hobby tier with SPA fallback via `vercel.json`); backend on **Render** (free web service); MongoDB Atlas free M0 cluster for the database. CORS locked down to the Vercel origin via the `CORS_ORIGIN` env var in production.

## 7. Architecture & Data Flow

```text
[ React UI ]  --HTTP + Authorization: Bearer <jwt>-->  [ Express API + passport-jwt ]  --[ provider interface ]--> [ finnhubProvider ] --> [ Finnhub API ]
       |                                                    |                              (swap-in any
       |                                                    |                               data source by
       |                                                    |                               writing one file)
       |                                                    |
       |                                                    +--verify ID token--> [ Google OAuth ]
       |                                                    |
       |                                                    +--Mongoose-->  [ MongoDB Atlas ]
       |                                                                       (users + stock cache + history + watchlists)
       +--stores JWT in localStorage, reads grade JSON, renders grade card
       +--Google Sign-In button --> [ Google OAuth ] --returns ID token--> backend --returns our JWT
```

Frontend state layout:

- **`AuthContext`** (provided at the app root, consumed via a `useAuth()` hook) — current user object, `login()`, `logout()`, and a "loading" flag while the initial `/api/auth/me` call resolves on app load.
- **Per-page server data** (grade results, watchlist, history) — fetched on mount with `useEffect`, stored in local component state, re-fetched on user action. No global cache in the browser; the canonical cache is in MongoDB.
- **Form state** (ticker search input, login/signup forms) — local `useState` inside the form component.

Request flow for a grade lookup:

1. User submits ticker in the React UI.
2. Frontend calls `GET /api/grade/:ticker`.
3. Backend checks MongoDB for a recent cached result (e.g. < 24h old).
4. If miss, fetch quote + profile + annual/quarterly financials from Finnhub.
5. Run the grading function over the data → produce 5 booleans + numbers + letter grade.
6. Persist the result in MongoDB and return JSON to the frontend.

## 8. Data Model (MongoDB)

- **`users`** — accounts (either email/password or Google sign-in, or both linked by email)
  - `email` (unique, indexed)
  - `passwordHash` (bcrypt) — optional; absent for Google-only accounts
  - `googleId` (string, sparse-indexed) — optional; present when the user signed in with Google
  - `displayName` (string) — pulled from Google profile when available
  - `createdAt`

- **`stocks`** — shared cache of graded results (not per-user, since the underlying numbers are the same for everyone)
  - `ticker` (string, unique-indexed)
  - `name` (string) — company name as the provider reports it (e.g. "Apple Inc."). Optional on legacy docs.
  - `price` (number) — last known share price from Finnhub's `/quote`. Optional on legacy docs.
  - `currency` (string) — ISO code the price is quoted in (e.g. `USD`, `CAD`, `EUR`).
  - `grade` (A/B/C/D/F/N/A)
  - `criteria` (array of 5 objects: `{ name, passed, value, prior, source }`)
  - `reason` (string) — set when the stock is N/A (stale data, or a sector the model doesn't fit)
  - `note` (string) — sector caveat shown alongside a real grade (REITs, insurers, utilities)
  - `rawData` (raw revenue & free cash flow snapshots, including TTM)
  - `gradedAt` (date)

- **`searchHistory`** — per-user recent lookups
  - `userId` (indexed)
  - `ticker`
  - `searchedAt`

- **`watchlists`** — per-user saved tickers
  - `userId` (indexed)
  - `ticker`
  - `gradeAtAdd` (string) — letter grade captured at the moment the user added this ticker. Optional on legacy rows. Frozen; never overwritten.
  - `addedAt`

## 9. API Endpoints (initial)

Auth (JWT-based):

- `POST /api/auth/register` → hash password with bcrypt, create user, return a signed JWT.
- `POST /api/auth/login` → verify email/password with bcrypt, return a signed JWT.
- `POST /api/auth/google` → verify the Google ID token with `google-auth-library`, find or create the matching user, return a signed JWT.
- `GET /api/auth/me` → protected by `passport-jwt` via the `verifyToken` middleware; returns the current user.

(No logout endpoint required — the frontend logs out by deleting the JWT from `localStorage`. Optional `POST /api/auth/logout` later if we ever maintain a server-side token blocklist.)

Grading:

- `GET /api/grade/:query` → graded result for a ticker **or company name** (auth required; resolves names via Finnhub search, records to user's history).
- `GET /api/compare?tickers=AAPL,MSFT,GOOG` → graded results for 2–3 tickers or names (auth required; per-ticker errors don't break the response).

User data:

- `GET /api/history` → current user's recent lookups, enriched with the cached company name per row.
- `GET /api/watchlist` → current user's watchlist, enriched with company name, current grade, last price, and currency from the Stock cache.
- `POST /api/watchlist` → add a ticker or name (resolves and grades; freezes the current grade as `gradeAtAdd`).
- `DELETE /api/watchlist/:ticker` → remove a ticker.

## 10. UI Pages / Components

- **Sign-up / Login pages:** email + password forms plus a "Sign in with Google" button (Google Identity Services). Both forms sit beside an "About StockGrader" card on desktop, stacked on phones.
- **Home / Search page:** ticker-or-name input. Logged-in users see recent searches below; logged-out users see the About card beside the search box.
- **Grade detail page:** ticker, company name, share price + currency, letter grade, criteria checklist with raw numbers, "graded at" timestamp, "Add to watchlist" button. Logged-out visitors get a friendly login/signup prompt instead of a technical error.
- **Watchlist page:** table of saved tickers with company name, last price, added date, grade-at-add, current grade, and an upgrade/downgrade/no-change indicator. Lower-priority columns hide below 576px so the table fits a phone viewport.
- **Compare page:** 2–3 tickers (or names) side-by-side. Toggle between **Cards** view (one card per stock) and **Table** view (criteria as rows, stocks as columns).
- **Shared components:** `<TickerSearch />`, `<NavBar />` (login state + dark mode toggle), `<Footer />` (dynamic year), `<AboutCard />`, `<CandlestickFooter />` (decorative band on sparse pages), `<GoogleSignInButton />`, `<AuthContext>` / `useAuth()`, `<ThemeContext>` / `useTheme()`, `useAutoDismiss()` (5s alert auto-clear), and an `apiFetch()` helper that attaches the JWT to every request.

## 11. Milestones

See [`classplan.md`](./classplan.md) for the live class-by-class tracker.

## 12. Testing Strategy

Backend uses **Mocha + Chai + Supertest** with `mongodb-memory-server` for isolation and `sinon` to stub the Finnhub provider. Frontend uses **Vitest + React Testing Library** (Vite-native, same syntax as Jest).

- **Unit tests** on the grading function (Mocha + Chai) — 30 tests covering each criterion, the score→grade mapping, the FCF-must-be-positive growth rule, the freshness guard, sector caveats, and N/A edge cases.
- **API tests** with Supertest (driven by Mocha) for each endpoint, with the Finnhub client stubbed out — 38 tests across `auth`, `grade`, `watchlist`, `compare`, and `history` routes (68 backend total).
- **Component / helper tests** with Vitest + React Testing Library — 34 tests across the `grade` helpers, `useWarmBackend`, `<TickerSearch />`, `<AboutCard />`, `<Footer />`, `<CandlestickFooter />`, and `<PasswordInput />`.
- **Manual smoke test** across desktop (1280px) + mobile (360px) sizes — verified end-to-end via Playwright on every page.

## 13. Risks & Open Questions

### Decided

- **Cash flow definition:** Free Cash Flow = operating cash flow − capital expenditure (computed from the provider's reported cash-flow figures; Finnhub reports CapEx as a positive amount, so we subtract its magnitude).
- **Zero yeses = F.**
- **User accounts:** Login is part of the MVP, not stretch.
- **Growth rule for long-term criteria (1 and 4):** "latest annual > earliest annual" over the available years.
- **Platform:** Web app (React). The capstone instructions allow React or React Native; we're choosing web for simpler deploy/demo, and the responsive layout will still work on a phone browser.
- **App name:** **StockGrader**.
- **Data source:** **Finnhub** (official REST API, free tier, API key, 60 calls/min). Accessed through a provider interface so the data source can be swapped by writing one file — which is exactly how we migrated off `yahoo-finance2` in Week 4 when its unofficial endpoints began rate-limiting the deployed backend.

### Ongoing risks

- **Provider data quality:** Finnhub returns SEC filings as raw XBRL concepts, which vary by filer and occasionally map a ticker to a stale/defunct entity. We handle this with: (a) MongoDB caching so a brief upstream issue doesn't take the app down for previously-graded tickers, (b) a freshness guard + sector-fit checks that return a clear N/A `reason` instead of a wrong grade, and (c) the provider abstraction as our escape hatch if we ever need to switch sources again.
- **Tickers with insufficient history:** Some newer or thinly-reported companies may not have enough annual data for criteria 1 and 4. We'll need a minimum-data threshold (e.g. at least 2 annual columns) and a graceful "not enough history to grade" message.
