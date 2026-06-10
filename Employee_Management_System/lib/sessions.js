// Keeps track of who is logged in. Sessions live in memory and the browser only
// gets a random token in a cookie, so nobody can fake their account or role.
const crypto = require('crypto');

const sessions = new Map(); // token -> { accountId, role, createdAt }

function createSession(accountId, role) {
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, { accountId, role, createdAt: Date.now() });
  return token;
}

function getSession(token) {
  if (!token) return null;
  return sessions.get(token) || null;
}

function destroySession(token) {
  if (token) sessions.delete(token);
}

module.exports = { createSession, getSession, destroySession };
