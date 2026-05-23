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
- [x] Choose tech stack — React (Vite) + Bootstrap, Express, MongoDB Atlas, `yahoo-finance2`, JWT + Google Sign-In
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

### Class 3 — Foundation Build

**Frontend**

- [x] Initialize Vite + React project
- [x] Install Bootstrap (`react-bootstrap`)
- [x] Create frontend README per instructor template
- [ ] Add React Router and set up empty pages: `Home`, `GradeDetail`, `Watchlist`, `Compare`, `Login`, `Signup`
- [ ] Build shared `<NavBar />` component (links + login-state placeholder)

**Backend**

- [x] Scaffold Express server (`server.js`, `cors`, `dotenv`)
- [x] Install `mongoose` + add `mongoose.connect()` block to `server.js`
- [x] Create `routes/`, `models/`, `middleware/` folders (with `.gitkeep`)
- [x] Add `GET /` test route returning `{ message: 'Server is running' }`
- [x] Create backend README per instructor template
- [ ] Provision MongoDB Atlas cluster (free M0) and paste the real connection string into `.env`
- [ ] Run the server and confirm it logs "MongoDB connected"

**Wire-up**

- [ ] Confirm frontend can call backend `GET /` locally (CORS working)

---

### Class 4 — Core Features (one full end-to-end flow)

Goal: a user can type a ticker and see a real letter grade by the end of class.

**Backend**

- [ ] Write the pure grading function (5 yes/no criteria → letter grade)
- [ ] Unit-test the grading function with Mocha + Chai (cover each criterion, score-to-grade table, N/A)
- [ ] Build the `StockDataProvider` interface (income statement + cash flow methods)
- [ ] Implement the Yahoo provider with `yahoo-finance2`
- [ ] Create `GET /api/grade/:ticker` route — fetch → grade → respond
- [ ] Add MongoDB cache for graded results (`stocks` collection)

**Frontend**

- [ ] Build the `<TickerSearch />` input on the Home page
- [ ] Build the Grade Detail page — `<GradeBadge />` + `<CriteriaList />` with real numbers
- [ ] Show loading and "ticker not found" states

**End-of-class check**

- [ ] Demo: type `AAPL`, see a real A–F grade with the 5-criteria breakdown

---

## Second Half — Crossing the Finish Line

### Class 5 — Feature Completion

**Auth**

- [ ] Email/password signup endpoint with bcrypt
- [ ] Login endpoint that issues a JWT in an httpOnly cookie
- [ ] `GET /api/auth/me` route + frontend `AuthContext` + `useAuth()` hook
- [ ] Logout endpoint + button
- [ ] Register an OAuth client in Google Cloud Console
- [ ] Add Google Sign-In button (Google Identity Services) on Login + Signup pages
- [ ] `POST /api/auth/google` — verify Google ID token with `google-auth-library`, find or create user, issue session JWT

**User-scoped data**

- [ ] Watchlist endpoints (GET, POST, DELETE) + Watchlist page
- [ ] Search history — record on every grade lookup, surface on the Home page (last 20)
- [ ] Compare page — `GET /api/compare?tickers=AAPL,MSFT,GOOG` rendered side-by-side

**Forms & state**

- [ ] All forms have proper validation + error messages
- [ ] Every page handles loading and empty states cleanly

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
- [ ] Add production env vars (JWT secret, Mongo URI, Google client ID, CORS origin)

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
