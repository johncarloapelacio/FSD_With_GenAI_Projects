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

The API tests start servers on ephemeral ports with temporary JSON files and clean up afterwards; they never modify the application's runtime database. Frontend tests exercise valid and invalid calendar dates, relative input, and AM/PM parsing.

Browser regressions live in [the repository QA suite](../../qa/tests/hr-taxi.spec.cjs). After installing the QA package and a Playwright Chromium browser, run `npm test -- hr-taxi` from `../../qa`. They launch isolated API and Vite servers and cover signup, service selection, fixed quotes, draft editing, booking, cancellation, profile updates, logout and login.

A passing local suite is evidence for these paths, not certification for a public production deployment. See the README for deployment boundaries. A corrupt-store error logged during API tests is expected in the preservation test.

Semantic-corruption tests cover per-record types, invalid/legacy hashes, invalid calendar timestamps, duplicate identities and foreign-key violations. Each case proves both startup/read rejection and pre-write rejection without replacing the previous file.

Taxi API tests additionally cover user-scoped retries, changed-payload conflicts, replay after restart/cancellation/pickup time, and UUID normalization. The browser test deliberately saves a confirmation, drops its HTTP response, reloads, and confirms again; exactly one persisted booking must remain.
