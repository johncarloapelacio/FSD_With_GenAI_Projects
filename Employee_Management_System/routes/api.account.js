// Lets the signed-in user view and edit their own account.
const express = require('express');
const router = express.Router();
const { listByRole, saveByRole, toPublic, isValidPhone, text } = require('../lib/db');
const { apiRequireAuth } = require('../middleware/auth');
const { validPassword, verifyPassword, setPassword } = require('../lib/passwords');
const { revokeAccountSessions } = require('../lib/sessions');
const { startSession } = require('../lib/cookies');

// The signed-in user's own profile.
router.get('/me', apiRequireAuth, (req, res) => {
  res.json({ account: toPublic(req.account, req.role) });
});

// Update profile. Everyone can change contact and location. Only admins can
// change designation and department. Name, email, joining date and date of
// birth are never editable here.
router.put('/profile', apiRequireAuth, (req, res) => {
  const { contact, location, designation, department } = req.body;
  const allowed = req.role === 'admin' ? ['contact', 'location', 'designation', 'department'] : ['contact', 'location'];
  if (allowed.some((key) => req.body[key] !== undefined && text(req.body[key]) === null)) {
    return res.status(400).json({ error: 'Profile fields must be text of at most 200 characters.' });
  }

  if (contact !== undefined && String(contact).trim() !== '' && !isValidPhone(contact)) {
    return res.status(400).json({ error: 'Contact must be in ###-###-#### format.' });
  }

  const list = listByRole(req.role);
  const account = list.find((a) => a.id === req.account.id);
  if (!account) return res.status(404).json({ error: 'Account not found.' });

  if (contact !== undefined) account.contact = String(contact).trim();
  if (location !== undefined) account.location = String(location).trim();
  if (req.role === 'admin') {
    if (designation !== undefined) account.designation = String(designation).trim();
    if (department !== undefined) account.department = String(department).trim();
  }

  saveByRole(req.role, list);
  res.json({ account: toPublic(account, req.role) });
});

// Change password.
router.put('/password', apiRequireAuth, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (typeof currentPassword !== 'string' || !validPassword(newPassword)) {
    return res.status(400).json({ error: 'Passwords must be text; the new password must be 8 to 256 characters.' });
  }
  if (!verifyPassword(currentPassword, req.account)) {
    return res.status(400).json({ error: 'Current password is incorrect.' });
  }

  const list = listByRole(req.role);
  const account = list.find((a) => a.id === req.account.id);
  if (!account) return res.status(404).json({ error: 'Account not found.' });
  setPassword(account, newPassword);
  saveByRole(req.role, list);
  revokeAccountSessions(account.id, req.role);
  startSession(req, res, account, req.role);
  res.json({ ok: true });
});

module.exports = router;
