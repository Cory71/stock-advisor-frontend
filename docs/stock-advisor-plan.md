# StockGrader — Capstone Project Plan

> **Repos:** [`stock-advisor-frontend`](https://github.com/Cory71/stock-advisor-frontend) (React + Vite) and [`stock-advisor-backend`](https://github.com/Cory71/stock-advisor-backend) (Express API). User-facing product name: **StockGrader**.

## 1. Project Overview

A web application that grades publicly traded stocks on an **A–F scale** based on five fundamental financial criteria sourced from Yahoo Finance. The user enters a ticker symbol (e.g. `AAPL`), the app fetches the relevant financial data, evaluates the five criteria, and returns a clear letter grade with the underlying yes/no answers and supporting numbers.

The goal is to give a non-expert investor a fast, opinionated, easy-to-read read on a stock's fundamental health without having to interpret financial statements themselves.

## 2. Problem & Target Audience

- **Problem:** Retail investors are flooded with noisy data on Yahoo Finance, but most don't know which numbers actually matter or how to combine them into a decision.
- **Target audience:** Beginner-to-intermediate retail investors who want a quick "is this stock fundamentally healthy?" check before researching further.
- **Value:** Reduces 5 different financial-statement questions into one letter grade plus a transparent breakdown.

## 3. The Grading Algorithm

All five criteria map directly to columns/rows on the Yahoo Finance income statement and cash flow statement pages (e.g. `finance.yahoo.com/quote/AAPL/cash-flow`), so the app's job is to read the same numbers a human user would and apply the rules below.

### 3.1 The five criteria (each is a yes/no)

1. **Topline revenue growth (long-term):** Is the **latest** annual revenue greater than the **earliest** annual revenue available? (income statement, annual columns)
2. **Recent revenue growth (TTM):** Is the **TTM** revenue column higher than the most recent full fiscal year? (income statement, TTM vs latest annual column)
3. **Net positive free cash flow:** Is the most recent **Free Cash Flow** value positive? (cash flow statement, "Free Cash Flow" row, latest column)
4. **Free cash flow growth (long-term):** Is the **latest** annual Free Cash Flow greater than the **earliest** annual Free Cash Flow available?
5. **Recent free cash flow growth (last year):** Is the **TTM** Free Cash Flow column higher than the most recent full fiscal year?

**"Growth" rule (criteria 1 and 4):** "latest annual > earliest annual" over the years Yahoo provides. We chose this over strict every-year-up because it still rewards companies that had a single down year (e.g. Apple's 2018→2019 free cash flow dip) without giving them a free pass on their overall direction.

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

- The letter grade (large, color-coded).
- All five criteria as a checklist with ✓ / ✗.
- The actual numbers used for each check (so the user can verify and learn).
- The data source / "as of" date.

## 4. Core Features (MVP)

- **User accounts:** Email/password sign-up and login (Passport Local), plus **"Sign in with Google"** via Passport OAuth (server-side redirect flow). Both strategies create the same session cookie, so the rest of the app doesn't care how the user signed in. All history and watchlists are scoped per-user.
- **Ticker lookup:** Enter a symbol, get a graded result.
- **Grade card:** Letter grade + 5-criteria breakdown + raw numbers.
- **Saved watchlist:** Add a ticker to a personal watchlist; revisit grades without re-typing.
- **Recent searches / history:** Last 20 tickers the user looked up (per user, stored in MongoDB).
- **Comparison view:** Look up 2–3 tickers side-by-side.
- **Responsive UI:** Works on desktop and mobile browsers.

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
- **Auth:** [Passport.js](https://www.passportjs.org/) with two strategies that both end in the same session cookie:
  - **[`passport-local`](https://www.passportjs.org/packages/passport-local/):** email/password, with [`bcryptjs`](https://www.npmjs.com/package/bcryptjs) for password hashing.
  - **[`passport-google-oauth20`](https://www.passportjs.org/packages/passport-google-oauth20/):** server-side OAuth redirect flow. The frontend hits `/api/auth/google`, the backend redirects to Google, Google redirects back to `/api/auth/google/callback`, and Passport either creates a user (first-time Google login) or finds the existing one. Either way the user ends up with a session cookie.
  - **Sessions:** [`express-session`](https://www.npmjs.com/package/express-session) with [`connect-mongo`](https://www.npmjs.com/package/connect-mongo) so sessions persist in MongoDB across server restarts. Protected routes use a single `req.isAuthenticated()` middleware regardless of how the user signed in.
- **Data source:** Yahoo Finance via the [`yahoo-finance2`](https://www.npmjs.com/package/yahoo-finance2) npm package (unofficial but well-maintained — ~100k weekly downloads, active maintainers, ~13 years of community track record between it and its predecessor). Free, no API key, works for any US ticker.
- **Provider abstraction:** All Yahoo calls live behind a thin `StockDataProvider` interface (one method for the income statement, one for the cash flow statement). The grading logic depends on the interface, not on Yahoo. If `yahoo-finance2` ever breaks unannounced, we can swap to Financial Modeling Prep ($22/mo Starter tier as the realistic paid fallback) by writing one new provider class — no changes to the grader, routes, or UI.
- **Testing:** Jest + React Testing Library (frontend), Mocha + Chai (backend; Supertest for HTTP endpoint tests).
- **Deployment:** Frontend on Vercel or Netlify; backend on Render or Railway; MongoDB Atlas for the DB.

## 7. Architecture & Data Flow

```text
[ React UI ]  --HTTP-->  [ Express API + Passport ]  --[ StockDataProvider ]--> [ yahoo-finance2 ] --> [ Yahoo Finance ]
       |                       |                       (interface;
       |                       |                        FMP swap-in
       |                       |                        if needed)
       |                       |
       |                       +--OAuth redirect--> [ Google OAuth ] --redirect back--> /api/auth/google/callback
       |                       |
       |                       +--Mongoose-->  [ MongoDB Atlas ]
       |                                          (users + sessions + stock cache + history + watchlists)
       +--reads grade JSON, renders grade card
       +--"Sign in with Google" link --> backend /api/auth/google (server handles the rest)
```

Frontend state layout:

- **`AuthContext`** (provided at the app root, consumed via a `useAuth()` hook) — current user object, `login()`, `logout()`, and a "loading" flag while the initial `/api/auth/me` call resolves on app load.
- **Per-page server data** (grade results, watchlist, history) — fetched on mount with `useEffect`, stored in local component state, re-fetched on user action. No global cache in the browser; the canonical cache is in MongoDB.
- **Form state** (ticker search input, login/signup forms) — local `useState` inside the form component.

Request flow for a grade lookup:

1. User submits ticker in the React UI.
2. Frontend calls `GET /api/grade/:ticker`.
3. Backend checks MongoDB for a recent cached result (e.g. < 24h old).
4. If miss, fetch income statement + cash flow statement from Yahoo Finance.
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
  - `grade` (A/B/C/D/F)
  - `criteria` (array of 5 objects: `{ name, passed, value, prior, source }`)
  - `rawData` (raw revenue & free cash flow snapshots, including TTM)
  - `gradedAt` (date)

- **`searchHistory`** — per-user recent lookups
  - `userId` (indexed)
  - `ticker`
  - `searchedAt`

- **`watchlists`** — per-user saved tickers
  - `userId` (indexed)
  - `ticker`
  - `addedAt`

## 9. API Endpoints (initial)

Auth (Passport-based):

- `POST /api/auth/register` → hash password with bcrypt, create user, log in via Passport, return session cookie.
- `POST /api/auth/login` → authenticate email/password through `passport-local`, return session cookie.
- `GET /api/auth/google` → kicks off the Google OAuth redirect flow (`passport.authenticate('google')`).
- `GET /api/auth/google/callback` → Google redirects back here; Passport creates or finds the user and starts the session.
- `GET /api/auth/logout` → `req.logout()` and clear the session.
- `GET /api/auth/me` → returns `req.user` (used by the frontend on load).

Grading:

- `GET /api/grade/:ticker` → graded result for a ticker (auth required; also records to user's history).
- `GET /api/compare?tickers=AAPL,MSFT,GOOG` → graded results for multiple tickers.

User data:

- `GET /api/history` → current user's recent lookups.
- `GET /api/watchlist` → current user's watchlist with grades.
- `POST /api/watchlist` → add a ticker.
- `DELETE /api/watchlist/:ticker` → remove a ticker.

## 10. UI Pages / Components

- **Sign-up / Login pages:** email + password form **and** a "Sign in with Google" link that hits `GET /api/auth/google` (Passport handles the OAuth redirect server-side).
- **Home / Search page:** ticker input + recent searches (per logged-in user).
- **Grade detail page:** letter grade, criteria checklist, raw numbers, "graded at" timestamp, "Add to watchlist" button.
- **Watchlist page:** user's saved tickers with their current grades.
- **Compare page:** side-by-side grades for 2–3 tickers.
- **Shared components:** `<GradeBadge />`, `<CriteriaList />`, `<TickerSearch />`, `<Loading />`, `<ErrorBanner />`, `<NavBar />` (with login state).

## 11. Milestones

See [`classplan.md`](./classplan.md) for the live class-by-class tracker.

## 12. Testing Strategy

- **Unit tests** on the grading function (Mocha + Chai) — easiest, highest-value tests; cover each criterion + the score→grade mapping including edge cases (missing data, ties, 0 yeses).
- **API tests** with Supertest (driven by Mocha) for each endpoint, mocking the Yahoo Finance client.
- **Component tests** with React Testing Library for the grade card and search form.
- **Manual smoke test** across desktop + mobile browser sizes before deploy.

## 13. Risks & Open Questions

### Decided

- **Cash flow definition:** Free Cash Flow (the "Free Cash Flow" row on Yahoo's cash flow statement).
- **Zero yeses = F.**
- **User accounts:** Login is part of the MVP, not stretch.
- **Growth rule for long-term criteria (1 and 4):** "latest annual > earliest annual" over the available years.
- **Platform:** Web app (React). The capstone instructions allow React or React Native; we're choosing web for simpler deploy/demo, and the responsive layout will still work on a phone browser.
- **App name:** **StockGrader**.
- **Data source:** `yahoo-finance2` (free, any ticker, no API key). Accessed through a `StockDataProvider` interface so a paid fallback (FMP Starter, $22/mo) can be dropped in without touching grading or UI code.

### Ongoing risks

- **Yahoo Finance reliability:** `yahoo-finance2` is unofficial and can break with little notice. We'll handle this with: (a) MongoDB caching so a brief upstream outage doesn't take the app down for previously-graded tickers, (b) a clear "data unavailable for this ticker, try again later" UI state, and (c) the provider abstraction described above as our escape hatch.
- **Tickers with insufficient history:** Some newer or thinly-reported companies may not have enough annual data for criteria 1 and 4. We'll need a minimum-data threshold (e.g. at least 2 annual columns) and a graceful "not enough history to grade" message.
