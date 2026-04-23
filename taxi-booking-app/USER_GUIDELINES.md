# User Guidelines

This document explains how to use the Book a Taxi app as an end user.

## Scope and Disclaimer

- This app is a demo environment for learning and testing.
- It does not process real payments or real-world taxi operations.
- Use test/demo data only.

## Accessing the App

1. Open the frontend URL in your browser (usually `http://localhost:5173`).
2. You will be redirected to the Login page first.
3. Sign in with an existing account, or create one from Sign Up.

## Main Navigation

After login, the navigation bar gives access to:
- Home
- Services
- About
- Contact
- Drivers
- Account
- My Bookings
- Logout

## Booking a Ride

1. Go to Home.
2. Enter booking details:
   - Pickup location
   - Dropoff location
   - Date
   - Time
   - Service type
   - Passenger count
3. Select `Book Your Ride`.
4. On the Drivers page, choose a driver.
5. Continue to Confirmation.
6. Confirm the ride.

Expected result:
- A success message appears.
- Booking data is saved by the backend.

## Using the Services Page

The Services page lets you quickly choose a service tier:
- Economy
- Comfort
- Premium
- XL

Behavior:
- If logged in: selecting a service redirects to Home with that service preselected.
- If logged out: selecting a service redirects to Login.

## Managing Your Account

From Account page, you can:
- Update first name, last name, and age
- Change password (requires current password)
- Delete account (requires current password)
- Open My Bookings and return to Account

## Viewing Booking History

1. Go to My Bookings from the navbar or Account page.
2. Review your previous bookings.
3. Use the back/return action to go back to Account when needed.

## Logout

- Click Logout from the navigation bar.
- You will be redirected to Login and protected pages will no longer be accessible.

## Common User Tips

- Fill all required fields before submitting forms.
- Use valid date/time values for booking.
- If your session appears expired, log in again.
- If a page does not load as expected, refresh the browser and ensure frontend/backend servers are both running.
