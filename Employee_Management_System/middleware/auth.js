// Figures out who is making each request and guards the pages and API routes.
const { getSession, destroySession } = require('../lib/sessions');
const { findById } = require('../lib/db');
const { credentialVersion } = require('../lib/passwords');

const COOKIE = 'sid';

// Look at the session cookie and, if it is valid, attach the account and role
// to the request. Runs on every request.
function attachUser(req, res, next) {
  const token = req.cookies && req.cookies[COOKIE];
  const session = getSession(token);
  if (session) {
    const account = findById(session.accountId, session.role);
    if (account && (account.passwordHash || account.password) && credentialVersion(account) === session.credentialVersion) {
      req.account = account;
      req.role = session.role;
      req.token = token;
    } else {
      destroySession(token);
    }
  }
  next();
}

// Page guards. If you are not allowed in, you go back to the login page.
function requireAdmin(req, res, next) {
  if (req.account && req.role === 'admin') return next();
  return res.redirect('/login');
}

function requireEmployee(req, res, next) {
  if (req.account && req.role === 'employee') return next();
  return res.redirect('/login');
}

// API guards. These answer with a status code instead of redirecting.
function apiRequireAuth(req, res, next) {
  if (req.account) return next();
  return res.status(401).json({ error: 'You must be signed in.' });
}

function apiRequireAdmin(req, res, next) {
  if (req.account && req.role === 'admin') return next();
  if (!req.account) return res.status(401).json({ error: 'You must be signed in.' });
  return res.status(403).json({ error: 'Admin access is required.' });
}

module.exports = {
  COOKIE,
  attachUser,
  requireAdmin,
  requireEmployee,
  apiRequireAuth,
  apiRequireAdmin,
};
