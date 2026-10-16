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

async function signup(f, email = 'one@example.test', extras = {}) {
  const body = { email, password: 'Strong password 123', firstName: 'Test', lastName: 'Rider', age: 30, ...extras };
  const result = await f.call('/api/auth/signup', { method: 'POST', body });
  assert.equal(result.status, 201); return { ...result, credentials: body };
}
function ride(extras = {}) { return { requestId: require('node:crypto').randomUUID(), pickupLocation: 'Main Street', dropoffLocation: 'Airport Terminal', dateTime: new Date(Date.now() + 86400000).toISOString(), passengers: 2, serviceType: 'Economy', driverId: 1, ...extras }; }
test('sessions, ownership and server-authoritative booking data', async t => {
  const f = await fixture(t), one = await signup(f), two = await signup(f, 'two@example.test');
  assert.match(one.headers.get('set-cookie'), /HttpOnly/); assert.match(one.headers.get('set-cookie'), /SameSite=Strict/);
  assert.equal((await f.call('/api/bookings')).status, 401);
  const created = await f.call('/api/bookings', { method: 'POST', cookie: one.cookie, body: ride({ userId: two.body.user.id, id: 'forged', price: 0.01, status: 'completed' }) });
  assert.equal(created.status, 201); const booking = created.body.booking;
  assert.equal(booking.userId, one.body.user.id); assert.notEqual(booking.id, 'forged'); assert.equal(booking.price, 17); assert.equal(booking.status, 'confirmed');
  assert.equal((await f.call('/api/bookings', { cookie: two.cookie })).body.length, 0);
  for (const method of ['GET','DELETE']) assert.equal((await f.call(`/api/bookings/${booking.id}`, { method, cookie: two.cookie })).status, 404);
  assert.equal((await f.call(`/api/bookings/${booking.id}`, { method: 'PUT', cookie: one.cookie, body: { userId: two.body.user.id } })).status, 404);
  assert.equal((await f.call(`/api/auth/profile/${one.body.user.id}`, { cookie: two.cookie })).status, 403);
  assert.equal((await f.call(`/api/auth/profile/${one.body.user.id}`, { method: 'PUT', cookie: two.cookie, body: { firstName: 'Hacked', lastName: 'Name', age: 20 } })).status, 403);
  assert.equal((await f.call(`/api/bookings/${booking.id}`, { method: 'DELETE', cookie: one.cookie })).status, 200);
  assert.equal((await f.call('/api/bookings', { cookie: one.cookie })).body[0].status, 'cancelled');
  assert.equal((await f.call(`/api/bookings/${booking.id}`, { method: 'DELETE', cookie: one.cookie })).status, 409);
});
test('registration and booking inputs reject malformed values and impossible dates', async t => {
  const f = await fixture(t), one = await signup(f);
  assert.equal((await f.call('/api/auth/signup', { method: 'POST', body: { ...one.credentials, email: ' ONE@EXAMPLE.TEST ' } })).status, 409);
  for (const bad of [{ password: 1234567890 }, { password: 'short' }, { firstName: [] }, { age: 25.4 }, { age: '25x' }, { email: 'invalid' }]) assert.equal((await f.call('/api/auth/signup', { method: 'POST', body: { ...one.credentials, email: 'new@example.test', ...bad } })).status, 400);
  for (const bad of [{ passengers: 5 }, { passengers: '2x' }, { passengers: null }, { driverId: 2 }, { serviceType: 'Missing' }, { dateTime: '2030-02-31T12:00:00.000Z' }, { dateTime: '2030-01-01T12:00' }, { dateTime: new Date(0).toISOString() }, { pickupLocation: ' Airport Terminal ' }, { specialRequests: {} }]) assert.equal((await f.call('/api/bookings', { method: 'POST', cookie: one.cookie, body: ride(bad) })).status, 400, JSON.stringify(bad));
  assert.equal((await f.call(`/api/auth/profile/${one.body.user.id}`, { method: 'PUT', cookie: one.cookie, body: { firstName: 'New', lastName: 'Name', age: 28, email: 'hacked@example.test', passwordHash: 'fake' } })).status, 200);
  assert.equal((await f.call('/api/auth/session', { cookie: one.cookie })).body.user.email, one.credentials.email);
});
test('password hashes, password rotation, logout and deletion revoke old sessions and remove private rides', async t => {
  const f = await fixture(t), one = await signup(f), address = one.body.user.id;
  const second = await f.call('/api/auth/login', { method: 'POST', body: { email: one.credentials.email, password: one.credentials.password } });
  assert.ok(!fs.readFileSync(f.dbPath, 'utf8').includes(one.credentials.password));
  assert.equal((await f.call(`/api/auth/change-password/${address}`, { method: 'PUT', cookie: one.cookie, body: { currentPassword: 'Wrong', newPassword: 'New strong password' } })).status, 401);
  const changed = await f.call(`/api/auth/change-password/${address}`, { method: 'PUT', cookie: one.cookie, body: { currentPassword: one.credentials.password, newPassword: 'New strong password' } }); assert.equal(changed.status, 200);
  assert.equal((await f.call('/api/auth/session', { cookie: second.cookie })).status, 401);
  assert.equal((await f.call('/api/auth/session', { cookie: one.cookie })).status, 401);
  assert.equal((await f.call('/api/auth/session', { cookie: changed.cookie })).status, 200);
  await f.call('/api/bookings', { method: 'POST', cookie: changed.cookie, body: ride() });
  assert.equal((await f.call(`/api/auth/account/${address}`, { method: 'DELETE', cookie: changed.cookie, body: { password: 'New strong password' } })).status, 200);
  assert.equal((await f.call('/api/auth/session', { cookie: changed.cookie })).status, 401);
  const stored = JSON.parse(fs.readFileSync(f.dbPath, 'utf8')); assert.equal(stored.bookings.length, 0); assert.equal(stored.users.length, 0);
  const replacement = await signup(f); assert.notEqual(replacement.body.user.id, address);
  assert.equal((await f.call('/api/auth/session', { cookie: changed.cookie })).status, 401);
  await f.call('/api/auth/logout', { method: 'POST', cookie: replacement.cookie });
  assert.equal((await f.call('/api/auth/session', { cookie: replacement.cookie })).status, 401);
});
test('hostile origin, missing CSRF header and corrupt store cannot mutate data', async t => {
  const f = await fixture(t), one = await signup(f);
  for (const headers of [{ Origin: 'https://evil.example' }, { 'X-Requested-With': '' }]) assert.equal((await f.call('/api/bookings', { method: 'POST', cookie: one.cookie, body: ride(), headers })).status, 403);
  fs.writeFileSync(f.dbPath, '{broken');
  assert.equal((await f.call('/api/bookings', { method: 'POST', cookie: one.cookie, body: ride() })).status, 500);
  assert.equal(fs.readFileSync(f.dbPath, 'utf8'), '{broken');
  assert.throws(() => createApp({ dbPath: f.dbPath }));
});

