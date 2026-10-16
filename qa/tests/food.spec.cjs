const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { once } = require('node:events');
const { createApp } = require('../../online-food-ordering-app/server');

let server, directory, origin;
test.beforeEach(async () => {
  directory = fs.mkdtempSync(path.join(os.tmpdir(), 'food-browser-'));
  server = createApp({ dataDir: directory, menuProvider: async () => ({ meals: [
    { idMeal: '101', strMeal: 'Roast vegetables', strMealThumb: '' },
    { idMeal: '102', strMeal: 'Pasta primavera', strMealThumb: '' },
  ] }) }).listen(0, '127.0.0.1');
  await once(server, 'listening'); origin = `http://127.0.0.1:${server.address().port}`;
});
test.afterEach(async () => {
  await new Promise(resolve => { server.close(resolve); server.closeAllConnections(); });
  if(path.dirname(path.resolve(directory))!==path.resolve(os.tmpdir()) || !path.basename(directory).startsWith('food-browser-')) throw new Error('Unexpected cleanup path.');
  fs.rmSync(directory, { recursive: true, force: true });
});
async function registerAndSignIn(page, email = 'riley@example.test') {
  await page.goto(`${origin}/register.html`);
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Password', { exact: true }).fill('Private test password');
  await page.getByRole('button', { name: 'Create Account', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Account created. Continue to Sign in.');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page).toHaveURL(`${origin}/signin.html`);
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Password', { exact: true }).fill('Private test password');
  await page.getByRole('button', { name: 'Sign In', exact: true }).click();
  await expect(page).toHaveURL(`${origin}/dashboard.html`);
  await expect(page.locator('#menuDisplay article')).toHaveCount(2);
}

test('food registration, cart totals, authoritative checkout and revoked logout', async ({ page, context }) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await registerAndSignIn(page);
  await page.getByRole('button', { name: 'Add to cart', exact: true }).first().click();
  await page.getByRole('button', { name: 'Add to cart', exact: true }).last().click();
  await page.getByRole('button', { name: 'Cart', exact: true }).click();
  await page.getByRole('button', { name: 'Increase quantity of Roast vegetables', exact: true }).click();
  await expect(page.locator('#cartItem')).toContainText('Demo total: $27.01');
  await page.getByRole('button', { name: 'Checkout', exact: true }).click();
  await expect(page.locator('#orderStatus')).toContainText('No payment was processed.');
  const stored = JSON.parse(fs.readFileSync(path.join(directory, 'store.json'), 'utf8'));
  expect(stored.orders).toHaveLength(1); expect(stored.orders[0].totalCents).toBe(2701);
  expect(stored.orders[0].items[0].quantity).toBe(2);
  const cookie = (await context.cookies()).find(item => item.name === 'food_session');
  expect(cookie.httpOnly).toBeTruthy();
  await page.getByRole('button', { name: 'Sign Out', exact: true }).click();
  await expect(page).toHaveURL(`${origin}/signin.html`);
  const denied = await context.request.get(`${origin}/api/orders`, { headers: { Cookie: `${cookie.name}=${cookie.value}` } });
  expect(denied.status()).toBe(401);
  await page.goto(`${origin}/dashboard.html`); await expect(page).toHaveURL(`${origin}/signin.html`);
  expect(errors).toEqual([]);
});

test('lost checkout response locks edits and reload reconciles one saved order', async ({ page }) => {
  await registerAndSignIn(page);
  await page.getByRole('button', { name: 'Add to cart', exact: true }).first().click();
  await page.getByRole('button', { name: 'Cart', exact: true }).click();
  await page.route('**/api/orders', async route => {
    if (route.request().method() === 'POST') { await route.fetch(); await route.abort('connectionfailed'); }
    else await route.continue();
  });
  await page.getByRole('button', { name: 'Checkout', exact: true }).click();
  await expect(page.locator('#orderStatus')).toContainText('saved and locked');
  await expect(page.getByRole('button', { name: 'Increase quantity of Roast vegetables', exact: true })).toBeDisabled();
  await page.unroute('**/api/orders'); await page.reload();
  await expect(page.locator('#orderStatus')).toContainText('Demo order confirmed');
  await expect(page.locator('#cartItem')).toContainText('Your cart is empty');
  const stored = JSON.parse(fs.readFileSync(path.join(directory, 'store.json'), 'utf8'));
  expect(stored.orders).toHaveLength(1);
});

test('food mobile pages stay within the viewport', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await registerAndSignIn(page);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  expect(overflow).toBe(false);
  await page.screenshot({ path: testInfo.outputPath('food-mobile.png'), fullPage: true });
});

test('a shared-cookie account switch cannot duplicate an uncertain checkout under another account', async ({ page, context }) => {
  await registerAndSignIn(page);
  await page.getByRole('button', { name: 'Add to cart', exact: true }).first().click();
  await page.getByRole('button', { name: 'Cart', exact: true }).click();
  await page.route('**/api/orders', async route => {
    if (route.request().method() === 'POST') { await route.fetch(); await route.abort('connectionfailed'); }
    else await route.continue();
  });
  await page.getByRole('button', { name: 'Checkout', exact: true }).click();
  await expect(page.locator('#orderStatus')).toContainText('saved and locked');
  await page.unroute('**/api/orders');
  const before = JSON.parse(fs.readFileSync(path.join(directory, 'store.json'), 'utf8'));
  const firstAccount = before.users.find(user => user.email === 'riley@example.test');
  const recoveryKey = `food.pendingCheckout.${firstAccount.id}`;
  const snapshot = await page.evaluate(key => sessionStorage.getItem(key), recoveryKey);
  const otherTab = await context.newPage();
  await registerAndSignIn(otherTab, 'other@example.test');
  await expect(page.locator('#emailDisplay')).toHaveText('riley@example.test');
  const blocked = page.waitForResponse(response => response.url() === `${origin}/api/orders` && response.request().method() === 'POST');
  await page.getByRole('button', { name: 'Checkout', exact: true }).click();
  const response = await blocked;
  expect(response.status()).toBe(409);
  await expect(page).toHaveURL(`${origin}/signin.html`);
  expect(await page.evaluate(key => sessionStorage.getItem(key), recoveryKey)).toBe(snapshot);
  const after = JSON.parse(fs.readFileSync(path.join(directory, 'store.json'), 'utf8'));
  expect(after.orders).toHaveLength(1);
  expect(after.orders[0].userId).toBe(firstAccount.id);
  const currentSession = await context.request.get(`${origin}/api/session`);
  expect((await currentSession.json()).user.email).toBe('other@example.test');
  // Returning to the original account resolves its existing order without a second POST.
  await page.getByLabel('Email address').fill('riley@example.test');
  await page.getByLabel('Password', { exact: true }).fill('Private test password');
  await page.getByRole('button', { name: 'Sign In', exact: true }).click();
  await expect(page).toHaveURL(`${origin}/dashboard.html`);
  await expect(page.locator('#orderStatus')).toContainText('Demo order confirmed');
  expect(await page.evaluate(key => sessionStorage.getItem(key), recoveryKey)).toBe(null);
  expect(JSON.parse(fs.readFileSync(path.join(directory, 'store.json'), 'utf8')).orders).toHaveLength(1);
});
