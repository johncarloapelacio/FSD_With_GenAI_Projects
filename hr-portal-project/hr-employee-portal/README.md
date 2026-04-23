# HR Employee Portal

An HR and Employee management portal built with React, Vite, React Router, and Redux Toolkit.

## Important Note

This is a dummy/demo application created for learning and practice purposes only. It does not provide real-world HR workflows, production-grade security, or business-ready functionality.

## What Was Implemented

- Full app state migration to Redux Toolkit.
- Centralized async API flows using thunks.
- Role-based route protection for HR and Employee screens.
- Session-based auth persistence via Redux state initialization.
- Shared API client configuration and standardized error handling.
- Welcome screen for HR dashboard with clickable quick-access cards shown on initial access.
- Welcome screen for Employee dashboard with personalized greeting and clickable quick-access cards shown on initial access.

## Tech Stack

- React 19
- Vite 8
- React Router DOM 7
- Redux Toolkit + React Redux
- Axios

## Project Structure

Key Redux files:

- src/store/index.js
- src/store/slices/authSlice.js
- src/store/slices/employeesSlice.js
- src/store/slices/leaveSlice.js

Routing and guards:

- src/App.jsx
- src/components/ProtectedRoute.jsx

Welcome screens:

- src/components/HRWelcome.jsx
- src/components/EmployeeWelcome.jsx

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Start JSON server (API)

From the server folder:

```bash
npx json-server --watch database.json --port 3000
```

### 3. Start frontend app

From hr-employee-portal folder:

```bash
npm run dev
```

Open the URL shown by Vite (usually http://localhost:5173).

## Available Scripts

- npm run dev: Starts development server.
- npm run build: Creates production build.
- npm run preview: Runs production build preview.
- npm run lint: Runs ESLint checks.

## Credentials and Data

Seed data is stored in server/database.json.

- credentials: Login users and roles.
- employeesInfo: Employee records and signup status.
- leaveInfo: Leave requests and statuses.

## Additional Documentation

- Testing guide: TESTING.md
- End-user guide: USER_GUIDELINES.md
