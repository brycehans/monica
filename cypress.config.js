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
  allowCypressEnv: false,
  expose: {
    USE_DOCKER: process.env.CYPRESS_USE_DOCKER,
    DOCKER_CONTAINER: process.env.CYPRESS_DOCKER_CONTAINER,
    DOCKER_USER: process.env.CYPRESS_DOCKER_USER,
  },
  e2e: {
    baseUrl: 'http://localhost:8000',
    supportFile: 'tests/cypress/support/e2e.js',
    specPattern: 'tests/cypress/e2e/**/*.cy.js',
  },
  component: {
    devServer: {
      framework: 'vue',
      bundler: 'webpack',
      webpackConfig: require('./tests/cypress/support/component.webpack.config.js'),
    },
    supportFile: 'tests/cypress/support/component.js',
    specPattern: 'tests/cypress/component/**/*.cy.js',
    indexHtmlFile: 'tests/cypress/support/component-index.html',
  },
});
