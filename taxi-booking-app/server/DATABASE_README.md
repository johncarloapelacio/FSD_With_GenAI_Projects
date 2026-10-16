# Local persistence

`database.example.json` is the safe checked-in seed: fictional fleet/services, empty users and bookings. `database.json` is private runtime data and must remain untracked. It is created from the example only if missing.

The API validates required collections and unique record IDs and rejects legacy plaintext user records. It stores salted scrypt password hashes, creates UUID identities, writes via temporary-file rename, and fails on malformed data without replacing it. Tests use temporary databases, not this runtime file.

Run exactly one server process per file. JSON persistence is suitable for local demonstrations, not multi-worker production service. See [the application README](../book-a-taxi/README.md) for startup, security boundaries and configuration. Back up any old runtime file privately before explicit migration; do not publish personal records or credentials.
