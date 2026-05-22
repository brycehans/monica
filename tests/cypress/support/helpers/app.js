// When running Cypress against the Docker dev stack (CYPRESS_USE_DOCKER=true),
// cy.exec runs on the host which has no .env or DB connection. Prefix artisan
// commands with docker exec so they run inside the app container instead.
//
// docker exec defaults to root; running artisan as root chowns
// storage/logs/laravel.log to root, after which any web request that logs
// (i.e. most of them) 500s under the apache www-data user. Inject
// --user www-data by default so the helper matches apache's uid. Override
// via CYPRESS_DOCKER_USER (set to empty string to run as root).
function artisan(cmd) {
  if (Cypress.env('USE_DOCKER')) {
    const container = Cypress.env('DOCKER_CONTAINER') || 'monica-app-1';
    const userEnv = Cypress.env('DOCKER_USER');
    const user = userEnv === undefined ? 'www-data' : userEnv;
    const userFlag = user ? '--user ' + user + ' ' : '';
    return 'docker exec ' + userFlag + container + ' ' + cmd;
  }
  return cmd;
}

Cypress.Commands.add('login', () => {
  cy.exec(artisan('php artisan setup:frontendtestuser')).then((result) => {
    // PHP versions with display_errors=on interleave deprecation
    // warnings with the artisan command's stdout; the user id is
    // always the last line emitted. See brycehans/monica#592.
    const token = result.stdout.trim().split(/\r?\n/).pop().trim();
    // Use cy.request() rather than cy.visit(): the dusk login route returns
    // 204 No Content (sets session cookie only). cy.visit() requires an HTML
    // response and fails with content-type undefined on a 204.
    cy.request('/_dusk/login/'+token);
  });
});

Cypress.Commands.add('setPremium', (accountId) => {
  cy.exec(artisan('php artisan account:setpremium ' + accountId));
});

Cypress.Commands.add('setRequiresSubscription', (requiresSubscription) => {
  const value = requiresSubscription ? 'true' : 'false';

  cy.exec(artisan('sh -lc "REQUIRES_SUBSCRIPTION=' + value + ' php artisan config:cache"'));
});

Cypress.Commands.add('clearCachedConfig', () => {
  cy.exec(artisan('php artisan config:clear'));
});

Cypress.Commands.add('register', (firstName, lastName, password, email, policy) => {
  cy.visit('/register');

  cy.get('.alert').should('not.exist');
  cy.get('input[name=email]').type(email);
  cy.get('input[name=first_name]').type(firstName);
  cy.get('input[name=last_name]').type(lastName);
  cy.get('input[name=password]').type(password);
  cy.get('input[name=password_confirmation]').type(password);
  if (policy) {
    cy.get('input[name=policy]').click();
  }
  cy.get('button.btn-primary[type=submit]').click();
});
