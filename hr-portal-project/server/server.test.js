const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { once } = require('node:events');
const { createApp } = require('./server');
async function fixture(t, options = {}) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'portfolio-api-'));
  const dbPath = path.join(directory, 'database.json');
  const app = createApp({ dbPath, ...options });
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(async () => { await new Promise(resolve => server.close(resolve)); const target = path.resolve(directory);
    assert.equal(path.dirname(target).toLowerCase(), path.resolve(os.tmpdir()).toLowerCase());
    assert.ok(path.basename(target).startsWith('portfolio-api-'));
    fs.rmSync(target, { recursive: true, force: true }); });
  const base = `http://127.0.0.1:${server.address().port}`;
  const accounts = new Map();
  async function call(route, { method = 'GET', body, cookie, headers = {} } = {}) {
    const response = await fetch(base + route, { method, headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'portfolio-app', ...(cookie ? { Cookie: cookie, ...(accounts.has(cookie) ? { 'X-Expected-Account': accounts.get(cookie) } : {}) } : {}), ...headers }, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
    const data = await response.json();
    const newCookie = response.headers.get('set-cookie')?.split(';')[0];
    const account = data.user?.id || data.id || accounts.get(cookie);
    if (newCookie && account) accounts.set(newCookie, account);
    return { status: response.status, body: data, cookie: newCookie, headers: response.headers };
  }
  return { call, dbPath, app };
}

