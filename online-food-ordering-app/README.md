# Online Food Ordering App

A menu and ordering demo built with Node.js, Express, HTML, vanilla JavaScript, and locally compiled Tailwind CSS. Accounts and orders are validated and stored on the server.

## Run

Use Node.js 24 LTS and npm. From this folder:

```sh
npm ci
npm run build
npm start
```

Open http://localhost:3002, register an account, then sign in. No preset credentials are shipped. `PORT` changes the port; `FOOD_DATA_DIR` changes the private data directory. Environment settings must be supplied by the shell or process manager; `.env.example` is a reference, not automatically loaded.

## Features

- Server sessions in HttpOnly cookies, salted scrypt passwords, authentication throttling, and account-scoped order history.
- TheMealDB menu integration with timeouts, validation, caching, loading/error states, and a refresh action.
- Quantity controls and integer-cent totals; the server validates menu items and determines authoritative prices and ownership.
- Idempotent checkout with a saved, immutable retry snapshot to avoid duplicate orders after an uncertain response or page reload in the same tab.
- Atomic JSON storage that rejects malformed or inconsistent records instead of overwriting them.

This is a demonstration: prices are generated from menu IDs, order confirmation is local, and no payment, restaurant submission, or delivery occurs. The menu and images require network access to TheMealDB. Sessions reset on server restart. JSON persistence and rate limiting are designed for one server process; a deployed multi-instance service needs shared transactional storage, shared sessions, HTTPS, and operational monitoring.

## Verify

```sh
npm test
npm audit
```

The API and browser-state tests use isolated synthetic data and no external menu service. Full browser flows are in the repository's [QA suite](../qa/README.md). See [TESTING.md](TESTING.md), [TECHNICAL_GUIDE.md](TECHNICAL_GUIDE.md), [FEATURES_GUIDE.md](FEATURES_GUIDE.md), and [USER_GUIDE.md](USER_GUIDE.md).
