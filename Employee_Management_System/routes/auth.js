// Login and logout. Signing up is handled by routes/api.signup.js instead, so
// that creating an account never logs anyone in automatically.
const express = require('express');
const router = express.Router();
const { findByEmail } = require('../lib/db');
const { createSession, destroySession } = require('../lib/sessions');
const { COOKIE } = require('../middleware/auth');

const COOKIE_OPTS = { httpOnly: true, sameSite: 'lax', path: '/' };

function startSession(res, account, role) {
  res.cookie(COOKIE, createSession(account.id, role), COOKIE_OPTS);
}

// Anything that is not 'admin' is treated as an employee.
function roleFrom(body) {
  return body.role === 'admin' ? 'admin' : 'employee';
}

// ----- Login -----
router.post('/login', (req, res) => {
  const role = roleFrom(req.body);
  const { email, password } = req.body;
  const account = findByEmail(email, role);
  // No password on the record means an employee was added but has not signed up yet.
  if (!account || !account.password || account.password !== password) {
    return res.status(401).render('login', {
      error: 'Invalid email or password.',
      values: { email: email || '', role },
    });
  }
  startSession(res, account, role);
  res.redirect(role === 'admin' ? '/admin/dashboard' : '/');
});

// ----- Logout (both roles) -----
router.post('/logout', (req, res) => {
  destroySession(req.token);
  res.clearCookie(COOKIE, COOKIE_OPTS);
  res.redirect('/login');
});

module.exports = router;
