// When running Cypress against the Docker dev stack (CYPRESS_USE_DOCKER=true),
// cy.exec runs on the host which has no .env or DB connection. Prefix artisan
// commands with docker exec so they run inside the app container instead.
function artisan(cmd) {
  if (Cypress.env('USE_DOCKER')) {
    const container = Cypress.env('DOCKER_CONTAINER') || 'monica-app-1';
    return 'docker exec ' + container + ' ' + cmd;
  }
  return cmd;
}

Cypress.Commands.add('login', () => {
  cy.exec(artisan('php artisan setup:frontendtestuser')).then((result) => {
    // PHP versions with display_errors=on interleave deprecation
    // warnings with the artisan command's stdout; the user id is
    // always the last line emitted. See brycehans/monica#592.
    const token = result.stdout.trim().split(/\r?\n/).pop().trim();
    cy.visit('/_dusk/login/'+token+'/');
  });
});

Cypress.Commands.add('setPremium', (accountId) => {
  cy.exec(artisan('php artisan account:setpremium ' + accountId));
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
  cy.get('button[type=submit]').click();
});