test('login throttling bounds repeated authentication attempts', async t => {
  const f = await fixture(t);
  for (let i = 0; i < 30; i++) assert.equal((await f.call('/api/auth/login', { method: 'POST', body: { email: 'missing@example.test', password: 'Wrong password 123', userType: 'hr' } })).status, 401);
  assert.equal((await f.call('/api/auth/login', { method: 'POST', body: { email: 'missing@example.test', password: 'Wrong password 123', userType: 'hr' } })).status, 429);
});

test('semantic corruption in users, bookings, drivers and services is preserved and rejected before reads/writes', async t => {
  const f = await fixture(t), one = await signup(f);
  const created = await f.call('/api/bookings', { method: 'POST', cookie: one.cookie, body: ride() }); assert.equal(created.status, 201);
  const baseline = fs.readFileSync(f.dbPath, 'utf8');
  const { createBase } = require('./security'), { validateDatabase } = require('./schema');
  const storage = createBase({ dbPath: f.dbPath, examplePath: path.join(__dirname, 'database.example.json'), collections: ['users','bookings','drivers','rideServices'], cookieName: 'test', validate: validateDatabase });
  const corruptions = [
    db => { db.users[0].passwordHash = 'plaintext'; },
    db => { db.users[0].age = '30'; },
    db => { db.users[0].email = 'UPPER@EXAMPLE.TEST'; },
    db => { db.users[0].createdAt = 'invalid'; },
    db => { db.users[0].firstName = []; },
    db => { db.bookings[0].price = -1; },
    db => { db.bookings[0].passengers = 5; },
    db => { db.bookings[0].status = 'forged'; },
    db => { db.bookings[0].userId = require('node:crypto').randomUUID(); },
    db => { db.bookings[0].driverId = 99999; },
    db => { db.bookings[0].dateTime = '2030-02-31T12:00:00.000Z'; },
    db => { db.bookings[0].requestFingerprint = '0'.repeat(64); },
    db => { db.bookings[0].requestId = 'invalid'; },
    db => { db.drivers[0].price = '17'; },
    db => { db.drivers[0].rating = 7; },
    db => { db.drivers[0].serviceType = 'missing'; },
    db => { db.rideServices = []; },
    db => { db.drivers = []; },
    db => { db.rideServices[0].capacity = 0; },
    db => { db.rideServices[0].features = 'wrong'; },
    db => { db.rideServices[0].pricePerMile = null; },
    db => { db.rideServices[1].name = db.rideServices[0].name; },
    db => { db.users[0].password = 'legacy-secret'; },
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
test('request keys make retries replay safely, reject changed payloads and survive API restart', async t => {
  const f = await fixture(t), one = await signup(f), two = await signup(f, 'two@example.test');
  const body = ride();
  const initial = await f.call('/api/bookings', { method: 'POST', cookie: one.cookie, body }); assert.equal(initial.status, 201);
  const replay = await f.call('/api/bookings', { method: 'POST', cookie: one.cookie, body });
  assert.equal(replay.status, 200); assert.equal(replay.body.replayed, true); assert.equal(replay.body.booking.id, initial.body.booking.id);
  const caseReplay = await f.call('/api/bookings', { method: 'POST', cookie: one.cookie, body: { ...body, requestId: body.requestId.toUpperCase() } });
  assert.equal(caseReplay.status, 200); assert.equal(caseReplay.body.booking.id, initial.body.booking.id);
  assert.equal((await f.call('/api/bookings', { method: 'POST', cookie: one.cookie, body: { ...body, passengers: 3 } })).status, 409);
  assert.equal((await f.call('/api/bookings', { method: 'POST', cookie: two.cookie, body })).status, 201);
  const restarted = createApp({ dbPath: f.dbPath }).listen(0, '127.0.0.1'); await once(restarted, 'listening');
  t.after(() => new Promise(resolve => restarted.close(resolve)));
  const url = `http://127.0.0.1:${restarted.address().port}`;
  const headers = { 'Content-Type': 'application/json', 'X-Requested-With': 'portfolio-app' };
  const login = await fetch(url + '/api/auth/login', { method: 'POST', headers, body: JSON.stringify({ email: one.credentials.email, password: one.credentials.password }) }); assert.equal(login.status, 200);
  const cookie = login.headers.get('set-cookie').split(';')[0]; await login.json();
  const afterRestart = await fetch(url + '/api/bookings', { method: 'POST', headers: { ...headers, Cookie: cookie, 'X-Expected-Account': one.body.user.id }, body: JSON.stringify(body) });
  assert.equal(afterRestart.status, 200); assert.equal((await afterRestart.json()).booking.id, initial.body.booking.id);
  assert.equal(JSON.parse(fs.readFileSync(f.dbPath, 'utf8')).bookings.length, 2);
  await f.call(`/api/bookings/${initial.body.booking.id}`, { method: 'DELETE', cookie: one.cookie });
  const cancelledReplay = await f.call('/api/bookings', { method: 'POST', cookie: one.cookie, body });
  assert.equal(cancelledReplay.status, 200); assert.equal(cancelledReplay.body.booking.status, 'cancelled');
  assert.equal(JSON.parse(fs.readFileSync(f.dbPath, 'utf8')).bookings.length, 2);
  assert.equal((await f.call('/api/bookings', { method: 'POST', cookie: one.cookie, body: { ...body, requestId: 'missing-or-invalid' } })).status, 400);
});

test('saved requests replay after their pickup time without creating another booking', async t => {
  const f = await fixture(t), one = await signup(f), body = ride();
  const initial = await f.call('/api/bookings', { method: 'POST', cookie: one.cookie, body }); assert.equal(initial.status, 201);
  const db = JSON.parse(fs.readFileSync(f.dbPath, 'utf8'));
  const previous = db.bookings[0];
  previous.dateTime = new Date(Date.now() - 86400000).toISOString(); previous.timestamp = new Date(Date.now() - 2 * 86400000).toISOString();
  previous.requestFingerprint = require('./schema').bookingFingerprint(previous);
  require('./schema').validateDatabase(db); fs.writeFileSync(f.dbPath, JSON.stringify(db));
  const oldBody = { ...body, dateTime: previous.dateTime };
  const replay = await f.call('/api/bookings', { method: 'POST', cookie: one.cookie, body: oldBody });
  assert.equal(replay.status, 200); assert.equal(replay.body.booking.id, previous.id);
  assert.equal((await f.call('/api/bookings', { method: 'POST', cookie: one.cookie, body: { ...oldBody, requestId: require('node:crypto').randomUUID() } })).status, 400);
  assert.equal(JSON.parse(fs.readFileSync(f.dbPath, 'utf8')).bookings.length, 1);
});

test('displayed account checks reject cross-tab booking/profile/password/deletion/logout and scoped reads', async t => {
  const f = await fixture(t), one = await signup(f), two = await signup(f, 'two@example.test');
  const wrong = { 'X-Expected-Account': one.body.user.id };
  const checks = [
    ['/api/bookings', { method: 'POST', body: ride() }],
    ['/api/bookings', {}],
    ['/api/auth/session', {}],
    [`/api/auth/profile/${two.body.user.id}`, {}],
    [`/api/auth/profile/${two.body.user.id}`, { method: 'PUT', body: { firstName: 'Wrong', lastName: 'Actor', age: 30 } }],
    [`/api/auth/change-password/${two.body.user.id}`, { method: 'PUT', body: { currentPassword: two.credentials.password, newPassword: 'Changed password 123' } }],
    [`/api/auth/account/${two.body.user.id}`, { method: 'DELETE', body: { password: two.credentials.password } }],
    ['/api/auth/logout', { method: 'POST' }],
  ];
  const baseline = fs.readFileSync(f.dbPath, 'utf8');
  for (const [route, options] of checks) { const denied = await f.call(route, { ...options, cookie: two.cookie, headers: wrong }); assert.equal(denied.status, 409); assert.equal(denied.body.code, 'ACCOUNT_CHANGED'); assert.equal(fs.readFileSync(f.dbPath, 'utf8'), baseline); }
  assert.equal((await f.call('/api/bookings', { method: 'POST', cookie: one.cookie, body: ride(), headers: { 'X-Expected-Account': '' } })).status, 409);
  assert.equal((await f.call('/api/auth/session', { cookie: two.cookie })).status, 200);
});
