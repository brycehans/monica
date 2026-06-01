/**
 * Journal rate-your-day flow (T2.5).
 *
 * Ports the 3rd test in tests/cypress/e2e/journal/entries.cy.js. Click the
 * sad reaction → comment box appears → save → the rate-day journal entry
 * lands in the list with "You rated your day" copy.
 *
 * The smiley buttons used to be bare `<svg @click>` elements with no
 * role/label, un-testable via `getByRole` and silently inaccessible to
 * screen readers (same shape as the SetFavorite svg fixed in T1.4). The
 * companion diff adds `role="button" tabindex="0" :aria-label` to each
 * pair of svgs in RateDay.vue and three new translation keys
 * (journal_rate_sad/medium/happy). Same a11y/testability nudge as the
 * ContactSelect (T1.1), MonicaModal (T1.2), and SetFavorite (T1.4)
 * commits.
 */

import { test, expect } from '../support/console-gate';
import { loginAsFreshUser } from '../support/auth';

test.describe('Monica v4 — journal rate-your-day', () => {
  test('clicking the sad reaction reveals the comment textbox and persists a rate-day entry', async ({ page, consoleGate }) => {
    await loginAsFreshUser(page);
    await page.goto('/journal');

    // Fresh user → no journal entries yet → RateDay component renders
    // because hasRated === 'notYet'.
    const sadButton = page.getByRole('button', { name: 'Rate the day as sad' });
    await expect(sadButton).toBeVisible();
    // The mono and color smileys both carry the same ARIA name; click the
    // mono (first one rendered). Clicking either fires showComment(1) and
    // flips hasRated to 'addComment'.
    await sadButton.first().click();

    // The comment box becomes visible.
    const commentTextarea = page.getByPlaceholder('Add information about what you know');
    await expect(commentTextarea).toBeVisible();

    // Save without filling a comment (it's optional).
    await page.getByRole('button', { name: 'Save' }).click();

    // The new journal entry is rendered as a JournalContentRate row,
    // which carries the journal_entry_rate copy verbatim.
    await expect(page.getByText('You rated your day.').first()).toBeVisible();

    consoleGate.assertNoUnknownErrors('/journal (rate-your-day sad)');
  });
});
