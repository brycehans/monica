/**
 * Gift CRUD restoration (T2.8).
 *
 * Restores end-to-end coverage of the gifts surface that
 * tests/cypress/e2e/contacts/gifts.cy.js has been carrying as a
 * commented-out stub for years ("Gift page has change recently a lot,
 * let rewrite this test later"). PHPUnit covers the Gift model in
 * isolation (tests/Unit/Models/GiftTest.php) but the create→edit→delete
 * flow isn't otherwise driven through a browser.
 *
 * Surface covered:
 *
 *   - "Add a gift" expands the inline CreateGift form (the dev-tracker
 *     issue comment in the original cypress test predates a refactor
 *     to a dedicated /gifts/create page that the issue's plan
 *     anticipated; the current implementation uses an inline panel —
 *     the assertions verify what's actually live).
 *   - Save → gift card appears in the gifts section with its name.
 *   - Edit → inline form re-renders with current name → save with new
 *     name → card reflects the new name and not the old.
 *   - Delete → modal opens → confirm → card is removed.
 *
 * Selectors anchor on the localised gift labels (`Gift name`,
 * `Add a gift`, `Delete a gift` dialog) — no cy-name fallback.
 */

import { test, expect } from '../support/console-gate';
import { loginAsFreshUser } from '../support/auth';
import { createContact } from '../support/contacts';

test.describe('Monica v4 — gift CRUD', () => {
  test('create + edit + delete a gift on the contact detail page', async ({ page, consoleGate }) => {
    // CreateGift._errorHandle's else-branch references undeclared `vm`
    // (filed as #732). It fires twice per gift save when $refs.upload is
    // undefined — i.e., every save that doesn't open the photo-upload
    // panel, which includes this test. Scope the allowlist to this spec
    // so a `vm is not defined` regression anywhere else in the app keeps
    // failing the gate.
    consoleGate.allow(/vm is not defined/, '#732');

    await loginAsFreshUser(page);
    await createContact(page, 'John', 'Doe', 'Man');

    const stamp = Date.now();
    const original = `Smoke gift ${stamp}`;
    const edited = `Smoke gift edited ${stamp}`;

    // --- Create ---
    await page.getByRole('link', { name: 'Add a gift' }).click();

    // The inline CreateGift form has labelled "Gift name" input + Add
    // primary button. Disambiguate "Add" by scoping to the create
    // panel which contains the Gift name input.
    const createPanel = page.locator('div').filter({ has: page.getByLabel('Gift name') }).first();
    await createPanel.getByLabel('Gift name').fill(original);
    await createPanel.getByRole('button', { name: 'Add', exact: true }).click();

    // The new gift card lands in the listing.
    const giftCard = page.locator('div.ba.b--gray-monica').filter({ hasText: String(stamp) }).first();
    await expect(giftCard).toBeVisible();
    await expect(giftCard).toContainText(original);

    // --- Edit ---
    await giftCard.getByRole('link', { name: 'Edit' }).click();

    // The card's contents flip to the CreateGift form. After save the
    // top-of-section create form is hidden (displayCreateGift=false), so
    // page-level getByLabel('Gift name') resolves to exactly the inline
    // edit form's input.
    await page.getByLabel('Gift name').fill(edited);
    await page.getByRole('button', { name: 'Update' }).click();

    // Re-scope by stamp (stable across the name change) and verify
    // the displayed text is now the edited name.
    const editedCard = page.locator('div.ba.b--gray-monica').filter({ hasText: String(stamp) }).first();
    await expect(editedCard).toContainText(edited);
    await expect(editedCard).not.toContainText(original);

    // --- Delete ---
    await editedCard.getByRole('link', { name: 'Delete' }).click();

    const deleteDialog = page.getByRole('dialog', { name: 'Delete a gift' });
    await expect(deleteDialog).toBeVisible();
    await deleteDialog.getByRole('link', { name: 'Delete', exact: true }).click();
    await expect(deleteDialog).toBeHidden();

    await expect(page.locator('div.ba.b--gray-monica').filter({ hasText: String(stamp) })).toHaveCount(0);

    consoleGate.assertNoUnknownErrors('/people/h:<contact> (gifts CRUD)');
  });
});
