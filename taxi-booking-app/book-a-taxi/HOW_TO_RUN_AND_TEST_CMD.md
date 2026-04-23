# How To Clone, Run, and Test (Windows CMD)

This guide is for anyone cloning your GitHub repository and running the project from Command Prompt (CMD) on Windows.

## Important Disclaimer

This application is a dummy/demo environment for learning and testing.
- No real-world ride bookings are performed.
- No real financial transactions or payment processing occur.
- No real customer service operations are provided.
- Use only test/demo data.

## 1. Prerequisites

Install the following first:
- Git
- Node.js (LTS recommended, includes npm)

Verify installation in CMD:

```bat
git --version
node -v
npm -v
```

## 2. Clone the Repository

Open CMD and run:

```bat
git clone <YOUR_GITHUB_REPO_URL>
cd <YOUR_REPO_FOLDER>
```

Replace:
- `<YOUR_GITHUB_REPO_URL>` with your actual repo URL
- `<YOUR_REPO_FOLDER>` with the cloned folder name

## 3. Install Dependencies

This project has two parts:
- Frontend (React/Vite)
- Backend (Express server)

From the project root (same folder as `package.json` and `server/`), run:

```bat
npm install
cd server
npm install
cd ..
```

## 4. Start Backend and Frontend (Two CMD Windows)

### CMD Window 1: Start backend API

```bat
cd <YOUR_REPO_FOLDER>\server
npm start
```

Backend should run at:
- `http://localhost:3001`

### CMD Window 2: Start frontend app

```bat
cd <YOUR_REPO_FOLDER>
npm run dev
```

Frontend should run at:
- `http://localhost:5173`

If `5173` is busy, Vite will use another port (example: `5174`).

## 5. Open in Browser

Open the frontend URL shown in terminal, usually:
- `http://localhost:5173`

## 6. Quick Test Checklist

### Authentication
1. You should land on Login first.
2. Use demo credentials:
   - Email: `johncarlo.apelacio@gmail.com`
   - Password: `12345`
3. After login, navbar should show welcome info and Logout.

### Booking Flow
1. Go to Home.
2. Fill booking form (pickup, dropoff, date, time, service type, passengers).
3. Click `Book Your Ride`.
4. Select a driver and continue.
5. On confirmation, click confirm and check for the success message (`Ride booked!`).

### Data Persistence
1. Open `server/database.json`.
2. Confirm a new object is added under `bookings`.
3. Verify service fields are present:
   - `serviceType`
   - `typeOfService`

### Services Page Behavior
1. Open Services page.
2. If logged in, clicking a service should redirect to Home with that service auto-selected.
3. If logged out, clicking a service should redirect to Login.

### Account Page Behavior
1. Open Account from navbar (when logged in).
2. Update `First Name`, `Last Name`, and `Age`.
3. Change password using current password.
4. Open `View My Bookings`, then use `Back to Account`.
5. Delete account requires current password.

## 7. Build Validation (Optional)

From project root:

```bat
npm run build
```

A successful build confirms frontend compiles correctly.

## 8. Common Troubleshooting

### Port already in use
- If frontend port is busy, use the alternate URL Vite prints.
- If backend `3001` is busy, stop old Node processes or close old terminals.

### API not reachable
- Make sure backend terminal is running `npm start` in `server/`.
- Confirm backend prints `Server running on http://localhost:3001`.

### Login fails with demo user
- Check `server/database.json` contains the demo user.
- Make sure backend server restarted after pulling latest changes.

## 9. Stop the Project

Press `Ctrl + C` in each CMD window (frontend and backend) to stop both servers.
