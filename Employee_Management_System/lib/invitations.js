const { randomBytes, createHash, timingSafeEqual } = require('node:crypto');
const digest = (token) => createHash('sha256').update(token).digest();
function issueInvitation(account) {
  const token = randomBytes(32).toString('hex');
  account.invitationHash = digest(token).toString('hex');
  account.invitationExpiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
  return token;
}
function validInvitation(account, token) {
  return !!(account && !account.password && !account.passwordHash && typeof token === 'string' && /^[a-f0-9]{64}$/.test(token) && typeof account.invitationHash === 'string' && /^[a-f0-9]{64}$/.test(account.invitationHash) && Number.isFinite(account.invitationExpiresAt) && account.invitationExpiresAt > Date.now() && timingSafeEqual(digest(token), Buffer.from(account.invitationHash, 'hex')));
}
module.exports = { issueInvitation, validInvitation };
