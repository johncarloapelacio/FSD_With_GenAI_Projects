# Features

## Accounts

Registration validates an email address and an 8-128 character password. Password spaces are significant. Duplicate emails are rejected case-insensitively, including concurrent registrations. Sign-in creates a server session lasting up to eight hours. Sign-out revokes that session; a dashboard URL alone does not grant access.

## Menu and cart

The server fetches and validates TheMealDB meals and supplies generated demo prices. The browser renders text safely, displays loading/error states, and supports retry/refresh. A cart supports up to 100 distinct meals and 1-99 of each. Refresh reconciles unavailable items and updates displayed prices when no checkout is unresolved.

## Checkout

Checkout first opens the cart for review. A subsequent click submits the selected IDs and quantities. The server derives prices and account ownership and saves the order before confirming it. A request ID makes repeat submissions of the same checkout return the original order. Reusing an ID with different items is rejected.

An uncertain response locks cart edits and preserves the request snapshot in this tab's session storage. Retry submits the same operation. Reload and sign-in with the same account reconcile any saved order before retrying. Keep the tab's storage intact while a checkout is unresolved. Completed confirmation lists the saved order ID, lines, and total and clears the cart. No funds are collected.

## Boundaries

The application does not send orders to a restaurant, dispatch deliveries, process payments, verify email ownership, or provide password recovery. The account-scoped history endpoint supports recovery; a dedicated order-history screen is not included. Unsaved ordinary cart edits are in memory and disappear on reload.
