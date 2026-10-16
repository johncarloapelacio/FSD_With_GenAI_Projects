const { defineConfig } = require('cypress');

module.exports = defineConfig({
  projectId: '15kjz1',
  allowCypressEnv: false,
  e2e: {
    baseUrl: 'http://localhost:3000',
    specPattern: 'cypress/e2e/**/*.cy.js',
    supportFile: 'cypress/support/e2e.js',
    fixturesFolder: 'cypress/fixtures',
    defaultCommandTimeout: 8000,
    video: false,
    setupNodeEvents(on) {
      let fixture;
      on('task', {
        resetData() {
          if (process.env.EMS_E2E !== '1') throw new Error('Use npm run test:e2e for isolated test storage.');
          const db = require('./lib/db');
          fixture ||= require('./lib/demo').createDemoRecords();
          const fresh = (records) => records.map((record) => ({ ...record, id: db.nextId() }));
          db.saveEmployees(fresh(fixture.employees));
          db.saveAdmins(fresh(fixture.admins));
          return null;
        },
      });
    },
  },
});
