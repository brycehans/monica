const { defineConfig } = require('cypress');

module.exports = defineConfig({
  videosFolder: 'tests/cypress/videos',
  screenshotsFolder: 'tests/cypress/screenshots',
  fixturesFolder: 'tests/cypress/fixtures',
  video: false,
  reporter: 'junit',
  reporterOptions: {
    mochaFile: 'results/junit/cypress/results-[hash].xml',
    toConsole: true,
  },
  projectId: 'q8h6k9',
  e2e: {
    baseUrl: 'http://localhost:8000',
    supportFile: 'tests/cypress/support/e2e.js',
    specPattern: 'tests/cypress/e2e/**/*.cy.js',
  },
});
