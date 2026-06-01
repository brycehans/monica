/**
 * Note edit + delete-confirm modal pattern (T1.5).
 *
 * Ports the edit + delete branches of tests/cypress/e2e/contacts/notes.cy.js
 * to playwright. The create branch is covered by
 * dependency-upgrade-smoke.spec.ts's `add-note flow` test; this spec adds
 * the inline-edit + modal-delete coverage.
 *
 * Selected as the host for the modal-CRUD pattern because the same
 * <monica-modal> + Cancel/Delete footer shape recurs across
 * activities/debts/journal/contact-deletion. One well-anchored test on
 * notes covers the binding pattern that the cypress suite exercised 5+
 * times.
 */

import { test, expect } from '../support/console-gate';
import { loginAsFreshUser } from '../support/auth';
import { createContact } from '../support/contacts';

test.describe('Monica v4 — note inline edit + modal delete', () => {
  test('inline edit updates the rendered body; delete-confirm modal removes the row', async ({ page, consoleGate }) => {
    await loginAsFreshUser(page);
    await createContact(page, 'John', 'Doe', 'Man');

    // We're on John's detail page. Add a note via the inline form.
    const stamp = Date.now();
    const original = `Smoke note ${stamp}`;
    const edited = `Smoke note edited ${stamp}`;

    const noteTextarea = page.getByPlaceholder('Add note');
    await noteTextarea.click();
    await noteTextarea.fill(original);
    // The Add button only appears after focus expands the inline form. The
    // contact detail page also renders many other "Add" links (relationships,
    // tasks, gifts, debts) so we scope to the note-add `<form>` containing
    // the textarea.
    const noteAddForm = page.locator('form').filter({ has: noteTextarea });
    await noteAddForm.getByRole('link', { name: 'Add', exact: true }).click();

    // Anchor the row on the timestamp — the stamp is unique to this run
    // and appears in both the original and the edited body, so the
    // locator stays stable across the edit flip (which would otherwise
    // break a hasText:original filter once we type the edited text into
    // the edit-mode textarea).
    const noteRow = page.locator('li.note').filter({ hasText: String(stamp) });
    await expect(noteRow).toBeVisible();
    await expect(noteRow).toContainText(original);

    // --- Edit branch ---
    await noteRow.getByRole('link', { name: 'Edit' }).click();
    const editTextarea = noteRow.getByRole('textbox');
    await expect(editTextarea).toBeVisible();
    await editTextarea.fill(edited);
    await noteRow.getByRole('link', { name: 'Update' }).click();

    // The textarea closes (display flips back to compiledMarkdown).
    await expect(editTextarea).toBeHidden();
    await expect(noteRow).toContainText(edited);

    // --- Delete-confirm modal branch ---
    await noteRow.getByRole('link', { name: 'Delete' }).click();

    // The delete modal opens with a stable accessible-name (set via the
    // aria-label patch from T1.2 — without it, the outer vfm wrapper
    // would also match role=dialog and strict-mode-fail).
    const deleteDialog = page.getByRole('dialog', { name: 'Delete a note' });
    await expect(deleteDialog).toBeVisible();
    await expect(deleteDialog).toContainText('Are you sure you want to delete this note');

    // Confirm. The dialog also has a Cancel link, so we need exact=true
    // to disambiguate the Delete confirm action from the row's Delete
    // trigger that we already clicked.
    await deleteDialog.getByRole('link', { name: 'Delete', exact: true }).click();
    await expect(deleteDialog).toBeHidden();

    // The note row is gone from the list.
    await expect(page.locator('li.note').filter({ hasText: String(stamp) })).toHaveCount(0);

    consoleGate.assertNoUnknownErrors('/people/h:<contact> (note edit + delete)');
  });
});
