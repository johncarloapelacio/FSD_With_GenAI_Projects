const { defineConfig } = require('cypress');

module.exports = defineConfig({
  projectId: '15kjz1',
  e2e: {
    baseUrl: 'http://localhost:3000',
    specPattern: 'cypress/e2e/**/*.cy.js',
    supportFile: 'cypress/support/e2e.js',
    fixturesFolder: 'cypress/fixtures',
    defaultCommandTimeout: 8000,
    video: false,
  },
});
