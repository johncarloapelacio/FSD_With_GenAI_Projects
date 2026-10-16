# Shared browser checks

Playwright starts isolated temporary app stores and exercises the real interfaces in a browser. It covers Employee Management System enrollment/admin/profile workflows, HR invitation and leave approval, taxi booking/account/cancellation, and food registration/cart/checkout/recovery. It also checks selected mobile layouts. All accounts are synthetic and temporary stores are removed afterward.

## Setup

Use Node.js 24.9 or newer. Run `npm ci` in these package folders first:

- `Employee_Management_System`
- `hr-portal-project/server`
- `hr-portal-project/hr-employee-portal`
- `taxi-booking-app/server`
- `taxi-booking-app/book-a-taxi`
- `online-food-ordering-app`
- `qa`

Build the food stylesheet with `npm run build` from its folder. The React browser fixtures start Vite directly. Then, from `qa`:

```sh
npx playwright install chromium
npm test
```

Windows uses installed Microsoft Edge by default; it does not require the Chromium download when Edge is available. To choose another supported channel, set `PLAYWRIGHT_CHANNEL` before running. Linux/macOS use Playwright Chromium. Linux CI installs its OS dependencies with `npx playwright install --with-deps chromium`.

Tests run serially. Failure screenshots and traces are placed in ignored `test-results`; open a trace with `npx playwright show-trace path/to/trace.zip`. The fixtures use local HTTP listeners, never shared live accounts. Food menu data is injected locally; its browser checks do not depend on TheMealDB availability.

The Employee Management System also retains its separate Cypress suite (`npm run test:e2e` in that folder). API/unit, lint/build, dependency audit, database, and browser checks serve different purposes; use the project READMEs and CI workflow for the complete verification commands.
