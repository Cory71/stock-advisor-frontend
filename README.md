# StockGrader — Frontend

React web application for StockGrader, a web app that grades publicly traded stocks A–F based on five fundamental financial criteria sourced from [Finnhub](https://finnhub.io/).

## Live demo

- **App:** <https://stock-advisor-frontend.vercel.app>
- **API:** <https://stock-advisor-backend-j9gw.onrender.com>

> First request after ~15 min of idle may take 30–60 seconds because the
> Render free tier spins the backend down to sleep. After it wakes up it's
> snappy.

## Prerequisites

- **[Node.js 22](https://nodejs.org/) or newer** (matches the backend; Vite needs Node 20+ at minimum).
- **[Git](https://git-scm.com/)** for cloning.
- **The backend must already be running.** Set up [stock-advisor-backend](https://github.com/Cory71/stock-advisor-backend) first — its README walks through the MongoDB + JWT setup.

To check Node:

```bash
node --version   # should print v22.x.x or higher
```

## Quick start (local development)

### 1. Clone the repository

```bash
git clone https://github.com/Cory71/stock-advisor-frontend.git
cd stock-advisor-frontend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create the `.env` file

Create a file named `.env` in the project root with this content:

```env
# Where the React app looks for the backend API.
# Should match the PORT in the backend's .env (default is 5000).
VITE_API_URL=http://localhost:5000

# Optional — skip if you don't want Google sign-in. The button hides itself
# when this is missing, and email/password sign-in still works.
# VITE_GOOGLE_CLIENT_ID=your-id-here.apps.googleusercontent.com
```

> Both lines must use the `VITE_` prefix — Vite only exposes env vars that
> start with `VITE_` to the React code.

If you want Google sign-in, follow the "Optional: Google sign-in" section in
the [backend README](https://github.com/Cory71/stock-advisor-backend#optional-google-sign-in)
to get a Client ID. Paste the **same** value into both `.env` files.

### 4. Start the dev server

```bash
npm run dev
```

You should see something like:

```text
  VITE v6.x.x  ready in 412 ms

  ➜  Local:   http://localhost:5173/
```

Open <http://localhost:5173/> in your browser. You should see the StockGrader
home page.

## Running the tests

```bash
npm test
```

Runs the Vitest suite with the verbose reporter — **34 tests** across helpers,
components, and hooks (`grade.js`, `usePageTitle`, `useWarmBackend`,
`<TickerSearch />`, `<AboutCard />`, `<Footer />`, `<CandlestickFooter />`,
`<PasswordInput />`).

```bash
npm run test:watch
```

Same suite but re-runs whenever a file changes — handy during development.

## Troubleshooting

| Error you see | Likely cause | Fix |
| --- | --- | --- |
| Page loads but every API call hangs / says "Failed to fetch" | Backend isn't running | Start the backend (`npm run dev` in its folder) |
| Login works but Google button doesn't appear | `VITE_GOOGLE_CLIENT_ID` not set | Either follow the Google setup steps, or just use email/password — both work |
| Browser says `Network Error` or CORS error in console | Backend running on a different port than `VITE_API_URL` | Edit `.env` to match, then restart `npm run dev` |
| `Error: Cannot find module 'vite'` | Dependencies didn't install | Run `npm install` again |
| Port 5173 is already in use | Something else is on that port | Vite will auto-pick the next free port — check the terminal output for the actual URL |

## Features

- Email / password sign-up & login plus **Google sign-in** (Google Identity Services).
- **Show / hide password** toggle (eye icon) on the Login and Signup forms.
- Login / Signup show a **spinner** while signing in, and warm up the backend on page load so the first request after the server has been idle feels fast.
- Ticker **or company name** search — backend resolves names to canonical tickers.
- Grade card with letter grade, 5-criteria breakdown, share price + currency, company name, "graded at" timestamp.
- **Plain-English explanations** when a stock can't be graded (e.g. data too old, or a bank/insurer the model doesn't fit), plus **sector caveats** on REITs, insurers, and utilities where free cash flow is only a rough proxy.
- Watchlist with `gradeAtAdd` snapshot per row, current grade comparison (▲ Upgraded / ▼ Downgraded / — No change), last price, and a phone-friendly column-hiding layout.
- Compare page with Cards and Table view modes.
- Recent searches with company name beside each ticker.
- Dark / light mode toggle (respects OS preference; persists to `localStorage`).
- About card explainer on Login, Signup, and the logged-out Home.
- Auto-dismissing alerts (5 seconds) and decorative candlestick band on sparse pages.
- Dynamic page titles (`AAPL · StockGrader`, `Watchlist · StockGrader`, etc).

## Project Docs

See the `/docs` folder for:

- [`proposal.md`](./docs/proposal.md) — original project pitch
- [`stock-advisor-plan.md`](./docs/stock-advisor-plan.md) — detailed architecture + data model
- [`classplan.md`](./docs/classplan.md) — class-by-class progress checklist
- [`wireframes.md`](./docs/wireframes.md) — ASCII wireframes for every page
- [`devlog.md`](./docs/devlog.md) — weekly development log
- [`architecture.excalidraw`](./docs/architecture.excalidraw) — architecture diagram source
