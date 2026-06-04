/**
 * Contact relationship create (C.6 of #731 Tier C).
 *
 * Extends dependency-upgrade-smoke.spec.ts:954-1025 (relationship/create
 * mount-only) with the positive create-and-associate contract. The smoke
 * tests assert form-checkbox toggling + SpecialDate slot rendering on the
 * form, but stop short of submitting. This spec drives the full flow:
 *
 *   /relationships/create → select "existing contact" radio → open the
 *   contact picker (@vueform/multiselect via <contact-select>) → click
 *   the other contact → pick a relationship type from the <form-select>
 *   → submit → server redirects to /people/h:<contact> with the success
 *   flash → relationships section now renders a <a> link to the
 *   associated contact.
 *
 * Two contacts in setup so the picker has something to find. The picker
 * pattern follows contact-introductions.spec.ts (ARIA combobox/listbox/
 * option roles, scoped by the localised title).
 */

import { test, expect } from '../support/console-gate';
import { loginAsFreshUser } from '../support/auth';
import { createContact } from '../support/contacts';

test.describe('Monica v4 — contact relationship create', () => {
  test('open create form → pick existing contact → submit → relationship renders on detail', async ({ page, consoleGate }) => {
    await loginAsFreshUser(page);

    // Two contacts. Alice is the active subject; Bob is the partner we'll
    // associate her with. createContact lands on each new contact's detail
    // page, so the second call leaves us on Bob — we navigate back to
    // Alice via her captured URL.
    await createContact(page, 'Alice', 'Subject', 'Woman');
    const aliceUrl = page.url();
    await createContact(page, 'Bob', 'Partner', 'Man');

    await page.goto(`${aliceUrl}/relationships/create`);

    // Flip to the "existing contact" radio. The "Add a new person" radio
    // is checked by default; clicking "An existing contact" flips
    // global_relationship_form_new_contact = false, which v-if-toggles
    // the ContactSelect into view.
    await page.locator('label', { hasText: 'An existing contact' }).click();

    // ContactSelect mounts a @vueform/multiselect rendered as ARIA
    // combobox + listbox + option tree. Anchor on its localised title
    // (relationship_form_associate_dropdown) so we don't grab the
    // adjacent form-select for relationship type.
    const picker = page.getByRole('combobox', {
      name: /Search and select an existing contact from the dropdown below/i,
    });
    await expect(picker).toBeVisible();
    await picker.click();

    const listbox = page.getByRole('listbox');
    await expect(listbox).toBeVisible();
    await listbox.getByRole('option', { name: 'Bob Partner' }).click();

    // Pick a relationship type. form-select renders a native <select>
    // labelled by people.relationship_form_is_with = "This person is…".
    // The relationship type options are seeded per account at creation
    // time (love / family / professional / etc.); first non-empty option
    // is good enough for the existence assertion.
    const typeSelect = page.getByLabel(/This person is/i);
    await typeSelect.selectOption({ index: 1 });

    // Submit. The store action POSTs to /people/h:<alice>/relationships,
    // creates the relationship, and redirects back to Alice's detail.
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(page).toHaveURL(aliceUrl);

    // The detail's relationships sidebar renders an <a href="/people/h:bob">
    // for each related contact. Asserting the link by Bob's full name
    // is enough — fresh account, no other contacts that could collide.
    await expect(page.getByRole('link', { name: 'Bob Partner' })).toBeVisible();

    consoleGate.assertNoUnknownErrors('/people/h:<alice> (relationship create)');
  });
});
