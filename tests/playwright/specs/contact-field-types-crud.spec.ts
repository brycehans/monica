/**
 * #781 CFT.1 + CFT.2 + CFT.3 — ContactFieldTypes CRUD happy path.
 *
 * Locks down the create / edit / delete modals in
 * resources/js/components/settings/ContactFieldTypes.vue at
 * /settings/personalization. Round-trip CRUD in one spec because the
 * post-create row is the precondition for both the edit + delete legs.
 *
 * form-errors-rendering.spec.ts:48-94 already covers the create + edit
 * modals' 422-failure path (alert renders on validation error). This
 * spec covers the success path that the 422 leg doesn't touch:
 *
 *   - Create: POST /settings/personalization/contactfieldtypes → modal
 *     closes → new row appears in the table.
 *   - Edit:   PUT  /settings/personalization/contactfieldtypes/{id} →
 *     modal closes → row reflects new name.
 *   - Delete: DELETE /settings/personalization/contactfieldtypes/{id} →
 *     modal closes → row gone.
 *
 * The seeded built-in types (Email, Phone, Facebook, …) have
 * `delible: false` so we create our own first, then edit + delete it.
 * That keeps the spec self-contained: no reliance on which built-ins
 * the seeder marks deletable, and the row we manipulate is guaranteed
 * to be ours (no risk of touching seeded fixtures).
 */

import { test, expect } from '../support/console-gate';
import { loginAsFreshUser } from '../support/auth';

test.describe('Monica v4 — ContactFieldTypes CRUD (#781 CFT.1+2+3)', () => {
  test('create + edit + delete a contact field type', async ({ page, consoleGate }) => {
    await loginAsFreshUser(page);

    const stamp = Date.now();
    const original = `Spec field type ${stamp}`;
    const edited = `Spec field type edited ${stamp}`;

    await page.goto('/settings/personalization');

    // --- CFT.1: create ---

    await page.getByRole('link', { name: 'Add new field type' }).click();

    const createDialog = page.getByRole('dialog', { name: 'Add a new contact field type' });
    await expect(createDialog).toBeVisible();

    // ContactFieldTypes.vue:77-114 mounts three form-input fields labelled
    // "Name" / "Protocol (optional)" / "Icon (optional)". All three are
    // required (`:required="true"`), so we fill all of them — the server-
    // side validator rejects empty protocol/icon even though the labels
    // say "optional".
    await createDialog.getByLabel('Name').fill(original);
    await createDialog.getByLabel(/Protocol/).fill('spec:');
    await createDialog.getByLabel(/Icon/).fill('fa fa-flask');

    // Watch for the POST round-trip so we don't race against the
    // axios.then handler that closes the modal + refetches the list.
    const createPersist = page.waitForResponse(
      (r) => r.url().endsWith('/settings/personalization/contactfieldtypes')
        && r.request().method() === 'POST'
        && r.ok(),
    );
    await createDialog.getByRole('link', { name: 'Save', exact: true }).click();
    await createPersist;
    await expect(createDialog).toBeHidden();

    // The new row lands in the table. ContactFieldTypes.vue:44 renders
    // each row as a div.dt-row containing the name in pa2. Filter by
    // the unique stamp so we don't grab a seeded row.
    const createdRow = page.locator('.dt-row').filter({ hasText: original });
    await expect(createdRow).toBeVisible();

    // --- CFT.2: edit ---

    // The pencil icon (.fa-pencil-square-o) is the edit trigger. Scope to
    // our row so we don't grab another row's pencil.
    await createdRow.locator('.fa-pencil-square-o').click();

    const editDialog = page.getByRole('dialog', { name: 'Edit an existing contact field type' });
    await expect(editDialog).toBeVisible();

    // editForm pre-fills with the row's name; clear + refill to make the
    // PUT meaningful.
    const editNameInput = editDialog.getByLabel('Name');
    await expect(editNameInput).toHaveValue(original);
    await editNameInput.fill(edited);

    const editPersist = page.waitForResponse(
      (r) => /\/settings\/personalization\/contactfieldtypes\/\d+$/.test(r.url())
        && r.request().method() === 'PUT'
        && r.ok(),
    );
    // Edit submit button reads app.edit = "Edit" (ContactFieldTypes.vue:193).
    await editDialog.getByRole('link', { name: 'Edit', exact: true }).click();
    await editPersist;
    await expect(editDialog).toBeHidden();

    // The row's name updates in place. Re-scope by the new stamp-bearing
    // text since the original name is gone.
    const editedRow = page.locator('.dt-row').filter({ hasText: edited });
    await expect(editedRow).toBeVisible();
    await expect(page.locator('.dt-row').filter({ hasText: original })).toHaveCount(0);

    // --- CFT.3: delete ---

    // The trash icon only renders when `delible: true` (ContactFieldTypes.vue:60).
    // Our just-created row is custom → delible.
    await editedRow.locator('.fa-trash-o').click();

    const deleteDialog = page.getByRole('dialog', { name: 'Delete an existing contact field type' });
    await expect(deleteDialog).toBeVisible();

    const deletePersist = page.waitForResponse(
      (r) => /\/settings\/personalization\/contactfieldtypes\/\d+$/.test(r.url())
        && r.request().method() === 'DELETE'
        && r.ok(),
    );
    await deleteDialog.getByRole('link', { name: 'Delete', exact: true }).click();
    await deletePersist;
    await expect(deleteDialog).toBeHidden();

    // Row is gone from the table.
    await expect(page.locator('.dt-row').filter({ hasText: edited })).toHaveCount(0);

    consoleGate.assertNoUnknownErrors('/settings/personalization (contact-field-types crud)');
  });
});
