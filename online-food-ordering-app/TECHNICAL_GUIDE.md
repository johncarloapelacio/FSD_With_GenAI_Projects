# Technical guide

## Components

- `server.js`: Express API, authentication, authorization, validated menu adapter, authoritative checkout, and whitelisted static assets.
- `lib/store.js`: JSON schema checks, relationship/total/fingerprint checks, and atomic temporary-file replacement.
- `js/api.js`: same-origin JSON transport with structured errors.
- `js/signin.js`: shared sign-in/registration UI and removal of obsolete browser-stored credentials.
- `js/dashboard.js`: menu/cart views, immutable checkout snapshots, account-keyed recovery, and receipt rendering.
- `css/tailwind-input.css`: local Tailwind build input. `css/tailwind.css` is the generated asset served to browsers.
- `tests/`: real HTTP regressions and browser-state tests using a VM harness.

## API

| Method | Route | Access/purpose |
| --- | --- | --- |
| POST | `/api/register` | Create an account |
| POST | `/api/login` | Verify credentials and issue a session |
| POST | `/api/logout` | Revoke the current session |
| GET | `/api/session` | Current authenticated account |
| GET | `/api/menu` | Authenticated, validated menu |
| GET | `/api/orders` | Current account's saved orders |
| POST | `/api/orders` | Authenticated, idempotent checkout |

Mutations require JSON. Cross-site/foreign-origin requests are rejected. Cookies are HttpOnly and SameSite=Strict, with Secure enabled under `NODE_ENV=production`. Dashboard requests include `X-Food-Account-Id` as an assertion about the displayed account; the server rejects a mismatch with `409 ACCOUNT_CHANGED`, while ownership always comes from the authenticated session. This prevents an older tab from silently ordering under an account signed into elsewhere. Content Security Policy restricts scripts/styles/connections to the app and menu images to TheMealDB. Set `TRUST_PROXY=1` only behind exactly one trusted reverse proxy. The default server binds to loopback.

## Persistence and retries

The ignored `data/store.json` contains users with salted scrypt hashes and order snapshots. Sessions and rate counters are in memory. Stores are validated on read and before write; inconsistent stores return an error and remain intact. Back up valid data separately before maintenance. There is no automatic destructive reset or legacy plaintext migration.

Orders record integer-cent line prices, quantities, a derived total, authenticated user ID, request ID, and canonical item fingerprint. Rechecking after menu fetch prevents concurrent retries from saving duplicates within this process. The frontend persists a pending operation before sending it, retains it on network/server/authentication uncertainty, and reconciles saved history after reload. Browser prices, account IDs, and modified local snapshots never determine server ownership or prices.

## Configuration

`PORT` defaults to 3002. `FOOD_DATA_DIR` defaults to this project's `data` folder. `NODE_ENV=production` enables Secure cookies and therefore requires HTTPS. `.env.example` documents these settings; the app does not load dotenv files. A reverse proxy must preserve the public Host/protocol consistently with same-origin validation.

The demo is single-process. Multi-process writes, durable shared sessions/rate counters, real payment/fulfillment integrations, account recovery, and production operations require further design.
