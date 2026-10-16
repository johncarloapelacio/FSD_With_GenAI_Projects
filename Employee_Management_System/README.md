# Employee Management System

A Node.js/Express 5 application with EJS dashboards, role-based employee CRUD,
private invitation-based enrollment, account settings, and file-based persistence.
The browser uses plain JavaScript and CSS; there is no frontend build step.

## Run a local demo

Requires Node.js 22 or later.

```sh
npm ci
npm run demo:seed
npm start
```

Open <http://127.0.0.1:3000>. Demo seeding is an explicit local action, refuses to
overwrite nonempty storage, and is disabled when `NODE_ENV=production`.

| Demo role | Email | Password |
| --- | --- | --- |
| Administrator | `admin@demo.example` | `DemoAdmin2026!` |
| Employee | `olivia.smith@company.com` | `DemoEmployee2026!` |

The other synthetic employees use the same **demo-only** employee password.
Use a separate data directory and create your own administrator for private use.
Accounts are not installed automatically on startup. Credentials in the data files
are salted scrypt hashes; the demo credentials above are intentionally public.

## Create your own first administrator

For an empty data directory, supply the following environment variables and run
`npm run admin:create`. The CLI only creates the initial administrator; later
administrators are created by a signed-in administrator using **Add administrator**.

PowerShell example:

```powershell
$env:EMS_ADMIN_NAME = 'Your Name'
$env:EMS_ADMIN_EMAIL = 'you@example.com'
$env:EMS_ADMIN_DOB = '1990-01-15'
$env:EMS_ADMIN_PASSWORD = 'Choose your own strong password here'
npm run admin:create
Remove-Item Env:EMS_ADMIN_PASSWORD
npm start
```

Passwords must be strings of 8–256 characters. The former public admin-passcode
registration flow has been removed.

## Employee enrollment

1. An administrator creates a pending employee with name, email, designation,
   department and a real, nonfuture date of birth.
2. The dashboard displays a private signup link. Share it with that employee over
   an appropriate private channel. Only a hash of the random token is stored.
3. The employee opens the link, confirms their details, and sets a password,
   contact number and location. Successful signup consumes the token.

Invitation links expire after seven days. **New signup link** replaces the previous
link for a pending employee. Names, email addresses and dates of birth alone do
not authorize account creation. Pending employees cannot sign in.

## Permissions and sessions

Employees can browse the directory and update their own contact, location and
password. The directory excludes colleagues' dates of birth, ages, credentials,
and invitation details. Only administrators manage employee HR fields or create
additional administrators. Identity and credential fields cannot be changed
through profile updates.

Sessions use random server-side tokens with an eight-hour absolute lifetime.
Logout and account deletion revoke sessions. Password changes revoke all earlier
sessions and rotate the current browser's cookie. Cookies are HttpOnly and
SameSite=Lax, and Secure over HTTPS or in production. API writes require JSON;
cross-origin browser writes are rejected. Login has a process-local failed-attempt
limit of 20 per IP per 15 minutes.

## Data, configuration and upgrades

Runtime data defaults to ignored `data/admin_db.json` and `data/emp_db.json`.
Set `EMS_DATA_DIR` to use a different directory. The root-level JSON files are
empty legacy templates and are not loaded automatically.

Each write validates the existing file, writes and flushes a temporary file in the
same directory, then atomically renames it. Invalid JSON, invalid account lists,
unreadable files and failed writes return an error rather than replacing records
with an empty dataset. Back up both files together. Restore damaged files from a
known-good backup before retrying; do not delete a damaged file to dismiss an error.

This storage design supports **one Node process**. Do not run multiple instances,
cluster workers or simultaneous maintenance commands against the same directory.
Use a transactional database and shared session/rate-limit storage when scaling.
Sessions are intentionally invalidated by a server restart.

To import a previous version's local files, stop the old server, back up its
`admin_db.json` and `emp_db.json`, and run this against an empty destination:

```sh
npm run data:migrate -- /absolute/path/to/backed-up/old/files
```

The source stays untouched. Migration assigns new identities and hashes plaintext
passwords. Pending employees need fresh invitations. Legacy records explicitly
placed in a runtime data directory also migrate their password upon successful
login. Public or reused old credentials should be replaced before private use.

`PORT` defaults to `3000`; `HOST` defaults to `127.0.0.1`. Deployment requires an
explicit public bind address, HTTPS, and a private dataset. If exactly one trusted
reverse proxy sits in front of the application, set `EMS_TRUST_PROXY=1`; otherwise
leave it unset. Do not expose the public demo accounts as a private HR service.
This is a tested portfolio application, not a claim of a comprehensive security audit.

## Tests

```sh
npm test                 # isolated HTTP/API, validation and storage regressions
npm run test:e2e          # full Cypress browser suite, manages its own server
npm run cypress:open     # isolated interactive Cypress runner
npm audit
```

Both suites use synthetic temporary storage and leave local application data
alone. Browser fixtures reset between tests. Cypress's binary is normally installed
by `npm ci`; if installation scripts were disabled, run `npx cypress install` first.

The API regressions exercise role/privacy boundaries, deleted-session isolation,
password hashing and migration, invitation expiry/reuse, strict calendar and type
validation, session expiry/rotation, request-origin protections, malformed storage
and a simulated atomic-write failure. Browser tests exercise login, signup, CRUD,
section navigation, persisted profile updates and password changes.

## API

| Method | Endpoint | Access |
| --- | --- | --- |
| GET | `/api/employees` | Signed-in user; role-filtered fields |
| POST | `/api/employees` | Administrator |
| PUT / DELETE | `/api/employees/:id` | Administrator |
| POST | `/api/employees/:id/invitation` | Administrator; pending account |
| GET | `/api/account/me` | Own account |
| PUT | `/api/account/profile` | Own permitted profile fields |
| PUT | `/api/account/password` | Own account, current password required |
| POST | `/api/signup/verify` | Pending employee details and valid invitation |
| POST | `/api/signup/employee` | Pending employee details and valid invitation |
| POST | `/api/signup/admin` | Signed-in administrator |

## Structure

`app.js` configures middleware and routes. `lib/` contains persistence, password,
session and invitation helpers. `middleware/` enforces authorization. `routes/`
implements the APIs and page rendering. `views/` and `public/` contain the EJS,
CSS and browser code. `scripts/` provides setup, migration and isolated browser
test commands. `test/` and `cypress/` contain regression and browser suites.
