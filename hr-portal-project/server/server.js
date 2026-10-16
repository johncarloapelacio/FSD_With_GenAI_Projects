const { validateDatabase } = require('./schema');
const path = require('node:path');
const { createBase, fail, text, email, password, integer, hash, verify, id } = require('./security');
function createApp(options = {}) {
  const base = createBase({ dbPath: options.dbPath || process.env.DB_PATH || path.join(__dirname, 'database.json'), examplePath: path.join(__dirname, 'database.example.json'), collections: ['users', 'employeesInfo', 'leaveInfo'], cookieName: 'hr_session', validate: validateDatabase });
  const { app, read, write, auth, issue, limit } = base;
  const publicUser = u => ({ id: u.id, userEmail: u.emailId, userType: u.typeOfUser });
  const publicEmployee = e => { const { passwordHash, inviteHash, ...result } = e; void passwordHash; void inviteHash; return result; };
  const hr = (req, res, next) => req.user.typeOfUser === 'hr' ? next() : res.status(403).json({ message: 'HR access required' });
  // Provision HR only via local configuration, never through public signup.
  const adminEmail = options.adminEmail || process.env.HR_ADMIN_EMAIL;
  const adminPassword = options.adminPassword || process.env.HR_ADMIN_PASSWORD;
  if (adminEmail || adminPassword) {
    const normalized = email(adminEmail), secret = password(adminPassword), db = read();
    if (!db.users.some(u => u.emailId === normalized)) { db.users.push({ id: id(), emailId: normalized, typeOfUser: 'hr', passwordHash: hash(secret) }); write(db); }
  }
  app.post('/api/auth/login', limit, (req, res) => {
    const normalized = email(req.body.email), db = read();
    const user = db.users.find(u => u.emailId === normalized);
    if (!user || !verify(req.body.password, user.passwordHash) || user.typeOfUser !== req.body.userType) fail(401, 'Invalid email, password, or user type');
    issue(req, res, user.id); res.json(publicUser(user));
  });
  app.get('/api/auth/session', auth, (req, res) => res.json(publicUser(req.user)));
  app.post('/api/auth/verify-invite', limit, (req, res) => {
    const normalized = email(req.body.email), db = read();
    const employee = db.employeesInfo.find(e => e.emailId === normalized && !e.signedUp);
    if (!employee || !verify(req.body.inviteCode, employee.inviteHash)) fail(400, 'Invalid or used invitation');
    res.json({ employeeId: employee.id, email: employee.emailId, department: employee.department });
  });
  app.post('/api/auth/signup', limit, (req, res) => {
    const normalized = email(req.body.email), db = read();
    const employee = db.employeesInfo.find(e => e.emailId === normalized && !e.signedUp);
    if (!employee || !verify(req.body.inviteCode, employee.inviteHash)) fail(400, 'Invalid or used invitation');
    if (db.users.some(u => u.emailId === normalized)) fail(409, 'Account already exists');
    const secret = password(req.body.password);
    Object.assign(employee, { fname: text(req.body.firstName, 'First name'), lname: text(req.body.lastName, 'Last name'), age: integer(req.body.age, 'Age', 16, 120), signedUp: true });
    delete employee.inviteHash;
    db.users.push({ id: id(), emailId: normalized, typeOfUser: 'employee', employeeId: employee.id, passwordHash: hash(secret) });
    write(db); res.status(201).json({ success: true });
  });
  app.get('/api/employeesInfo', auth, (req, res) => {
    const employees = read().employeesInfo;
    res.json((req.user.typeOfUser === 'hr' ? employees : employees.filter(e => e.id === req.user.employeeId)).map(publicEmployee));
  });
  app.post('/api/employeesInfo', auth, hr, (req, res) => {
    const normalized = email(req.body.emailId), department = text(req.body.department, 'Department'), db = read();
    if (db.employeesInfo.some(e => e.emailId === normalized) || db.users.some(u => u.emailId === normalized)) fail(409, 'Employee already exists');
    const inviteCode = require('node:crypto').randomBytes(18).toString('base64url');
    const employee = { id: id(), emailId: normalized, department, signedUp: false, inviteHash: hash(inviteCode) };
    db.employeesInfo.push(employee); write(db);
    res.status(201).json({ ...publicEmployee(employee), inviteCode });
  });
  app.get('/api/leaveInfo', auth, (req, res) => {
    const leaves = read().leaveInfo;
    res.json(req.user.typeOfUser === 'hr' ? leaves : leaves.filter(l => l.employeeId === req.user.employeeId));
  });
  app.post('/api/leaveInfo', auth, (req, res) => {
    if (req.user.typeOfUser !== 'employee') fail(403, 'Employee access required');
    const db = read();
    const leave = { id: id(), employeeId: req.user.employeeId, emailId: req.user.emailId, reason: text(req.body.reason, 'Reason', 2000), numberOfDays: integer(req.body.numberOfDays, 'Days', 1, 365), status: 'Pending', createdAt: new Date().toISOString() };
    db.leaveInfo.push(leave); write(db); res.status(201).json(leave);
  });
  app.patch('/api/leaveInfo/:id', auth, hr, (req, res) => {
    const db = read(), leave = db.leaveInfo.find(l => l.id === req.params.id);
    if (!leave) fail(404, 'Leave request not found');
    if (!['Approved','Denied'].includes(req.body.status)) fail(400, 'Status must be Approved or Denied');
    if (leave.status !== 'Pending') fail(409, 'Leave request has already been reviewed');
    leave.status = req.body.status; write(db); res.json(leave);
  });
  return base.finish();
}
if (require.main === module) createApp().listen(Number(process.env.PORT) || 3000, '127.0.0.1', () => console.log('HR API listening on loopback'));
module.exports = { createApp };
