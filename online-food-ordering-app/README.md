# Online Food Ordering App

This project is a browser-based food ordering demo built with HTML, Tailwind CSS via CDN, custom CSS, and vanilla JavaScript. It provides a simple account flow using `localStorage`, a dashboard that loads meal data from TheMealDB API, and a client-side cart and checkout experience.

> Disclaimer: This is a dummy application for learning and demonstration purposes only. It does not provide real-world ordering, payment, delivery, or production-grade security functionality.

## Project Structure

- `signin.html`: Sign-in page for existing users.
- `register.html`: Registration page for new users.
- `dashboard.html`: Menu, cart, and checkout experience.
- `js/signin.js`: Shared authentication and page navigation logic.
- `js/dashboard.js`: Dashboard state, rendering, menu loading, cart handling, and checkout logic.
- `css/styles.css`: Shared custom styling, accessibility helpers, and responsive polish.
- `images/`: Background and decorative assets used by the UI.

## Key Improvements Included

- Replaced duplicated authentication logic with shared validation and storage helpers.
- Removed most inline UI behavior from HTML and moved it into event-driven JavaScript.
- Refactored the dashboard into a state-driven render flow with deterministic item pricing.
- Added loading, empty, and error states for menu and cart rendering.
- Added accessibility improvements such as hidden labels and visible focus styles.
- Added functional block comments in the application code for easier maintenance.

## How to Run

Because this is a static front-end project, you can run it in any browser.

1. Open the project folder in VS Code.
2. Open `signin.html` in a browser.
3. If you use Live Server or another local static server, point it at the project root and open the served `signin.html` page.

## Additional Documentation

- See `TESTING.md` for manual testing steps.
- See `USER_GUIDE.md` for end-user instructions.

## Notes

- User accounts are stored in the browser using `localStorage`.
- Menu data is fetched from `https://www.themealdb.com`.
- If the external meal API is unavailable, the dashboard shows an error message instead of menu items.
