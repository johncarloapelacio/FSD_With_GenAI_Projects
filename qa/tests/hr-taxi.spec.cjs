const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const net = require('node:net');
const { once } = require('node:events');
const { pathToFileURL } = require('node:url');
const repo = path.resolve(__dirname, '../..');
function removeTemporary(directory) {
  const target = path.resolve(directory), parent = path.resolve(os.tmpdir());
  const normalize = value => process.platform === 'win32' ? value.toLowerCase() : value;
  if (normalize(path.dirname(target)) !== normalize(parent) || !path.basename(target).startsWith('portfolio-browser-')) throw new Error('Unsafe browser fixture cleanup path');
  fs.rmSync(target, { recursive: true, force: true });
}

async function freePort() {
  const server = net.createServer(); server.listen(0, '127.0.0.1'); await once(server, 'listening');
  const port = server.address().port; await new Promise(resolve => server.close(resolve)); return port;
}
async function startApp(project, frontend, options = {}) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'portfolio-browser-'));
  const dbPath = path.join(directory, 'database.json');
  const port = await freePort(), origin = `http://127.0.0.1:${port}`;
  const previous = process.env.CLIENT_ORIGINS;
  let api, vite;
  try {
    process.env.CLIENT_ORIGINS = origin;
    const { createApp } = require(path.join(repo, project, 'server/server.js'));
    const app = createApp({ dbPath, ...options });
    api = app.listen(0, '127.0.0.1'); await once(api, 'listening');
    if (previous === undefined) delete process.env.CLIENT_ORIGINS; else process.env.CLIENT_ORIGINS = previous;
    const root = path.join(repo, project, frontend);
    const { createServer } = await import(pathToFileURL(path.join(root, 'node_modules/vite/dist/node/index.js')).href);
    vite = await createServer({ root, logLevel: 'error', server: { host: '127.0.0.1', port, strictPort: true, proxy: { '/api': { target: `http://127.0.0.1:${api.address().port}`, changeOrigin: true } } } });
    await vite.listen();
    return { origin, dbPath, async close() { await vite.close(); await new Promise(resolve => api.close(resolve)); removeTemporary(directory); } };
  } catch (error) {
    if (previous === undefined) delete process.env.CLIENT_ORIGINS; else process.env.CLIENT_ORIGINS = previous;
    if (vite) await vite.close(); if (api) await new Promise(resolve => api.close(resolve));
    removeTemporary(directory); throw error;
  }
}
async function hrLogin(page, origin, email, password, role) {
  page.on('dialog', dialog => dialog.accept());
  await page.goto(origin);
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('radio', { name: role, exact: true }).check();
  await page.getByRole('button', { name: 'Sign In', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(role === 'HR' ? '/hrHome' : '/employeeHome'));
}
test('HR invitation, employee signup, private leave submission, HR review and logout', async ({ browser, page }) => {
  const app = await startApp('hr-portal-project', 'hr-employee-portal', { adminEmail: 'hr@example.test', adminPassword: 'HR private password 123' });
  const employeeContext = await browser.newContext();
  const employee = await employeeContext.newPage();
  try {
    await hrLogin(page, app.origin, 'hr@example.test', 'HR private password 123', 'HR');
    await page.getByRole('link', { name: 'Add Employee', exact: true }).click();
    await page.getByLabel('Email', { exact: true }).fill('employee@example.test');
    await page.getByLabel('Department').fill('Engineering');
    await page.getByRole('button', { name: 'Add Employee', exact: true }).click();
    const notice = page.locator('.app-message');
    await expect(notice).toContainText('one-time invitation');
    const inviteCode = (await notice.textContent()).split(': ').at(-1).trim();
    await employee.goto(`${app.origin}/signUp`);
    await employee.getByLabel('Registered Email').fill('employee@example.test');
    await employee.getByLabel('Invitation code from HR').fill(inviteCode);
    await employee.getByRole('button', { name: 'Verify Invitation' }).click();
    await employee.getByLabel('First Name').fill('Example');
    await employee.getByLabel('Last Name').fill('Employee');
    await employee.getByLabel('Password', { exact: true }).fill('Employee private password');
    await employee.getByLabel('Age').fill('30');
    await employee.getByRole('button', { name: 'Complete Sign Up' }).click();
    await expect(employee.locator('.app-message')).toHaveText('Sign Up successful');
    await hrLogin(employee, app.origin, 'employee@example.test', 'Employee private password', 'Employee');
    await employee.getByRole('link', { name: 'Apply Leave', exact: true }).click();
    await employee.getByLabel('Reason').fill('Annual leave for browser regression');
    await employee.getByLabel('Number of Days').fill('3');
    await employee.getByRole('button', { name: 'Apply Leave', exact: true }).click();
    await expect(employee.locator('.app-message')).toHaveText('Leave applied successfully');
    await employee.getByRole('link', { name: 'Leave Status', exact: true }).click();
    await expect(employee.getByRole('cell', { name: 'Pending', exact: true })).toBeVisible();
    await employee.getByRole('link', { name: 'Apply Leave', exact: true }).click();
    await page.getByRole('link', { name: 'Leave Info', exact: true }).click();
    await expect(page.getByRole('cell', { name: 'Annual leave for browser regression', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Approve', exact: true }).click();
    await expect(page.locator('.app-message')).toHaveText('Status updated successfully');
    await employee.getByRole('link', { name: 'Leave Status', exact: true }).click();
    await expect(employee.getByRole('cell', { name: 'Approved', exact: true })).toBeVisible();
    await employee.reload();
    await expect(employee.getByRole('cell', { name: 'Approved', exact: true })).toBeVisible();
    const cookies = await employeeContext.cookies();
    const oldCookie = cookies.find(cookie => cookie.name === 'hr_session');
    expect(oldCookie.httpOnly).toBeTruthy();
    await employee.getByRole('button', { name: 'Log Out', exact: true }).click();
    await expect(employee).toHaveURL(`${app.origin}/`);
    const denied = await employeeContext.request.get(`${app.origin}/api/auth/session`, { headers: { Cookie: `${oldCookie.name}=${oldCookie.value}` } });
    expect(denied.status()).toBe(401);
    const db = JSON.parse(fs.readFileSync(app.dbPath, 'utf8'));
    expect(db.users).toHaveLength(2); expect(db.leaveInfo[0].status).toBe('Approved');
  } finally { await employeeContext.close(); await app.close(); }
});
test('taxi signup, fixed quote, draft editing, booking, cancellation, profile update and logout', async ({ page, context }) => {
  const app = await startApp('taxi-booking-app', 'book-a-taxi');
  page.on('dialog', dialog => dialog.accept());
  try {
    await page.goto(`${app.origin}/signup`);
    await page.getByLabel('First Name', { exact: true }).fill('Example');
    await page.getByLabel('Last Name', { exact: true }).fill('Rider');
    await page.getByLabel('Age', { exact: true }).fill('30');
    await page.getByLabel('Email Address', { exact: true }).fill('rider@example.test');
    await page.getByLabel('Password', { exact: true }).fill('Rider private password');
    await page.getByLabel('Confirm Password', { exact: true }).fill('Rider private password');
    await page.getByRole('button', { name: 'Create Account', exact: true }).click();
    await expect(page).toHaveURL(`${app.origin}/home`);
    await page.getByRole('link', { name: 'Services', exact: true }).click();
    await page.getByRole('button', { name: 'Book Economy', exact: true }).click();
    await expect(page).toHaveURL(`${app.origin}/home`);
    await page.getByLabel('Pickup Location').fill('Downtown Station');
    await page.getByLabel('Dropoff Location').fill('Airport Terminal');
    await page.getByLabel('Pickup Date').fill('tomorrow');
    await page.getByLabel('Pickup Time').fill('2:30 PM');
    await page.getByLabel('Number of Passengers').selectOption('2');
    await page.getByRole('button', { name: /Book Your Ride/ }).click();
    await expect(page).toHaveURL(`${app.origin}/drivers`);
    await page.getByRole('button', { name: /John Smith/ }).click();
    await page.getByRole('button', { name: /Confirm Selection/ }).click();
    await expect(page).toHaveURL(`${app.origin}/confirmation`);
    await expect(page.locator('.total-amount')).toHaveText('$17.00');
    await page.getByRole('button', { name: 'Edit Booking', exact: true }).click();
    await expect(page.getByLabel('Pickup Location')).toHaveValue('Downtown Station');
    await expect(page.getByLabel('Pickup Time')).toHaveValue('14:30');
    await page.getByRole('button', { name: /Book Your Ride/ }).click();
    await page.getByRole('button', { name: /John Smith/ }).click();
    await page.getByRole('button', { name: /Confirm Selection/ }).click();
    let lostResponse = false;
    await page.route('**/api/bookings', async route => {
      if (route.request().method() === 'POST' && !lostResponse) {
        lostResponse = true;
        const saved = await route.fetch();
        expect(saved.status()).toBe(201);
        await route.abort('failed');
      } else await route.continue();
    });
    await page.getByRole('button', { name: 'Confirm Booking', exact: true }).click();
    await expect(page.locator('.auth-error')).toContainText('response was not received');
    expect(JSON.parse(fs.readFileSync(app.dbPath, 'utf8')).bookings).toHaveLength(1);
    await page.reload();
    await expect(page.getByRole('button', { name: 'Edit Booking', exact: true })).toBeDisabled();
    await page.getByRole('button', { name: 'Confirm Booking', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Ride booked!', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'View My Bookings', exact: true }).click();
    await expect(page.getByText('Downtown Station', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Cancel Booking', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'No bookings yet', exact: true })).toBeVisible();
    await page.getByRole('link', { name: 'Account', exact: true }).click();
    await page.getByLabel('First Name', { exact: true }).fill('Updated');
    await page.getByRole('button', { name: /Update Profile/ }).click();
    await expect(page.locator('.auth-success')).toContainText('Profile updated successfully!');
    const cookies = await context.cookies(); const oldCookie = cookies.find(cookie => cookie.name === 'taxi_session');
    expect(oldCookie.httpOnly).toBeTruthy();
    await page.locator('nav').getByRole('button', { name: 'Logout', exact: true }).click();
    await expect(page).toHaveURL(`${app.origin}/login`);
    const denied = await context.request.get(`${app.origin}/api/auth/session`, { headers: { Cookie: `${oldCookie.name}=${oldCookie.value}` } }); expect(denied.status()).toBe(401);
    await page.getByLabel('Email Address', { exact: true }).fill('rider@example.test');
    await page.getByLabel('Password', { exact: true }).fill('Rider private password');
    await page.getByRole('button', { name: 'Sign In', exact: true }).click();
    await expect(page).toHaveURL(`${app.origin}/home`);
    const db = JSON.parse(fs.readFileSync(app.dbPath, 'utf8'));
    expect(db.users[0].firstName).toBe('Updated'); expect(db.bookings).toHaveLength(1); expect(db.bookings[0].status).toBe('cancelled'); expect(db.bookings[0].price).toBe(17);
  } finally { await app.close(); }
});

test('HR rejects a stale leave form after another tab switches the shared cookie account', async ({ browser, page, context }) => {
  const app = await startApp('hr-portal-project', 'hr-employee-portal', { adminEmail: 'hr@example.test', adminPassword: 'HR private password 123' });
  const admin = await browser.newContext();
  try {
    const headers = { 'X-Requested-With': 'portfolio-app' };
    const login = await admin.request.post(`${app.origin}/api/auth/login`, { headers, data: { email: 'hr@example.test', password: 'HR private password 123', userType: 'hr' } }); expect(login.status()).toBe(200);
    const adminId = (await login.json()).id;
    for (const email of ['first@example.test','second@example.test']) {
      const invitation = await admin.request.post(`${app.origin}/api/employeesInfo`, { headers: { ...headers, 'X-Expected-Account': adminId }, data: { emailId: email, department: 'Engineering' } }); expect(invitation.status()).toBe(201);
      const inviteCode = (await invitation.json()).inviteCode;
      const signup = await admin.request.post(`${app.origin}/api/auth/signup`, { headers, data: { email, inviteCode, password: 'Employee password 123', firstName: 'Example', lastName: 'Employee', age: 30 } }); expect(signup.status()).toBe(201);
    }
    await hrLogin(page, app.origin, 'first@example.test', 'Employee password 123', 'Employee');
    await page.getByRole('link', { name: 'Apply Leave', exact: true }).click();
    await page.getByLabel('Reason').fill('Must not be submitted as the second employee');
    await page.getByLabel('Number of Days').fill('2');
    const other = await context.newPage();
    await other.goto(app.origin); await expect(other).toHaveURL(`${app.origin}/employeeHome`);
    await other.getByRole('button', { name: 'Log Out', exact: true }).click(); await expect(other).toHaveURL(`${app.origin}/`);
    await hrLogin(other, app.origin, 'second@example.test', 'Employee password 123', 'Employee');
    await page.getByRole('button', { name: 'Apply Leave', exact: true }).click();
    await expect(page).toHaveURL(`${app.origin}/`);
    expect(JSON.parse(fs.readFileSync(app.dbPath, 'utf8')).leaveInfo).toHaveLength(0);
    const session = await context.request.get(`${app.origin}/api/auth/session`); expect(session.status()).toBe(200); expect((await session.json()).userEmail).toBe('second@example.test');
  } finally { await admin.close(); await app.close(); }
});
test('taxi rejects a stale booking confirmation after another tab signs in to a different account', async ({ browser, page, context }) => {
  const app = await startApp('taxi-booking-app', 'book-a-taxi');
  const setup = await browser.newContext();
  try {
    for (const email of ['first@example.test','second@example.test']) {
      const signup = await setup.request.post(`${app.origin}/api/auth/signup`, { headers: { 'X-Requested-With': 'portfolio-app' }, data: { email, password: 'Rider password 123', firstName: 'Example', lastName: 'Rider', age: 30 } }); expect(signup.status()).toBe(201);
    }
    await page.goto(`${app.origin}/login`);
    await page.getByLabel('Email Address', { exact: true }).fill('first@example.test');
    await page.getByLabel('Password', { exact: true }).fill('Rider password 123');
    await page.getByRole('button', { name: 'Sign In', exact: true }).click(); await expect(page).toHaveURL(`${app.origin}/home`);
    await page.getByLabel('Pickup Location').fill('First rider station'); await page.getByLabel('Dropoff Location').fill('Airport terminal');
    await page.getByLabel('Pickup Date').fill('tomorrow'); await page.getByLabel('Pickup Time').fill('2pm');
    await page.getByRole('button', { name: /Book Your Ride/ }).click();
    await page.getByRole('button', { name: /John Smith/ }).click();
    await page.getByRole('button', { name: /Confirm Selection/ }).click(); await expect(page).toHaveURL(`${app.origin}/confirmation`);
    const other = await context.newPage(); await other.goto(`${app.origin}/home`);
    await other.locator('nav').getByRole('button', { name: 'Logout', exact: true }).click(); await expect(other).toHaveURL(`${app.origin}/login`);
    await other.getByLabel('Email Address', { exact: true }).fill('second@example.test');
    await other.getByLabel('Password', { exact: true }).fill('Rider password 123');
    await other.getByRole('button', { name: 'Sign In', exact: true }).click(); await expect(other).toHaveURL(`${app.origin}/home`);
    await page.getByRole('button', { name: 'Confirm Booking', exact: true }).click(); await expect(page).toHaveURL(`${app.origin}/login`);
    expect(JSON.parse(fs.readFileSync(app.dbPath, 'utf8')).bookings).toHaveLength(0);
    const session = await context.request.get(`${app.origin}/api/auth/session`); expect(session.status()).toBe(200); expect((await session.json()).user.email).toBe('second@example.test');
  } finally { await setup.close(); await app.close(); }
});
