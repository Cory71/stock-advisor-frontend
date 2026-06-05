# StockGrader — Frontend

React web application for StockGrader, a web app that grades publicly traded stocks A–F based on five fundamental financial criteria sourced from Yahoo Finance.

## Live demo

- **App:** <https://stock-advisor-frontend.vercel.app>
- **API:** <https://stock-advisor-backend-j9gw.onrender.com>

> First request after ~15 min of idle may take 30–60 seconds because the
> Render free tier spins the backend down to sleep. After it wakes up it's
> snappy.

## Prerequisites

- Node.js installed
- Backend server running (see [stock-advisor-backend](https://github.com/Cory71/stock-advisor-backend) repo)

## Setup

1. Clone the repository
   git clone <https://github.com/Cory71/stock-advisor-frontend.git>

2. Install dependencies
   npm install

3. Start the development server
   npm run dev

4. Open your browser at <http://localhost:5173>

5. Run the test suite (Vitest + React Testing Library)
   npm test

## Environment Variables

Create a `.env` file in the root:

```env
VITE_API_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id   # optional; the Google button hides itself if absent
```

## Features

- Email / password sign-up & login plus **Google sign-in** (Google Identity Services).
- Ticker **or company name** search — backend resolves names to canonical tickers.
- Grade card with letter grade, 5-criteria breakdown, share price + currency, company name, "graded at" timestamp.
- Watchlist with `gradeAtAdd` snapshot per row, current grade comparison (▲ Upgraded / ▼ Downgraded / — No change), last price, and a phone-friendly column-hiding layout.
- Compare page with Cards and Table view modes.
- Recent searches with company name beside each ticker.
- Dark / light mode toggle (respects OS preference; persists to `localStorage`).
- About card explainer on Login, Signup, and the logged-out Home.
- Auto-dismissing alerts (5 seconds) and decorative candlestick band on sparse pages.

## Project Docs

See the `/docs` folder for the project proposal, class plan, architecture diagram, and wireframes.

## Testing

`npm test` runs the Vitest suite (verbose reporter) — 25 tests across helpers and components. `npm run test:watch` re-runs on save.
