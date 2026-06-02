/**
 * Reminder create + persistence (#731 A.6).
 *
 * The dependency-upgrade smoke covers the form mounting at L284 but not
 * the persist-then-appears-in-list flow. This spec drives the create
 * branch end-to-end against the seeded user's blank reminders section.
 *
 * Cron-driven email dispatch is out of scope (would need a clock-advance
 * fixture); see #731 non-goal 3. This covers the persistence + UI surfacing
 * leg only.
 */

import { test, expect } from '../support/console-gate';
import { loginAsFreshUser } from '../support/auth';
import { createContact } from '../support/contacts';

test.describe('Monica v4 — reminder persistence', () => {
  test('a created reminder appears in the contact reminders list', async ({ page, consoleGate }) => {
    await loginAsFreshUser(page);
    await createContact(page, 'Reminder', 'Subject', 'Woman');

    // We're on Reminder Subject's contact-detail page. The reminders
    // section renders the blank-state CTA. Two visible "Add a reminder"
    // links exist on the page (the section-heading CTA and the
    // blank-state CTA — same destination); .first() disambiguates.
    const stamp = Date.now();
    const reminderTitle = `Smoke reminder ${stamp}`;

    await page.getByRole('link', { name: 'Add a reminder' }).first().click();
    await expect(page).toHaveURL(/\/people\/h:[A-Za-z0-9]+\/reminders\/create$/);

    // Form fields. initial_date is pre-filled with today; the radio is
    // not pre-selected on a fresh Reminder (the blade only sets `checked`
    // when $reminder->frequency_type matches), so we have to pick one.
    await page.locator('input[name="title"]').fill(reminderTitle);
    await page.getByLabel('Remind me about this just once').check();
    await page.getByRole('button', { name: 'Add reminder' }).click();

    // Lands back on the contact detail page.
    await expect(page).toHaveURL(/\/people\/h:[A-Za-z0-9]+$/);

    // The populated reminders state renders <div class="reminders-list">.
    // Anchoring on that asserts both (a) the reminder persisted and
    // (b) we're no longer in the blank state.
    const remindersList = page.locator('.reminders-list');
    await expect(remindersList).toBeVisible();
    await expect(remindersList).toContainText(reminderTitle);

    consoleGate.assertNoUnknownErrors('/people/:hash (reminder persistence)');
  });
});
