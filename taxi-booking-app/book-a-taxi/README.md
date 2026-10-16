# Book a Taxi

React taxi-booking portfolio demo with an Express API. Sign up, choose a service and sample driver, confirm a fixed demo fare, review bookings, cancel an upcoming ride, and manage your account. The sample fleet is fictional; no rides are dispatched or payments collected. The contact form demonstrates validation and does not send messages.

## Run locally

Use Node.js 22.12+ (Node.js 24 recommended). Start the API in one terminal:

```text
cd ../server
npm ci --ignore-scripts
npm start
```

Start the UI in another terminal from this directory:

```text
npm ci --ignore-scripts
npm run dev
```

Open the Vite URL (normally http://localhost:5173). Create an account with a password of at least 10 characters; no shared or hardcoded demo account is supplied. Bookings require a future pickup within one year, a valid service/driver pair, and a passenger count within that service's capacity. Flexible dates accept MM/DD/YYYY, YYYY-MM-DD, today/tomorrow or weekday names; times accept 24-hour or AM/PM input. Numeric dates are interpreted month-first.

The backend selects the owner from the session, validates the requested service/driver, and derives the fixed fare from the fleet data. A client cannot override the fare, owner, booking ID, or status. Quotes are deterministic sample fares, independent of actual distance. Cancellation marks the booking cancelled; stored history is retained. The UI lists active rides.

## Verification

```text
npm test
npm run lint
npm run build
```

From `../server`, run `npm test` for isolated HTTP regressions covering account isolation, fare/ownership tampering, profile authorization, date/capacity validation, password rotation and deletion, stale sessions, CSRF and storage corruption. Frontend tests cover date/time parsing, calendar validity and malformed AM/PM values.

## Configuration and boundaries

Vite dev and preview proxy `/api` to loopback port 3001. `VITE_API_BASE_URL` overrides the frontend API path; `PORT`, `DB_PATH` and comma-separated `CLIENT_ORIGINS` configure the backend. Allowed defaults are local Vite ports 5173/5174/4173 only. Cross-origin usage must explicitly configure the frontend origin. All write requests require `X-Requested-With: portfolio-app`, included by the client.

Identity comes from random server-side sessions in HttpOnly, SameSite=Strict cookies. `sessionStorage` caches display data and booking drafts only. Passwords are salted scrypt hashes. Every account and booking endpoint checks ownership on the server. Password changes revoke old sessions; account deletion removes that user's bookings and revokes sessions. Sessions last 8 hours and restart signs everyone out.

The untracked runtime `server/database.json` is initialized from the checked-in `database.example.json`, which contains fictional services/drivers and empty users/bookings. Writes use a temporary file and rename. Invalid or unreadable data is rejected without replacing the file. Legacy plaintext-password databases must be backed up privately and migrated explicitly, or replaced with a fresh runtime database.

This is a single-process local app. Public deployment needs HTTPS (`NODE_ENV=production` enables Secure cookies), the correct allowed frontend origin, shared session/rate-limit storage and a transactional database before multiple workers, backups, and operational monitoring. Password recovery, email verification, live dispatch, real payment processing, reviews and messaging are outside this demo's scope.

Persisted data is validated on every read and before every write, including strict field types/allowed fields, canonical timestamps, IDs, uniqueness and foreign-key/identity relationships. Invalid but syntactically valid JSON is also rejected and preserved; it is never normalized or silently rewritten.

Booking confirmation uses a UUID request ID and an immutable submitted payload saved with the draft. Retrying after a lost response or reload reuses that request: the API returns the existing booking (HTTP 200), creates a new one only once (HTTP 201), and rejects changed booking details under the same key (HTTP 409). Keys and payload fingerprints are stored with the booking, scoped to its owner, so replay protection survives an API restart. An uncertain confirmation can be resumed from Home; editing is disabled until its result is retrieved. Replaying a cancelled booking retrieves that cancelled record instead of creating another ride. Explicit logout clears local drafts; review My Bookings before starting a new ride after an interrupted confirmation.

Authenticated requests also send `X-Expected-Account` with the account currently displayed in that tab. The server compares it with the cookie-authenticated account (it never selects an identity from the header). A missing/mismatched context returns HTTP 409 `ACCOUNT_CHANGED` before reading private records or changing state, and the UI returns to sign-in. Session discovery can omit this header to establish the initial account. This prevents a stale tab from silently submitting as another account after a shared-cookie login switch.
