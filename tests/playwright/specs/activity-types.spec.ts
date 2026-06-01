/**
 * Activity-types settings → activity-form cross-flow (T1.2).
 *
 * Ported from the 3rd test in tests/cypress/e2e/settings/activity_types.cy.js.
 * Guards two things that aren't testable from phpunit:
 *
 *   1. The settings/personalization modal cluster wires through end-to-end —
 *      create category, create type, both surface in the listing on submit.
 *   2. A type added in settings flows through to the contact-detail
 *      "log an activity" form's category/type picker. This is the
 *      cross-component cache-invalidation that breaks when ActivityTypeList
 *      forgets to re-fetch /activityCategories after a settings edit, or
 *      when CreateActivity short-circuits the category panel mount.
 *
 * Premium-gated: the "Add" buttons are hidden behind `!limited` so we run
 * the body inside withPremiumAccount on the fresh user's account.
 */

import { test, expect } from '../support/console-gate';
import { loginAsFreshUser } from '../support/auth';
import { withPremiumAccount } from '../support/premium';
import { createContact } from '../support/contacts';

test.describe('Monica v4 — activity-types cross-flow', () => {
  test('category + type created in settings appear in /people/h:<contact> activity-add picker', async ({ page, consoleGate }) => {
    const { accountId } = await loginAsFreshUser(page);

    await withPremiumAccount(async () => {
      const stamp = Date.now();
      const categoryName = `Smoke Category ${stamp}`;
      const typeName = `Smoke Type ${stamp}`;

      // --- Settings: create category ---
      await page.goto('/settings/personalization');
      await expect(page).toHaveURL(/\/settings\/personalization$/);

      // The "Add a new activity type category" trigger is an <a> with an
      // empty href, but the dev image renders it as role=link.
      await page.getByRole('link', { name: 'Add a new activity type category' }).click();

      // Anchor on the dialog's title-derived accessible name. The outer
      // vue-final-modal wrapper also has role=dialog but no name, so the
      // { name } filter pins us to MonicaModal's inner panel.
      const categoryDialog = page.getByRole('dialog', { name: 'Add a new activity type category' });
      await expect(categoryDialog).toBeVisible();
      await categoryDialog.getByLabel('What should we name this new category?').fill(categoryName);
      await categoryDialog.getByRole('link', { name: 'Save' }).click();
      await expect(categoryDialog).toBeHidden();

      // Assert the category lands in the listing. ActivityTypes.vue
      // renders each category name inside a <strong> in a <li> row. We
      // anchor on the listitem so we don't match the Clockwork debug
      // widget that echoes the POST body further down the page.
      const categoryRow = page.getByRole('listitem').filter({ has: page.locator('strong', { hasText: categoryName }) });
      await expect(categoryRow).toBeVisible();

      // --- Settings: create type within that category ---
      // ActivityTypes.vue renders an "Add a new activity type" link per
      // category. Scope to the categoryRow we just verified above.
      await categoryRow.getByRole('link', { name: 'Add a new activity type' }).click();

      const typeDialog = page.getByRole('dialog', { name: 'Add a new activity type' });
      await expect(typeDialog).toBeVisible();
      await typeDialog.getByLabel('What should we name this new activity type?').fill(typeName);
      await typeDialog.getByRole('link', { name: 'Save' }).click();
      await expect(typeDialog).toBeHidden();

      await expect(categoryRow.getByText(typeName)).toBeVisible();

      // --- Cross-flow: type appears in contact's activity-add picker ---
      await createContact(page, 'John', 'Doe', 'Man');
      // The contact-store redirects to /people/h:<hash>. ActivityList shows a
      // blank state on a fresh contact whose CTA ("Add an activity") is an
      // <a href=""> — addressable as role=link. The header's "Add activity"
      // trigger above it is also an <a> but with no href, so ARIA treats it
      // as generic and getByRole('link') doesn't match. Both toggles drive
      // the same `displayLogActivity = true`; we use the blank-state CTA.
      await page.getByRole('link', { name: 'Add an activity' }).click();

      // CreateActivity defers the category picker behind a toggle link
      // ("Indicate a category"). Click to expand the section.
      await page.getByRole('link', { name: 'Indicate a category' }).click();

      // The picker is a labelled <select>; the new type should appear as
      // an <option> inside the optgroup labelled with our new category.
      const typePicker = page.getByLabel(/categorize this activity/i);
      await expect(typePicker).toBeVisible();
      await expect(typePicker).toContainText(typeName);

      consoleGate.assertNoUnknownErrors('/settings/personalization → /people/h:JOHN (activity-types cross-flow)');
    }, accountId);
  });
});
