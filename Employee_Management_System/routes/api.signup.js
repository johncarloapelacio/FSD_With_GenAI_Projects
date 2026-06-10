// Signup happens here. Employees can only sign up if an admin has already added
// them, so we match the name, email and date of birth they enter against a
// record that has not been activated yet (an activated record has a password).
// Nobody is logged in automatically after signing up.
const express = require('express');
const router = express.Router();
const {
  getEmployees,
  saveEmployees,
  getAdmins,
  saveAdmins,
  findByEmail,
  emailTaken,
  nextId,
  isValidEmail,
  isValidDate,
  isValidPhone,
} = require('../lib/db');

const ADMIN_PASSCODE = '52277225';

function norm(value) {
  return String(value || '').trim().toLowerCase();
}

// Look for an admin-added employee that matches and has not signed up yet.
function matchPendingEmployee({ name, email, dob }) {
  const emp = findByEmail(email, 'employee');
  if (!emp) return { status: 'none' };
  if (emp.password) return { status: 'registered' };
  if (norm(emp.name) !== norm(name) || String(emp.dob) !== String(dob).trim()) {
    return { status: 'mismatch' };
  }
  return { status: 'ok', employee: emp };
}

function matchError(status) {
  if (status === 'registered') return 'An account for this email already exists. Please log in.';
  return 'No match found.';
}

// Step 1: check that the person is in the system before asking for more details.
router.post('/verify', (req, res) => {
  const { name, email, dob } = req.body;
  if (!name || !email || !dob) {
    return res.status(400).json({ error: 'Please enter your name, email, and date of birth.' });
  }
  const match = matchPendingEmployee({ name, email, dob });
  if (match.status === 'ok') return res.json({ ok: true, name: match.employee.name });
  const code = match.status === 'registered' ? 400 : 404;
  return res.status(code).json({ error: matchError(match.status) });
});

// Step 2: finish the employee account with a password, phone number and location.
router.post('/employee', (req, res) => {
  const { name, email, dob, password, contact, location } = req.body;
  if (!name || !email || !dob || !password || !contact || !location) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  const match = matchPendingEmployee({ name, email, dob });
  if (match.status !== 'ok') {
    const code = match.status === 'registered' ? 400 : 404;
    return res.status(code).json({ error: matchError(match.status) });
  }
  if (!isValidPhone(contact)) return res.status(400).json({ error: 'Contact must be in ###-###-#### format.' });
  if (String(password).length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters.' });

  const employees = getEmployees();
  const emp = employees.find((e) => e.id === match.employee.id);
  emp.password = password;
  emp.contact = String(contact).trim();
  emp.location = String(location).trim();
  saveEmployees(employees);
  res.json({ ok: true });
});

// Admins register themselves with the passcode.
router.post('/admin', (req, res) => {
  const { name, email, dob, password, passcode } = req.body;
  if (!name || !email || !dob || !password || !passcode) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  if (passcode !== ADMIN_PASSCODE) return res.status(400).json({ error: 'Incorrect admin passcode.' });
  if (!isValidEmail(email)) return res.status(400).json({ error: 'Please enter a valid email address.' });
  if (!isValidDate(dob)) return res.status(400).json({ error: 'Please enter a valid date of birth.' });
  if (new Date(dob).getTime() > Date.now()) return res.status(400).json({ error: 'Date of birth cannot be in the future.' });
  if (String(password).length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  if (emailTaken(email)) return res.status(400).json({ error: 'That email is already registered.' });

  const admins = getAdmins();
  admins.push({
    id: nextId(admins),
    name: String(name).trim(),
    email: String(email).trim(),
    password,
    designation: 'Administrator',
    department: '',
    contact: '',
    location: '',
    joiningDate: new Date().toISOString().slice(0, 10),
    dob: String(dob).trim(),
  });
  saveAdmins(admins);
  res.json({ ok: true });
});

module.exports = router;
