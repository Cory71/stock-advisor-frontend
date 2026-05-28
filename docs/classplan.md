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
- [x] Choose tech stack — React (Vite) + Bootstrap, Express, MongoDB Atlas, `yahoo-finance2`, Passport (Local + Google OAuth)
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
- [ ] Set up a Postman collection (or Thunder Client) for testing each route as it's built (deferred to Class 4 when there are real routes to test)

---

### Class 4 — Auth, Core Routes & Grading Flow

Goal by end of class: a registered user can sign in (email/password or Google), grade `AAPL`, and add it to their watchlist. This class satisfies the full Week 2 instructor rubric (models, auth, 3+ CRUD routes, route protection, Postman testing).

**Auth — Passport setup**

- [ ] Install `passport`, `passport-local`, `passport-google-oauth20`, `bcryptjs`, `express-session`, `connect-mongo`
- [ ] Register an OAuth client in Google Cloud Console; store `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` + `SESSION_SECRET` in `.env`
- [ ] `middleware/passport.js` — configure `passport-local` + `passport-google-oauth20` strategies + `serializeUser` / `deserializeUser`
- [ ] Wire `express-session` (with `connect-mongo` store) + `passport.initialize()` + `passport.session()` in `server.js`
- [ ] `middleware/authMiddleware.js` — `protect` function that calls `req.isAuthenticated()`

**Auth — routes**

- [ ] `POST /api/auth/register` — bcrypt-hash password, create user, log in via `req.login()`
- [ ] `POST /api/auth/login` — `passport.authenticate('local')`
- [ ] `GET /api/auth/google` — `passport.authenticate('google', { scope: ['profile', 'email'] })`
- [ ] `GET /api/auth/google/callback` — Passport finds or creates the user and starts the session
- [ ] `GET /api/auth/me` — returns `req.user`
- [ ] `GET /api/auth/logout` — `req.logout()` and clear session

**Grading flow**

- [ ] Write the pure grading function (5 yes/no criteria → letter grade)
- [ ] Unit-test the grading function with Mocha + Chai (each criterion, score-to-grade table, N/A handling)
- [ ] Build the `StockDataProvider` interface (income statement + cash flow methods)
- [ ] Implement the Yahoo provider with `yahoo-finance2`
- [ ] `GET /api/grade/:ticker` (protected) — fetch → grade → cache in `stocks` → respond

**Watchlist CRUD** (the "3+ CRUD routes for your main resource" rubric)

- [ ] `GET /api/watchlist` (protected) — return current user's watchlist
- [ ] `POST /api/watchlist` (protected) — add a ticker
- [ ] `DELETE /api/watchlist/:ticker` (protected) — remove a ticker

**Frontend**

- [ ] `AuthContext` + `useAuth()` hook (calls `/api/auth/me` on mount)
- [ ] Login + Signup pages: email/password form **plus** a "Sign in with Google" link to `/api/auth/google`
- [ ] `<TickerSearch />` input on the Home page (auth-gated)
- [ ] Grade Detail page — `<GradeBadge />` + `<CriteriaList />` with real numbers
- [ ] Watchlist page — list, "Add", "Remove"
- [ ] NavBar shows login state + logout button

**Postman testing** (continuous, not at the end)

- [ ] Register → log in → `GET /api/auth/me` returns the user
- [ ] `GET /api/watchlist` returns `[]` for a new user
- [ ] `POST /api/watchlist` adds a ticker → `GET` shows it
- [ ] `DELETE /api/watchlist/:ticker` removes it
- [ ] `GET /api/grade/:ticker` returns a real grade for a logged-in user
- [ ] Google OAuth round-trip — `/api/auth/google` redirects to Google and back

**End-of-class check**

- [ ] Demo: register → log in → grade `AAPL` → add to watchlist → see it on Watchlist page
- [ ] All Week 2 instructor checklist items satisfied (models, auth routes, 3+ CRUD routes, route protection with Passport middleware, Postman testing, all code pushed)

---

## Second Half — Crossing the Finish Line

### Class 5 — Search History, Compare & Form Polish

**User-scoped extras**

- [ ] Search history — record on every grade lookup; surface last 20 on the Home page
- [ ] Compare page — `GET /api/compare?tickers=AAPL,MSFT,GOOG` rendered side-by-side

**Forms & state**

- [ ] All forms have proper validation + error messages
- [ ] Every page handles loading and empty states cleanly
- [ ] Confirm the Google OAuth flow links new Google users to existing accounts (match by email) instead of creating duplicates

---

### Class 6 — Polish + Testing

**UI polish**

- [ ] Consistent spacing, typography, and Bootstrap component usage across pages
- [ ] Color-coded grade badges (A green → F red)
- [ ] Responsive layout works on phone and desktop widths

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
- [ ] Add production env vars (`SESSION_SECRET`, `MONGO_URI`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, CORS origin)

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
