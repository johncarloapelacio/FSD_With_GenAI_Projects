// Custom commands we reuse across the tests.

// Log in as the seeded admin by calling the API directly. This sets the
// session cookie so the next visit lands on the admin dashboard.
Cypress.Commands.add('loginAdmin', () => {
  return cy.request({
    method: 'POST',
    url: '/login',
    form: true,
    body: { role: 'admin', email: 'apelacio.john@gmail.com', password: '52277225' },
  });
});

// Add a pending employee as the seeded admin. Employees can only finish signup
// after an admin has created this record.
Cypress.Commands.add('createPendingEmployee', (overrides = {}) => {
  const stamp = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const user = {
    name: `Test Employee ${stamp}`,
    email: `employee.${stamp}@company.com`,
    dob: '1995-05-20',
    designation: 'QA Analyst',
    department: 'Quality Assurance',
    ...overrides,
  };
  return cy.loginAdmin()
    .then(() => cy.request({ method: 'POST', url: '/api/employees', body: user }))
    .then(() => cy.clearCookie('sid'))
    .then(() => user);
});

// Finish signup for a pending employee, then log in so the next visit lands on
// the employee dashboard.
Cypress.Commands.add('signupEmployee', (overrides = {}) => {
  const user = {
    password: 'secret123',
    contact: '444-555-1212',
    location: 'Remote, US',
    ...overrides,
  };
  return cy.createPendingEmployee(user)
    .then((pendingUser) => {
      const fullUser = { ...pendingUser, password: user.password, contact: user.contact, location: user.location };
      return cy.request({
        method: 'POST',
        url: '/api/signup/verify',
        body: { name: fullUser.name, email: fullUser.email, dob: fullUser.dob },
      }).then(() => cy.request({
        method: 'POST',
        url: '/api/signup/employee',
        body: fullUser,
      })).then(() => cy.request({
        method: 'POST',
        url: '/login',
        form: true,
        body: { role: 'employee', email: fullUser.email, password: fullUser.password },
      })).then(() => fullUser);
    });
});

// Sign up a brand new admin (uses the passcode), then log them in.
Cypress.Commands.add('signupAdmin', (overrides = {}) => {
  const stamp = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const user = {
    name: 'Test Admin',
    email: `admin.${stamp}@company.com`,
    password: 'secret123',
    dob: '1985-04-10',
    ...overrides,
  };
  return cy
    .request({ method: 'POST', url: '/api/signup/admin', body: { passcode: '52277225', ...user } })
    .then(() => cy.request({
      method: 'POST',
      url: '/login',
      form: true,
      body: { role: 'admin', email: user.email, password: user.password },
    }))
    .then(() => user);
});

// Fill the add/edit employee popup (it must already be open). Admins only own
// these HR fields; contact and location are filled by employees during signup.
Cypress.Commands.add('fillEmployeeForm', (emp) => {
  cy.get('[data-cy=emp-name]').clear().type(emp.name);
  cy.get('[data-cy=emp-designation]').clear().type(emp.designation);
  cy.get('[data-cy=emp-email]').clear().type(emp.email);
  cy.get('[data-cy=emp-department]').clear().type(emp.department);
  cy.get('[data-cy=emp-dob]').clear().type(emp.dob);
});