const admin = { adminEmail: 'hr@example.test', adminPassword: 'Correct horse 123' };
async function hrFixture(t) { const f = await fixture(t, admin); const login = await f.call('/api/auth/login', { method: 'POST', body: { email: admin.adminEmail, password: admin.adminPassword, userType: 'hr' } }); assert.equal(login.status, 200); return { ...f, hr: login.cookie }; }
async function invite(f, address = 'employee@example.test') {
  const added = await f.call('/api/employeesInfo', { method: 'POST', cookie: f.hr, body: { emailId: address, department: 'Engineering' } });
  assert.equal(added.status, 201);
  const body = { email: address, password: 'Employee password 1', inviteCode: added.body.inviteCode, firstName: 'Sample', lastName: 'Employee', age: 30 };
  assert.equal((await f.call('/api/auth/signup', { method: 'POST', body })).status, 201);
  const login = await f.call('/api/auth/login', { method: 'POST', body: { email: address, password: body.password, userType: 'employee' } });
  assert.equal(login.status, 200); return { cookie: login.cookie, body, employeeId: added.body.id };
}
test('authentication, invitation ownership, sensitive data and role boundaries', async t => {
  const f = await hrFixture(t), { call } = f;
  assert.equal((await call('/api/employeesInfo')).status, 401);
  assert.equal((await call('/credentials')).status, 404);
  const added = await call('/api/employeesInfo', { method: 'POST', cookie: f.hr, body: { emailId: 'invite@example.test', department: 'Finance' } });
  assert.equal(added.status, 201); assert.ok(added.body.inviteCode); assert.equal(added.body.inviteHash, undefined);
  assert.equal((await call('/api/auth/verify-invite', { method: 'POST', body: { email: 'invite@example.test', inviteCode: 'wrong' } })).status, 400);
  const good = await call('/api/auth/verify-invite', { method: 'POST', body: { email: 'invite@example.test', inviteCode: added.body.inviteCode } });
  assert.equal(good.status, 200); assert.equal(good.body.employees, undefined);
  const one = await invite(f), two = await invite(f, 'other@example.test');
  const own = await call('/api/employeesInfo', { cookie: one.cookie }); assert.equal(own.body.length, 1); assert.equal(own.body[0].id, one.employeeId);
  assert.equal((await call('/api/employeesInfo', { cookie: two.cookie })).body.length, 1);
  const all = await call('/api/employeesInfo', { cookie: f.hr }); assert.equal(all.body.length, 3); assert.ok(all.body.every(e => !e.passwordHash && !e.password && !e.inviteHash && !e.inviteCode));
  assert.equal((await call('/api/employeesInfo', { method: 'POST', cookie: one.cookie, body: { emailId: 'bad@example.test', department: 'Root' } })).status, 403);
  assert.equal((await call('/api/auth/signup', { method: 'POST', body: one.body })).status, 400);
  const stored = fs.readFileSync(f.dbPath, 'utf8'); assert.ok(!stored.includes(one.body.password)); assert.ok(!stored.includes(admin.adminPassword));
  assert.equal((await call('/api/auth/login', { method: 'POST', body: { email: admin.adminEmail, password: admin.adminPassword, userType: 'employee' } })).status, 401);
});
test('leave requests derive identity and enforce review transitions, validation and employee privacy', async t => {
  const f = await hrFixture(t), one = await invite(f), two = await invite(f, 'second@example.test');
  const request = await f.call('/api/leaveInfo', { method: 'POST', cookie: one.cookie, body: { emailId: 'forged@example.test', employeeId: two.employeeId, status: 'Approved', reason: 'Annual leave', numberOfDays: 3 } });
  assert.equal(request.status, 201); assert.equal(request.body.employeeId, one.employeeId); assert.equal(request.body.status, 'Pending');
  assert.equal((await f.call('/api/leaveInfo', { cookie: two.cookie })).body.length, 0);
  assert.equal((await f.call(`/api/leaveInfo/${request.body.id}`, { method: 'PATCH', cookie: two.cookie, body: { status: 'Approved' } })).status, 403);
  for (const days of [0, -1, '2x', 1.5, 366, [], null]) assert.equal((await f.call('/api/leaveInfo', { method: 'POST', cookie: one.cookie, body: { reason: 'Test', numberOfDays: days } })).status, 400);
  assert.equal((await f.call(`/api/leaveInfo/${request.body.id}`, { method: 'PATCH', cookie: f.hr, body: { status: 'Approved', reason: 'Forged' } })).status, 200);
  const reviewed = (await f.call('/api/leaveInfo', { cookie: one.cookie })).body[0]; assert.equal(reviewed.reason, 'Annual leave');
  assert.equal((await f.call(`/api/leaveInfo/${request.body.id}`, { method: 'PATCH', cookie: f.hr, body: { status: 'Denied' } })).status, 409);
});
test('session invalidation, CSRF rejection, normalized duplicates and corrupt-store preservation', async t => {
  const f = await hrFixture(t);
  const added = await f.call('/api/employeesInfo', { method: 'POST', cookie: f.hr, body: { emailId: ' Case@Example.Test ', department: 'Test' } }); assert.equal(added.status, 201);
  assert.equal((await f.call('/api/employeesInfo', { method: 'POST', cookie: f.hr, body: { emailId: 'case@example.test', department: 'Test' } })).status, 409);
  assert.equal((await f.call('/api/auth/logout', { method: 'POST', cookie: f.hr, headers: { Origin: 'https://evil.example' } })).status, 403);
  assert.equal((await f.call('/api/auth/logout', { method: 'POST', cookie: f.hr, headers: { 'X-Requested-With': '' } })).status, 403);
  assert.equal((await f.call('/api/auth/logout', { method: 'POST', cookie: f.hr })).status, 200);
  assert.equal((await f.call('/api/auth/session', { cookie: f.hr })).status, 401);
  fs.writeFileSync(f.dbPath, '{broken');
  assert.equal((await f.call('/api/auth/login', { method: 'POST', body: { email: admin.adminEmail, password: admin.adminPassword, userType: 'hr' } })).status, 500);
  assert.equal(fs.readFileSync(f.dbPath, 'utf8'), '{broken');
  assert.throws(() => createApp({ dbPath: f.dbPath }));
});

test('login throttling bounds repeated authentication attempts', async t => {
  const f = await fixture(t);
  for (let i = 0; i < 30; i++) assert.equal((await f.call('/api/auth/login', { method: 'POST', body: { email: 'missing@example.test', password: 'Wrong password 123', userType: 'hr' } })).status, 401);
  assert.equal((await f.call('/api/auth/login', { method: 'POST', body: { email: 'missing@example.test', password: 'Wrong password 123', userType: 'hr' } })).status, 429);
});

