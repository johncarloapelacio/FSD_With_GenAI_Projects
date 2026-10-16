# Verification

Follow [README.md](README.md) for startup. Use Node.js 24 and synthetic accounts. No public demo credentials are supplied.

From this frontend directory:

```text
npm ci --ignore-scripts
npm test
npm run lint
npm run build
```

From `../server`:

```text
npm ci --ignore-scripts
npm test
```

The API tests start servers on ephemeral ports with temporary JSON files and clean up afterwards; they never modify the application's runtime database. Frontend tests exercise server-only login/signup flows, minimal leave-update payloads, and stale private-response protection after session changes.

Browser regressions live in [the repository QA suite](../../qa/tests/hr-taxi.spec.cjs). After installing the QA package and a Playwright Chromium browser, run `npm test -- hr-taxi` from `../../qa`. They launch isolated API and Vite servers and cover HR invitation, employee signup, private leave submission, status refresh, HR approval and server logout.

A passing local suite is evidence for these paths, not certification for a public production deployment. See the README for deployment boundaries. A corrupt-store error logged during API tests is expected in the preservation test.

Semantic-corruption tests cover per-record types, invalid/legacy hashes, invalid calendar timestamps, duplicate identities and foreign-key violations. Each case proves both startup/read rejection and pre-write rejection without replacing the previous file.
