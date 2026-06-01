/**
 * Conversation create + submit flow (T2.6).
 *
 * Ports the only test in tests/cypress/e2e/contacts/conversations.cy.js.
 * Smoke covers the datepicker side of this form (L506 + L1593) but the
 * actual save path — pick a contact-field type, fill a message,
 * submit — isn't otherwise exercised end-to-end.
 */

import { test, expect } from '../support/console-gate';
import { loginAsFreshUser } from '../support/auth';
import { createContact } from '../support/contacts';

test.describe('Monica v4 — conversation create + submit', () => {
  test('selecting Phone, filling a message, and submitting persists the conversation', async ({ page, consoleGate }) => {
    await loginAsFreshUser(page);
    await createContact(page, 'John', 'Doe', 'Man');

    // We're on John's detail page. Use the contact link to derive the
    // hash and navigate to the conversation-create route.
    const contactHref = await page.url();
    await page.goto(contactHref.replace(/\/$/, '') + '/conversations/create');
    await expect(page).toHaveURL(/\/conversations\/create$/);

    const marker = `Smoke convo ${Date.now()}`;

    // Pick the "Phone" contact field type. The label "How did you
    // communicate?" identifies the FormSelect.
    await page.getByLabel('How did you communicate?').selectOption({ label: 'Phone' });

    // Fill the first message's content. Message.vue renders a textarea
    // with placeholder "Write down what was said" for each message uid.
    await page.getByPlaceholder('Write down what was said').first().fill(marker);

    // Submit. The conversation form's primary button uses "Add".
    await page.getByRole('button', { name: 'Add' }).click();

    // Land back on John's detail page.
    await expect(page).toHaveURL(/\/people\/h:[A-Za-z0-9]+$/);
    // The conversation-blank-state copy includes "Record conversations
    // you have with John…" — if a conversation exists, the blank state
    // is gone.
    await expect(page.locator('body')).not.toContainText('Record conversations you have with John');

    consoleGate.assertNoUnknownErrors('/people/h:<contact>/conversations/create');
  });
});
