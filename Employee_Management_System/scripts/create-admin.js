const { getAdmins, saveAdmins, getEmployees, saveEmployees, nextId, emailTaken, isValidEmail, isValidBirthDate, text, todayISO } = require('../lib/db');
const { validPassword, setPassword } = require('../lib/passwords');
try {
  const { EMS_ADMIN_NAME: name, EMS_ADMIN_EMAIL: email, EMS_ADMIN_DOB: dob, EMS_ADMIN_PASSWORD: password } = process.env;
  if (getAdmins().length) throw new Error('An administrator already exists. Create further administrators from the admin dashboard.');
  if (!text(name) || !isValidEmail(email) || !isValidBirthDate(dob) || !validPassword(password)) throw new Error('Set EMS_ADMIN_NAME, EMS_ADMIN_EMAIL, EMS_ADMIN_DOB (YYYY-MM-DD), and EMS_ADMIN_PASSWORD (8–256 characters).');
  if (emailTaken(email)) throw new Error('That email is already registered.');
  const account = { id: nextId(), name: name.trim(), email: email.trim(), dob, joiningDate: todayISO(), designation: 'Administrator', department: '', contact: '', location: '' };
  setPassword(account, password);
  saveEmployees(getEmployees());
  saveAdmins([account]);
  console.log('Initial administrator created. Sign in at /login.');
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
