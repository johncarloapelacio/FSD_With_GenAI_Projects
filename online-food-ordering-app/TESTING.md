# Testing

Run `npm ci`, `npm run build`, and `npm test` with Node.js 24 LTS. API tests start real loopback HTTP servers with temporary private stores and deterministic menu providers. They cover authentication and password hashing, concurrent registration, account isolation, server-controlled prices, invalid carts, concurrent/idempotent checkout, expiry/logout, origin and content-type rejection, corrupt-store preservation, menu failures, static-file boundaries, and throttling.

Dashboard tests execute the actual script in a VM with controlled transport/storage. They exercise uncertain responses, immutable retry payloads, reload recovery, authentication expiry, definite rejection, storage failure, and menu refresh ordering. These are logic regressions, not a substitute for rendering checks.

The shared [Playwright suite](../qa/README.md) exercises registration, sign-in, menu/cart/checkout, sign-out, uncertain checkout recovery, and mobile layout in a real browser. Test data is synthetic; TheMealDB responses are injected locally. `npm audit` checks the resolved dependency tree separately.

For a manual check, run the server, open `http://localhost:3002`, register, sign in, add two meals, adjust quantities, review the cart, and checkout. Confirm that the receipt says no payment was processed. Sign out and reload the dashboard URL; it should redirect to sign-in. Repeat at a narrow viewport. Stop the server to check visible request errors; restart and sign in again because sessions are not persisted.

Automated tests do not establish production readiness or verify external restaurant/payment services, which are not implemented.
