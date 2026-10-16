const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { once } = require('node:events');
const vm = require('node:vm');
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'ems-api-'));
process.env.EMS_DATA_DIR = temporary;
process.env.NODE_ENV = 'test';
const db = require('../lib/db');
const passwords = require('../lib/passwords');
const sessions = require('../lib/sessions');
const { issueInvitation } = require('../lib/invitations');
const app = require('../app');
const PASSWORD = 'SyntheticPassword2026!';
const hash = passwords.hashPassword(PASSWORD);
let server;
let base;
const account = (id, name, email) => ({ id, name, email, passwordHash: hash, designation: 'Engineer', department: 'Engineering', contact: '555-111-2222', location: 'Test Office', joiningDate: '2026-03-01', dob: '1990-06-15' });

test.before(async () => {
  server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  base = `http://127.0.0.1:${server.address().port}`;
});
test.beforeEach(() => {
  db.saveAdmins([account('test-admin', 'Test Administrator', 'admin@test.example')]);
  db.saveEmployees([account(1, 'First Employee', 'first@test.example'), account(2, 'Second Employee', 'second@test.example')]);
});
test.after(async () => {
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
  if (path.dirname(path.resolve(temporary)) !== path.resolve(os.tmpdir()) || !path.basename(temporary).startsWith('ems-api-')) throw new Error('Unexpected cleanup path.');
  fs.rmSync(temporary, { recursive: true, force: true });
});
async function request(route, { method = 'GET', body, cookie, form = false, headers = {}, raw } = {}) {
  const requestHeaders = { ...headers };
  if (cookie) requestHeaders.Cookie = cookie;
  if (body !== undefined) requestHeaders['Content-Type'] = form ? 'application/x-www-form-urlencoded' : 'application/json';
  const response = await fetch(base + route, {
    method, headers: requestHeaders, redirect: 'manual',
    body: raw !== undefined ? raw : body === undefined ? undefined : form ? new URLSearchParams(body) : JSON.stringify(body),
  });
  const text = await response.text();
  let data;
  try { data = JSON.parse(text); } catch { data = null; }
  return { status: response.status, headers: response.headers, cookie: response.headers.get('set-cookie')?.split(';')[0], data, text };
}
async function login(email = 'admin@test.example', role = 'admin', password = PASSWORD) {
  const response = await request('/login', { method: 'POST', form: true, body: { email, role, password } });
  assert.equal(response.status, 302);
  assert.ok(response.cookie);
  return response.cookie;
}
async function createEmployee(admin, overrides = {}) {
  const response = await request('/api/employees', { method: 'POST', cookie: admin, body: { name: 'Pending Employee', email: 'pending@test.example', designation: 'Analyst', department: 'Finance', dob: '1988-02-10', ...overrides } });
  assert.equal(response.status, 201, response.text);
  return response.data;
}
const signupBody = (created, overrides = {}) => ({ ...created.employee, inviteToken: created.inviteToken, password: PASSWORD, contact: '555-222-3333', location: 'Remote', ...overrides });

