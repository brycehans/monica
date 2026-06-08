/**
 * #781 MC.1 + MC.2 — MeContact set + remove (resources/js/components/people/MeContact.vue).
 *
 * Locks down the modal that lets the logged-in user designate which contact
 * represents themself, plus the inverse remove flow. Mounted in the
 * /settings page via blade (resources/views/settings/index.blade.php:70).
 *
 *   MC.1 — Set:    click "Select a contact" → modal opens → pick contact →
 *                  Save → POST /me/contact → modal closes → avatar+name
 *                  renders in the widget.
 *   MC.2 — Remove: re-open modal → click "Remove the association" →
 *                  DELETE /me/contact → modal closes → widget reverts to
 *                  "No contact selected yet."
 *
 * Round-trip in one spec because the setup is shared and the post-save
 * widget state is the precondition for the remove leg.
 *
 * `limited=true` for fresh accounts hides the "Select a contact" button
 * (MeContact.vue:12, `v-if="!limited"`) and replaces the picker with an
 * upgrade prompt. Toggle has_access_to_paid_version_for_free on the
 * isolated account so the button renders — same pattern
 * contact-documents-upload.spec.ts uses.
 */

import { test, expect } from '../support/console-gate';
import { loginAsFreshUser } from '../support/auth';
import { createContact } from '../support/contacts';
import { artisan } from '../support/artisan';

test.describe('Monica v4 — MeContact set + remove (#781 MC.1+MC.2)', () => {
  test('set me → widget shows contact; remove → widget reverts', async ({ page, consoleGate }) => {
    const user = await loginAsFreshUser(page);

    // Lift the limited-account gate. Without this, MeContact.vue renders
    // an upgrade prompt instead of the "Select a contact" button.
    artisan(
      'tinker',
      '--execute',
      `$a = App\\Models\\Account\\Account::find(${user.accountId}); ` +
        `$a->has_access_to_paid_version_for_free = true; $a->save();`,
    );

    // existingContacts is sourced from the account's contact list; need at
    // least one to pick from.
    await createContact(page, 'Alice', 'Self', 'Woman');

    await page.goto('/settings');

    // --- MC.1: set ---

    // Two open-triggers exist in the template. The primary button at
    // MeContact.vue:13 renders the localised "Select a contact" link; the
    // placeholder div at :29 renders "Click here to select a contact." —
    // distinct text, so `name: 'Select a contact'` (exact) targets the
    // primary button unambiguously.
    await page.getByRole('link', { name: 'Select a contact', exact: true }).click();

    const dialog = page.getByRole('dialog', { name: 'Select a contact' });
    await expect(dialog).toBeVisible();

    // The picker is a @vueform/multiselect inside ContactSelect, exposed as
    // ARIA combobox + listbox + option. SettingsController.php:57 pre-filters
    // defaultOptions by the user's own name+email — for a fresh test user it
    // resolves to an empty list, so we type into the combobox to trigger
    // ContactSelect's POST /people/search and fetch matching contacts
    // (ContactSelect.vue:95). Same fill-to-filter pattern as
    // contact-introductions.spec.ts:72.
    const picker = page.getByRole('combobox', { name: /Choose yourself/i });
    await expect(picker).toBeVisible();
    await picker.click();
    await picker.fill('Alice');

    const listbox = page.getByRole('listbox');
    await expect(listbox.getByRole('option', { name: 'Alice Self' })).toBeVisible();
    await listbox.getByRole('option', { name: 'Alice Self' }).click();

    // Save fires POST /me/contact. Watch for the response so we can assert
    // on it instead of guessing how long the round-trip takes.
    const setRoundtrip = page.waitForResponse(
      (r) => r.url().endsWith('/me/contact') && r.request().method() === 'POST' && r.ok(),
    );
    await dialog.getByRole('link', { name: 'Save', exact: true }).click();
    await setRoundtrip;
    await expect(dialog).toBeHidden();

    // Widget now renders the avatar+name (MeContact.vue:15-26). The avatar
    // link to /people/<hash> with the contact's complete_name is the
    // observable assertion — anchors on the contact name we just picked.
    await expect(page.getByRole('link', { name: 'Alice Self' })).toBeVisible();

    // --- MC.2: remove ---

    // The primary "Select a contact" button stays visible regardless of
    // whether a me-contact is set (MeContact.vue:12 only gates on
    // `!limited`). Re-open the modal to reach the Remove action.
    await page.getByRole('link', { name: 'Select a contact', exact: true }).click();
    await expect(dialog).toBeVisible();

    const removeRoundtrip = page.waitForResponse(
      (r) => r.url().endsWith('/me/contact') && r.request().method() === 'DELETE' && r.ok(),
    );
    await dialog.getByRole('link', { name: 'Remove the association' }).click();
    await removeRoundtrip;
    await expect(dialog).toBeHidden();

    // Widget reverts to the "no contact" placeholder.
    await expect(page.getByText('No contact selected yet.')).toBeVisible();

    consoleGate.assertNoUnknownErrors('/settings (me-contact set+remove)');
  });
});
