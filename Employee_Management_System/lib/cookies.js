const { SESSION_TTL_MS } = require('./sessions');
function cookieOptions(req) { return { httpOnly: true, sameSite: 'lax', secure: req.secure || process.env.NODE_ENV === 'production', path: '/' }; }
function startSession(req, res, account, role) {
  const { createSession, destroySession } = require('./sessions');
  if (req.cookies?.sid) destroySession(req.cookies.sid);
  res.cookie('sid', createSession(account, role), { ...cookieOptions(req), maxAge: SESSION_TTL_MS });
}
module.exports = { cookieOptions, startSession };
