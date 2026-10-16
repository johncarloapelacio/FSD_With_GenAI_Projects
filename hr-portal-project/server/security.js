const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const express = require('express');
const cors = require('cors');
function fail(status, message, code) { const error = new Error(message); error.status = status; if (code) error.code = code; throw error; }
function text(value, label, max = 100, min = 1) {
  if (typeof value !== 'string' || value.trim().length < min || value.trim().length > max) fail(400, `${label} must contain ${min}-${max} characters`);
  return value.trim();
}
function email(value) {
  const result = text(value, 'Email', 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result)) fail(400, 'Enter a valid email');
  return result;
}
function password(value) {
  if (typeof value !== 'string' || value.length < 10 || Buffer.byteLength(value) > 128) fail(400, 'Password must be at least 10 characters and at most 128 bytes');
  return value;
}
function integer(value, label, min, max) {
  if ((typeof value !== 'number' && typeof value !== 'string') || String(value).trim() === '' || !Number.isInteger(Number(value)) || Number(value) < min || Number(value) > max) fail(400, `${label} must be an integer from ${min} to ${max}`);
  return Number(value);
}
function hash(value) {
  const salt = crypto.randomBytes(16).toString('hex');
  return `${salt}:${crypto.scryptSync(value, salt, 64).toString('hex')}`;
}
function verify(value, stored) {
  if (typeof value !== 'string' || Buffer.byteLength(value) > 128 || typeof stored !== 'string' || !/^[a-f0-9]{32}:[a-f0-9]{128}$/.test(stored)) return false;
  const [salt, expected] = stored.split(':');
  return crypto.timingSafeEqual(crypto.scryptSync(value, salt, 64), Buffer.from(expected, 'hex'));
}
function createBase({ dbPath, examplePath, collections, cookieName, validate = () => {} }) {
  const app = express();
  const allowed = new Set((process.env.CLIENT_ORIGINS || 'http://localhost:5173,http://localhost:5174,http://localhost:4173,http://127.0.0.1:5173,http://127.0.0.1:5174,http://127.0.0.1:4173').split(',').map(s => s.trim()));
  const sessions = new Map(), attempts = new Map();
  const lifetime = 8 * 60 * 60 * 1000;
  app.disable('x-powered-by');
  app.use(cors({ origin(origin, cb) { cb(null, !origin || allowed.has(origin)); }, credentials: true }));
  app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store'); res.set('X-Content-Type-Options', 'nosniff');
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      if (req.get('origin') && !allowed.has(req.get('origin'))) return res.status(403).json({ error: 'Origin not allowed', message: 'Origin not allowed' });
      if (req.get('X-Requested-With') !== 'portfolio-app') return res.status(403).json({ error: 'Request header required', message: 'Request header required' });
    }
    next();
  });
  app.use(express.json({ limit: '32kb', strict: true }));
  app.use((req, res, next) => { req.body ||= {}; next(); });
  function check(data) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Invalid database root');
    for (const key of collections) {
      if (!Array.isArray(data[key])) throw new Error(`Invalid database collection: ${key}`);
    }
    validate(data); return data;
  }
  function read() { return check(JSON.parse(fs.readFileSync(dbPath, 'utf8'))); }
  function write(data) {
    check(data); // Validate the entire transaction before touching the existing file.
    const temporary = `${dbPath}.${crypto.randomUUID()}.tmp`;
    try { fs.mkdirSync(path.dirname(dbPath), { recursive: true }); fs.writeFileSync(temporary, JSON.stringify(data, null, 2) + '\n', { mode: 0o600, flag: 'wx' }); fs.renameSync(temporary, dbPath); }
    finally { if (fs.existsSync(temporary)) fs.unlinkSync(temporary); }
  }
  if (!fs.existsSync(dbPath)) write(JSON.parse(fs.readFileSync(examplePath, 'utf8')));
  read();
  function token(req) { return (req.headers.cookie || '').split(';').map(s => s.trim()).find(s => s.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1); }
  function issue(req, res, userId) {
    sessions.delete(token(req));
    const secret = crypto.randomBytes(32).toString('hex');
    sessions.set(secret, { userId, expires: Date.now() + lifetime });
    res.cookie(cookieName, secret, { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production', maxAge: lifetime, path: '/api' });
  }
  function revoke(userId) { for (const [key, session] of sessions) if (session.userId === userId) sessions.delete(key); }
  function auth(req, res, next) {
    try {
      const key = token(req), session = sessions.get(key);
      if (!session || session.expires <= Date.now()) { sessions.delete(key); fail(401, 'Please sign in'); }
      const user = read().users.find(u => u.id === session.userId);
      if (!user) { sessions.delete(key); fail(401, 'Please sign in'); }
      const expected = req.get('X-Expected-Account');
      if ((expected && expected !== user.id) || (!expected && req.path !== '/api/auth/session')) fail(409, 'Your signed-in account changed. Sign in again before continuing.', 'ACCOUNT_CHANGED');
      req.user = user; next();
    } catch (error) { next(error); }
  }
  function limit(req, res, next) {
    const now = Date.now();
    for (const [ip, record] of attempts) if (record.until <= now) attempts.delete(ip);
    for (const [secret, session] of sessions) if (session.expires <= now) sessions.delete(secret);
    const record = attempts.get(req.ip) || { count: 0, until: now + 15 * 60 * 1000 };
    if (++record.count > 30) return res.status(429).json({ error: 'Too many attempts; try again in 15 minutes', message: 'Too many attempts; try again in 15 minutes' });
    attempts.set(req.ip, record); next();
  }
  app.post('/api/auth/logout', auth, (req, res) => { sessions.delete(token(req)); res.clearCookie(cookieName, { path: '/api', sameSite: 'strict', httpOnly: true, secure: process.env.NODE_ENV === 'production' }); res.json({ success: true }); });
  function finish() {
    app.get('/api/health', (req, res) => { read(); res.json({ status: 'ok' }); });
    app.use((req, res) => res.status(404).json({ error: 'Not found', message: 'Not found' }));
    app.use((error, req, res, next) => {
      void next;
      const status = error.status && error.status >= 400 && error.status < 500 ? error.status : 500;
      const message = status === 500 ? 'Storage or server error. Review the record before retrying.' : (error.type === 'entity.parse.failed' ? 'Invalid JSON' : error.message);
      if (status === 500) console.error(error.message);
      res.status(status).json({ error: message, message, ...(status !== 500 && error.code ? { code: error.code } : {}) });
    });
    return app;
  }
  return { app, read, write, auth, issue, revoke, limit, finish };
}
module.exports = { createBase, fail, text, email, password, integer, hash, verify, id: () => crypto.randomUUID() };
