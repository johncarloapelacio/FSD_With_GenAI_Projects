const { randomBytes, scryptSync, timingSafeEqual, createHash } = require('node:crypto');
const validPassword = (password) => typeof password === 'string' && password.length >= 8 && password.length <= 256;
function hashPassword(password) {
  if (typeof password !== 'string' || password.length < 1 || password.length > 256) throw new TypeError('Password must be a string of 1 to 256 characters.');
  const salt = randomBytes(16).toString('hex');
  return `scrypt$v1$${salt}$${scryptSync(password, salt, 64).toString('hex')}`;
}
function verifyPassword(password, account) {
  if (typeof password !== 'string' || password.length > 256 || !account) return false;
  if (account.passwordHash) {
    const match = /^scrypt\$v1\$([a-f0-9]{32})\$([a-f0-9]{128})$/.exec(account.passwordHash);
    return !!match && timingSafeEqual(scryptSync(password, match[1], 64), Buffer.from(match[2], 'hex'));
  }
  // Explicitly imported legacy records migrate before a successful login issues a session.
  if (typeof account.password !== 'string' || !account.password) return false;
  const digest = (value) => createHash('sha256').update(value).digest();
  return timingSafeEqual(digest(password), digest(account.password));
}
function setPassword(account, password) { account.passwordHash = hashPassword(password); delete account.password; }
const credentialVersion = (account) => createHash('sha256').update(account.passwordHash || account.password || '').digest('hex');
module.exports = { validPassword, hashPassword, verifyPassword, setPassword, credentialVersion };
