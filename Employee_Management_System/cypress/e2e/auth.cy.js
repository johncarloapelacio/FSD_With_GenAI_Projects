/// <reference types="cypress" />

describe('Authentication and access control', () => {
  it('sends anonymous visitors from the employee dashboard to login', () => {
    cy.visit('/');
    cy.location('pathname').should('eq', '/login');
  });

  it('sends anonymous visitors from the admin dashboard to login', () => {
    cy.visit('/admin/dashboard');
    cy.location('pathname').should('eq', '/login');
  });

  it('logs the seeded admin in with email and password', () => {
    cy.visit('/login');
    cy.get('[data-cy=role-admin]').check({ force: true });
    cy.get('[data-cy=email]').type('apelacio.john@gmail.com');
    cy.get('[data-cy=password]').type('52277225');
    cy.get('[data-cy=submit]').click();
    cy.location('pathname').should('eq', '/admin/dashboard');
    cy.contains('Welcome, John Apelacio!').should('be.visible');
  });

  it('shows an error when admin credentials are wrong', () => {
    cy.visit('/login');
    cy.get('[data-cy=role-admin]').check({ force: true });
    cy.get('[data-cy=email]').type('apelacio.john@gmail.com');
    cy.get('[data-cy=password]').type('wrong-password');
    cy.get('[data-cy=submit]').click();
    cy.get('[data-cy=error]').should('be.visible').and('contain', 'Invalid email or password');
    cy.location('pathname').should('eq', '/login');
  });

  it('lets a seeded employee log in with email and password', () => {
    cy.visit('/login');
    // employee is the default role
    cy.get('[data-cy=email]').type('olivia.smith@company.com');
    cy.get('[data-cy=password]').type('password123');
    cy.get('[data-cy=submit]').click();
    cy.location('pathname').should('eq', '/');
    cy.contains('Welcome, Olivia Smith!').should('be.visible');
  });

  it('will not let an employee log in through the admin selector', () => {
    cy.visit('/login');
    cy.get('[data-cy=role-admin]').check({ force: true });
    cy.get('[data-cy=email]').type('olivia.smith@company.com');
    cy.get('[data-cy=password]').type('password123');
    cy.get('[data-cy=submit]').click();
    cy.get('[data-cy=error]').should('contain', 'Invalid email or password');
  });

  it('rejects admin signup without the right passcode', () => {
    const stamp = Date.now();
    cy.visit('/signup');
    cy.get('[data-cy=role-admin]').check({ force: true });
    cy.get('[data-cy=admin-name]').type('Mallory');
    cy.get('[data-cy=admin-email]').type(`mallory.${stamp}@company.com`);
    cy.get('[data-cy=admin-dob]').type('1990-02-02');
    cy.get('[data-cy=admin-password]').type('secret123');
    cy.get('[data-cy=passcode]').type('00000000');
    cy.get('[data-cy=admin-submit]').click();
    cy.get('[data-cy=error]').should('be.visible').and('contain', 'Incorrect admin passcode');
    cy.location('pathname').should('eq', '/signup');
  });

  it('creates an admin account with the right passcode, then lets them log in', () => {
    const stamp = Date.now();
    const email = `newadmin.${stamp}@company.com`;
    cy.visit('/signup');
    cy.get('[data-cy=role-admin]').check({ force: true });
    cy.get('[data-cy=admin-name]').type('New Admin');
    cy.get('[data-cy=admin-email]').type(email);
    cy.get('[data-cy=admin-dob]').type('1986-08-08');
    cy.get('[data-cy=admin-password]').type('secret123');
    cy.get('[data-cy=passcode]').type('52277225');
    cy.get('[data-cy=admin-submit]').click();
    cy.get('[data-cy=success]').should('be.visible').and('contain', 'created successfully');
    cy.location('pathname').should('eq', '/signup');

    cy.get('[data-cy=to-login]').click();
    cy.get('[data-cy=role-admin]').check({ force: true });
    cy.get('[data-cy=email]').type(email);
    cy.get('[data-cy=password]').type('secret123');
    cy.get('[data-cy=submit]').click();
    cy.location('pathname').should('eq', '/admin/dashboard');
    cy.contains('Welcome, New Admin!').should('be.visible');
  });

  it('signs up a pending employee, then lets them log in', () => {
    const stamp = Date.now();
    const user = {
      name: `Jordan Lane ${stamp}`,
      email: `jordan.${stamp}@company.com`,
      dob: '1994-03-03',
      password: 'secret123',
      contact: '555-333-1212',
      location: 'Remote, US',
    };
    cy.createPendingEmployee(user);

    cy.visit('/signup');
    cy.get('[data-cy=name]').type(user.name);
    cy.get('[data-cy=email]').type(user.email);
    cy.get('[data-cy=dob]').type(user.dob);
    cy.get('[data-cy=verify]').click();
    cy.get('[data-cy=matched-note]').should('be.visible');
    cy.get('[data-cy=password]').type('secret123');
    cy.get('[data-cy=contact]').type(user.contact);
    cy.get('[data-cy=location]').type(user.location);
    cy.get('[data-cy=submit]').click();
    cy.get('[data-cy=success]').should('be.visible').and('contain', 'created successfully');

    cy.get('[data-cy=to-login]').click();
    cy.get('[data-cy=email]').type(user.email);
    cy.get('[data-cy=password]').type(user.password);
    cy.get('[data-cy=submit]').click();
    cy.location('pathname').should('eq', '/');
    cy.contains(`Welcome, ${user.name}!`).should('be.visible');
  });

  it('blocks employee signup when there is no matching pending record', () => {
    cy.visit('/signup');
    cy.get('[data-cy=name]').type('Copycat');
    cy.get('[data-cy=email]').type('olivia.smith@company.com'); // already seeded
    cy.get('[data-cy=dob]').type('1992-02-02');
    cy.get('[data-cy=verify]').click();
    cy.get('[data-cy=error]').should('contain', 'An account for this email already exists');
  });

  it('keeps an employee out of the admin dashboard', () => {
    cy.signupEmployee().then(() => {
      cy.visit('/admin/dashboard');
      cy.location('pathname').should('eq', '/');
      cy.contains('Welcome,').should('be.visible');
    });
  });

  it('blocks an employee from a write API endpoint', () => {
    cy.signupEmployee().then(() => {
      cy.request({ method: 'POST', url: '/api/employees', failOnStatusCode: false, body: { name: 'X' } })
        .its('status')
        .should('eq', 403);
    });
  });

  it('logs out and ends the session', () => {
    cy.loginAdmin();
    cy.visit('/admin/dashboard');
    cy.get('[data-cy=logout]').click();
    cy.location('pathname').should('eq', '/login');
    cy.visit('/admin/dashboard');
    cy.location('pathname').should('eq', '/login');
  });
});
