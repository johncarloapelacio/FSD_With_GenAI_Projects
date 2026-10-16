'use strict';
const express = require('express');
const path = require('node:path');
const crypto = require('node:crypto');
const { promisify } = require('node:util');
const { createStore } = require('./lib/store');
const scrypt = promisify(crypto.scrypt);
const COOKIE = 'food_session';
const MENU_URL = 'https://www.themealdb.com/api/json/v1/1/search.php?f=a';

function fail(status, message) { const error = new Error(message); error.status = status; throw error; }
function publicUser(user) { return { id: user.id, email: user.email }; }

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const key = await scrypt(password, salt, 64);
  return `scrypt:${salt}:${key.toString('hex')}`;
}
async function verifyPassword(password, encoded) {
  const [algorithm, salt, value] = encoded.split(':');
  if (algorithm !== 'scrypt' || !/^[a-f0-9]{32}$/.test(salt || '') || !/^[a-f0-9]{128}$/.test(value || '')) return false;
  const actual = await scrypt(password, salt, 64);
  return crypto.timingSafeEqual(actual, Buffer.from(value, 'hex'));
}
function credentials(body) {
  if (!body || typeof body.email !== 'string' || typeof body.password !== 'string') fail(400, 'Email and password must be text.');
  const email = body.email.trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail(400, 'Enter a valid email address.');
  if (body.password.length < 8 || body.password.length > 128) fail(400, 'Use a password between 8 and 128 characters.');
  return { email, password: body.password };
}
function cleanMenu(raw) {
  if (!raw || !Array.isArray(raw.meals)) fail(502, 'The menu service returned an invalid response.');
  const seen = new Set();
  return raw.meals.slice(0, 1000).filter(item => {
    if (!item || !/^\d{1,8}$/.test(String(item.idMeal)) || typeof item.strMeal !== 'string' || !item.strMeal.trim() || seen.has(String(item.idMeal))) return false;
    seen.add(String(item.idMeal));
    return true;
  })
    .map(item => {
      const id = String(item.idMeal);
      let image = '';
      try { const url = new URL(item.strMealThumb); if (url.protocol === 'https:' && url.hostname === 'www.themealdb.com') image = url.href; } catch { /* image is optional */ }
      return { id, name: item.strMeal.trim().slice(0, 200), image, priceCents: 799 + (Number(id) % 1300) };
    });
}

