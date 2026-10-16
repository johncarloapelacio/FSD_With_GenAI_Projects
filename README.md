# John Carlo Apelacio | Software Development Portfolio

Six projects covering full-stack applications, backend APIs, relational data modeling, and automated software evaluation. The applications demonstrate server-side authorization, input validation, stateful workflows, and regression testing. Each project has its own setup instructions, and each JavaScript package has a dependency lockfile.

| Project | Implementation | What to explore |
| --- | --- | --- |
| [Employee Management System](Employee_Management_System/) | Node.js, Express, EJS, JSON persistence | Administrator/employee roles, private invitations, employee CRUD, session lifecycle, Cypress and API tests |
| [HR Employee Portal](hr-portal-project/) | React, Vite, Express | HR invitations, employee self-service, scoped leave requests and approvals, stale-response protection |
| [Taxi Booking App](taxi-booking-app/) | React, Vite, Express | Scheduling, driver/service selection, server-validated quotes, account-scoped booking and cancellation |
| [Online Food Ordering](online-food-ordering-app/) | Express, JavaScript, HTML, Tailwind CSS | Menu API integration, cart calculations, authoritative order validation, idempotent checkout recovery |
| [Gen AI Powered Software Testing](Gen%20AI%20Powered%20Software%20Testing/) | JavaScript, Jest, Faker | Synthetic KYC/AML scenarios, deterministic fixtures, test-to-requirement mapping, execution-derived reporting |
| [Client Meeting Database](Database_MySQL/) | MySQL/MariaDB, SQL, Python verification | Relational constraints, many-to-many scheduling, derived reporting views, real database integration checks |

## Getting started

Use Node.js 24 LTS (24.9 or newer) and npm for the JavaScript projects. Start with the README in the selected project, run `npm ci` in each of its package directories, and follow its startup instructions. The HR and taxi apps have separate frontend/backend packages. Their default API ports overlap with the Employee Management System; run one project at a time or configure separate ports. The food app defaults to port 3002. If PowerShell blocks the npm/npx scripts, use `npm.cmd` and `npx.cmd` for those commands.

Runtime databases, dependencies, secrets, and test/build output are ignored. Examples contain synthetic data. Create private administrators through the documented setup commands; demo seeding is explicit. Do not put real personal information into public fixtures or commit runtime data.

These are independently runnable portfolio demonstrations. Food ordering and taxi booking do not process payments or perform real-world fulfillment. The file-backed apps use one server process and in-memory sessions; see their documentation for deployment boundaries. The testing project's AI-assisted artifacts and local simulated integrations are identified explicitly; its reports reflect actual test execution.

## Quality checks

Each app's `npm test` checks its implemented behavior. React frontends also provide `npm run lint` and `npm run build`; the food app provides a local CSS build. The [shared browser suite](qa/README.md) verifies complete employee, HR, taxi, and food workflows. The SQL project includes a runner that creates and removes a disposable database and checks the real schema and reports.

[GitHub Actions](.github/workflows/quality.yml) defines dependency audits, application checks, browser workflows, and MySQL integration checks. A workflow definition is not proof of a successful remote run; review the Actions result for the current commit.

## Connect

[GitHub](https://github.com/johncarloapelacio) | [LinkedIn](https://www.linkedin.com/in/john-carlo-apelacio-714846268/)
