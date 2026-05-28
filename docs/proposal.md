# StockGrader — Project Proposal

> **Architecture diagram** — system architecture, frontend component tree, and backend component tree:
>
> - 🔗 **[Open in Excalidraw (live view)](https://excalidraw.com/#json=zWA_-8Ea4rsq__VOPWiD6,v7nrDZ810n7zDAqidAVHSw)** — click to view all three diagrams in the browser. Press **`Shift + 1`** once loaded to fit all diagrams to your screen.
> - 📄 **[architecture.excalidraw](./architecture.excalidraw)** — source file in this repo (version-controlled; renders on GitHub)

## Project Idea

StockGrader is a web application that grades publicly traded stocks on an A–F scale based on five fundamental financial criteria sourced from Yahoo Finance. Users enter a ticker symbol, and the app returns a letter grade with a transparent checklist of the underlying numbers — giving beginner investors a fast, clear read on a stock's fundamental health without having to interpret financial statements themselves.

---

## Features

- **Ticker lookup** — enter a stock symbol (e.g. `AAPL`) and get a graded result instantly
- **Grade card** — letter grade (A–F), color-coded, plus a 5-criteria checklist with the actual numbers used
- **User accounts** — email/password sign-up and login, **plus "Sign in with Google"** via Passport OAuth redirect flow; all data is scoped to the logged-in user
- **Saved watchlist** — add tickers to a personal watchlist and revisit grades without re-typing
- **Search history** — view the last 20 tickers the user looked up
- **Comparison view** — look up 2–3 tickers side-by-side on the same screen
- **Responsive UI** — works on both desktop and mobile browsers

---

## Target Audience

Beginner-to-intermediate retail investors who already browse Yahoo Finance but feel overwhelmed by the raw data and don't know which numbers actually matter. These users want a quick "is this stock fundamentally healthy?" check before researching further — not a recommendation engine, not a social feed, just a clean, honest grade with a transparent breakdown they can learn from over time.

---

## Technology Stack

| Layer | Technology |
| --- | --- |
| Frontend | React (Vite), React Router, Bootstrap (via `react-bootstrap`) |
| Backend | Node.js, Express |
| Database | MongoDB Atlas (via Mongoose) |
| External Data | `yahoo-finance2` npm package (free, no API key required) |
| Authentication | Passport.js with two strategies: `passport-local` (email/password with `bcryptjs`) and `passport-google-oauth20` (Google login). Sessions stored in MongoDB via `express-session` + `connect-mongo`. |
| Deployment | Vercel (frontend), Render (backend) |

**Out of scope for MVP:** social features, stock recommendations, mobile app (React Native), charts, PDF export, email alerts.

---

## Cost Estimate

> All amounts are in **Canadian dollars (CAD)**. Upstream services (Vercel, Render, MongoDB Atlas, Namecheap, FMP) bill in USD; figures below are converted at an approximate rate of **1 USD ≈ 1.37 CAD** and rounded.

### Free Tier — portfolio / personal project

| Service | Plan | Monthly Cost |
| --- | --- | --- |
| Vercel (frontend) | Hobby (free) | $0 |
| Render (backend web service) | Free | $0 |
| MongoDB Atlas | Free M0 (512 MB storage) | $0 |
| `yahoo-finance2` npm package | Free (no API key) | $0 |
| Domain name | None | $0 |
| **Total** | | **$0/month** |

> ⚠️ Render's free backend tier spins down after 15 minutes of inactivity. The first request after a cold start can take 30–60 seconds. Acceptable for a portfolio project, not for real users.

---

### Paid — small production app

| Service | Plan | Monthly Cost |
| --- | --- | --- |
| Vercel (frontend) | Pro | ~$27 CAD |
| Render (backend web service) | Starter — always on | ~$10 CAD |
| MongoDB Atlas | M10 dedicated cluster | ~$78 CAD |
| `yahoo-finance2` npm package | Free | $0 |
| Domain name | .com via Namecheap | ~$1.50 CAD |
| **Total** | | **~$117 CAD/month** |

---

### At Scale — 10,000 active users

| Service | Concern at scale | Upgrade needed |
| --- | --- | --- |
| Render backend | CPU/memory limits under load | Standard plan (~$34 CAD/month) or horizontal scaling |
| MongoDB Atlas | Storage and concurrent connections grow | M20 or M30 cluster (~$178–$274 CAD/month) |
| `yahoo-finance2` | Yahoo Finance rate limits or breakage | Server-side MongoDB cache reduces redundant calls; Financial Modeling Prep (~$30 CAD/mo) as paid fallback |
| Vercel frontend | Bandwidth and build minutes | Pro plan handles most traffic at ~$27 CAD/month |
| **Estimated total at scale** | | **~$240–$335 CAD/month** |

> Note: `yahoo-finance2` is an unofficial package and can break without notice. The backend uses a `StockDataProvider` interface so a paid data source (Financial Modeling Prep, ~$30 CAD/mo Starter) can be swapped in without touching the grading logic or UI.

---

## Development & Maintenance Cost

The estimates above cover **running** the app. This section covers the cost of **building** it in the first place and **keeping it running** afterwards. As a capstone project these costs are absorbed by my own time and free tools; a paying client would see the numbers below.

### One-Time Development Cost

Estimated developer hours by capstone phase (4-week build, ~20 hrs/week):

| Phase | Work | Hours |
| --- | --- | --- |
| Week 1 — Planning & Setup | Proposal, architecture diagrams, repo setup, dependency install | 15 |
| Week 2 — Backend Core | Auth (email + Google), `GET /api/grade/:ticker`, MongoDB caching, Yahoo Finance integration | 25 |
| Week 3 — Frontend | All pages (home, grade detail, watchlist, compare, login), shared components, responsive styling | 25 |
| Week 4 — Testing, Deploy, Docs | Mocha + Chai (backend) and Jest + RTL (frontend) tests, deploy to Vercel/Render/Atlas, README | 15 |
| **Total** | | **~80 hrs** |

Multiplied by typical Canadian developer rates:

| Developer Level | Hourly Rate | One-Time Build Cost |
| --- | --- | --- |
| Junior | $80 CAD/hr | ~$6,400 CAD |
| Mid-level | $135 CAD/hr | ~$10,800 CAD |
| Senior | $205 CAD/hr | ~$16,400 CAD |

**Developer tooling cost during build:** $0 — GitHub, VS Code, Excalidraw, and every library in the stack are free.

> ⚠️ As a capstone, my actual out-of-pocket spend is **$0**. The numbers above represent what a client would pay to commission this app from scratch.

---

### Ongoing Maintenance Cost (annual)

After launch the app still needs developer attention — mainly dependency security updates and reacting to upstream changes (Yahoo Finance is the biggest risk since `yahoo-finance2` is an unofficial package).

| Work | Hours/Year |
| --- | --- |
| Dependency security updates (quarterly check-ins) | 16 |
| Bug fixes & minor enhancements | 30 |
| Yahoo Finance breakage / provider swap contingency | 10 |
| **Total developer time** | **~56 hrs/year** |

| Cost Component | Annual Cost |
| --- | --- |
| Developer time (~56 hrs @ $135 CAD/hr mid-level) | ~$7,560 CAD |
| Hosting & infrastructure (paid tier above: ~$117 CAD/mo × 12) | ~$1,400 CAD |
| **Total annual maintenance** | **~$8,960 CAD/year** |

> Maintenance covers keeping the existing feature set working. New features cost extra — e.g. adding charts, PDF export, or email alerts would each add roughly 20–40 hrs of dev time at the same hourly rates.
