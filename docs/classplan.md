# StockGrader — Class-by-Class Plan

A checklist of what I want done in each of the 8 capstone classes (2 per week).
I review this after every class, then push so my GitHub history matches the schedule.

> **Status legend:** `[x]` = done, `[ ]` = not started, `[~]` = in progress
> **Repos:** [`stock-advisor-frontend`](https://github.com/Cory71/stock-advisor-frontend) · [`stock-advisor-backend`](https://github.com/Cory71/stock-advisor-backend)

---

## First Half — Foundation

### Class 1 — Project Kickoff & Proposal Workshop

- [x] Define the project idea — StockGrader (A–F grading from Yahoo Finance fundamentals)
- [x] List MVP features in [`proposal.md`](./proposal.md) — ticker lookup, grade card, accounts, watchlist, history, compare, responsive UI
- [x] Identify target audience — beginner-to-intermediate retail investors
- [x] Choose tech stack — React (Vite) + Bootstrap, Express, MongoDB Atlas, `yahoo-finance2`, JWT auth + Google Identity Services
- [x] Write cost estimate (free tier, paid tier, at-scale, dev + maintenance) in [`proposal.md`](./proposal.md)
- [x] Submit for instructor approval

---

### Class 2 — Design Phase

- [x] Create architecture diagram in Excalidraw — system + frontend tree + backend tree ([`architecture.excalidraw`](./architecture.excalidraw))
- [x] Set up GitHub repos with `/docs` folder
  - [x] Frontend repo: `stock-advisor-frontend`
  - [x] Backend repo: `stock-advisor-backend`
  - [x] Push initial commits to both
- [x] Write the detailed plan ([`stock-advisor-plan.md`](./stock-advisor-plan.md)) — grading algorithm, data model, API endpoints, milestones

---

### Class 3 — Foundation Build + Data Models

**Frontend**

- [x] Initialize Vite + React project
- [x] Install Bootstrap (`react-bootstrap`)
- [x] Create frontend README per instructor template
- [x] Add React Router and set up empty pages: `Home`, `GradeDetail`, `Watchlist`, `Compare`, `Login`, `Signup`
- [x] Build shared `<NavBar />` component (links + login-state placeholder)

**Backend — scaffold**

- [x] Scaffold Express server (`server.js`, `cors`, `dotenv`)
- [x] Install `mongoose` + add `mongoose.connect()` block to `server.js`
- [x] Create `routes/`, `models/`, `middleware/` folders (with `.gitkeep`)
- [x] Add `GET /` test route returning `{ message: 'Server is running' }`
- [x] Create backend README per instructor template
- [x] Provision MongoDB Atlas cluster (free M0) and paste the real connection string into `.env` (reused existing `Shopping-App-Cluster` with new `stockgrader` database)
- [x] Run the server and confirm it logs "MongoDB connected"

**Backend — data models** (instructor rubric: "All models defined and pushed to GitHub")

- [x] `models/User.js` — `email`, `passwordHash`, `googleId`, `displayName`
- [x] `models/Stock.js` — `ticker`, `grade`, `criteria`, `rawData` (shared grade cache; `createdAt` / `updatedAt` via timestamps)
- [x] `models/WatchlistItem.js` — `userId`, `ticker` (compound unique index on user+ticker)
- [x] `models/SearchHistory.js` — `userId`, `ticker`

**Wire-up + tooling**

- [x] Confirm frontend can call backend `GET /` locally (CORS working) — Home page renders "Backend says: Server is running"
- [x] Set up a Postman collection for testing each route as it's built — lives in Postman Cloud, plus a portable JSON export under `backend/docs/postman/` so reviewers can import it locally

---

### Class 4 — Auth, Core Routes & Grading Flow

Goal by end of class: a complete, tested backend — auth (email/password + JWT), grading flow, and watchlist CRUD — that satisfies the full Week 2 instructor rubric. (Frontend wiring + Google sign-in deliberately deferred — see Class 5 and Stretch Features.)

**Auth — JWT setup**

- [x] Install `jsonwebtoken`, `bcryptjs`, `passport`, `passport-jwt`
- [x] Generate `JWT_SECRET` (64-byte random hex) and store in backend `.env`
- [x] `middleware/passport.js` — registers the `passport-jwt` strategy: reads `Authorization: Bearer <jwt>`, verifies with `JWT_SECRET`, looks up the user, attaches the Mongoose user doc (minus `passwordHash`) to `req.user`
- [x] `middleware/authMiddleware.js` — thin wrapper around `passport.authenticate('jwt', { session: false })` that returns a friendly JSON 401 instead of plain text
- [x] `server.js` — `app.use(passport.initialize())` after JSON middleware

**Auth — routes**

- [x] `POST /api/auth/register` — bcrypt-hash password, create user, return signed JWT
- [x] `POST /api/auth/login` — bcrypt-compare password, return signed JWT
- [x] `GET /api/auth/me` (protected by `verifyToken`) — returns the current user

**Grading flow**

- [x] Write the pure grading function (5 yes/no criteria → letter grade)
- [x] Unit-test the grading function with Mocha + Chai (each criterion, score-to-grade table, N/A handling — 13 tests passing)
- [x] Build the Yahoo provider with `yahoo-finance2` (kept thin — easy to swap for FMP later)
- [x] `GET /api/grade/:ticker` (protected) — fetch → grade → cache in `stocks` (24h TTL) → respond, plus records the lookup to `searchHistory`

**Watchlist CRUD** (the "3+ CRUD routes for your main resource" rubric)

- [x] `GET /api/watchlist` (protected) — return current user's watchlist
- [x] `POST /api/watchlist` (protected) — add a ticker
- [x] `DELETE /api/watchlist/:ticker` (protected) — remove a ticker

**Postman testing**

- [x] Register → log in → `GET /api/auth/me` returns the user
- [x] `GET /api/watchlist` returns `[]` for a new user
- [x] `POST /api/watchlist` adds a ticker → `GET` shows it
- [x] `DELETE /api/watchlist/:ticker` removes it
- [x] `GET /api/grade/:ticker` returns a real grade for a logged-in user (verified with MSFT=B, AAPL=B)
- [x] Collection exported to `backend/docs/postman/` so reviewers can import it

**End-of-class check**

- [x] All Week 2 instructor rubric items satisfied — models, auth routes, 3+ CRUD routes, route protection (`verifyToken` middleware via `passport-jwt`), manual testing, 13 unit tests passing for the grading function
- [x] Push all code to GitHub

---

## Second Half — Crossing the Finish Line

### Class 5 — Frontend Wiring + Search History + Compare

**Frontend wiring** (carried forward from Class 4)

- [x] `AuthContext` + `useAuth()` hook — stores the JWT in `localStorage`, calls `/api/auth/me` on mount to hydrate the current user
- [x] Small `apiFetch()` helper that attaches `Authorization: Bearer <jwt>` to every request
- [x] Login + Signup pages: working email/password forms that hit `/api/auth/login` and `/api/auth/register`
- [x] `<TickerSearch />` input on the Home page that navigates to `/grade/:ticker`
- [x] Grade Detail page — fetch `/api/grade/:ticker`, render letter grade + criteria checklist with real numbers + "Add to watchlist" button
- [x] Watchlist page — list, "Add", "Remove" wired to the watchlist API
- [x] NavBar shows login state + logout button (logout = delete the JWT from `localStorage`)

**User-scoped extras**

- [x] Search history — `GET /api/history` endpoint + last 20 surfaced on Home page
- [x] Compare page — `GET /api/compare?tickers=AAPL,MSFT,GOOG` + side-by-side cards (graceful per-ticker error handling)

**Wireframes** (instructor's Week 3 planning requirement)

- [x] `docs/wireframes.md` — Mermaid user flow + 6 ASCII wireframes with happy/loading/empty/error states per screen
- [x] `docs/wireframes.pdf` — visual version

**Bonus polish**

- [x] Dark mode toggle in NavBar — Bootstrap 5.3 `data-bs-theme` with `ThemeContext`, persists to `localStorage`, respects OS preference on first visit
- [x] **Search by company name** — backend resolves names (e.g. "Apple") to canonical tickers via Yahoo's search endpoint; Home, Grade Detail, Watchlist, and Compare inputs all accept either form
- [x] **Company name on every page** — `Stock` model gained an optional `name` field; surfaced beside the ticker on Grade Detail, in recent-searches rows on Home, in Watchlist rows, and in Compare cards/columns
- [x] **Share price + currency** — `Stock` model gained `price` + `currency` from Yahoo's `regularMarketPrice`; displayed as `$310.61 USD` on Grade Detail, Watchlist ("Last price" column), and Compare. Cache self-heals: legacy entries missing price are re-graded on next view.
- [x] **Watchlist grade tracking** — `WatchlistItem` gained `gradeAtAdd` snapshot; GET enriches each row with current grade + company name from the Stock cache; UI shows `▲ Upgraded` / `▼ Downgraded` / `— No change` per row
- [x] **Compare table view** — toggle between Cards (one card per stock) and Table (criteria as rows × stocks as columns) for easier side-by-side reading
- [x] **Friendly logged-out prompt on Grade Detail** — instead of "Missing or invalid token", unauthenticated visitors see an info alert with Log in / Sign up CTAs

**End-of-class check**

- [x] Demo: register → log in → grade `AAPL` → add to watchlist → see it on the Watchlist page (verified end-to-end via Playwright)

---

### Class 6 — Polish + Testing

**UI polish**

- [ ] Consistent spacing, typography, and Bootstrap component usage across pages
- [ ] Color-coded grade badges (A green → F red)
- [ ] Responsive layout works on phone and desktop widths
- [ ] All forms have proper validation + error messages
- [ ] Every page handles loading and empty states cleanly

**Error handling**

- [ ] Invalid ticker → friendly message
- [ ] Yahoo Finance outage → "data unavailable, try again later"
- [ ] Insufficient history → "not enough data to grade"
- [ ] API failures → `<ErrorBanner />` (no crashes)

**Testing**

- [ ] Backend: Mocha + Chai unit tests on the grading function (already started in Class 4)
- [ ] Backend: Supertest API tests for `/api/grade/:ticker`, watchlist, history, auth
- [ ] Frontend: Jest + RTL component tests for `<GradeBadge />`, `<CriteriaList />`, `<TickerSearch />`
- [ ] Manual smoke test on Chrome + mobile width

**Devlog**

- [ ] Submit Devlog entry covering progress so far

---

### Class 7 — Deployment

**Production setup**

- [ ] Create a production MongoDB Atlas cluster (or separate database)
- [ ] Add production env vars on Render: `JWT_SECRET`, `MONGO_URI`, CORS origin; on Vercel: `VITE_API_URL` (add `GOOGLE_CLIENT_ID` + `VITE_GOOGLE_CLIENT_ID` only if Google sign-in is implemented — see Stretch Features)

**Deploy backend → Render**

- [ ] Create Render web service from the `stock-advisor-backend` repo
- [ ] Wire env vars
- [ ] Confirm `GET /` responds in production
- [ ] Note Render free-tier cold-start (30–60s) in the demo plan

**Deploy frontend → Vercel**

- [ ] Import `stock-advisor-frontend` into Vercel
- [ ] Set `VITE_API_BASE_URL` to the Render backend URL
- [ ] Confirm a real grade lookup works end-to-end in production

**Docs**

- [ ] Finalize frontend README (overview, features, install, run, env vars, live URL)
- [ ] Finalize backend README (routes list, env vars, run, deploy notes)

**End-of-class check**

- [ ] App is live, reachable by URL, signed-in lookup works

---

### Class 8 — Presentations

- [ ] Rehearse demo script: sign in → grade a ticker → add to watchlist → compare two tickers
- [ ] Walk through the architecture diagram (frontend → API → provider → Yahoo → Mongo)
- [ ] Explain the grading algorithm in plain English (5 criteria → letter grade)
- [ ] Share what was learned (auth, provider abstraction, deployment, testing)
- [ ] Have a backup plan for the Render cold-start (warm the backend before demo)
- [ ] Present

---

## Stretch Features

Optional work that isn't required for the MVP rubric. Can land in any class after frontend wiring works for email/password.

**Google sign-in** (via Google Identity Services)

- [ ] Install `google-auth-library` on the backend
- [ ] Register an OAuth Client ID in Google Cloud Console (Web application type, with `http://localhost:5173` as an authorised JavaScript origin; later add the Vercel URL)
- [ ] Store `GOOGLE_CLIENT_ID` in backend `.env`; store `VITE_GOOGLE_CLIENT_ID` in frontend `.env`
- [ ] `POST /api/auth/google` — verify the Google ID token with `google-auth-library`, find or create the matching user (match by `email` or `googleId`), return our signed JWT
- [ ] Add a Google Identity Services button to Login + Signup pages — when clicked, post the returned ID token to `/api/auth/google` and store the returned JWT same as the email/password flow
- [ ] Manual test: Google sign-in returns a JWT that works on protected routes
- [ ] Confirm the flow links new Google users to existing accounts (match by email) instead of creating duplicates
