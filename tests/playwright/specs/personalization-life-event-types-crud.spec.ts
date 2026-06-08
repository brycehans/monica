/**
 * Personalization → life event types CRUD (D.3 sub-PR of #731).
 *
 * Second of the D.3 carve. The life-event-types surface on
 * /settings/personalization is true CRUD: each seeded category (Work,
 * Family, Home, Travel, Health, plus default types under each) has an
 * "Add a new life event type" link that opens a create modal, and each
 * type row has pencil + trash icons that open edit + delete modals.
 *
 * Smoke (dependency-upgrade-smoke.spec.ts:780) already covers the "Life
 * event categories" h3 mount. This adds the create / edit / delete /
 * persistence-via-API-refetch chain:
 *
 *   /settings/personalization → life-event-types section → click
 *   "Add a new life event type" under a category → create modal →
 *   fill name → save → modal closes → new type appears under that
 *   category → click pencil → edit modal prefilled → mutate name →
 *   update → re-open edit → server round-trip confirmed via the
 *   prefilled value → close → click trash → confirm delete → row
 *   gone from the list.
 *
 * Gating: the entire CRUD UI is hidden when LifeEventTypes.vue's
 * `limited` prop is true. PersonalizationController passes
 * AccountHelper::hasLimitations as `accountHasLimitations`, which is
 * true under REQUIRES_SUBSCRIPTION=true (the dev compose default)
 * unless `has_access_to_paid_version_for_free` is set on the account.
 * setPremium(true, accountId) flips that flag for the per-test
 * account, and the finally-block revoke keeps the state symmetric.
 *
 * Isolation: fresh user. The seeded admin account would also work
 * (with appropriate premium setup), but mutating life event types on
 * the shared admin risks cross-test ordering with the smoke spec at
 * L780 (which counts on the default categories rendering).
 */

import { test, expect } from '../support/console-gate';
import { loginAsFreshUser } from '../support/auth';
import { setPremium } from '../support/premium';

test.describe('Monica v4 — life event types CRUD', () => {
  test('create + edit + delete a life event type under a category', async ({ page, consoleGate }) => {
    const { accountId } = await loginAsFreshUser(page);
    setPremium(true, accountId);

    try {
      await page.goto('/settings/personalization');

      // Scope to the life-event-types section. The h3 is "Life event
      // categories" (settings.personalization_life_event_category_title);
      // we use a wrapping locator scoped by it so modal find()s below
      // are unambiguous from the modal-soup the personalization page
      // accumulates.
      const lifeEventsSection = page
        .locator('div')
        .filter({ has: page.getByRole('heading', { name: 'Life event categories', exact: true }) })
        .first();
      await expect(lifeEventsSection).toBeVisible();

      // Pick the first category — its "Add a new life event type" link
      // is the simplest target. The default categories under a fresh
      // account are populated by PopulateLifeEventsTable so at least
      // one is guaranteed to exist.
      const addLink = lifeEventsSection
        .getByRole('link', { name: 'Add a new life event type' })
        .first();
      await expect(addLink).toBeVisible();

      const typeName = `life-event-${Date.now()}`;
      const editedName = `${typeName}-edited`;

      // -- Create. Note: both the "Add a new life event type" *link* and the
      // create *modal title* use the same i18n key shape, so filtering by
      // hasText alone would match the link wrapper too. Scope to
      // .monica-modal__panel first — links sit outside the panel — and then
      // anchor on the panel's <h3 class="monica-modal__title"> text.
      await addLink.click();
      const createModal = page
        .locator('.monica-modal__panel')
        .filter({ has: page.locator('h3.monica-modal__title', { hasText: 'Add a new life event type' }) });
      await expect(createModal).toBeVisible();
      await createModal.getByLabel('What should we name this new life event type?').fill(typeName);
      await createModal.getByRole('link', { name: 'Save', exact: true }).click();
      await expect(createModal).toBeHidden();

      // The newly created type appears in the list. getLifeEventCategories()
      // refetches after the POST, so seeing it here means the server
      // accepted and persisted the row (not just local component state).
      const newRow = page.locator('.dt-row', { hasText: typeName });
      await expect(newRow).toBeVisible();

      // -- Edit. Pencil opens the update modal prefilled with the
      // current name (showEditType assigns into updateTypeForm).
      await newRow.locator('em.fa-pencil-square-o').click();
      const editModal = page
        .locator('.monica-modal__panel')
        .filter({ has: page.locator('h3.monica-modal__title', { hasText: 'Edit a life event type' }) });
      await expect(editModal).toBeVisible();
      const editNameInput = editModal.getByLabel('What should we name this new life event type?');
      await expect(editNameInput).toHaveValue(typeName);

      await editNameInput.fill(editedName);
      await editModal.getByRole('link', { name: 'Update', exact: true }).click();
      await expect(editModal).toBeHidden();

      // -- Persistence check. Re-open edit on the renamed row and
      // verify the prefilled value matches what we saved — proves the
      // PUT round-tripped through the index GET refetch, not just
      // local state.
      const editedRow = page.locator('.dt-row', { hasText: editedName });
      await expect(editedRow).toBeVisible();
      await editedRow.locator('em.fa-pencil-square-o').click();
      const editModalReopened = page
        .locator('.monica-modal__panel')
        .filter({ has: page.locator('h3.monica-modal__title', { hasText: 'Edit a life event type' }) });
      await expect(editModalReopened).toBeVisible();
      await expect(
        editModalReopened.getByLabel('What should we name this new life event type?'),
      ).toHaveValue(editedName);
      await editModalReopened.getByRole('link', { name: 'Cancel', exact: true }).click();
      await expect(editModalReopened).toBeHidden();

      // -- Delete. Trash opens the delete modal.
      await editedRow.locator('em.fa-trash-o').click();
      const deleteModal = page
        .locator('.monica-modal__panel')
        .filter({ has: page.locator('h3.monica-modal__title', { hasText: 'Delete a life event type' }) });
      await expect(deleteModal).toBeVisible();
      await deleteModal.getByRole('link', { name: 'Delete', exact: true }).click();
      await expect(deleteModal).toBeHidden();

      // Row should be gone from the list. The destroyType() handler
      // refetches via getLifeEventCategories() so a stale row would
      // indicate either the DELETE failed or the refetch didn't fire.
      await expect(page.locator('.dt-row', { hasText: editedName })).toHaveCount(0);
    } finally {
      setPremium(false, accountId);
    }

    consoleGate.assertNoUnknownErrors('/settings/personalization (life event types CRUD)');
  });
});
