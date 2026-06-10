/// <reference types="cypress" />

// Work out the age the app should show for a given date of birth, the same way
// the app does. Keeping it here means the test stays correct as years pass.
function ageFrom(dob) {
  const parts = dob.split('-').map(Number);
  const birth = new Date(parts[0], parts[1] - 1, parts[2]);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

describe('Employee dashboard', () => {
  it('shows the directory with formatted phones while hiding private DOB and age', () => {
    cy.signupEmployee().then(() => {
      cy.visit('/');
      cy.get('[data-cy=directory-grid]').should('contain', 'Olivia Smith');
      cy.contains('[data-cy=directory-card]', 'Olivia Smith')
        .should('contain', '415-555-0143') // no country code
        .and('not.contain', 'Date of Birth')
        .and('not.contain', 'Age');
    });
  });

  it('shows the signed-in employee their own date of birth and computed age in account settings', () => {
    const dob = '1995-05-20';
    cy.signupEmployee({ dob }).then(() => {
      cy.visit('/');
      cy.get('[data-cy=nav-account]').click();
      cy.get('[data-cy=acct-age]').should('have.text', String(ageFrom(dob)));
      cy.get('[data-cy=acct-dob-text]').should('contain', 'May 20, 1995');
    });
  });

  it('only lets an employee edit contact and location', () => {
    const name = `Read Only ${Date.now()}`;
    cy.signupEmployee({ name }).then((user) => {
      cy.visit('/');
      cy.get('[data-cy=nav-account]').click();
      // editable
      cy.get('[data-cy=acct-contact]').should('exist');
      cy.get('[data-cy=acct-location]').should('exist');
      // not editable for employees
      cy.get('#profile-form input[name=designation]').should('not.exist');
      cy.get('#profile-form input[name=department]').should('not.exist');
      cy.get('#profile-form input[name=name]').should('not.exist');
      cy.get('#profile-form input[name=email]').should('not.exist');
      cy.get('#profile-form input[name=dob]').should('not.exist');
      // identity and locked fields appear as read-only text
      cy.contains('.ro-item', 'Name').should('contain', name);
      cy.contains('.ro-item', 'Email').should('contain', user.email);
      cy.contains('.ro-item', 'Designation').should('contain', user.designation);
    });
  });

  it('saves contact and location and keeps them after a reload', () => {
    cy.signupEmployee().then(() => {
      cy.visit('/');
      cy.get('[data-cy=nav-account]').click();
      cy.get('[data-cy=acct-contact]').clear().type('444-555-6666');
      cy.get('[data-cy=acct-location]').clear().type('Remote, US');
      cy.get('[data-cy=save-profile]').click();
      cy.get('[data-cy=profile-msg]').should('contain', 'updated');

      cy.reload();
      cy.get('[data-cy=nav-account]').click();
      cy.get('[data-cy=acct-contact]').should('have.value', '444-555-6666');
      cy.get('[data-cy=acct-location]').should('have.value', 'Remote, US');
    });
  });

  it('rejects an invalid contact number', () => {
    cy.signupEmployee().then(() => {
      cy.visit('/');
      cy.get('[data-cy=nav-account]').click();
      cy.get('[data-cy=acct-contact]').clear().type('12345');
      cy.get('[data-cy=save-profile]').click();
      cy.get('[data-cy=profile-msg]').should('contain', '###-###-####');
    });
  });

  it('changes the password and logs back in with the new one', () => {
    cy.signupEmployee().then((user) => {
      cy.visit('/');
      cy.get('[data-cy=nav-account]').click();
      cy.get('[data-cy=current-password]').type(user.password);
      cy.get('[data-cy=new-password]').type('brandnew123');
      cy.get('[data-cy=confirm-password]').type('brandnew123');
      cy.get('[data-cy=save-password]').click();
      cy.get('[data-cy=password-msg]').should('contain', 'updated');

      cy.get('[data-cy=logout]').click();
      cy.location('pathname').should('eq', '/login');

      // employee is the default role
      cy.get('[data-cy=email]').type(user.email);
      cy.get('[data-cy=password]').type('brandnew123');
      cy.get('[data-cy=submit]').click();
      cy.location('pathname').should('eq', '/');
      cy.contains('Welcome,').should('be.visible');
    });
  });

  it('logs out and blocks the dashboard afterwards', () => {
    cy.signupEmployee().then(() => {
      cy.visit('/');
      cy.get('[data-cy=logout]').click();
      cy.location('pathname').should('eq', '/login');
      cy.visit('/');
      cy.location('pathname').should('eq', '/login');
    });
  });
});