test('semantic corruption is rejected before reads and writes without replacing the store', async t => {
  const f = await hrFixture(t), employee = await invite(f);
  await f.call('/api/employeesInfo', { method: 'POST', cookie: f.hr, body: { emailId: 'invited@example.test', department: 'Operations' } });
  await f.call('/api/leaveInfo', { method: 'POST', cookie: employee.cookie, body: { reason: 'Test leave', numberOfDays: 2 } });
  const baseline = fs.readFileSync(f.dbPath, 'utf8');
  const { createBase } = require('./security'), { validateDatabase } = require('./schema');
  const storage = createBase({ dbPath: f.dbPath, examplePath: path.join(__dirname, 'database.example.json'), collections: ['users','employeesInfo','leaveInfo'], cookieName: 'test', validate: validateDatabase });
  const corruptions = [
    db => { db.employeesInfo[0].department = {}; },
    db => { db.employeesInfo[0].age = '30'; },
    db => { db.employeesInfo[0].fname = ''; },
    db => { db.employeesInfo[1].inviteHash = 'not-a-hash'; },
    db => { db.employeesInfo[1].signedUp = true; },
    db => { db.employeesInfo[1].emailId = db.employeesInfo[0].emailId; },
    db => { db.users[1].employeeId = require('node:crypto').randomUUID(); },
    db => { db.users[0].passwordHash = 'plaintext'; },
    db => { db.users[0].emailId = 'UPPER@EXAMPLE.TEST'; },
    db => { db.employeesInfo[0].password = 'legacy-secret'; },
    db => { db.leaveInfo[0].status = 'Anything'; },
    db => { db.leaveInfo[0].numberOfDays = 1.5; },
    db => { db.leaveInfo[0].createdAt = '2030-02-31T12:00:00.000Z'; },
    db => { db.leaveInfo[0].employeeId = require('node:crypto').randomUUID(); },
    db => { db.leaveInfo[0].emailId = 'other@example.test'; },
    db => { db.leaveInfo[0].reason = []; },
    db => { db.credentials = []; },
  ];
  for (const corrupt of corruptions) {
    const db = JSON.parse(baseline); corrupt(db);
    assert.throws(() => storage.write(db), /Invalid database/);
    assert.equal(fs.readFileSync(f.dbPath, 'utf8'), baseline);
    const broken = JSON.stringify(db); fs.writeFileSync(f.dbPath, broken);
    assert.equal((await f.call('/api/health')).status, 500);
    assert.equal(fs.readFileSync(f.dbPath, 'utf8'), broken);
    assert.throws(() => createApp({ dbPath: f.dbPath }), /Invalid database/);
    fs.writeFileSync(f.dbPath, baseline);
  }
});

test('displayed account checks reject cross-tab leave/review/logout operations and scoped reads', async t => {
  const f = await hrFixture(t), one = await invite(f), two = await invite(f, 'two@example.test');
  const oneId = (await f.call('/api/auth/session', { cookie: one.cookie })).body.id;
  const adminId = (await f.call('/api/auth/session', { cookie: f.hr })).body.id;
  createApp({ dbPath: f.dbPath, adminEmail: 'second-hr@example.test', adminPassword: 'Second HR password' });
  const otherHR = await f.call('/api/auth/login', { method: 'POST', body: { email: 'second-hr@example.test', password: 'Second HR password', userType: 'hr' } }); assert.equal(otherHR.status, 200);
  const initial = await f.call('/api/leaveInfo', { method: 'POST', cookie: one.cookie, body: { reason: 'Original request', numberOfDays: 1 } }); assert.equal(initial.status, 201);
  const checks = [
    ['/api/leaveInfo', { method: 'POST', cookie: two.cookie, body: { reason: 'Wrong actor', numberOfDays: 1 }, headers: { 'X-Expected-Account': oneId } }],
    ['/api/employeesInfo', { cookie: two.cookie, headers: { 'X-Expected-Account': oneId } }],
    ['/api/auth/session', { cookie: two.cookie, headers: { 'X-Expected-Account': oneId } }],
    [`/api/leaveInfo/${initial.body.id}`, { method: 'PATCH', cookie: otherHR.cookie, body: { status: 'Approved' }, headers: { 'X-Expected-Account': adminId } }],
    ['/api/auth/logout', { method: 'POST', cookie: otherHR.cookie, headers: { 'X-Expected-Account': adminId } }],
    ['/api/leaveInfo', { method: 'POST', cookie: one.cookie, body: { reason: 'No context', numberOfDays: 1 }, headers: { 'X-Expected-Account': '' } }],
  ];
  const baseline = fs.readFileSync(f.dbPath, 'utf8');
  for (const [route, options] of checks) { const denied = await f.call(route, options); assert.equal(denied.status, 409); assert.equal(denied.body.code, 'ACCOUNT_CHANGED'); assert.equal(fs.readFileSync(f.dbPath, 'utf8'), baseline); }
  assert.equal((await f.call('/api/auth/session', { cookie: otherHR.cookie })).status, 200);
});
