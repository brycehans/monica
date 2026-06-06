/**
 * OAuth clients CRUD (D.2 of #731 Tier D).
 *
 * Extends dependency-upgrade-smoke.spec.ts:266-308 (create + plain-secret
 * one-shot, with revoke as cleanup) into the full create → edit-persist →
 * revoke contract:
 *
 *   /settings/api → empty-state paragraph rendered → "Create New Client" →
 *   fill name + redirect → submit → secret modal opens with plain secret →
 *   close secret modal → row appears in the clients table → pencil →
 *   edit modal opens with form prefilled from the row → mutate redirect →
 *   save → modal closes → re-open edit → assert new redirect URL is
 *   prefilled (proves server round-trip, not just local list mutation) →
 *   close edit modal → trash → row disappears and the empty-state
 *   paragraph returns.
 *
 * Isolation: fresh user. The seeded admin account accumulates clients
 * across smoke runs (smoke L266 deletes its own row at the end, but
 * earlier iterations / dev usage may have left rows), so the
 * empty-state-at-start and empty-state-after-revoke assertions only
 * hold against a freshly minted user.
 *
 * On the close-button safety: Clients.vue splits closeModal() (create /
 * edit modal — form ref is mounted when called) from closeSecretModal()
 * (secret modal — no form ref touched), so neither path hits the
 * stale-ref defect that PersonalAccessTokens.vue had (#771, fixed in
 * b69aee351 trailing PR). Both Close buttons work.
 */

import { test, expect } from '../support/console-gate';
import { loginAsFreshUser } from '../support/auth';

test.describe('Monica v4 — OAuth clients CRUD', () => {
  test('create surfaces secret once, edit persists, revoke removes the row', async ({ page, consoleGate }) => {
    await loginAsFreshUser(page);
    await page.goto('/settings/api');

    // Empty-state paragraph (v-if="clients.length === 0" in
    // Clients.vue:30). Anchors the "before" state.
    await expect(
      page.getByText('You have not created any OAuth clients.'),
    ).toBeVisible();

    const clientName = `client-${Date.now()}`;
    const initialRedirect = 'https://example.com/oauth/cb';
    const editedRedirect = 'https://example.com/oauth/cb-edited';

    // -- Create: open modal, fill name + redirect, submit.
    await page.getByRole('link', { name: 'Create New Client' }).click();
    const createModal = page.locator('.monica-modal__panel').filter({ hasText: 'Create Client' });
    await expect(createModal).toBeVisible();

    // form-input wires the HTML `name` attribute from its `:id` prop, so
    // the inputs are name="client-name" / name="redirect-url". Targeting
    // by label keeps the spec independent of that detail.
    await createModal.getByLabel('Name', { exact: true }).fill(clientName);
    await createModal.getByLabel('Redirect URL', { exact: true }).fill(initialRedirect);
    await createModal.getByRole('link', { name: 'Create', exact: true }).click();
    await expect(createModal).toBeHidden();

    // -- One-time-show: secret modal opens with the plain client secret.
    // Filter on the help text (api_oauth_secret_help) — "Client Secret"
    // alone matches both the secret-modal title and the populated-list
    // column header.
    const secretModal = page
      .locator('.monica-modal__panel')
      .filter({ hasText: 'Here is the client secret for the OAuth client you just created' });
    await expect(secretModal).toBeVisible();

    const clientSecret = (await secretModal.locator('[cy-name="client-secret-display"] code').textContent())?.trim() ?? '';
    // Passport generates Str::random(40) for the secret — alphanumeric only.
    expect(clientSecret).toMatch(/^[A-Za-z0-9]{40,}$/);

    // Dismiss the secret modal. Footer-scoped to disambiguate from the
    // modal-chrome `×` (also has accessible name "Close" via aria-label).
    await secretModal.locator('.monica-modal__footer').getByRole('link', { name: 'Close', exact: true }).click();
    await expect(secretModal).toBeHidden();

    // -- List: the new client row renders with its name + edit/trash actions.
    const row = page.locator('.dt-row', { hasText: clientName });
    await expect(row).toBeVisible();

    // -- Edit: pencil opens the same modal in edit mode (title flips from
    // "Create Client" to "Edit Client" via the form.id ternary in
    // Clients.vue:96), form prefilled from the row.
    await row.locator('em.fa-pencil-square-o').click();
    const editModal = page.locator('.monica-modal__panel').filter({ hasText: 'Edit Client' });
    await expect(editModal).toBeVisible();

    // edit(client) does `Object.assign(this.form, client)` so name +
    // redirect prefill from the in-memory list value (which itself came
    // from the create response).
    await expect(editModal.getByLabel('Name', { exact: true })).toHaveValue(clientName);
    await expect(editModal.getByLabel('Redirect URL', { exact: true })).toHaveValue(initialRedirect);

    // Mutate the redirect URL and save. persistClient() PUTs the update,
    // calls getClients() to refetch, then closeModal() to dismiss.
    await editModal.getByLabel('Redirect URL', { exact: true }).fill(editedRedirect);
    await editModal.getByRole('link', { name: 'Save', exact: true }).click();
    await expect(editModal).toBeHidden();

    // -- Persistence check: re-open the edit modal and verify the new
    // redirect URL is prefilled. This proves the value round-tripped to
    // the server (the list was refetched via getClients()), not just
    // that it landed in local Vue state.
    await page.locator('.dt-row', { hasText: clientName }).locator('em.fa-pencil-square-o').click();
    const editModalReopened = page.locator('.monica-modal__panel').filter({ hasText: 'Edit Client' });
    await expect(editModalReopened).toBeVisible();
    await expect(editModalReopened.getByLabel('Redirect URL', { exact: true })).toHaveValue(editedRedirect);
    await editModalReopened.locator('.monica-modal__footer').getByRole('link', { name: 'Close', exact: true }).click();
    await expect(editModalReopened).toBeHidden();

    // -- Revoke: trash icon calls destroy() which DELETEs the client and
    // refreshes the list via getClients(). The populated table v-else
    // collapses and the v-if empty-state paragraph returns.
    await page.locator('.dt-row', { hasText: clientName }).locator('em.fa-trash-o').click();
    await expect(page.locator('.dt-row', { hasText: clientName })).toHaveCount(0);
    await expect(
      page.getByText('You have not created any OAuth clients.'),
    ).toBeVisible();

    consoleGate.assertNoUnknownErrors('/settings/api (OAuth client create + edit + revoke)');
  });
});
