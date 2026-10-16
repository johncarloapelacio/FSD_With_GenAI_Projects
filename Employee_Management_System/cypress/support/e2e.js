// Loaded automatically before every spec file.
import './commands';
beforeEach(() => cy.task('resetData'));
