describe('Avatar upload / crop / save', function () {
  beforeEach(function () {
    cy.login();
  });

  it('uploads, crops (default selection), saves, and shows the new avatar', function () {
    cy.createContact('Alice', 'Cropper', 'Woman');
    cy.url().should('include', '/people/h:');
    cy.url().then((contactUrl) => {
      const contactHash = contactUrl.match(/\/people\/(h:[^/]+)/)[1];
      cy.visit('/people/' + contactHash + '/avatar');

      cy.contains('label', 'From a photo that you upload').click();
      cy.get('input[type=file][name=photo]').selectFile('tests/cypress/fixtures/avatar-test.jpg', { force: true });

      cy.get('.sweet-modal.is-visible', { timeout: 10000 }).should('exist');
      cy.get('.sweet-modal.is-visible .cropper-container', { timeout: 10000 }).should('exist');
      cy.contains('.sweet-modal.is-visible .btn-primary', 'Done').click({ force: true });

      cy.get('.sweet-modal.is-visible').should('not.exist');

      cy.get('button[name=save][type=submit]').click();

      cy.url({ timeout: 10000 }).should('include', '/people/' + contactHash);
      cy.url().should('not.include', '/avatar/edit');
      cy.get('img.cover', { timeout: 10000 }).should('have.attr', 'src').and('not.be.empty');
    });
  });

  it('cancel-from-crop returns to a clean upload state', function () {
    cy.createContact('Bob', 'Cancel', 'Man');
    cy.url().then((contactUrl) => {
      const contactHash = contactUrl.match(/\/people\/(h:[^/]+)/)[1];
      cy.visit('/people/' + contactHash + '/avatar');

      cy.contains('label', 'From a photo that you upload').click();
      cy.get('input[type=file][name=photo]').selectFile('tests/cypress/fixtures/avatar-test.jpg', { force: true });

      cy.get('.sweet-modal.is-visible', { timeout: 10000 }).should('exist');
      cy.contains('.sweet-modal.is-visible .btn', 'Cancel').click({ force: true });

      cy.get('.sweet-modal.is-visible').should('not.exist');
      cy.get('input[type=file][name=photo]').should(($input) => {
        expect($input[0].files.length).to.equal(0);
      });
    });
  });
});
