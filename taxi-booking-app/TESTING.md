# User Testing Guide

This document provides a manual user testing checklist for the Book a Taxi demo application.

## Test Objective

Validate that core user journeys work correctly:
- Authentication
- Booking flow
- Service selection redirects
- Account management
- Booking history visibility

## Test Environment

- OS: Windows
- Browser: Chrome, Edge, or Firefox (latest stable)
- Frontend URL: `http://localhost:5173` (or Vite fallback port)
- Backend URL: `http://localhost:3001`

## Pre-Test Setup

1. Start backend server from `server/`:

```bat
npm start
```

2. Start frontend server from project root:

```bat
npm run dev
```

3. Confirm both servers are running without errors.

## Test Accounts

Use at least one known account (example from project docs):
- Email: `johncarlo.apelacio@gmail.com`
- Password: `12345`

Also test with:
- A newly created account via Sign Up
- Invalid credentials for negative testing

## Core Test Scenarios

### 1. Login and Access Control

Steps:
1. Open app root URL.
2. Verify redirect to Login.
3. Log in with valid credentials.
4. Navigate to protected pages (`/account`, `/my-bookings`).
5. Log out and try to reopen protected pages.

Expected:
- Unauthenticated users are redirected to Login.
- Authenticated users can access protected pages.
- Logout clears protected access.

### 2. Sign Up

Steps:
1. Open Sign Up.
2. Enter valid new user details.
3. Submit form.
4. Attempt login with newly created credentials.

Expected:
- Sign Up succeeds for unique account.
- New user can log in.

### 3. Booking Flow

Steps:
1. Go to Home.
2. Fill all booking fields.
3. Click `Book Your Ride`.
4. Select a driver on Drivers page.
5. Confirm booking on Confirmation page.

Expected:
- Navigation sequence works: Home -> Drivers -> Confirmation.
- Success message appears after confirmation.
- Booking data persists to backend.

### 4. Services Redirect Behavior

Logged-in test:
1. Open Services.
2. Click each service card.

Expected:
- Redirect to Home with selected service prefilled.

Logged-out test:
1. Log out.
2. Open Services.
3. Click a service card.

Expected:
- Redirect to Login.

### 5. Account Management

Steps:
1. Open Account.
2. Update profile fields (first name, last name, age).
3. Change password using correct current password.
4. Attempt password change with incorrect current password.
5. Attempt delete account with incorrect and then correct current password.

Expected:
- Profile updates persist.
- Password change succeeds only with correct current password.
- Delete account requires correct current password.

### 6. My Bookings

Steps:
1. After at least one successful booking, open My Bookings.
2. Verify latest booking appears.
3. Return to Account.

Expected:
- Booking list shows saved entries accurately.
- Navigation back to Account works.

## Data Verification

Open `server/database.json` and validate:
- New users are added under `users`
- New bookings are added under `bookings`
- Booking entries include service fields such as:
  - `serviceType`
  - `typeOfService`

## Non-Functional Checks

- Basic responsiveness on desktop and mobile widths
- Form validation messaging clarity
- No major layout breakage between pages
- No console errors during critical journeys

## Test Result Template

Use this template per scenario:

- Scenario ID:
- Scenario Name:
- Tester:
- Date:
- Preconditions:
- Steps Executed:
- Expected Result:
- Actual Result:
- Status: Pass / Fail
- Notes / Defects:

## Exit Criteria

Testing is considered acceptable when:
- All critical scenarios pass
- No blockers in auth or booking flow
- No data-loss issue in booking/account updates
- Remaining issues (if any) are documented with clear reproduction steps
