# HR Employee Portal

A React/Redux HR portal with a local Express API. HR can invite employees and review leave; employees can register with an invitation, view their own profile and submit leave requests.

## Run locally

Use Node.js 22.12+ (Node.js 24 recommended) and npm. Run two terminals from this directory:

```powershell
cd ../server
npm ci --ignore-scripts
$env:HR_ADMIN_EMAIL = "hr@example.test"
$env:HR_ADMIN_PASSWORD = "choose-a-private-password-of-at-least-10-characters"
npm start
```

```powershell
npm ci --ignore-scripts
npm run dev
```

Open the Vite URL (normally http://localhost:5173). Sign in with the HR account configured above and select **HR**. Add an employee and copy the one-time invitation shown in the success message; share it privately with that employee. The employee enters their email and invitation on Sign Up, creates a password, and signs in with **Employee** selected. Invitations are stored hashed and cannot be reused. An existing HR account is never silently reset by changing the environment variables.

On POSIX systems set the same variables using `export HR_ADMIN_EMAIL=...` and `export HR_ADMIN_PASSWORD=...` before `npm start`.

## Checks

```text
npm test
npm run lint
npm run build
```

From `../server`, run `npm test` for HTTP integration tests covering role restrictions, invitation use, employee isolation, leave transitions, sessions, CSRF protection and corrupt storage. Tests use isolated temporary databases and ephemeral ports.

## API and storage

Vite proxies `/api` to loopback port 3000; production preview has the same proxy. `VITE_API_BASE_URL` can override the path. `PORT`, `DB_PATH` and comma-separated `CLIENT_ORIGINS` configure the backend. Defaults allow local Vite ports 5173/5174/4173 only. Every write requires the `X-Requested-With: portfolio-app` header; browser origins must also be allowed. The frontend includes it automatically.

Authentication uses random server-side sessions and HttpOnly, SameSite=Strict cookies. Browser storage is not an authority for identity or role. Passwords and invitations use salted scrypt hashes. Employees receive only their own employee and leave records; credential and invitation hashes are never returned. HR decisions change only the status of a pending request. Logout also clears Redux employee/leave caches.

`server/database.example.json` contains an empty schema, with no accounts or personal data. The untracked runtime `server/database.json` is initialized from it when missing. Writes use a temporary file and rename; malformed data fails rather than being reset. Legacy JSON-server data with plaintext credentials is intentionally rejected; back it up privately and migrate it explicitly or start with a fresh database. Never run json-server against this file.

This is a single-process local portfolio app. Sessions expire after 8 hours and restart invalidates them. A public deployment needs HTTPS (`NODE_ENV=production` enables Secure cookies), one origin configured for the frontend, a transactional database and shared session/rate-limit storage before multiple workers, and operational backups. No email invitation delivery, password recovery, or administrator management UI is implemented.

Persisted data is validated on every read and before every write, including strict field types/allowed fields, canonical timestamps, IDs, uniqueness and foreign-key/identity relationships. Invalid but syntactically valid JSON is also rejected and preserved; it is never normalized or silently rewritten.

Authenticated requests also send `X-Expected-Account` with the account currently displayed in that tab. The server compares it with the cookie-authenticated account (it never selects an identity from the header). A missing/mismatched context returns HTTP 409 `ACCOUNT_CHANGED` before reading private records or changing state, and the UI returns to sign-in. Session discovery can omit this header to establish the initial account. This prevents a stale tab from silently submitting as another account after a shared-cookie login switch.
