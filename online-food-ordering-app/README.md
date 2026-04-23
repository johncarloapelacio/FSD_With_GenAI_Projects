# Online Food Ordering App

Online Food Ordering App is a static front-end demo built with HTML, Tailwind CSS (CDN), custom CSS, and vanilla JavaScript.

## Important Disclaimer
- This project is a demo/dummy site for development and learning purposes only.
- It does not provide real-world food ordering, payment, or delivery.
- It does not process real financial transactions.
- Do not use this project in production as-is.

## Tech Stack
- Frontend: HTML5, Tailwind CSS (CDN), custom CSS, vanilla JavaScript
- Storage: Browser `localStorage`
- External API: TheMealDB (`https://www.themealdb.com`)

## Run Locally

This is a static front-end project with no build step required.

1. Open the project folder in VS Code.
2. Open `signin.html` directly in a browser, or use the Live Server extension pointed at the project root.

## Page Map
- `signin.html` — sign-in for existing users
- `register.html` — new account registration
- `dashboard.html` — menu browsing, cart management, and checkout (protected)

## Core Features
- Account registration and sign-in backed by `localStorage`
- Dashboard access guard: unauthenticated users are redirected to sign-in
- Menu loaded from TheMealDB API with loading and error states
- Deterministic per-item pricing derived from meal ID
- Client-side cart with quantity controls and running total
- Checkout generates a receipt alert and clears the cart
- Sign-out clears the active session

## Data Notes
- All user accounts are stored in `localStorage` under the `accounts` key
- The active session email is stored under `activeAccount`
- Menu data is fetched from `https://www.themealdb.com/api/json/v1/1/search.php?f=a`
- No server or database is used

## Additional Documentation
- See [FEATURES_GUIDE.md](FEATURES_GUIDE.md) for a detailed per-page feature breakdown.
- See [TECHNICAL_GUIDE.md](TECHNICAL_GUIDE.md) for architecture, file structure, and implementation patterns.
- See [TESTING.md](TESTING.md) for manual testing steps.
- See [USER_GUIDE.md](USER_GUIDE.md) for end-user instructions.
