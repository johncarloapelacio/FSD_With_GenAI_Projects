// Administrators manage HR fields; employees supply contact details at signup.
const express = require('express');
const router = express.Router();
const {
  getEmployees,
  saveEmployees,
  getAdmins,
  emailTaken,
  nextId,
  isValidEmail,
  isValidDate,
  isValidBirthDate,
  todayISO,
  text,
  toPublic,
  toDirectory,
} = require('../lib/db');
const { apiRequireAuth, apiRequireAdmin } = require('../middleware/auth');
const { revokeAccountSessions } = require('../lib/sessions');
const { issueInvitation } = require('../lib/invitations');

// Check the fields an admin sends when adding or editing an employee.
function validateEmployee(body) {
  const name = text(body.name);
  const designation = text(body.designation);
  const email = text(body.email, 254);
  const department = text(body.department);
  const dob = body.dob;

  if (!name) return { error: 'Name is required.' };
  if (!designation) return { error: 'Designation is required.' };
  if (!isValidEmail(email)) return { error: 'A valid email address is required.' };
  if (!department) return { error: 'Department is required.' };
  if (!isValidDate(dob)) return { error: 'A valid date of birth is required.' };
  if (!isValidBirthDate(dob)) return { error: 'Date of birth cannot be in the future.' };

  return { value: { name, designation, email, department, dob } };
}

// Is this email used by an admin, or by an employee other than the one we are editing?
function emailUsedByOther(email, employees, skipIndex) {
  const wanted = email.toLowerCase();
  const inAdmins = getAdmins().some((a) => String(a.email).toLowerCase() === wanted);
  const inOthers = employees.some((e, i) => i !== skipIndex && String(e.email).toLowerCase() === wanted);
  return inAdmins || inOthers;
}

function norm(value) {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

// Detect duplicate records even when the email differs. This does not authorize signup.
function samePersonUsedByOther(employee, employees, skipIndex) {
  const wantedName = norm(employee.name);
  const wantedDob = String(employee.dob || '').trim();
  return employees.some((e, i) => (
    i !== skipIndex &&
    norm(e.name) === wantedName &&
    String(e.dob || '').trim() === wantedDob
  ));
}

// List. Admins get the full record (with date of birth and age); employees get
// the directory view, which hides those private details.
router.get('/', apiRequireAuth, (req, res) => {
  const employees = getEmployees();
  const mapped = req.role === 'admin'
    ? employees.map((e) => toPublic(e, 'employee'))
    : employees.map((e) => toDirectory(e));
  res.json({ employees: mapped });
});

// Create. Admins only. The employee is "pending" (no password, blank phone and
// location) until they sign up. Joining date is set to today.
router.post('/', apiRequireAdmin, (req, res) => {
  const { value, error } = validateEmployee(req.body);
  if (error) return res.status(400).json({ error });
  if (emailTaken(value.email)) return res.status(400).json({ error: 'That email is already registered.' });

  const employees = getEmployees();
  if (samePersonUsedByOther(value, employees, -1)) {
    return res.status(400).json({ error: 'This employee already exists. Use the existing record instead of creating a duplicate.' });
  }

  const employee = {
    id: nextId(),
    name: value.name,
    email: value.email,
    designation: value.designation,
    department: value.department,
    contact: '',
    location: '',
    joiningDate: todayISO(),
    dob: value.dob,
  };
  const inviteToken = issueInvitation(employee);
  employees.push(employee);
  saveEmployees(employees);
  res.status(201).json({ employee: toPublic(employee, 'employee'), inviteToken, signupUrl: `/signup?invite=${inviteToken}` });
});

// Update. Admins only. Keeps the employee's password, phone, location and
// joining date; only the admin-managed fields change.
router.put('/:id', apiRequireAdmin, (req, res) => {
  const employees = getEmployees();
  const idx = employees.findIndex((e) => String(e.id) === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Employee not found.' });

  const { value, error } = validateEmployee(req.body);
  if (error) return res.status(400).json({ error });
  if (emailUsedByOther(value.email, employees, idx)) {
    return res.status(400).json({ error: 'That email is already registered.' });
  }
  if (samePersonUsedByOther(value, employees, idx)) {
    return res.status(400).json({ error: 'This employee already exists. Use the existing record instead of creating a duplicate.' });
  }

  employees[idx] = {
    ...employees[idx],
    name: value.name,
    email: value.email,
    designation: value.designation,
    department: value.department,
    dob: value.dob,
  };
  saveEmployees(employees);
  res.json({ employee: toPublic(employees[idx], 'employee') });
});

// Delete. Admins only.
router.delete('/:id', apiRequireAdmin, (req, res) => {
  const employees = getEmployees();
  const idx = employees.findIndex((e) => String(e.id) === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Employee not found.' });
  const [removed] = employees.splice(idx, 1);
  saveEmployees(employees);
  revokeAccountSessions(removed.id, 'employee');
  res.json({ ok: true, removed: toPublic(removed, 'employee') });
});

// Reissue a private activation link without exposing its stored hash.
router.post('/:id/invitation', apiRequireAdmin, (req, res) => {
  const employees = getEmployees();
  const employee = employees.find((e) => String(e.id) === req.params.id);
  if (!employee) return res.status(404).json({ error: 'Employee not found.' });
  if (employee.passwordHash || employee.password) return res.status(400).json({ error: 'This employee has already signed up.' });
  const inviteToken = issueInvitation(employee);
  saveEmployees(employees);
  res.json({ inviteToken, signupUrl: `/signup?invite=${inviteToken}` });
});

module.exports = router;
