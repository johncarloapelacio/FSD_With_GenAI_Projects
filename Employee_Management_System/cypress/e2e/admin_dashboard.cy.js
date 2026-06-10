/// <reference types="cypress" />

describe('Admin dashboard', () => {
  beforeEach(() => {
    cy.loginAdmin();
    cy.visit('/admin/dashboard');
  });

  it('shows the employee records and a total count', () => {
    cy.get('[data-cy=emp-count]').should(($count) => {
      expect(Number($count.text())).to.be.greaterThan(0);
    });
    cy.get('[data-cy=emp-grid]').should('contain', 'Olivia Smith');
  });

  it('adds a new employee through the popup', () => {
    const name = `Cypress Add ${Date.now()}`;
    cy.get('[data-cy=add-employee]').click();
    cy.get('[data-cy=emp-modal]').should('have.class', 'open');
    cy.fillEmployeeForm({
      name,
      designation: 'QA Engineer',
      email: `cyadd.${Date.now()}@company.com`,
      department: 'Quality Assurance',
      dob: '1993-07-15',
    });
    cy.get('[data-cy=emp-save]').click();
    cy.get('[data-cy=emp-modal]').should('not.have.class', 'open');
    cy.contains('[data-cy=emp-card]', name)
      .should('exist')
      .and('contain', 'Pending signup')
      .and('contain', 'Age');

    // Clean up so the suite can be re-run.
    cy.contains('[data-cy=emp-card]', name).within(() => {
      cy.get('[data-cy=delete-emp]').click();
    });
    cy.get('[data-cy=confirm-ok]').click();
    cy.contains('[data-cy=emp-card]', name).should('not.exist');
  });

  it('validates required admin-owned fields when adding', () => {
    cy.get('[data-cy=add-employee]').click();
    cy.fillEmployeeForm({
      name: 'Bad Phone',
      designation: 'Tester',
      email: `bad.${Date.now()}@company.com`,
      department: 'QA',
      dob: '1990-01-01',
    });
    cy.get('[data-cy=emp-designation]').clear();
    cy.get('[data-cy=emp-save]').click();
    cy.get('[data-cy=emp-msg]').should('contain', 'Designation is required');
    cy.get('[data-cy=emp-modal]').should('have.class', 'open');
    cy.get('[data-cy=emp-cancel]').click();
  });

  it('does not allow an admin to create a duplicate employee record', () => {
    cy.get('[data-cy=add-employee]').click();
    cy.fillEmployeeForm({
      name: 'Olivia Smith',
      designation: 'Software Engineer',
      email: `olivia.duplicate.${Date.now()}@company.com`,
      department: 'Engineering',
      dob: '1992-03-15',
    });
    cy.get('[data-cy=emp-save]').click();
    cy.get('[data-cy=emp-msg]').should('contain', 'This employee already exists');
    cy.get('[data-cy=emp-modal]').should('have.class', 'open');
    cy.get('[data-cy=emp-cancel]').click();
  });

  it('edits an existing employee', () => {
    const name = `Cypress Edit ${Date.now()}`;
    cy.get('[data-cy=add-employee]').click();
    cy.fillEmployeeForm({
      name,
      designation: 'Software Engineer',
      email: `cyedit.${Date.now()}@company.com`,
      department: 'Engineering',
      dob: '1991-09-09',
    });
    cy.get('[data-cy=emp-save]').click();
    cy.contains('[data-cy=emp-card]', name).should('exist');

    cy.contains('[data-cy=emp-card]', name).within(() => {
      cy.get('[data-cy=edit-emp]').click();
    });
    cy.get('[data-cy=emp-modal-title]').should('contain', 'Edit Employee');
    cy.get('[data-cy=emp-designation]').clear().type('Lead Engineer');
    cy.get('[data-cy=emp-save]').click();
    cy.contains('[data-cy=emp-card]', name).should('contain', 'Lead Engineer');

    cy.contains('[data-cy=emp-card]', name).within(() => {
      cy.get('[data-cy=delete-emp]').click();
    });
    cy.get('[data-cy=confirm-ok]').click();
    cy.contains('[data-cy=emp-card]', name).should('not.exist');
  });

  it('can cancel a delete without removing the employee', () => {
    cy.contains('[data-cy=emp-card]', 'Olivia Smith').within(() => {
      cy.get('[data-cy=delete-emp]').click();
    });
    cy.get('[data-cy=confirm-modal]').should('have.class', 'open');
    cy.get('[data-cy=confirm-cancel]').click();
    cy.get('[data-cy=confirm-modal]').should('not.have.class', 'open');
    cy.contains('[data-cy=emp-card]', 'Olivia Smith').should('exist');
  });

  it('switches sections in-page without navigating', () => {
    cy.get('[data-cy=nav-account]').click();
    cy.get('#section-account').should('have.class', 'active');
    cy.get('#section-employees').should('not.have.class', 'active');
    cy.location('pathname').should('eq', '/admin/dashboard');
    cy.get('[data-cy=nav-employees]').click();
    cy.get('#section-employees').should('have.class', 'active');
  });

  it('shows date of birth as read-only in account settings', () => {
    cy.get('[data-cy=nav-account]').click();
    cy.get('[data-cy=acct-dob-text]').should('be.visible');
    cy.get('#profile-form input[name=dob]').should('not.exist');
  });

  it('lets an admin change their own designation and department', () => {
    cy.signupAdmin().then(() => {
      cy.visit('/admin/dashboard');
      cy.get('[data-cy=nav-account]').click();
      cy.get('[data-cy=acct-designation]').clear().type('Senior HR Lead');
      cy.get('[data-cy=acct-department]').clear().type('People Operations');
      cy.get('[data-cy=save-profile]').click();
      cy.get('[data-cy=profile-msg]').should('contain', 'updated');
      cy.reload();
      cy.get('[data-cy=nav-account]').click();
      cy.get('[data-cy=acct-designation]').should('have.value', 'Senior HR Lead');
      cy.get('[data-cy=acct-department]').should('have.value', 'People Operations');
    });
  });

  it('rejects a password change when the confirmation does not match', () => {
    cy.get('[data-cy=nav-account]').click();
    cy.get('[data-cy=current-password]').type('52277225');
    cy.get('[data-cy=new-password]').type('newpass123');
    cy.get('[data-cy=confirm-password]').type('different123');
    cy.get('[data-cy=save-password]').click();
    cy.get('[data-cy=password-msg]').should('contain', 'do not match');
  });
});
