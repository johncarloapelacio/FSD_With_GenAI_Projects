// Login and logout. Signing up is handled by routes/api.signup.js instead, so
// that creating an account never logs anyone in automatically.
const express = require('express');
const router = express.Router();
const { findByEmail, listByRole, saveByRole } = require('../lib/db');
const { destroySession } = require('../lib/sessions');
const { COOKIE } = require('../middleware/auth');
const { verifyPassword, setPassword } = require('../lib/passwords');
const { cookieOptions, startSession } = require('../lib/cookies');

const attempts = new Map();

// Anything that is not 'admin' is treated as an employee.
function roleFrom(body = {}) {
  return body.role === 'admin' ? 'admin' : 'employee';
}

// ----- Login -----
router.post('/login', (req, res) => {
  const now = Date.now();
  for (const [key, value] of attempts) if (value.until <= now) attempts.delete(key);
  const key = req.ip;
  const attempt = attempts.get(key) || { count: 0, until: now + 15 * 60 * 1000 };
  if (attempt.count >= 20) {
    res.set('Retry-After', String(Math.ceil((attempt.until - now) / 1000)));
    return res.status(429).type('text').send('Too many login attempts. Try again later.');
  }
  const role = roleFrom(req.body);
  const { email, password } = req.body || {};
  const account = findByEmail(email, role);
  // No password on the record means an employee was added but has not signed up yet.
  if (!verifyPassword(password, account)) {
    attempt.count++;
    attempts.set(key, attempt);
    return res.status(401).render('login', {
      error: 'Invalid email or password.',
      values: { email: typeof email === 'string' ? email : '', role },
    });
  }
  attempts.delete(key);
  if (!account.passwordHash) {
    const list = listByRole(role);
    const stored = list.find((item) => String(item.id) === String(account.id));
    setPassword(stored, password);
    saveByRole(role, list);
    Object.assign(account, stored);
    delete account.password;
  }
  startSession(req, res, account, role);
  res.redirect(role === 'admin' ? '/admin/dashboard' : '/');
});

// ----- Logout (both roles) -----
router.post('/logout', (req, res) => {
  destroySession(req.token);
  res.clearCookie(COOKIE, cookieOptions(req));
  res.redirect('/login');
});

module.exports = router;
