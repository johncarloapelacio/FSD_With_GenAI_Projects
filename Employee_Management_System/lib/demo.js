// Explicit demo/test fixtures. These accounts are never installed at startup.
const employees = require('../fixtures/demo-employees.json').employees;
const { nextId, saveAdmins, saveEmployees, getAdmins, getEmployees, todayISO } = require('./db');
const { setPassword } = require('./passwords');
function createDemoRecords() {
  const admin = { id: nextId(), name: 'Demo Administrator', email: 'admin@demo.example', designation: 'Administrator', department: 'People Operations', contact: '555-010-1000', location: 'Demo Office', joiningDate: todayISO(), dob: '1985-04-10' };
  setPassword(admin, 'DemoAdmin2026!');
  return { admins: [admin], employees: employees.map((employee) => {
    const account = { ...employee, id: nextId() };
    setPassword(account, 'DemoEmployee2026!');
    return account;
  }) };
}
function installDemo() {
  if (process.env.NODE_ENV === 'production') throw new Error('Demo setup is disabled in production.');
  if (getAdmins().length || getEmployees().length) throw new Error('Demo setup requires an empty data directory. Existing records were not changed.');
  const records = createDemoRecords();
  saveEmployees(records.employees);
  saveAdmins(records.admins);
}
module.exports = { createDemoRecords, installDemo };
