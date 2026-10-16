// Atomic JSON storage for a single Node process. A damaged file is never
// silently replaced with an empty directory.
const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const DATA_DIR = path.resolve(process.env.EMS_DATA_DIR || path.join(__dirname, '..', 'data'));
const ADMIN_PATH = path.join(DATA_DIR, 'admin_db.json');
const EMP_PATH = path.join(DATA_DIR, 'emp_db.json');
class StorageError extends Error {
  constructor(message, cause) { super(message, { cause }); this.code = 'EMS_STORAGE_ERROR'; }
}
function validateRecords(records) {
  if (!Array.isArray(records)) throw new Error('Expected account array.');
  const ids = new Set();
  const emails = new Set();
  for (const record of records) {
    if (!record || typeof record !== 'object' || Array.isArray(record) ||
        !((typeof record.id === 'number' && Number.isSafeInteger(record.id) && record.id > 0) ||
          (typeof record.id === 'string' && /^[a-zA-Z0-9-]{1,80}$/.test(record.id))) ||
        typeof record.name !== 'string' || !record.name.trim() || !isValidEmail(record.email) ||
        (record.password !== undefined && typeof record.password !== 'string') ||
        (record.passwordHash !== undefined && typeof record.passwordHash !== 'string')) throw new Error('Invalid account record.');
    if (ids.has(String(record.id)) || emails.has(record.email.trim().toLowerCase())) throw new Error('Duplicate account identity or email.');
    ids.add(String(record.id));
    emails.add(record.email.trim().toLowerCase());
  }
  return records;
}
function readRecords(file, key) {
  let source;
  try { source = fs.readFileSync(file, 'utf8'); }
  catch (error) {
    if (error.code === 'ENOENT') return [];
    throw new StorageError('Account storage could not be read.', error);
  }
  try { return validateRecords(JSON.parse(source.replace(/^\uFEFF/, ''))?.[key]); }
  catch (error) { throw new StorageError('Account storage is damaged; restore it before retrying.', error); }
}
function writeRecords(file, key, records) {
  const temp = `${file}.${randomUUID()}.tmp`;
  let fd;
  try {
    validateRecords(records);
    readRecords(file, key);
    fs.mkdirSync(DATA_DIR, { recursive: true, mode: 0o700 });
    fd = fs.openSync(temp, 'wx', 0o600);
    fs.writeFileSync(fd, JSON.stringify({ [key]: records }, null, 2) + '\n', 'utf8');
    fs.fsyncSync(fd);
    fs.closeSync(fd);
    fd = undefined;
    fs.renameSync(temp, file);
  } catch (error) {
    throw error instanceof StorageError ? error : new StorageError('Account changes could not be saved.', error);
  } finally {
    if (fd !== undefined) fs.closeSync(fd);
    try { fs.unlinkSync(temp); } catch (error) { if (error.code !== 'ENOENT') console.error('Temporary storage cleanup failed.'); }
  }
}
const getAdmins = () => readRecords(ADMIN_PATH, 'admins');
const saveAdmins = (records) => writeRecords(ADMIN_PATH, 'admins', records);
const getEmployees = () => readRecords(EMP_PATH, 'employees');
const saveEmployees = (records) => writeRecords(EMP_PATH, 'employees', records);
function listByRole(role) {
  if (role === 'admin') return getAdmins();
  if (role === 'employee') return getEmployees();
  throw new Error('Unknown account role.');
}
function saveByRole(role, list) {
  if (role === 'admin') return saveAdmins(list);
  if (role === 'employee') return saveEmployees(list);
  throw new Error('Unknown account role.');
}
function findByEmail(email, role) {
  if (typeof email !== 'string') return null;
  const wanted = email.trim().toLowerCase();
  return listByRole(role).find((a) => a.email.trim().toLowerCase() === wanted) || null;
}
function findById(id, role) { return listByRole(role).find((a) => String(a.id) === String(id)) || null; }
function emailTaken(email) { return !!(findByEmail(email, 'admin') || findByEmail(email, 'employee')); }
// Random identities cannot be reassigned when a record is deleted.
const nextId = () => randomUUID();
function parseDateLocal(value) {
  if (typeof value !== 'string') return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const [, year, month, day] = match.map(Number);
  if (year < 1000 || month < 1 || month > 12 || day < 1 || day > 31) return null;
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : null;
}
function todayISO() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
const isValidDate = (value) => parseDateLocal(value) !== null;
const isValidBirthDate = (value) => isValidDate(value) && value <= todayISO();
function calcAge(dob) {
  const birth = parseDateLocal(dob);
  if (!birth) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) age--;
  return age >= 0 ? age : null;
}
function formatDate(value) {
  const date = parseDateLocal(value);
  return date ? date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '';
}
const isValidPhone = (value) => typeof value === 'string' && /^\d{3}-\d{3}-\d{4}$/.test(value.trim());
const isValidEmail = (value) => typeof value === 'string' && value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
const text = (value, max = 200) => typeof value === 'string' && value.trim().length <= max ? value.trim() : null;
function toDirectory(record) {
  if (!record) return null;
  const { id, name, designation, email, contact, department, location, joiningDate } = record;
  return { id, name, designation, email, contact, department, location, joiningDate, joiningDateText: formatDate(joiningDate) };
}
function toPublic(record, role) {
  if (!record) return null;
  return { ...toDirectory(record), role, active: !!(record.passwordHash || record.password), dob: record.dob, dobText: formatDate(record.dob), age: calcAge(record.dob) };
}
module.exports = {
  DATA_DIR, StorageError, validateRecords, getAdmins, saveAdmins,
  getEmployees, saveEmployees, listByRole, saveByRole, findByEmail,
  findById, emailTaken, nextId, parseDateLocal, todayISO, calcAge,
  formatDate, isValidPhone, isValidEmail, isValidDate, isValidBirthDate,
  text, toPublic, toDirectory,
};
