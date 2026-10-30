import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    viewportWidth: 1366,
    viewportHeight: 768,
    video: false,
    screenshotOnRunFailure: true,
    setupNodeEvents(_on, _config) {
      // implement node event listeners here
    },
  },
});
