function ensure(condition, label) { if (!condition) throw new Error(`Invalid database: ${label}`); }
const plain = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const string = (value, min = 1, max = 100) => typeof value === 'string' && value === value.trim() && value.length >= min && value.length <= max;
const integer = (value, min, max) => Number.isInteger(value) && value >= min && value <= max;
const number = (value, min, max) => typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
const uuid = value => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
const email = value => string(value, 3, 254) && value === value.toLowerCase() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const hash = value => typeof value === 'string' && /^[a-f0-9]{32}:[a-f0-9]{128}$/.test(value);
const date = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value;
function keys(value, required, optional = []) { return plain(value) && required.every(key => Object.hasOwn(value, key)) && Object.keys(value).every(key => required.includes(key) || optional.includes(key)); }
function unique(rows, key, label) { ensure(new Set(rows.map(row => row[key])).size === rows.length, label); }

function validateDatabase(db) {
  ensure(keys(db, ['users','employeesInfo','leaveInfo']), 'top-level collections');
  for (const rows of Object.values(db)) ensure(Array.isArray(rows), 'collection type');
  for (const user of db.users) {
    ensure(keys(user, ['id','emailId','passwordHash','typeOfUser'], ['employeeId']) && uuid(user.id) && email(user.emailId) && hash(user.passwordHash) && ['hr','employee'].includes(user.typeOfUser), 'user record');
    ensure(user.typeOfUser === 'employee' ? uuid(user.employeeId) : !Object.hasOwn(user, 'employeeId'), 'user role relation');
  }
  for (const employee of db.employeesInfo) {
    ensure(plain(employee) && typeof employee.signedUp === 'boolean', 'employee signup state');
    const required = employee.signedUp ? ['id','emailId','department','signedUp','fname','lname','age'] : ['id','emailId','department','signedUp','inviteHash'];
    ensure(keys(employee, required) && uuid(employee.id) && email(employee.emailId) && string(employee.department), 'employee record');
    ensure(employee.signedUp ? string(employee.fname) && string(employee.lname) && integer(employee.age, 16, 120) : hash(employee.inviteHash), 'employee personal data or invitation');
    const users = db.users.filter(user => user.employeeId === employee.id && user.emailId === employee.emailId && user.typeOfUser === 'employee');
    ensure(users.length === (employee.signedUp ? 1 : 0), 'employee account relation');
    ensure(!db.users.some(user => user.typeOfUser === 'hr' && user.emailId === employee.emailId), 'HR and employee identity collision');
  }
  for (const user of db.users.filter(user => user.typeOfUser === 'employee')) ensure(db.employeesInfo.some(employee => employee.id === user.employeeId && employee.emailId === user.emailId && employee.signedUp), 'orphaned employee account');
  for (const leave of db.leaveInfo) {
    ensure(keys(leave, ['id','employeeId','emailId','reason','numberOfDays','status','createdAt']) && uuid(leave.id) && uuid(leave.employeeId) && email(leave.emailId) && string(leave.reason, 1, 2000) && integer(leave.numberOfDays, 1, 365) && ['Pending','Approved','Denied'].includes(leave.status) && date(leave.createdAt), 'leave record');
    ensure(db.employeesInfo.some(employee => employee.id === leave.employeeId && employee.emailId === leave.emailId && employee.signedUp), 'orphaned leave or mismatched identity');
  }
  for (const [name, rows] of Object.entries(db)) unique(rows, 'id', `${name} duplicate IDs`);
  unique(db.users, 'emailId', 'duplicate user emails'); unique(db.employeesInfo, 'emailId', 'duplicate employee emails');
}
module.exports = { validateDatabase };
