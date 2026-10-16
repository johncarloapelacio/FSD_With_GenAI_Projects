# User guide

1. Start the server using the README and open http://localhost:3002.
2. Choose Register, enter your email and an 8-128 character password, and create an account. Then sign in with those credentials.
3. Add meals from the menu. Open Cart to adjust quantities; decreasing a quantity to zero removes that meal. Refresh menu retries the catalog and reconciles unavailable items.
4. Choose Checkout to review the cart, then Checkout again to submit. Confirmation displays a demo order ID, items, and total. No payment or delivery is arranged.
5. If the response is uncertain, keep the tab open and choose Checkout again. Cart edits are locked until that same request is resolved. Reloading in the same tab restores its saved checkout; sign in again if prompted. Do not clear tab storage while an order is unresolved.
6. If another tab signs into a different account, the old dashboard returns to sign-in before submitting under that account. Sign back into the original account to recover its unresolved checkout.
7. Choose Sign Out when finished. Ordinary carts are not saved across reloads; pending checkout recovery is saved separately for the current account in this tab.

Menu failures can be retried. Account passwords cannot be recovered through this demo, so use test credentials you can remember. A server restart signs everyone out while retaining accounts and saved orders.
