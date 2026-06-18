# Book a Taxi

Book a Taxi is a React + Vite frontend with an Express backend and JSON file storage.

## Important Disclaimer
- This project is a demo/dummy site for development and testing only.
- It does not provide real-world ride bookings.
- It does not process real financial transactions or payments.
- It does not provide real customer service operations.
- Do not use this project in production as-is.

## Tech Stack
- Frontend: React, React Router, Vite
- Backend: Node.js, Express
- Storage: JSON file at server/database.json

## Run Locally (Windows CMD)
Use this file as the quick overview, then follow the full command-by-command setup and testing guide:
- [HOW_TO_RUN_AND_TEST_CMD.md](HOW_TO_RUN_AND_TEST_CMD.md)

Quick commands:

```bat
git clone <YOUR_GITHUB_REPO_URL>
cd <YOUR_REPO_FOLDER>
npm install
cd server
npm install
npm start
```

Open another CMD window:

```bat
cd <YOUR_REPO_FOLDER>
npm run dev
```

App URLs:
- Frontend: http://localhost:5173 (or next free Vite port)
- Backend: http://localhost:3001

For full browser test coverage (auth, booking flow, services redirects, account actions), use the checklist in [HOW_TO_RUN_AND_TEST_CMD.md](HOW_TO_RUN_AND_TEST_CMD.md).

## Current Route Map
- /login
- /signup
- /home
- /services
- /about
- /contact
- /drivers
- /confirmation
- /account (protected)
- /my-bookings (protected)
- / redirects to /login

## Core Features
- Login-first flow with localStorage session
- Booking flow: Home -> Drivers -> Confirmation
- Service selection on Home: Economy, Comfort, Premium, XL
- Services cards redirect behavior:
  - Logged in: redirects to Home with selected service prefilled
  - Logged out: redirects to Login
- Account page:
  - Update First Name, Last Name, Age
  - Change password (requires current password)
  - Delete account (requires current password)
  - View My Bookings and return to Account
- Bookings persisted to server/database.json

## Data Notes
- Users are stored in server/database.json under users
- Bookings are stored under bookings
- Booking service fields include serviceType and typeOfService

## Validation Commands
From project root:

```bat
npm run lint
npm run build
```

Backend syntax check:

```bat
node --check server\\server.js
```
