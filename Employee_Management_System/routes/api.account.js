// Lets the signed-in user view and edit their own account.
const express = require('express');
const router = express.Router();
const { listByRole, saveByRole, toPublic, isValidPhone } = require('../lib/db');
const { apiRequireAuth } = require('../middleware/auth');

// The signed-in user's own profile.
router.get('/me', apiRequireAuth, (req, res) => {
  res.json({ account: toPublic(req.account, req.role) });
});

// Update profile. Everyone can change contact and location. Only admins can
// change designation and department. Name, email, joining date and date of
// birth are never editable here.
router.put('/profile', apiRequireAuth, (req, res) => {
  const { contact, location, designation, department } = req.body;

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
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Both current and new passwords are required.' });
  }
  if (req.account.password !== currentPassword) {
    return res.status(400).json({ error: 'Current password is incorrect.' });
  }
  if (String(newPassword).length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters.' });
  }

  const list = listByRole(req.role);
  const account = list.find((a) => a.id === req.account.id);
  if (!account) return res.status(404).json({ error: 'Account not found.' });
  account.password = newPassword;
  saveByRole(req.role, list);
  res.json({ ok: true });
});

module.exports = router;
