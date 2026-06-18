# Application Features Guide

## Login Page (`/`)

### Features
- **Login Form** — Authenticates users against `credentials` records via JSON Server
- **Role Selection** — User must specify whether they are logging in as HR or Employee
- **Error Display** — Redux error state surfaced inline below the form

### Form Fields
1. **Email** *(Required)*
2. **Password** *(Required)*
3. **User Type** *(Required)* — `hr` or `employee`

### Behaviors
- All three fields must be filled before submission
- Credentials are validated against the `credentials` collection; mismatched role, email, or password shows an error
- On success, users are redirected to `/hrHome` (HR) or `/employeeHome` (Employee)
- Session email and role are persisted to `sessionStorage` so a page refresh does not require re-login

---

## Sign Up Page (`/signUp`)

### Features
- **Registration Form** — Creates a new entry in the `employeesInfo` collection via JSON Server
- **Navigation Link** — Link back to the login page

### Form Fields
1. **Email** *(Required)*
2. **Password** *(Required)*
3. **First Name** *(Required)*
4. **Last Name** *(Required)*
5. **Age** *(Required)*
6. **Department** *(Required)*

### Behaviors
- Successful registration creates the employee record and redirects to the login page
- Errors from the API are shown as a message below the form

---

## HR Dashboard (`/hrHome`)

Access is protected to users whose session role is `hr`. The dashboard renders a persistent navigation bar with links to all HR sub-sections, and an `<Outlet>` area for active sub-page content.

### Welcome Screen (index route)
- Displayed when no sub-route is active
- Shows a welcome message for the HR user

### Add Employee (`/hrHome/addEmployee`)

#### Features
- **Add Employee Form** — Creates a new employee record in `employeesInfo`

#### Form Fields
1. **Email** *(Required)*
2. **Department** *(Required)*

#### Behaviors
- Both fields must be filled; missing fields show an inline message
- On success, a confirmation message is shown and the form clears

---

### View Employees (`/hrHome/viewEmployees`)

#### Features
- **Employee Table** — Lists all records from `employeesInfo`
- **Loading State** — Shown while the fetch is in progress

#### Displayed Columns
- Email
- Department

---

### Leave Info (`/hrHome/viewAllLeaveInfo`)

#### Features
- **Pending Leave Table** — Lists leave requests with a `pending` status
- **Approve / Deny Actions** — Buttons per row to update the request status

#### Displayed Columns
- Employee Email
- Reason
- Number of Days
- Action (Approve / Deny)

#### Behaviors
- Status update dispatches a Redux thunk that PATCHes the record via JSON Server
- A success or error message is shown after the update

---

## Employee Dashboard (`/employeeHome`)

Access is protected to users whose session role is `employee`. Mirrors the HR dashboard layout with an employee-specific navigation bar and `<Outlet>`.

### Welcome Screen (index route)
- Displayed when no sub-route is active
- Shows a welcome message for the employee

### Profile (`/employeeHome/viewEmployee`)

#### Features
- **Profile Card** — Displays the logged-in employee's personal and employment details

#### Displayed Fields
- First Name
- Last Name
- Email
- Age
- Department

#### Behaviors
- Profile is resolved from Redux state by matching the session email to `employeesInfo` records
- Shows `-` for any field not yet populated

---

### Apply Leave (`/employeeHome/applyLeave`)

#### Features
- **Leave Request Form** — Submits a new leave request to the `leaveInfo` collection

#### Form Fields
1. **Reason** *(Required)*
2. **Number of Days** *(Required)*

#### Behaviors
- Both fields must be filled; missing fields show an inline message
- Submitted request is associated with the logged-in employee's email
- On success, a confirmation message is shown and the form clears

---

### Leave Status (`/employeeHome/viewLeaveStatus`)

#### Features
- **Leave Status Table** — Lists all leave requests belonging to the logged-in employee

#### Displayed Columns
- Reason
- Number of Days
- Status (`pending`, `approved`, or `denied`)
