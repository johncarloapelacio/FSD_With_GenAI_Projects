# Portfolio quality review

Scope: the six original projects in this repository. Forked repositories were excluded. The reviewed public baseline was `e420d7123b3b372b9acb79354d5025bd07b561e8`.

## Repairs

| Project | Substantive changes |
| --- | --- |
| Employee Management System | Nonreusable account identities; expiring and revocable sessions; salted password hashes; strict date/type checks; private, expiring employee invitations; authenticated administrator creation; safe initial setup/migration; fail-closed atomic storage; mobile layout corrections |
| HR Portal | Replaced exposed JSON-server account access with an authenticated Express API; HR/employee authorization; hashed credentials; one-time invitations; private leave requests and approvals; stale-response, cross-tab account and expired-session protection; semantic store validation |
| Taxi Booking | Server-authenticated account access; authoritative owner, driver, capacity and fare checks; validated future scheduling; cancellation rules; password/session lifecycle; safe persistent data; resumable idempotent booking; corrected draft editing, catalog selection and redirect behavior |
| Food Ordering | Replaced browser-stored plaintext accounts with an Express backend; session-scoped orders; authoritative integer-cent prices; idempotent checkout with immutable recovery snapshots; cross-tab account assertions; corruption-preserving storage checks; menu failure/refresh handling; locally built CSS; mobile header corrections |
| KYC and AML Test Automation | Reports now derive from observed Jest execution; explicit Not Run/skipped/failure states; deterministic synthetic datasets; corrected risk labels; malformed-input checks; meaningful performance assertions; clear distinction between simulated integrations, requirement mapping and executed coverage |
| Client Meeting Database | Removed automatic database deletion and plaintext password fields; added constraints/indexes and stable host IDs; reproducible fixtures; derived attendance; reports retain unassigned records; real database integration runner with isolated cleanup |

Repository maintenance removed 4,892 tracked dependency files, stopped tracking runtime HR/taxi databases, added ignores and lockfiles, updated setup/feature/testing documentation, indexed all six projects, and added CI checks. Existing Git history is retained; this review does not claim to erase historical files.

## Verification

- Employee Management System: 24 Node regressions and all 30 Cypress cases passed. Native Edge workflows also checked invitation/signup, profile/password/deletion, administrator creation and a narrow viewport.
- Synthetic testing: 43 Jest assertions in six suites passed. Instrumented source coverage was 100% lines, 97.12% statements and 87.43% branches. Those metrics describe this project's tested source, not production integrations or the other projects. A deliberate failing assertion was separately verified to produce a failed catalog result and nonzero process exit, then restored.
- SQL: 30 integration checks passed against MariaDB 11.4.5 locally and MySQL 8.4 in GitHub Actions, including schema execution, seed counts, views, constraints, referential behavior, cascading host deletion and rejection of a destructive rerun.
- HR Portal: six backend integration groups and three frontend regressions passed. Taxi: nine backend groups and two parser regressions passed. Both React frontends passed lint and production builds. Corruption tests exercise 17 HR and 23 taxi invalid-store variants; booking tests cover replay after restart, cancellation and elapsed pickup time.
- Food Ordering: 30 API/browser-state regressions passed, covering ownership, prices, persistence, request replay, immutable recovery, menu refresh races and cross-tab identity. CSS production build passed.
- Shared browser run: all 11 Playwright workflows passed together in native Microsoft Edge (43.9 seconds), including full employee, HR, taxi and food flows, mobile checks, deliberately dropped checkout/booking responses, reload recovery, and shared-cookie account switches. The simulated dropped taxi response intentionally logs a fetch error while its recovery assertions pass.
- Dependency audits: all eight package trees reported zero known npm advisories at the time of review. Advisory databases can change.
- Workflow: actionlint passed; package paths/scripts, installer failure propagation and local documentation links were checked. All nine jobs passed in the [first published GitHub Actions run](https://github.com/johncarloapelacio/FSD_With_GenAI_Projects/actions/runs/38867037040). The Actions tab records results for subsequent commits.

## Reproduce

Use Node.js 24 LTS (24.9 or newer). Run `npm ci` and `npm test` in each JavaScript package folder. Run `npm run lint` and `npm run build` in both React frontend folders and `npm run build` in the food app. See [qa/README.md](qa/README.md) for Playwright setup and [Database_MySQL/README.md](Database_MySQL/README.md) for the real-database runner. The [CI workflow](.github/workflows/quality.yml) lists the automated checks.

## Practical boundaries

The file-backed apps support one Node process and use in-memory sessions and rate limiting. Restarting a server signs users out. Food orders and taxi reservations are local demonstrations without payment, dispatch or delivery integrations. Account recovery and email delivery are not implemented. The SQL Workbench file is retained as a historical model; the current schema is the SQL and documented diagram. Automated tests establish the exercised behavior, not the absence of every possible defect or production readiness.
