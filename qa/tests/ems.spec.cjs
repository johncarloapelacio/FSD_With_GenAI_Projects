const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { once } = require('node:events');
const root = path.resolve(__dirname, '../../Employee_Management_System');
let temporary;
let server;
let base;

test.beforeAll(async () => {
  temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'ems-native-browser-'));
  process.env.EMS_DATA_DIR = temporary;
  process.env.NODE_ENV = 'test';
  require(path.join(root, 'lib/demo')).installDemo();
  server = require(path.join(root, 'app')).listen(0, '127.0.0.1');
  await once(server, 'listening');
  base = `http://127.0.0.1:${server.address().port}`;
});
test.afterAll(async () => {
  if (server) {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
  if (temporary) {
    if (path.dirname(path.resolve(temporary)) !== path.resolve(os.tmpdir()) || !path.basename(temporary).startsWith('ems-native-browser-')) throw new Error('Unexpected cleanup path.');
    fs.rmSync(temporary, { recursive: true, force: true });
  }
});
async function login(page, role = 'admin', email = 'admin@demo.example', password = 'DemoAdmin2026!') {
  await page.goto(`${base}/login`);
  await page.locator(`[data-cy=role-${role}]`).check({ force: true });
  await page.locator('[data-cy=email]').fill(email);
  await page.locator('[data-cy=password]').fill(password);
  await page.locator('[data-cy=submit]').click();
  await expect(page).toHaveURL(role === 'admin' ? `${base}/admin/dashboard` : `${base}/`);
}

test('EMS native forms: admin invitation, employee enrollment, profile/password update and deletion', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const email = 'native.employee@test.example';
  await login(page);
  await page.locator('[data-cy=add-employee]').click();
  await page.locator('[data-cy=emp-name]').fill('Native Browser Employee');
  await page.locator('[data-cy=emp-email]').fill(email);
  await page.locator('[data-cy=emp-designation]').fill('QA Engineer');
  await page.locator('[data-cy=emp-department]').fill('Engineering');
  await page.locator('[data-cy=emp-dob]').fill('1994-03-03');
  await page.locator('[data-cy=emp-save]').click();
  await expect(page.locator('#emp-modal')).not.toHaveClass(/open/);
  const signupUrl = await page.locator('[data-cy=invitation-link]').inputValue();
  expect(signupUrl).toMatch(/\/signup\?invite=[a-f0-9]{64}$/);
  const employeeCard = page.locator('[data-cy=emp-card]').filter({ hasText: 'Native Browser Employee' });
  await expect(employeeCard).toContainText('Pending signup');
  await page.locator('[data-cy=logout]').click();
  await expect(page).toHaveURL(`${base}/login`);

  await page.goto(signupUrl);
  await page.locator('[data-cy=name]').fill('Native Browser Employee');
  await page.locator('[data-cy=email]').fill(email);
  await page.locator('[data-cy=dob]').fill('March 3, 1994');
  await page.locator('[data-cy=verify]').click();
  await expect(page.locator('[data-cy=matched-note]')).toBeVisible();
  await page.locator('[data-cy=password]').fill('NativeEmployee2026!');
  await page.locator('[data-cy=contact]').fill('5552223333');
  await page.locator('[data-cy=location]').fill('Remote');
  await page.locator('[data-cy=submit]').click();
  await expect(page.locator('[data-cy=success]')).toBeVisible();
  await login(page, 'employee', email, 'NativeEmployee2026!');
  await page.locator('[data-cy=nav-account]').click();
  await page.locator('[data-cy=acct-location]').fill('Updated Office');
  await page.locator('[data-cy=save-profile]').click();
  await expect(page.locator('[data-cy=profile-msg]')).toContainText('updated');
  await page.reload();
  await page.locator('[data-cy=nav-account]').click();
  await expect(page.locator('[data-cy=acct-location]')).toHaveValue('Updated Office');
  await page.locator('[data-cy=current-password]').fill('NativeEmployee2026!');
  await page.locator('[data-cy=new-password]').fill('NativeUpdated2026!');
  await page.locator('[data-cy=confirm-password]').fill('NativeUpdated2026!');
  await page.locator('[data-cy=save-password]').click();
  await expect(page.locator('[data-cy=password-msg]')).toContainText('updated');
  await page.locator('[data-cy=logout]').click();
  await login(page, 'employee', email, 'NativeUpdated2026!');
  await page.locator('[data-cy=logout]').click();
  await login(page);
  await employeeCard.locator('[data-cy=delete-emp]').click();
  await page.locator('[data-cy=confirm-ok]').click();
  await expect(employeeCard).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('EMS native forms: only a signed-in admin creates another administrator', async ({ page }) => {
  await page.goto(`${base}/signup`);
  await expect(page.locator('[data-cy=role-admin]')).toHaveCount(0);
  await login(page);
  await page.locator('[data-cy=add-admin]').click();
  await page.locator('[data-cy=admin-name]').fill('Native Test Administrator');
  await page.locator('[data-cy=admin-email]').fill('native.admin@test.example');
  await page.locator('[data-cy=admin-dob]').fill('1985-04-10');
  await page.locator('[data-cy=admin-password]').fill('NativeAdmin2026!');
  await page.locator('[data-cy=admin-submit]').click();
  await expect(page.locator('[data-cy=success]')).toBeVisible();
  await page.locator('[data-cy=to-login]').click();
  await page.locator('[data-cy=logout]').click();
  await login(page, 'admin', 'native.admin@test.example', 'NativeAdmin2026!');
  await expect(page.locator('[data-cy=topbar-name]')).toHaveText('Native Test Administrator');
});

test('EMS mobile dashboard and pending employee actions fit a narrow viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page);
  await expect(page.locator('[data-cy=add-admin]')).toBeInViewport();
  await page.locator('[data-cy=add-employee]').click();
  for (const [name, value] of Object.entries({ name: 'Mobile Pending', email: 'mobile.pending@test.example', designation: 'Analyst', department: 'Finance', dob: '1990-01-01' })) {
    await page.locator(`[data-cy=emp-${name}]`).fill(value);
  }
  await page.locator('[data-cy=emp-save]').click();
  const card = page.locator('[data-cy=emp-card]').filter({ hasText: 'Mobile Pending' });
  await expect(card).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflow).toBe(false);
  const buttonFits = await card.evaluate((element) => {
    const cardBox = element.getBoundingClientRect();
    return [...element.querySelectorAll('button')].every((button) => {
      const box = button.getBoundingClientRect();
      return box.left >= cardBox.left && box.right <= cardBox.right;
    });
  });
  expect(buttonFits).toBe(true);
});
