# HR Employee Portal

HR Employee Portal is a React + Vite frontend with a JSON Server backend and JSON file storage.

## Important Disclaimer
- This project is a demo/dummy site for development and testing only.
- It does not represent a real HR system or manage real employee data.
- It does not integrate with any payroll, compliance, or identity provider.
- Do not use this project in production as-is.

## Tech Stack
- Frontend: React, React Router, Redux Toolkit, Vite
- State Management: Redux Toolkit (RTK)
- HTTP Client: Axios
- Backend: JSON Server
- Storage: JSON file at `server/database.json`

## Run Locally

Two terminals are required.

**Terminal 1 — Backend (from `server/` folder):**

```bash
npx json-server --watch database.json --port 3000
```

**Terminal 2 — Frontend (from `hr-employee-portal/` folder):**

```bash
npm install
npm run dev
```

App URLs:
- Frontend: http://localhost:5173 (or next free Vite port)
- Backend: http://localhost:3000

## Route Map
- `/` — Login
- `/signUp` — Sign Up
- `/hrHome` — HR Dashboard (protected, HR role only)
- `/hrHome/addEmployee` — Add Employee
- `/hrHome/viewEmployees` — View All Employees
- `/hrHome/viewAllLeaveInfo` — Leave Info
- `/employeeHome` — Employee Dashboard (protected, Employee role only)
- `/employeeHome/viewEmployee` — Profile
- `/employeeHome/applyLeave` — Apply Leave
- `/employeeHome/viewLeaveStatus` — Leave Status

## Core Features
- Role-based login: HR and Employee users are routed to separate dashboards
- Route protection via `ProtectedRoute` component enforcing `requiredUserType`
- HR can add employees, view the full employee list, and approve or deny leave requests
- Employees can view their own profile, submit leave requests, and check leave status
- Session persisted in `sessionStorage` so refreshes do not force re-login

## Data Notes
- `server/database.json` holds three collections: `credentials`, `employeesInfo`, `leaveInfo`
- `credentials` records contain `emailId`, `password`, and `typeOfUser` (`hr` or `employee`)
- `employeesInfo` records contain `emailId`, `department`, `fname`, `lname`, `password`, `age`, `signedUp`
- `leaveInfo` records contain `emailId`, `reason`, `numberOfDays`, `status`

## Validation Commands

From the `hr-employee-portal/` folder:

```bash
npm run lint
npm run build
```
