# Architecture and API

The React frontend uses React Router and the `apiFetch` client in `src/api.js`. Vite proxies `/api` to Express in `../server`. Browser requests include credentials and the required `X-Requested-With: portfolio-app` header. `sessionStorage` stores public display data and drafts; server-side sessions establish identity.

## HTTP contract

- `POST /api/auth/signup`: email, password, firstName, lastName and age; creates an account and cookie session.
- `POST /api/auth/login`: email and password; rotates the cookie session.
- `GET /api/auth/session`: public user profile, or 401.
- `POST /api/auth/logout`: invalidates the session.
- `GET /api/auth/profile/:userId`: only the current account.
- `PUT /api/auth/profile/:userId`: firstName, lastName and age; only the current account, immutable email/identity.
- `PUT /api/auth/change-password/:userId`: currentPassword and newPassword; rotates the current session and revokes other old sessions.
- `DELETE /api/auth/account/:userId`: password; removes the account and its bookings and revokes sessions.
- `GET /api/services` and `GET /api/drivers`: fictional catalog data and fixed demo driver quotes.
- `GET /api/bookings`: current user's bookings only.
- `GET /api/bookings/:id`: current user's matching booking, otherwise 404.
- `POST /api/bookings`: requestId (UUID), pickupLocation, dropoffLocation, ISO-UTC dateTime, passengers, serviceType, driverId and optional specialRequests. The server validates the selected service/driver/capacity/date and assigns UUID, owner, quote, status and timestamp.
- `DELETE /api/bookings/:id`: cancels an upcoming confirmed ride belonging to the current user; retains cancelled history.
- `GET /api/health`: confirms storage is readable.

Arbitrary booking PUT and legacy user-ID-in-body account mutation routes are not exposed. Account endpoints check ownership even when a valid session exists. Passwords use salted scrypt; random sessions are held in memory for up to eight hours. Authentication attempts are rate-limited per IP. HttpOnly/SameSite cookies, allowed origins and a custom request header protect browser writes. Corrupt JSON is preserved and rejected. Writes use temporary-file rename in one process. See README.md for setup and public deployment requirements.

Quotes are fictional fixed prices stored with each sample driver, not a distance engine or payment integration. Driver cards use catalog ratings, plates and quotes; no random prices or review counts are generated. Contact validates locally and clearly reports that no message was sent.

Booking confirmation uses a UUID request ID and an immutable submitted payload saved with the draft. Retrying after a lost response or reload reuses that request: the API returns the existing booking (HTTP 200), creates a new one only once (HTTP 201), and rejects changed booking details under the same key (HTTP 409). Keys and payload fingerprints are stored with the booking, scoped to its owner, so replay protection survives an API restart. An uncertain confirmation can be resumed from Home; editing is disabled until its result is retrieved. Replaying a cancelled booking retrieves that cancelled record instead of creating another ride. Explicit logout clears local drafts; review My Bookings before starting a new ride after an interrupted confirmation.
