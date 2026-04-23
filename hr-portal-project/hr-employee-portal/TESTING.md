# Application Testing Guide

This document explains how to test the HR Employee Portal after the Redux migration.

## Prerequisites

- Node.js installed
- npm installed
- Two terminals available

## Setup

1. Install app dependencies:

```bash
npm install
```

2. Start backend API (json-server) from server folder:

```bash
npx json-server --watch database.json --port 3000
```

3. Start frontend from hr-employee-portal folder:

```bash
npm run dev
```

## Static Checks

1. Run lint:

```bash
npm run lint
```

2. Run production build:

```bash
npm run build
```

Expected result: both commands complete without errors.

## Functional Test Scenarios

### 1. Login and Role Routing

- Open app at /.
- Try empty login submission: expect validation error.
- Login with valid HR credentials: expect redirect to /hrHome.
- Logout: expect redirect to /.
- Login with valid Employee credentials: expect redirect to /employeeHome.

### 2. HR Welcome Screen

- Login as HR.
- Expect welcome card to appear at /hrHome with the HR email shown.
- Expect three clickable cards: Add Employee, View Employees, Leave Info.
- Click Add Employee card: expect Add Employee form to load and welcome card to disappear.
- Navigate back to /hrHome directly: expect welcome card to reappear.
- Repeat for View Employees and Leave Info cards.

### 3. Employee Welcome Screen

- Login as employee.
- Expect welcome card to appear at /employeeHome with the employee first name and email shown.
- Expect three clickable cards: Profile, Apply Leave, Leave Status.
- Click Profile card: expect profile view to load and welcome card to disappear.
- Navigate back to /employeeHome directly: expect welcome card to reappear.
- Repeat for Apply Leave and Leave Status cards.

### 4. Route Protection

- Without login, manually open /hrHome or /employeeHome.
- Expect redirect to /.
- While logged in as employee, open /hrHome.
- Expect redirect to employee area.
- While logged in as HR, open /employeeHome.
- Expect redirect to HR area.

### 5. Employee Management (HR)

- Login as HR.
- Add employee with unique email and department.
- Expect success message and table update in View Employees.
- Try adding same email again.
- Expect duplicate employee message.

### 6. Employee Signup Flow

- Open Sign Up page.
- Verify an employee email that exists and is not signed up.
- Expect step 2 form with department and email prefilled.
- Complete signup fields and submit.
- Expect success message.
- Try re-verifying same email.
- Expect already signed up message.

### 7. Leave Workflow

Employee side:

- Login as employee.
- Apply leave with reason and number of days.
- Expect success message.
- Open View Leave Status.
- Expect newly created request in Pending state.

HR side:

- Login as HR.
- Open View All Leave Info.
- Approve or reject a pending request.
- Expect success message and request removed from pending list.

Employee side again:

- Re-login as the same employee.
- Open View Leave Status.
- Expect status updated to Approved or Denied.

## Redux Regression Checks

- Refresh browser after login.
- Expect session to stay active using persisted auth values.
- Logout and refresh.
- Expect user to remain logged out.

## Troubleshooting

- If API calls fail, verify json-server is running on port 3000.
- If login fails unexpectedly, verify credentials in server/database.json.
- If stale data appears, restart frontend and backend servers.
