// Run with the old server stopped. The source files remain untouched.
const fs = require('node:fs');
const path = require('node:path');
const db = require('../lib/db');
const { setPassword } = require('../lib/passwords');
try {
  const source = process.argv[2];
  if (!source) throw new Error('Usage: npm run data:migrate -- /absolute/path/to/old/data');
  if (db.getAdmins().length || db.getEmployees().length) throw new Error('Migration requires an empty destination data directory.');
  const read = (name, key) => {
    let parsed;
    try {
      parsed = JSON.parse(fs.readFileSync(path.join(path.resolve(source), name), 'utf8').replace(/^\uFEFF/, ''));
    } catch (error) {
      if (error instanceof SyntaxError) throw new Error('A legacy storage file contains invalid JSON. Restore it before migration.');
      throw error;
    }
    const records = parsed?.[key];
    if (!Array.isArray(records)) throw new Error('The source has an invalid account list.');
    return db.validateRecords(records.map((old) => {
      const record = { ...old, id: db.nextId() };
      if (old.password) setPassword(record, old.password);
      delete record.password;
      delete record.invitationHash;
      delete record.invitationExpiresAt;
      return record;
    }));
  };
  const admins = read('admin_db.json', 'admins');
  const employees = read('emp_db.json', 'employees');
  const emails = new Set();
  for (const account of [...admins, ...employees]) {
    const email = account.email.trim().toLowerCase();
    if (emails.has(email)) throw new Error('The source contains a duplicate email address. Correct it before migration.');
    emails.add(email);
  }
  db.saveEmployees(employees);
  db.saveAdmins(admins);
  console.log('Legacy records copied with new identities and password hashes. Reissue pending employee invitations from the dashboard.');
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
