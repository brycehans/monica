/**
 * Personalization → genders edit + delete (D.3 sub-PR of #731).
 *
 * Fourth and last of the D.3 carve. The smoke spec at
 * dependency-upgrade-smoke.spec.ts:352 covers the **create** modal flow
 * (open → fill name → save → row appears + dynamicModals registry guard).
 * The remaining gaps from the issue text are **edit** + **delete**.
 *
 *   /settings/personalization → genders section → pencil on the "Man" row
 *   → EditModal prefilled with name="Man" → mutate name → Update → modal
 *   closes → row reflects new name → re-open edit → server round-trip
 *   confirmed via prefilled value → cancel → trash on the edited row →
 *   DeleteModal opens → Delete → row removed.
 *
 * Why this works without `setPremium`: Genders.vue is NOT gated by the
 * `limited` prop (no v-if="limited" guards inside the CRUD chrome — only
 * LifeEventTypes.vue and Modules.vue gate that way). A fresh user with
 * the default-three genders (Man / Woman / Rather not say, per
 * populateDefaultGendersTable) can edit/delete the non-default ones
 * directly.
 *
 * Delete-path choice: "Man" is non-default (the default is "Rather not
 * say" per the seed), and a fresh user has zero contacts → form.isDefault
 * is false and form.numberOfContacts is 0, so DeleteModal renders the
 * simple `trash()` button (DELETE on .../genders/{id}) rather than the
 * `trashAndReplace()` branch. The simpler path exercises the more common
 * regression mode and avoids needing the form-select that the
 * replace-on-delete branch requires.
 *
 * `genders.length > 1` keeps the trash icon visible after the delete
 * (we go from 3 → 2 seeded rows), so a subsequent test could in theory
 * delete again. We don't; the spec stops at one deletion.
 *
 * Isolation: fresh user. The seeded admin would work but mutates
 * across the smoke + #765 (gender modal flake) coverage.
 */

import { test, expect } from '../support/console-gate';
import { loginAsFreshUser } from '../support/auth';

test.describe('Monica v4 — genders edit + delete', () => {
  test('edit prefills, updates persist, and delete removes the row', async ({ page, consoleGate }) => {
    await loginAsFreshUser(page);
    await page.goto('/settings/personalization');

    // The "Man" row is seeded by populateDefaultGendersTable (translation
    // app.gender_male = 'Man'). It's non-default — the default seeded
    // gender is "Rather not say" (app.gender_none). Targeting Man rather
    // than the default keeps us on the simple `trash()` delete path.
    const manRow = page.locator('.dt-row', { hasText: 'Man' }).first();
    await expect(manRow).toBeVisible();

    // -- Edit. Pencil opens EditModal with the gender prefilled
    // (CreateModal/EditModal initialize `form` from props in data()).
    await manRow.locator('em.fa-pencil-square-o').click();

    // Modal title is "Update gender type" (personalization_genders_modal_edit).
    // Scope by .monica-modal__panel + h3 title to dodge any future modal
    // text-collision on the page.
    const editModal = page
      .locator('.monica-modal__panel')
      .filter({ has: page.locator('h3.monica-modal__title', { hasText: 'Update gender type' }) });
    await expect(editModal).toBeVisible();

    // The "Name" form-input — first text input in the modal. The
    // form-input generates dynamic IDs (`+_uid`) so target by position
    // (mirrors the smoke L390 anchor strategy).
    const nameInput = editModal.locator('input[type="text"]').first();
    await expect(nameInput).toHaveValue('Man');

    const editedName = `Man ${Date.now()}`;
    await nameInput.fill(editedName);
    await expect(nameInput).toHaveValue(editedName);

    // PUT /settings/personalization/genders/{id}. Wait for the response
    // before asserting against the refreshed list — onSaved triggers
    // getGenders() in the parent and the row text update races the
    // close animation otherwise.
    const updatePut = page.waitForResponse(
      (r) =>
        r.url().includes('/settings/personalization/genders/')
        && r.request().method() === 'PUT',
    );
    await editModal.getByRole('link', { name: 'Update', exact: true }).click();
    const updateResponse = await updatePut;
    expect(updateResponse.status()).toBeLessThan(400);

    await expect(editModal).toBeHidden();

    // List shows the new name. The "Man" → "Man <ts>" rename means the
    // edited row is the only one matching the timestamp suffix.
    const editedRow = page.locator('.dt-row', { hasText: editedName });
    await expect(editedRow).toBeVisible();

    // -- Persistence check. Re-open edit on the renamed row and verify
    // the prefilled value matches. EditModal's `form.name` re-reads from
    // the parent's `gender` prop on each mount, so this proves the
    // server round-trip (via getGenders() refetch), not just local
    // component state.
    await editedRow.locator('em.fa-pencil-square-o').click();
    const editModalReopened = page
      .locator('.monica-modal__panel')
      .filter({ has: page.locator('h3.monica-modal__title', { hasText: 'Update gender type' }) });
    await expect(editModalReopened).toBeVisible();
    await expect(editModalReopened.locator('input[type="text"]').first()).toHaveValue(editedName);
    await editModalReopened.getByRole('link', { name: 'Cancel', exact: true }).click();
    await expect(editModalReopened).toBeHidden();

    // -- Delete. Trash opens DeleteModal. Since the row's gender has
    // numberOfContacts=0 (fresh user, no contacts) and isDefault=false,
    // the simple `trash()` button renders rather than `trashAndReplace()`.
    await editedRow.locator('em.fa-trash-o').click();
    const deleteModal = page
      .locator('.monica-modal__panel')
      .filter({ has: page.locator('h3.monica-modal__title', { hasText: 'Delete gender type' }) });
    await expect(deleteModal).toBeVisible();

    const deleteRequest = page.waitForResponse(
      (r) =>
        r.url().includes('/settings/personalization/genders/')
        && r.request().method() === 'DELETE',
    );
    await deleteModal.getByRole('link', { name: 'Delete', exact: true }).click();
    const deleteResponse = await deleteRequest;
    expect(deleteResponse.status()).toBeLessThan(400);

    await expect(deleteModal).toBeHidden();
    // Row gone. The DELETE handler emits saved → parent calls
    // getGenders() → the index refetch drops the row from the bound
    // array.
    await expect(page.locator('.dt-row', { hasText: editedName })).toHaveCount(0);

    consoleGate.assertNoUnknownErrors('/settings/personalization (genders edit + delete)');
  });
});
