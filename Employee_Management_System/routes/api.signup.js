const express = require('express');
const router = express.Router();
const { getEmployees, saveEmployees, getAdmins, saveAdmins, findByEmail, emailTaken, nextId, isValidEmail, isValidBirthDate, isValidPhone, todayISO, text } = require('../lib/db');
const { validPassword, setPassword } = require('../lib/passwords');
const { validInvitation } = require('../lib/invitations');
const { apiRequireAdmin } = require('../middleware/auth');

const norm = (value) => value.trim().toLowerCase().replace(/\s+/g, ' ');
function matchingEmployee(body) {
  if (!text(body.name) || !isValidEmail(body.email) || !isValidBirthDate(body.dob)) return null;
  const employee = findByEmail(body.email, 'employee');
  return employee && norm(employee.name) === norm(body.name) && employee.dob === body.dob && validInvitation(employee, body.inviteToken) ? employee : null;
}
router.post('/verify', (req, res) => {
  const employee = matchingEmployee(req.body);
  if (!employee) return res.status(404).json({ error: 'No match found. Check your details and private signup link.' });
  res.json({ ok: true, name: employee.name });
});
router.post('/employee', (req, res) => {
  const { password, contact, location } = req.body;
  if (!validPassword(password)) return res.status(400).json({ error: 'Password must be text of 8 to 256 characters.' });
  if (!isValidPhone(contact)) return res.status(400).json({ error: 'Contact must be in ###-###-#### format.' });
  if (!text(location)) return res.status(400).json({ error: 'Location is required and must be at most 200 characters.' });
  const employee = matchingEmployee(req.body);
  if (!employee) return res.status(404).json({ error: 'No match found. Check your details and private signup link.' });
  const employees = getEmployees();
  const stored = employees.find((item) => String(item.id) === String(employee.id));
  setPassword(stored, password);
  stored.contact = contact.trim();
  stored.location = location.trim();
  delete stored.invitationHash;
  delete stored.invitationExpiresAt;
  saveEmployees(employees);
  res.json({ ok: true });
});

// First admin setup is a local CLI operation. Only an authenticated admin can
// create further administrators; there is no public shared passcode.
router.post('/admin', apiRequireAdmin, (req, res) => {
  const { name, email, dob, password } = req.body;
  if (!text(name)) return res.status(400).json({ error: 'Name is required and must be at most 200 characters.' });
  if (!isValidEmail(email)) return res.status(400).json({ error: 'Please enter a valid email address.' });
  if (!isValidBirthDate(dob)) return res.status(400).json({ error: 'Please enter a valid date of birth that is not in the future.' });
  if (!validPassword(password)) return res.status(400).json({ error: 'Password must be text of 8 to 256 characters.' });
  if (emailTaken(email)) return res.status(400).json({ error: 'That email is already registered.' });
  const admins = getAdmins();
  const account = { id: nextId(), name: name.trim(), email: email.trim(), designation: 'Administrator', department: '', contact: '', location: '', joiningDate: todayISO(), dob };
  setPassword(account, password);
  admins.push(account);
  saveAdmins(admins);
  res.json({ ok: true });
});
module.exports = router;