test('login, dashboard rendering, anonymous access and role boundaries', async () => {
  const admin = await login();
  const employee = await login('first@test.example', 'employee');
  assert.equal((await request('/admin/dashboard', { cookie: admin })).status, 200);
  assert.equal((await request('/', { cookie: employee })).status, 200);
  assert.equal((await request('/api/employees')).status, 401);
  assert.equal((await request('/api/employees', { method: 'POST', cookie: employee, body: {} })).status, 403);
  assert.equal((await request('/admin/dashboard', { cookie: employee })).status, 302);
});
test('directory and account responses never disclose credentials or invitation hashes', async () => {
  const admin = await login();
  await createEmployee(admin);
  const employee = await login('first@test.example', 'employee');
  const directory = await request('/api/employees', { cookie: employee });
  for (const record of directory.data.employees) {
    for (const field of ['password', 'passwordHash', 'invitationHash', 'invitationExpiresAt', 'dob', 'age']) assert.ok(!(field in record));
  }
  for (const route of ['/api/employees', '/api/account/me']) {
    const response = await request(route, { cookie: admin });
    assert.doesNotMatch(response.text, /password|invitationHash|invitationExpiresAt|scrypt\$/i);
  }
});
test('profile field allowlists and string validation protect account identity', async () => {
  const employee = await login('first@test.example', 'employee');
  const response = await request('/api/account/profile', { method: 'PUT', cookie: employee, body: { id: 2, email: 'forged@test.example', dob: '1999-01-01', designation: 'Forged', department: 'Forged', passwordHash: 'forged', contact: '555-999-0000', location: 'New Office' } });
  assert.equal(response.status, 200);
  assert.equal(response.data.account.email, 'first@test.example');
  assert.equal(response.data.account.designation, 'Engineer');
  assert.equal(response.data.account.contact, '555-999-0000');
  for (const location of [123, {}, [], null, 'x'.repeat(201)]) {
    assert.equal((await request('/api/account/profile', { method: 'PUT', cookie: employee, body: { location } })).status, 400);
  }
});
test('deletion and replacement never revive a deleted employee session', async () => {
  const admin = await login();
  const old = await login('second@test.example', 'employee');
  assert.equal((await request('/api/employees/2', { method: 'DELETE', cookie: admin, body: {} })).status, 200);
  const created = await createEmployee(admin);
  assert.match(created.employee.id, /^[a-f0-9-]{36}$/);
  assert.notEqual(String(created.employee.id), '2');
  assert.equal((await request('/api/account/me', { cookie: old })).status, 401);
  assert.equal((await request('/api/signup/employee', { method: 'POST', body: signupBody(created) })).status, 200);
  assert.equal((await request('/api/account/profile', { method: 'PUT', cookie: old, body: { location: 'Stale account' } })).status, 401);
  assert.equal((await request('/api/account/me', { cookie: old })).status, 401);
  const replacement = await login('pending@test.example', 'employee');
  assert.equal((await request('/api/account/me', { cookie: replacement })).data.account.id, created.employee.id);
});
test('canonical calendar validation rejects impossible, trailing and future dates', async () => {
  const admin = await login();
  for (const dob of ['1990-02-31', '1900-02-29', '2000-13-01', '2000-00-01', '2000-01-00', '2099-01-01invalid', '2099-01-01', '2000-1-01', ' 2000-01-01 ', 123, {}, null]) {
    const response = await request('/api/employees', { method: 'POST', cookie: admin, body: { name: 'Date Test', email: 'date@test.example', designation: 'Tester', department: 'QA', dob } });
    assert.equal(response.status, 400, `Accepted date ${JSON.stringify(dob)}`);
    assert.equal((await request('/api/signup/admin', { method: 'POST', cookie: admin, body: { name: 'Date Admin', email: 'dateadmin@test.example', dob, password: PASSWORD } })).status, 400);
  }
  const created = await createEmployee(admin, { dob: '2000-02-29' });
  assert.equal(created.employee.dob, '2000-02-29');
});
test('nonstring and oversized passwords are rejected at all write boundaries', async () => {
  const admin = await login();
  const employee = await login('first@test.example', 'employee');
  const created = await createEmployee(admin);
  for (const password of [12345678, {}, [], null, true, 'short', 'x'.repeat(257)]) {
    assert.equal((await request('/api/signup/employee', { method: 'POST', body: signupBody(created, { password }) })).status, 400);
    assert.equal((await request('/api/signup/admin', { method: 'POST', cookie: admin, body: { name: 'New Admin', email: 'newadmin@test.example', dob: '1990-01-01', password } })).status, 400);
    assert.equal((await request('/api/account/password', { method: 'PUT', cookie: employee, body: { currentPassword: PASSWORD, newPassword: password } })).status, 400);
  }
  assert.equal((await request('/api/account/password', { method: 'PUT', cookie: employee, body: { currentPassword: 12345678, newPassword: 'ValidPassword2026!' } })).status, 400);
  assert.equal((await request('/api/account/me', { cookie: employee })).status, 200);
});
test('new employee credentials are hashed, verifiable, and never stored in plaintext', async () => {
  const admin = await login();
  const created = await createEmployee(admin);
  assert.equal((await request('/api/signup/employee', { method: 'POST', body: signupBody(created) })).status, 200);
  const stored = db.getEmployees().find((record) => record.id === created.employee.id);
  assert.ok(!('password' in stored));
  assert.match(stored.passwordHash, /^scrypt\$v1\$/);
  assert.ok(passwords.verifyPassword(PASSWORD, stored));
  assert.ok(!passwords.verifyPassword('WrongPassword', stored));
  await login('pending@test.example', 'employee');
  assert.notEqual(passwords.hashPassword(PASSWORD), passwords.hashPassword(PASSWORD));
});
test('legacy plaintext passwords migrate before login issues a session', async () => {
  const employees = db.getEmployees();
  delete employees[0].passwordHash;
  employees[0].password = 'old123';
  db.saveEmployees(employees);
  const cookie = await login('first@test.example', 'employee', 'old123');
  assert.equal((await request('/api/account/me', { cookie })).status, 200);
  const stored = db.getEmployees()[0];
  assert.ok(!('password' in stored));
  assert.ok(passwords.verifyPassword('old123', stored));
});
test('administrator creation requires an existing authenticated administrator', async () => {
  const body = { name: 'New Administrator', email: 'newadmin@test.example', dob: '1990-01-01', password: PASSWORD, passcode: 'old-published-demo-passcode' };
  assert.equal((await request('/api/signup/admin', { method: 'POST', body })).status, 401);
  const employee = await login('first@test.example', 'employee');
  assert.equal((await request('/api/signup/admin', { method: 'POST', cookie: employee, body })).status, 403);
  const publicSignup = await request('/signup');
  assert.doesNotMatch(publicSignup.text, /data-cy="role-admin"/);
  const admin = await login();
  assert.equal((await request('/api/signup/admin', { method: 'POST', cookie: admin, body })).status, 200);
  assert.equal((await request('/api/account/me', { cookie: admin })).data.account.email, 'admin@test.example');
  await login('newadmin@test.example', 'admin');
});
test('employee enrollment requires a private valid invitation and pending account cannot log in', async () => {
  const admin = await login();
  const created = await createEmployee(admin);
  assert.equal((await request('/login', { method: 'POST', form: true, body: { role: 'employee', email: created.employee.email, password: PASSWORD } })).status, 401);
  for (const inviteToken of [undefined, '', 'a'.repeat(64), {}, 123]) {
    const body = signupBody(created, { inviteToken });
    assert.equal((await request('/api/signup/verify', { method: 'POST', body })).status, 404);
    assert.equal((await request('/api/signup/employee', { method: 'POST', body })).status, 404);
  }
  assert.equal((await request('/api/signup/verify', { method: 'POST', body: signupBody(created) })).status, 200);
  const stored = db.getEmployees().find((record) => record.id === created.employee.id);
  assert.notEqual(stored.invitationHash, created.inviteToken);
  const records = db.getEmployees();
  records.find((record) => record.id === created.employee.id).password = '';
  db.saveEmployees(records);
  assert.equal((await request('/login', { method: 'POST', form: true, body: { role: 'employee', email: created.employee.email, password: '' } })).status, 401);
});
test('invitation reissue, expiry, identity match, and single use are enforced', async () => {
  const admin = await login();
  const created = await createEmployee(admin);
  const renewed = await request(`/api/employees/${created.employee.id}/invitation`, { method: 'POST', cookie: admin, body: {} });
  assert.equal(renewed.status, 200);
  assert.equal((await request('/api/signup/employee', { method: 'POST', body: signupBody(created) })).status, 404);
  created.inviteToken = renewed.data.inviteToken;
  assert.equal((await request('/api/signup/employee', { method: 'POST', body: signupBody(created, { dob: '1988-02-11' }) })).status, 404);
  const employees = db.getEmployees();
  const pending = employees.find((record) => record.id === created.employee.id);
  pending.invitationExpiresAt = Date.now() - 1;
  db.saveEmployees(employees);
  assert.equal((await request('/api/signup/employee', { method: 'POST', body: signupBody(created) })).status, 404);
  created.inviteToken = issueInvitation(pending);
  db.saveEmployees(employees);
  assert.equal((await request('/api/signup/employee', { method: 'POST', body: signupBody(created) })).status, 200);
  assert.equal((await request('/api/signup/employee', { method: 'POST', body: signupBody(created) })).status, 404);
  const activated = db.getEmployees().find((record) => record.id === created.employee.id);
  assert.ok(!('invitationHash' in activated));
});
test('password changes rotate the current cookie and revoke every previous session', async () => {
  const first = await login('first@test.example', 'employee');
  const second = await login('first@test.example', 'employee');
  const response = await request('/api/account/password', { method: 'PUT', cookie: first, body: { currentPassword: PASSWORD, newPassword: 'UpdatedPassword2026!' } });
  assert.equal(response.status, 200);
  assert.ok(response.cookie && response.cookie !== first);
  for (const cookie of [first, second]) assert.equal((await request('/api/account/me', { cookie })).status, 401);
  assert.equal((await request('/api/account/me', { cookie: response.cookie })).status, 200);
  assert.equal((await request('/login', { method: 'POST', form: true, body: { role: 'employee', email: 'first@test.example', password: PASSWORD } })).status, 401);
  await login('first@test.example', 'employee', 'UpdatedPassword2026!');
});
test('sessions expire, logout revokes, and external password changes invalidate credentials', async () => {
  const account = db.getEmployees()[0];
  const expired = sessions.createSession(account, 'employee', Date.now() - sessions.SESSION_TTL_MS - 1);
  assert.equal((await request('/api/account/me', { cookie: `sid=${expired}` })).status, 401);
  const cookie = await login('first@test.example', 'employee');
  const employees = db.getEmployees();
  passwords.setPassword(employees[0], 'ExternalPassword2026!');
  db.saveEmployees(employees);
  assert.equal((await request('/api/account/me', { cookie })).status, 401);
  const fresh = await login('first@test.example', 'employee', 'ExternalPassword2026!');
  assert.equal((await request('/logout', { method: 'POST', cookie: fresh })).status, 302);
  assert.equal((await request('/api/account/me', { cookie: fresh })).status, 401);
});
test('production cookies are Secure and every session cookie is HttpOnly, SameSite and expiring', async () => {
  process.env.NODE_ENV = 'production';
  try {
    const response = await request('/login', { method: 'POST', form: true, body: { role: 'admin', email: 'admin@test.example', password: PASSWORD } });
    const header = response.headers.get('set-cookie');
    for (const expected of ['HttpOnly', 'SameSite=Lax', 'Max-Age=28800', 'Secure']) assert.ok(header.includes(expected));
  } finally { process.env.NODE_ENV = 'test'; }
});
test('cross-origin requests and form-based API writes cannot mutate records', async () => {
  const admin = await login();
  assert.equal((await request('/api/employees', { method: 'POST', cookie: admin, headers: { Origin: 'https://attacker.example' }, body: {} })).status, 403);
  assert.equal((await request('/login', { method: 'POST', form: true, headers: { Origin: 'null' }, body: { role: 'admin', email: 'admin@test.example', password: PASSWORD } })).status, 403);
  assert.equal((await request('/api/employees', { method: 'POST', cookie: admin, headers: { 'Sec-Fetch-Site': 'cross-site' }, body: {} })).status, 403);
  assert.equal((await request('/api/employees', { method: 'POST', cookie: admin, form: true, body: {} })).status, 415);
  assert.equal(db.getEmployees().length, 2);
});
test('malformed, missing, array, and oversized API request bodies fail cleanly', async () => {
  const admin = await login();
  for (const raw of ['{bad', '[]', 'null', '']) {
    const response = await request('/api/employees', { method: 'POST', cookie: admin, headers: { 'Content-Type': 'application/json' }, raw });
    assert.equal(response.status, 400);
    assert.doesNotMatch(response.text, /stack|node_modules|SyntaxError/);
  }
  assert.equal((await request('/api/employees', { method: 'POST', cookie: admin, body: { name: 'x'.repeat(20000) } })).status, 413);
});
test('corrupted and invalid-schema storage fails closed and preserves the original bytes', async () => {
  const admin = await login();
  const file = path.join(temporary, 'emp_db.json');
  const original = fs.readFileSync(file, 'utf8');
  try {
    for (const broken of ['{"employees":', '{"employees":{}}', '{"employees":[{"id":1}]}']) {
      fs.writeFileSync(file, broken);
      assert.equal((await request('/api/employees', { cookie: admin })).status, 503);
      assert.equal((await request('/api/employees', { method: 'POST', cookie: admin, body: { name: 'After corruption', email: 'new@test.example', designation: 'Tester', department: 'QA', dob: '1990-01-01' } })).status, 503);
      assert.equal(fs.readFileSync(file, 'utf8'), broken);
    }
  } finally { fs.writeFileSync(file, original); }
});
test('failed atomic rename leaves the old file intact and cleans up the temporary file', async () => {
  const file = path.join(temporary, 'emp_db.json');
  const original = fs.readFileSync(file, 'utf8');
  const rename = fs.renameSync;
  try {
    fs.renameSync = () => { const error = new Error('Synthetic write failure'); error.code = 'EACCES'; throw error; };
    const records = db.getEmployees();
    records[0].location = 'Never committed';
    assert.throws(() => db.saveEmployees(records), { code: 'EMS_STORAGE_ERROR' });
    assert.equal(fs.readFileSync(file, 'utf8'), original);
    assert.ok(!fs.readdirSync(temporary).some((name) => name.endsWith('.tmp')));
  } finally { fs.renameSync = rename; }
});
test('duplicate identities and cross-role duplicate emails cannot be saved', async () => {
  const records = db.getEmployees();
  assert.throws(() => db.saveEmployees([...records, { ...records[0] }]), { code: 'EMS_STORAGE_ERROR' });
  assert.equal(db.getEmployees().length, 2);
  const admin = await login();
  assert.equal((await request('/api/employees', { method: 'POST', cookie: admin, body: { name: 'Duplicate Email', email: ' ADMIN@test.example ', designation: 'Tester', department: 'QA', dob: '1990-01-01' } })).status, 400);
});
test('server-rendered identity text is escaped and security headers are present', async () => {
  const records = db.getAdmins();
  records[0].name = '<script>alert(1)</script>';
  db.saveAdmins(records);
  const cookie = await login();
  const response = await request('/admin/dashboard', { cookie });
  assert.equal(response.status, 200);
  assert.ok(response.text.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));
  assert.ok(!response.text.includes('<script>alert(1)</script>'));
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.ok(response.headers.get('content-security-policy').includes("frame-ancestors 'none'"));
});
test('browser date input rejects normalization while preserving supported formats', () => {
  const context = { window: {}, document: { addEventListener() {} } };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../public/js/common.js'), 'utf8'), context);
  const parse = context.window.EMS.parseFlexibleDate;
  for (const value of ['February 31, 2000', '02-30-2000', '1990-02-31', '2099-01-01invalid']) assert.equal(parse(value), null);
  for (const value of ['2000-06-03', '6/3/2000', 'June 3, 2000']) assert.equal(parse(value).iso, '2000-06-03');
});
