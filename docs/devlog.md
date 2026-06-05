# StockGrader — Development Log

A week-by-week log of building StockGrader, an A–F stock grading app powered by Yahoo Finance fundamentals. Captures the work done, the obstacles hit, and what was learned along the way.

> **Repos:** [`stock-advisor-frontend`](https://github.com/Cory71/stock-advisor-frontend) · [`stock-advisor-backend`](https://github.com/Cory71/stock-advisor-backend)
> **Live app:** <https://stock-advisor-frontend.vercel.app>
> **Live API:** <https://stock-advisor-backend-j9gw.onrender.com>

---

## Week 1 — Foundation

### What I built

- Wrote the project proposal (problem, audience, MVP feature list, cost estimate). Settled on **StockGrader**: enter a ticker, get an A–F grade plus a five-point breakdown of why.
- Picked the stack: React (Vite) + Bootstrap on the frontend, Express + Mongoose on the backend, Yahoo Finance via `yahoo-finance2` for data, MongoDB Atlas for storage.
- Designed the architecture in Excalidraw (frontend → API → provider → Yahoo, with MongoDB as cache + per-user store).
- Created two GitHub repos (`stock-advisor-frontend`, `stock-advisor-backend`) with `/docs` folders and pushed initial commits.
- Wrote the detailed plan in [`stock-advisor-plan.md`](./stock-advisor-plan.md) including the grading rules, data model, and API surface.

### Challenges

- **Choosing the data source.** Yahoo Finance has no official API. I evaluated `yahoo-finance2` (free, no key, unofficial) against Financial Modeling Prep ($22/mo Starter tier). I went with `yahoo-finance2` for cost but built a `StockDataProvider` abstraction so I could swap in a paid fallback later without touching the grading code.
- **Scope creep risk.** Easy to imagine a hundred features for a finance app. Wrote a tight MVP and pushed everything else into a "Stretch Features" section.

### What I learned

- The value of a thin provider abstraction. Even before I knew Yahoo's API would break (it did, in Nov 2024 — more on that in Week 2), the abstraction kept my options open.
- How to explain a side-project idea concisely. The proposal forced me to answer "who is this for?" in plain English.

### Screenshots / milestones

- _[Add: architecture diagram from Excalidraw]_
- _[Add: first commit graph from GitHub]_

---

## Week 2 — Backend, Auth, and Grading

### What I built

- Stood up Express with `cors`, `dotenv`, and Mongoose, connected to a MongoDB Atlas cluster (reused an existing `Shopping-App-Cluster` to save on cluster count and made a new `stockgrader` database inside it).
- Built four models: `User`, `Stock` (shared 24-hour cache), `WatchlistItem`, `SearchHistory`.
- Implemented JWT auth with Passport.js (`passport-jwt` strategy). Email + bcrypt password flow. Wrote `register`, `login`, and a protected `/me` route.
- Wrote the **pure grading function** in `lib/grading.js` — five yes/no criteria, score-to-grade mapping, N/A handling for thin tickers. Covered it with 13 Mocha + Chai unit tests.
- Built the Yahoo provider (`providers/yahooProvider.js`) to fetch annual revenue, FCF, and TTM numbers.
- Wired the route handlers: `GET /api/grade/:ticker`, `GET /api/watchlist`, `POST /api/watchlist`, `DELETE /api/watchlist/:ticker`.

### Challenges

- **Yahoo Finance broke in November 2024.** The `cashflowStatementHistory` submodule of `quoteSummary` started returning only `netIncome` — Free Cash Flow disappeared from the response. Took me a while to figure out the workaround: switch to `fundamentalsTimeSeries` with `cash-flow` module, which has `freeCashFlow` directly. Lesson: this is exactly why the provider abstraction mattered. I changed one file.
- **Auth strategy iteration.** I started with raw JWT, briefly switched to Passport sessions, then went back to JWT with `passport-jwt`. The instructor updated the requirement mid-project to JWT specifically, which lined up with where I'd ended up anyway after weighing stateless vs session complexity for a deployed frontend on a different domain.
- **Postman MCP stripped test scripts.** I tried publishing my collection to Postman Cloud via MCP and the `pm.test` / `pm.environment.set` event scripts disappeared. Switched to maintaining a portable JSON export under `backend/docs/postman/` that newman can run locally.

### What I learned

- Pure functions are a gift for testing. The grading function takes data in and returns a grade out — no I/O, no async, no mocks. 13 tests in ~100 lines.
- JWT vs sessions matters more than people say. When your frontend lives on a different domain than your backend (Vercel + Render), sessions get awkward (cookies, CORS credentials). JWT in `localStorage` + `Authorization: Bearer` header just works.
- Manual ticker testing in Postman beats reading docs. I caught the FCF disappearance because I noticed `null` showing up in a real response.

### Screenshots / milestones

- _[Add: Mocha test output showing 13 passing]_
- _[Add: Postman screenshot of a successful grade lookup]_

---

## Week 3 — Frontend, Polish, Tests, and Deployment

### What I built

- Wired the whole frontend: `AuthContext`, `apiFetch` JWT helper, login/signup pages, ticker search, grade detail page, watchlist, compare page (with both Cards and Table views), recent searches on Home.
- Added **dark mode** via Bootstrap 5.3 `data-bs-theme`, persisted to `localStorage`, respecting OS preference on first visit.
- Added **Google sign-in** as a stretch — `google-auth-library` on the backend, `@react-oauth/google` on the frontend, find-or-create user by `googleId` or `email`.
- Polished the watchlist: each row now snapshots the grade at the moment of adding and compares it to the current cached grade (▲ Upgraded / ▼ Downgraded / — No change). Added share price + currency, and column-hiding below 576px so the table fits a phone.
- Added **page-level testing**: backend gained Supertest specs with `mongodb-memory-server` + `sinon`-stubbed Yahoo (37 API tests on top of the 13 grading tests). Frontend gained Vitest + RTL coverage for helpers and components (25 tests). Total: **75 tests, all green**.
- Built decorative polish: an upward-trending candlestick band on sparse pages, an "About StockGrader" explainer card beside the form on Login / Signup / logged-out Home, dynamic page titles (`AAPL · StockGrader` instead of every tab saying the same thing), auto-dismissing alerts (5-second `useAutoDismiss` hook), sticky-when-short footer.
- **Deployed**:
  - Backend → Render, with env vars (MONGO_URI, JWT_SECRET, GOOGLE_CLIENT_ID, CORS_ORIGIN, NODE_VERSION=22).
  - Frontend → Vercel, with `VITE_API_URL` pointing at Render.
  - MongoDB Atlas IP allowlist set to `0.0.0.0/0` (Render's free tier doesn't have static outbound IPs).
  - Added the Vercel URL to Google OAuth's Authorized JavaScript Origins.
  - Locked the backend CORS down from `*` to the Vercel origin via the `CORS_ORIGIN` env var.

### Challenges

- **The "Apple" bug.** Typing "Apple" in any search box gave a 404. The route's `TICKER_PATTERN` regex matched any 1–5 letter input, so `APPLE` (5 letters, all caps) was treated as a real ticker — Yahoo doesn't know `APPLE`, only `AAPL`. The fix was a fallback: if `getStockData` fails, try the Yahoo search endpoint with the raw query. Same trap quietly caught `Tesla`, `Cisco`, `Meta`. Lesson: regex feels like a great cheap optimisation until the data lies to it.
- **Test flake from parallel execution.** My Compare-page test asserted "the third ticker errored" but the route runs all three lookups via `Promise.allSettled` — call order isn't guaranteed. The fix was switching from `onCall(N)` to `withArgs('NOPE')`, matching by argument instead of position. Non-deterministic tests are worse than always-failing ones because they pass in CI most of the time.
- **Vercel SPA routing.** First production deploy worked for `/`, but `/signup` and `/grade/AAPL` returned 404 — Vercel served `signup.html` instead of letting React Router take the URL. Fix: a tiny `vercel.json` rewriting every path to `/index.html`. Now deep links and refreshes work.
- **Module imports + sinon stubs.** API tests didn't intercept the Yahoo client at first because each route file did `const { getStockData } = require('../providers/yahooProvider')` — destructuring at require time captures the function reference, which sinon's later `.stub()` can't replace. Changing to namespace imports (`const yahooProvider = require('...')` and `yahooProvider.getStockData(...)`) fixed it.

### What I learned

- **Sticky footers in 4 lines of CSS.** I'd always assumed sticky-when-short, in-flow-when-long was a fancy layout. It's `html, body, #root { min-height: 100vh; } #root { display: flex; flex-direction: column; } main { flex: 1 0 auto; }`. That's it.
- **Tests don't have to slow you down.** The 75-test suite runs in ~10 seconds across both repos. Every time I touched the watchlist resolution code I knew within seconds whether I'd broken something.
- **Real bugs only show in production-shaped environments.** The SPA-routing 404 wouldn't have shown up locally because Vite's dev server already does the fallback. First Vercel deploy = first time the app behaved like a real static-hosted SPA.
- **Cold starts are real.** Render's free tier spins down after 15 minutes — the first request takes 30–60 seconds. Worth noting in the README and in any demo plan.

### Screenshots / milestones

- _[Add: live app screenshot — Home page on stock-advisor-frontend.vercel.app]_
- _[Add: live grade page for AAPL showing the B grade + 5 criteria]_
- _[Add: Render deploy log with "Your service is live" line]_
- _[Add: Vercel deploy "Production READY" output]_
- _[Add: full test suite output, 75 passing]_

---

## Wrap-up

By the end of Week 3 the app is **live, deployed, and tested**. The whole stack — Vercel ↔ Render ↔ MongoDB Atlas ↔ Yahoo Finance — proven end-to-end via a smoke test: sign up on the live site → grade AAPL → see the cached grade with full criteria + price.

### Things I'd do differently next time

- Set up the Vercel + Render deployment **earlier**, even with placeholder pages. The two real bugs I found at deploy time (SPA routing + CORS allowlist) would have surfaced sooner.
- Write the devlog **as I go**, not at the end. Some details from Week 1 are fuzzy three weeks later.

### Future improvements (post-capstone)

- Watchlist auto-refresh on a schedule (instead of relying on the user to revisit a ticker's page).
- Sector-relative grading.
- A "Why this grade?" plain-English explanation generated from the criteria.
- Email alerts when a watchlist ticker's grade changes.
- Charts of revenue and FCF trends.
