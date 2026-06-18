# Employee Management System (EMS)

A full stack Employee Management System built with Node.js, Express, EJS, and the
`fs` module for file based storage (no database), with Cypress for end to end tests.

Admins manage the company employee directory (create, read, update, delete). Employees
who have been added by an admin can finish signup, browse the directory, and customize
their own account. Both dashboards work like a single page app: sections (records,
account settings) switch in place without a full page reload.

## Tech stack

- Node.js and Express 5 for the server and routing
- EJS for server rendered views
- cookie-parser for reading the session cookie
- the fs module so all data lives in JSON files (`admin_db.json`, `emp_db.json`)
- Cypress for end to end tests

No other runtime dependencies are used.

## Getting started

```bash
npm install      # installs express, ejs, cookie-parser, and cypress
npm start        # starts the server on http://localhost:3000
```

Then open http://localhost:3000.

## Accounts

There is one login page and one signup page. On each, you pick Employee or Admin.
Employees sign up in two steps: first they verify their name, email, and date of birth
against an admin-created pending employee record, then they choose a password and add
their phone number and location. Admins sign up with their name, email, date of birth,
password, and the admin passcode.

A seeded admin account is provided:

| Field    | Value                       |
| -------- | --------------------------- |
| Email    | `apelacio.john@gmail.com`   |
| Password | `52277225`                  |

The 18 seeded employees can each log in with their listed email and the password
`password123` (a demo default they can change in account settings). For example
`olivia.smith@company.com` / `password123`.

To create a new admin, choose Admin on the signup page and enter the admin passcode
**`52277225`**. Employees added by an admin from the dashboard are created as pending
accounts. They cannot log in until they complete employee signup with matching name,
email, and date of birth.

## Routes

| Page               | Path               | Who can see it    |
| ------------------ | ------------------ | ----------------- |
| Employee dashboard | `/`                | Employee session  |
| Admin dashboard    | `/admin/dashboard` | Admin session     |
| Login              | `/login`           | Public            |
| Sign up            | `/signup`          | Public            |

### API

| Method | Endpoint                | Who can call it     |
| ------ | ----------------------- | ------------------- |
| GET    | `/api/employees`        | Any signed in user  |
| POST   | `/api/employees`        | Admin only          |
| PUT    | `/api/employees/:id`    | Admin only          |
| DELETE | `/api/employees/:id`    | Admin only          |
| GET    | `/api/account/me`       | Any signed in user  |
| PUT    | `/api/account/profile`  | Self                |
| PUT    | `/api/account/password` | Self                |
| POST   | `/api/signup/verify`    | Public              |
| POST   | `/api/signup/employee`  | Public              |
| POST   | `/api/signup/admin`     | Public              |

## Access control

A session is a random token stored on the server and sent to the browser as an
httpOnly cookie, so a user cannot fake their account or role. The admin dashboard needs
an admin session and the employee dashboard needs an employee session; anything else is
sent back to login. Employees who call an admin only API endpoint get a 403.

## What each role can change

- Employees can change their contact, location, and password.
- Admins can change their designation, department, contact, location, and password, and
  they manage every employee record from the dashboard.
- Admins add and edit an employee's name, email, designation, department, and date of
  birth. Contact and location are filled in by the employee during signup or account
  editing.
- For everyone, name, email, joining date, and date of birth cannot be changed in account
  settings once they are set.

Age is always worked out from the date of birth, so it stays correct over time: one year
from now everyone is a year older. Phone numbers are stored and shown as `###-###-####`
with no country code.

## Color themes

- Login and signup pages: beige, brown, sky blue, grayscale
- Admin dashboard: black, burgundy, grayscale
- Employee dashboard: dark olive green, muted mustard yellow, grayscale

## Testing (Cypress)

Start the server first, then run the tests in a second terminal:

```bash
npm start            # terminal 1
npm run cypress:run  # terminal 2, headless run
# or
npm run cypress:open # interactive runner
```

Specs live in `cypress/e2e/`:

- `auth.cy.js`
- `admin_dashboard.cy.js`
- `employee_dashboard.cy.js`

The CRUD specs create unique records and clean up after themselves so you can run the
suite again. The current app requires employee records to be created by an admin before
employee signup can be completed, so new employee signup tests should create a pending
employee first and then finish signup through `/api/signup/verify` and
`/api/signup/employee`.

## Project structure

```
app.js                  Express entry point
admin_db.json           Admin accounts
emp_db.json             Employee accounts (also the directory)
lib/
  db.js                 fs based data access plus helpers (age, dates, validation)
  sessions.js           In memory session store
middleware/
  auth.js               Works out who is logged in, guards pages and the API
routes/
  pages.js              Page routes
  auth.js               Login and logout
  api.signup.js         Employee and admin signup API
  api.employees.js      Employee CRUD API
  api.account.js        Account profile and password API
views/                  EJS templates (login, signup, admin/, employee/, partials/)
public/
  css/                  base.css plus one file per theme
  js/                   common.js, signup.js, account.js, admin.js, employee.js
cypress/                Cypress config, support, and e2e specs
```

## TODOS

- Only Admin adds admin
- Admin checkmark for new and signup guard
- Message for adding admin; must be human relations
