// Reads and writes our JSON data files. We use the fs module instead of a real
// database. Admins live in admin_db.json and employees live in emp_db.json.
const fs = require('fs');
const path = require('path');

const ADMIN_PATH = path.join(__dirname, '..', 'admin_db.json');
const EMP_PATH = path.join(__dirname, '..', 'emp_db.json');

function readJSON(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8').replace(/^\uFEFF/, ''));
  } catch (err) {
    return fallback;
  }
}

function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

// Admin accounts.
function getAdmins() {
  const data = readJSON(ADMIN_PATH, { admins: [] });
  return Array.isArray(data.admins) ? data.admins : [];
}

function saveAdmins(admins) {
  writeJSON(ADMIN_PATH, { admins });
}

// Employee accounts (these are also the directory records).
function getEmployees() {
  const data = readJSON(EMP_PATH, { employees: [] });
  return Array.isArray(data.employees) ? data.employees : [];
}

function saveEmployees(employees) {
  writeJSON(EMP_PATH, { employees });
}

// Grab the right list for a role so the rest of the app does not have to care
// which file the account came from.
function listByRole(role) {
  return role === 'admin' ? getAdmins() : getEmployees();
}

function saveByRole(role, list) {
  if (role === 'admin') saveAdmins(list);
  else saveEmployees(list);
}

// Login is by email, so we look people up by email within their role's list.
function findByEmail(email, role) {
  if (!email) return null;
  const wanted = String(email).trim().toLowerCase();
  return listByRole(role).find((a) => String(a.email).toLowerCase() === wanted) || null;
}

function findById(id, role) {
  return listByRole(role).find((a) => a.id === Number(id)) || null;
}

// True if this email is already used by any admin or employee. Used so we never
// end up with two accounts sharing an email.
function emailTaken(email) {
  const wanted = String(email || '').trim().toLowerCase();
  const inAdmins = getAdmins().some((a) => String(a.email).toLowerCase() === wanted);
  const inEmployees = getEmployees().some((e) => String(e.email).toLowerCase() === wanted);
  return inAdmins || inEmployees;
}

// Next id for a list.
function nextId(list) {
  return list.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1;
}

// Treat a 'YYYY-MM-DD' string as a local date so the day never shifts by one.
function parseDateLocal(value) {
  if (!value) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value));
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

// Work out someone's age from their date of birth. Because it is calculated
// fresh each time, everyone gets a year older on their birthday automatically.
function calcAge(dob) {
  const birth = parseDateLocal(dob);
  if (!birth) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) age--;
  return age >= 0 ? age : null;
}

// Turn a stored date into something nice to read, like "June 9, 2026".
function formatDate(value) {
  const d = parseDateLocal(value);
  if (!d) return '';
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

const PHONE_RE = /^\d{3}-\d{3}-\d{4}$/;
function isValidPhone(phone) {
  return PHONE_RE.test(String(phone || '').trim());
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function isValidEmail(email) {
  return EMAIL_RE.test(String(email || '').trim());
}

function isValidDate(value) {
  return parseDateLocal(value) !== null;
}

// Get a record ready to send to the browser: drop the password and add the
// computed age plus friendly date strings. "active" tells the admin whether the
// person has finished signing up (an employee only gets a password once they do).
function toPublic(record, role) {
  if (!record) return null;
  const { password, ...rest } = record;
  return {
    ...rest,
    role: role || rest.role,
    active: !!password,
    age: calcAge(record.dob),
    joiningDateText: formatDate(record.joiningDate),
    dobText: formatDate(record.dob),
  };
}

// The trimmed-down view colleagues see in the company directory. We leave out
// date of birth and age on purpose so they are not shared with everyone.
function toDirectory(record) {
  if (!record) return null;
  return {
    id: record.id,
    name: record.name,
    designation: record.designation,
    email: record.email,
    contact: record.contact,
    department: record.department,
    location: record.location,
    joiningDate: record.joiningDate,
    joiningDateText: formatDate(record.joiningDate),
  };
}

module.exports = {
  getAdmins,
  saveAdmins,
  getEmployees,
  saveEmployees,
  listByRole,
  saveByRole,
  findByEmail,
  findById,
  emailTaken,
  nextId,
  calcAge,
  formatDate,
  isValidPhone,
  isValidEmail,
  isValidDate,
  toPublic,
  toDirectory,
};
