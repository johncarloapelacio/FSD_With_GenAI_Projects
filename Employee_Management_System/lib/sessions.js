const { randomBytes } = require('node:crypto');
const { credentialVersion } = require('./passwords');
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const sessions = new Map();
function prune(now = Date.now()) { for (const [token, session] of sessions) if (session.expiresAt <= now) sessions.delete(token); }
function createSession(account, role, now = Date.now()) {
  prune(now);
  const token = randomBytes(32).toString('hex');
  sessions.set(token, { accountId: account.id, role, credentialVersion: credentialVersion(account), expiresAt: now + SESSION_TTL_MS });
  return token;
}
function getSession(token, now = Date.now()) {
  if (typeof token !== 'string') return null;
  const session = sessions.get(token);
  if (!session) return null;
  if (session.expiresAt <= now) { sessions.delete(token); return null; }
  return session;
}
function destroySession(token) { sessions.delete(token); }
function revokeAccountSessions(id, role) {
  for (const [token, session] of sessions) if (String(session.accountId) === String(id) && session.role === role) sessions.delete(token);
}
module.exports = { SESSION_TTL_MS, createSession, getSession, destroySession, revokeAccountSessions };
