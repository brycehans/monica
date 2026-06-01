/**
 * Activity create → journal entry side-effect (T1.3).
 *
 * Ported from the second test in tests/cypress/e2e/journal/entries.cy.js.
 * Guards the invariant that creating an activity automatically inserts a
 * journal entry pointing at it, and that the resulting journal entry is
 * NOT independently deletable from /journal (it's owned by the activity;
 * removing it requires deleting the activity).
 *
 * Surface covered:
 *
 *   - The activity-store action emits a JournalContentActivity row at
 *     /journal — verified by the activity's summary text appearing in
 *     the day's row alongside the "Activity" type label.
 *   - The activity-journal row does NOT carry a Delete affordance — the
 *     ApplyAccessibility/JournalContentActivity component omits the
 *     `<confirm>` button that JournalContentEntry exposes. Without this
 *     guard, a future refactor that homogenises the partials risks
 *     re-introducing the delete path and bypassing the activity-store's
 *     bookkeeping (which expects the journal row to live as long as the
 *     activity does).
 */

import { test, expect } from '../support/console-gate';
import { loginAsFreshUser } from '../support/auth';
import { createContact } from '../support/contacts';

test.describe('Monica v4 — activity creates journal entry side-effect', () => {
  test('activity logged from contact detail surfaces at /journal with no delete affordance', async ({ page, consoleGate }) => {
    await loginAsFreshUser(page);
    await createContact(page, 'John', 'Doe', 'Man');

    // We're on /people/h:JOHN. Expand the activity-create form via the
    // blank-state CTA (the header trigger is an <a> with no href — see
    // the T1.2 spec for the same rationale).
    await page.getByRole('link', { name: 'Add an activity' }).click();

    const marker = `Smoke activity-journal ${Date.now()}`;
    // The summary input is labelled with the parametrised activity title.
    await page.getByLabel('What did you do with John?').fill(marker);
    // Save. Activities use "Add" (not "Save") for new records.
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    // Activity-store redirects back to the contact detail page.
    await expect(page).toHaveURL(/\/people\/h:[A-Za-z0-9]+$/);

    // Navigate to /journal and verify the activity-derived row.
    await page.goto('/journal');

    // The row contains the activity summary and the "Activity" type label
    // (from JournalContentActivity.vue's "Activity: ..." prefix).
    const activityRow = page.getByText(marker).locator('xpath=ancestor::div[contains(@class, "journal-line")][1]');
    await expect(activityRow).toBeVisible();
    await expect(activityRow).toContainText('Created automatically');

    // The invariant: no Delete affordance on this row. JournalContentEntry
    // ships a `<confirm>` button with the localised "Delete" label;
    // JournalContentActivity omits it entirely. A row that grows a Delete
    // button would suggest the partial was homogenised.
    await expect(activityRow.getByRole('button', { name: /^Delete$/i })).toHaveCount(0);
    await expect(activityRow.getByRole('link', { name: /^Delete$/i })).toHaveCount(0);

    consoleGate.assertNoUnknownErrors('/journal (activity-derived row)');
  });
});
