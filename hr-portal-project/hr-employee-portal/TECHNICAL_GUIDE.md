# Technical Implementation Guide

## Project Architecture

### Technology Stack
- **Frontend Framework**: React 19.2.4
- **Routing**: React Router DOM 7.14.2
- **State Management**: Redux Toolkit 2.11.2, React Redux 9.2.0
- **Build Tool**: Vite 8.0.1
- **HTTP Client**: Axios 1.15.2
- **Styling**: CSS3 (component-scoped CSS files)
- **Backend**: JSON Server (watches `server/database.json` on port 3000)

### Folder Structure

```
hr-portal-project/
├── server/
│   └── database.json               (JSON Server data file: credentials, employeesInfo, leaveInfo)
└── hr-employee-portal/
    ├── src/
    │   ├── components/
    │   │   ├── Login.jsx / .css
    │   │   ├── SignUp.jsx / .css
    │   │   ├── HRDashboard.jsx / .css
    │   │   ├── EmployeeDashboard.jsx / .css
    │   │   ├── AddEmployee.jsx / .css
    │   │   ├── ViewAllEmployees.jsx / .css
    │   │   ├── ViewAllLeaveInfo.jsx / .css
    │   │   ├── EmployeeView.jsx / .css
    │   │   ├── ApplyLeave.jsx / .css
    │   │   ├── ViewLeaveStatus.jsx / .css
    │   │   ├── HRWelcome.jsx
    │   │   ├── EmployeeWelcome.jsx
    │   │   └── ProtectedRoute.jsx
    │   ├── config/
    │   │   └── api.js                  (API base URL, endpoint catalog, shared Axios client)
    │   ├── store/
    │   │   ├── index.js                (Redux store configuration)
    │   │   └── slices/
    │   │       ├── authSlice.js        (Login, logout, session persistence)
    │   │       ├── employeesSlice.js   (Employee CRUD operations)
    │   │       └── leaveSlice.js       (Leave request submission and status updates)
    │   ├── App.jsx                     (Route map)
    │   ├── main.jsx                    (React and Redux entry point)
    │   ├── App.css / index.css
    │   └── assets/
    ├── public/
    ├── package.json
    ├── vite.config.js
    └── eslint.config.js
```

---

## Component Architecture

### Component Tree

```
App
├── Login (/)
├── SignUp (/signUp)
├── ProtectedRoute [requiredUserType="hr"]
│   └── HRDashboard (/hrHome)
│       ├── HRWelcome (index)
│       ├── AddEmployee (/hrHome/addEmployee)
│       ├── ViewAllEmployees (/hrHome/viewEmployees)
│       └── ViewAllLeaveInfo (/hrHome/viewAllLeaveInfo)
└── ProtectedRoute [requiredUserType="employee"]
    └── EmployeeDashboard (/employeeHome)
        ├── EmployeeWelcome (index)
        ├── EmployeeView (/employeeHome/viewEmployee)
        ├── ApplyLeave (/employeeHome/applyLeave)
        └── ViewLeaveStatus (/employeeHome/viewLeaveStatus)
```

### Component Responsibilities

#### `ProtectedRoute.jsx`
- Reads `userType` and `isAuthenticated` from Redux auth state
- Redirects unauthenticated users to `/`
- Redirects users whose role does not match `requiredUserType` to their correct dashboard
- Renders `<Outlet>` for authorized users

#### `HRDashboard.jsx` / `EmployeeDashboard.jsx`
- Layout shells: persistent header, role-specific nav links, and an `<Outlet>` for sub-routes
- Dispatch `logoutUser` on sign-out and navigate to `/`
- `EmployeeDashboard` also fetches employee records on mount so child components can resolve profile data locally

#### `Login.jsx`
- Manages local `form` state (`email`, `password`, `userType`)
- Dispatches `loginUser` thunk on submit
- Redirects on `isAuthenticated` change via `useEffect`

#### `AddEmployee.jsx` / `ApplyLeave.jsx`
- Manage local form state and a transient `message` string
- Dispatch the respective thunk on submit and clear the form on success

#### `ViewAllEmployees.jsx` / `ViewAllLeaveInfo.jsx` / `ViewLeaveStatus.jsx`
- Read from Redux selectors and render tabular data
- `ViewAllLeaveInfo` additionally dispatches `updateLeaveStatus` per row action

---

## Redux State Management

### Store Slices

#### `authSlice`
- **State**: `userEmail`, `userType`, `status`, `error`
- **Thunk**: `loginUser` — GETs `credentials`, finds a matching record, rejects with a message if not found
- **Reducers**: `clearAuthError`, `logoutUser`
- **Persistence**: `userEmail` and `userType` are written to `sessionStorage` on fulfilled login and cleared on logout

#### `employeesSlice`
- **State**: `employees` (array), `status`, `error`
- **Thunks**: `fetchEmployees` (GET), `addEmployee` (POST)
- **Selectors**: `selectAllEmployees`, `selectEmployeeByEmail`, `selectEmployeesState`

#### `leaveSlice`
- **State**: `leaveRequests` (array), `status`, `error`
- **Thunks**: `fetchLeaveRequests` (GET), `applyLeaveRequest` (POST), `updateLeaveStatus` (PATCH)
- **Selectors**: `selectPendingLeaveRequests`, `selectLeaveByEmail`, `selectLeaveState`

---

## API Configuration

Centralized in `src/config/api.js`:

```javascript
const API_BASE = "http://localhost:3000";

export const API_ENDPOINTS = {
    CREDENTIALS: `${API_BASE}/credentials`,
    EMPLOYEES:   `${API_BASE}/employeesInfo`,
    LEAVE:       `${API_BASE}/leaveInfo`,
};

export const apiClient = axios.create({ timeout: 10000 });
```

All async thunks import `apiClient` and `API_ENDPOINTS` from this file, keeping the base URL in one place.

---

## Session Persistence

Auth state is hydrated from `sessionStorage` on store initialization:

```javascript
const initialState = {
    userEmail: sessionStorage.getItem("userEmail") || "",
    userType:  sessionStorage.getItem("userType")  || "",
    status: "idle",
    error: "",
};
```

On fulfilled login, both keys are written. On logout, both keys are removed. This means a hard refresh restores the session without re-authenticating.

---

## Styling Strategy

Each component has a co-located CSS file (e.g., `Login.css`, `HRDashboard.css`). Global resets and root-level rules live in `App.css` and `index.css`. No CSS-in-JS library is used.
