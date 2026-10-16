# Architecture and API

The React UI uses Redux Toolkit thunks and Axios. Vite proxies `/api` to the Express server in `../server`. Server-side authentication and data filtering are authoritative; the client never downloads password hashes or a credentials collection.

## HTTP contract

- `POST /api/auth/login`: email, password and userType (`hr` or `employee`); creates an HttpOnly cookie session and returns public identity.
- `GET /api/auth/session`: current public identity; 401 when expired or signed out.
- `POST /api/auth/logout`: revokes the session and clears the cookie.
- `POST /api/auth/verify-invite`: email and private inviteCode; returns the matching unsigned employee's onboarding details only.
- `POST /api/auth/signup`: email, inviteCode, firstName, lastName, age and password; consumes the invitation and creates the employee account atomically.
- `GET /api/employeesInfo`: HR receives the directory; an employee receives only their own record.
- `POST /api/employeesInfo`: HR-only emailId and department; returns one private inviteCode once. It is not included in later list responses.
- `GET /api/leaveInfo`: HR receives all requests; an employee receives only their own requests.
- `POST /api/leaveInfo`: employee-only reason and numberOfDays. Identity and Pending status are assigned by the server.
- `PATCH /api/leaveInfo/:id`: HR-only status Approved/Denied for a currently Pending request; unrelated request fields cannot be overwritten.
- `GET /api/health`: confirms storage is readable.

Writes require `X-Requested-With: portfolio-app`. Allowed browser origins are configured in CLIENT_ORIGINS. Authentication attempts are limited per IP for the local process. Errors return JSON messages without stack traces. Passwords and invitations are salted scrypt hashes; sessions are random, expire in 8 hours and live in memory. Admin creation is available only through local startup configuration.

Redux caches reset at login, logout or expiration. Thunk request IDs prevent late private responses from restoring a previous account's records. Lists refresh on route entry. The UI guards are navigation aids; the Express role checks and identity filters enforce access.

The JSON store uses synchronous read/validate/write operations and temporary-file rename within one process. Invalid data fails closed; it is not replaced with empty arrays. database.example.json is the safe seed; database.json is private runtime state. See README.md for startup and deployment limitations.
