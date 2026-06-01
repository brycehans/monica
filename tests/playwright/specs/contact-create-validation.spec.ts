/**
 * Contact-create form validation: empty firstname (T2.3).
 *
 * Ports the 3rd test in tests/cypress/e2e/contacts/contacts.cy.js.
 *
 * Note: the issue's plan described this as a vuelidate inline error, but
 * the `<form-input>` on /people/add isn't wired to a vuelidate validator
 * (no `:validator` prop) — the `required` prop ends up as HTML5
 * `required` on the underlying input. So the guard here is:
 * `firstname=required` blocks form submission and the browser reports
 * the input as invalid. URL stays at /people/add.
 */

import { test, expect } from '../support/console-gate';
import { loginAsFreshUser } from '../support/auth';

test.describe('Monica v4 — contact-create firstname validation', () => {
  test('submitting /people/add with an empty firstname blocks navigation and flags the input invalid', async ({ page, consoleGate }) => {
    await loginAsFreshUser(page);
    await page.goto('/people/add');

    // Click Add with no firstname filled — exact match to avoid the
    // sibling "Submit and add someone else" save button.
    await page.getByRole('button', { name: 'Add', exact: true }).click();

    // URL must not have advanced past /people/add. HTML5 required validation
    // blocks the form's POST so the browser never navigates.
    await expect(page).toHaveURL(/\/people\/add$/);

    // The firstname input reports invalid via DOM validity API; we drop
    // into page.evaluate because Playwright doesn't surface
    // `input.validity.valid` through its locator assertions.
    const firstNameValid = await page.getByLabel(/First name/i).evaluate(
      (el) => (el as HTMLInputElement).validity.valid,
    );
    expect(firstNameValid).toBe(false);

    consoleGate.assertNoUnknownErrors('/people/add (empty firstname)');
  });
});