function createApp(options = {}) {
  const app = express();
  const now = options.now || Date.now;
  const ttl = options.sessionTtlMs ?? 8 * 60 * 60 * 1000;
  const store = createStore(options.dataDir || process.env.FOOD_DATA_DIR || path.join(__dirname, 'data'));
  const secure = options.secureCookies ?? process.env.NODE_ENV === 'production';
  const sessions = new Map();
  const attempts = new Map();
  let cachedMenu = null;
  let cachedAt = 0;
  let pendingMenu = null;
  const cookieOptions = { httpOnly: true, sameSite: 'strict', secure, path: '/', maxAge: ttl };
  const menuProvider = options.menuProvider || (async () => {
    const response = await fetch(MENU_URL, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) fail(503, 'The menu is temporarily unavailable. Please retry.');
    return response.json();
  });
  async function menu() {
    if (cachedMenu && now() - cachedAt < 15 * 60 * 1000) return cachedMenu;
    if (!pendingMenu) pendingMenu = Promise.resolve().then(menuProvider).then(raw => {
      cachedMenu = cleanMenu(raw); cachedAt = now(); return cachedMenu;
    }).catch(error => { if (!error.status) error.status = 503; throw error; }).finally(() => { pendingMenu = null; });
    return pendingMenu;
  }
  function issueSession(res, user) {
    for (const [token, session] of sessions) if (session.expires <= now()) sessions.delete(token);
    if (sessions.size >= 10000) fail(503, 'Sign-in is temporarily unavailable. Please retry.');
    const token = crypto.randomBytes(32).toString('hex');
    sessions.set(token, { userId: user.id, expires: now() + ttl });
    res.cookie(COOKIE, token, cookieOptions);
  }
  function tokenFrom(req) {
    const part = (req.get('cookie') || '').split(';').find(p => p.trim().startsWith(`${COOKIE}=`));
    return part ? part.trim().slice(COOKIE.length + 1) : null;
  }
  function sessionUser(req) {
    const token = tokenFrom(req);
    const session = sessions.get(token);
    if (session && session.expires > now()) {
      const user = store.read().users.find(u => u.id === session.userId);
      if (user) { req.sessionToken = token; return user; }
    }
    if (token) sessions.delete(token);
    return null;
  }
  function authenticate(req, res, next) {
    req.user = sessionUser(req);
    if (!req.user) return res.status(401).json({ error: 'Please sign in to continue.' });
    // This is an assertion about the already authenticated account. It never
    // selects the owner of an order or grants access to another account.
    const expected = req.get('X-Food-Account-Id');
    if (expected !== undefined && expected !== req.user.id) {
      return res.status(409).json({ code: 'ACCOUNT_CHANGED', error: 'The signed-in account has changed. Please sign in again before continuing.' });
    }
    return next();
  }
  function rateLimit(req, res, next) {
    const key = req.ip;
    const stamp = now();
    for (const [ip, record] of attempts) if (record.expires <= stamp) attempts.delete(ip);
    const record = attempts.get(key) || { count: 0, expires: stamp + 60_000 };
    if (++record.count > 30) return res.status(429).set('Retry-After', '60').json({ error: 'Too many attempts. Please try again in a minute.' });
    if (attempts.size >= 10000 && !attempts.has(key)) return res.status(429).json({ error: 'Please try again later.' });
    attempts.set(key, record);
    next();
  }
  app.disable('x-powered-by');
  if (process.env.TRUST_PROXY === '1') app.set('trust proxy', 1);
  app.use((req, res, next) => {
    res.set({
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' https://www.themealdb.com data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
    });
    if (req.path.startsWith('/api/')) res.set('Cache-Control', 'no-store');
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      const origin = req.get('origin');
      if (req.get('sec-fetch-site') === 'cross-site' || (origin && origin !== `${req.protocol}://${req.get('host')}`)) return res.status(403).json({ error: 'Cross-site requests are not allowed.' });
      if (!req.is('application/json')) return res.status(415).json({ error: 'Use an application/json request body.' });
    }
    next();
  });
  app.use(express.json({ limit: '16kb', strict: true }));
  app.post('/api/register', rateLimit, async (req, res) => {
    const { email, password } = credentials(req.body);
    if (store.read().users.some(u => u.email === email)) fail(409, 'An account with this email already exists.');
    const passwordHash = await hashPassword(password);
    const data = store.read(); // Recheck after hashing so parallel signup cannot duplicate an email.
    if (data.users.some(u => u.email === email)) fail(409, 'An account with this email already exists.');
    const user = { id: crypto.randomUUID(), email, passwordHash };
    data.users.push(user); store.write(data);
    res.status(201).json({ user: publicUser(user) });
  });
  app.post('/api/login', rateLimit, async (req, res) => {
    const { email, password } = credentials(req.body);
    const user = store.read().users.find(u => u.email === email);
    if (!user || !await verifyPassword(password, user.passwordHash)) fail(401, 'Invalid email or password.');
    issueSession(res, user);
    res.json({ user: publicUser(user) });
  });
  app.get('/api/session', authenticate, (req, res) => res.json({ user: publicUser(req.user) }));
  app.post('/api/logout', authenticate, (req, res) => {
    sessions.delete(tokenFrom(req));
    res.clearCookie(COOKIE, { ...cookieOptions, maxAge: undefined });
    res.json({ ok: true });
  });
  app.get('/api/menu', authenticate, async (req, res) => res.json({ meals: await menu() }));
  app.get('/api/orders', authenticate, (req, res) => res.json({ orders: store.read().orders.filter(o => o.userId === req.user.id) }));
  app.post('/api/orders', authenticate, async (req, res) => {
    const { items, requestId } = req.body || {};
    if (!Array.isArray(items) || items.length < 1 || items.length > 100 || typeof requestId !== 'string' || !/^[a-zA-Z0-9-]{16,80}$/.test(requestId)) fail(400, 'Provide cart items and a valid request ID.');
    const ids = new Set();
    for (const item of items) {
      if (!item || typeof item.id !== 'string' || !/^\d{1,8}$/.test(item.id) || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99 || ids.has(item.id)) fail(400, 'Each menu item needs a unique ID and a quantity from 1 to 99.');
      ids.add(item.id);
    }
    let data = store.read();
    let existing = data.orders.find(o => o.userId === req.user.id && o.requestId === requestId);
    const fingerprint = JSON.stringify(items.map(i => ({ id: i.id, quantity: i.quantity })).sort((a,b) => a.id.localeCompare(b.id)));
    if (existing) {
      if (existing.fingerprint !== fingerprint) fail(409, 'That request ID belongs to a different order.');
      return res.json({ order: existing });
    }
    const available = await menu();
    const lines = items.map(item => {
      const meal = available.find(m => m.id === item.id);
      if (!meal) fail(400, 'A selected item is no longer on the menu. Please refresh it.');
      return { id: meal.id, name: meal.name, priceCents: meal.priceCents, quantity: item.quantity };
    });
    data = store.read();
    existing = data.orders.find(o => o.userId === req.user.id && o.requestId === requestId);
    if (existing) {
      if (existing.fingerprint !== fingerprint) fail(409, 'That request ID belongs to a different order.');
      return res.json({ order: existing });
    }
    const order = { id: crypto.randomUUID(), userId: req.user.id, requestId, fingerprint, items: lines,
      totalCents: lines.reduce((sum, i) => sum + i.priceCents * i.quantity, 0), createdAt: new Date(now()).toISOString(), status: 'demo-confirmed' };
    data.orders.push(order); store.write(data);
    res.status(201).json({ order });
  });
  app.get('/dashboard.html', (req, res, next) => {
    if (!sessionUser(req)) return res.redirect('/signin.html');
    next();
  });
  app.get('/', (req, res) => res.redirect('/signin.html'));
  for (const file of ['signin.html', 'register.html', 'dashboard.html']) app.get(`/${file}`, (req, res) => res.sendFile(path.join(__dirname, file)));
  for (const folder of ['js', 'css', 'images']) app.use(`/${folder}`, express.static(path.join(__dirname, folder), { dotfiles: 'deny' }));
  app.use((req, res) => res.status(404).json({ error: 'Not found.' }));
  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    const status = error.type === 'entity.parse.failed' ? 400 : error.status || 500;
    res.status(status).json({ error: status === 500 ? 'The request could not be completed.' : error.type === 'entity.parse.failed' ? 'Invalid JSON body.' : error.message });
  });
  return app;
}

if (require.main === module) {
  const port = Number(process.env.PORT || 3002);
  createApp().listen(port, '127.0.0.1', () => console.log(`Food ordering demo: http://localhost:${port}`));
}
module.exports = { createApp, cleanMenu };
