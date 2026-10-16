# Using Book a Taxi

This portfolio demo uses fictional drivers and fixed sample fares. It does not dispatch vehicles, collect payments or send contact messages. Use test data.

Create an account on Sign Up with first/last name, age (16-120), email and a password of at least 10 characters. Sign in on later visits. There are no shared demo credentials.

On Home, enter different pickup/dropoff addresses, a future pickup date/time within one year, a service and the exact passenger count. Supported date input includes MM/DD/YYYY, YYYY-MM-DD, tomorrow and weekday names; times include 24-hour input and AM/PM. Each service has a capacity limit.

Select Book Your Ride, choose a matching sample driver and review the fixed quote. Edit Booking preserves your entered details. Confirm Booking saves the ride; select View My Bookings to manage it. You can cancel an upcoming confirmed ride before its pickup time. The user interface lists active rides; cancelled records remain stored as history.

The Services page loads the current service catalog and can preselect a tier on Home. Account lets you update your name/age, view bookings, change your password with the current password, or delete the account with password confirmation. Password changes invalidate previous sessions; deleting an account also removes its bookings.

Use Logout to invalidate the session. Sessions expire in eight hours and API restarts require signing in again. The Contact page previews validation locally and does not deliver messages.

Booking confirmation uses a UUID request ID and an immutable submitted payload saved with the draft. Retrying after a lost response or reload reuses that request: the API returns the existing booking (HTTP 200), creates a new one only once (HTTP 201), and rejects changed booking details under the same key (HTTP 409). Keys and payload fingerprints are stored with the booking, scoped to its owner, so replay protection survives an API restart. An uncertain confirmation can be resumed from Home; editing is disabled until its result is retrieved. Replaying a cancelled booking retrieves that cancelled record instead of creating another ride. Explicit logout clears local drafts; review My Bookings before starting a new ride after an interrupted confirmation.
