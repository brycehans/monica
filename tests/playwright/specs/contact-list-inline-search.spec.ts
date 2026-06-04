/**
 * /people inline vgt-table search — filter → match → click row → contact
 * detail (C.2b of #731 Tier C).
 *
 * Covers ContactList.vue's match-then-click-through flow. The smoke spec
 * at dependency-upgrade-smoke.spec.ts:320-349 already asserts the no-match
 * "No results found" toast under the vue-good-table cutover guard; this
 * spec carries the positive contract — typing a match filters the rows,
 * and clicking the surviving row navigates to the contact detail page via
 * onRowClick → window.location.href (ContactList.vue:187-194).
 *
 * Isolation: fresh user with two contacts (one match, one not). Search by
 * first name so the table filter has something to exclude.
 */

import { test, expect } from '../support/console-gate';
import { loginAsFreshUser } from '../support/auth';
import { createContact } from '../support/contacts';

test.describe('Monica v4 — /people inline search', () => {
  test('filter rows → click match → contact detail', async ({ page, consoleGate }) => {
    await loginAsFreshUser(page);

    await createContact(page, 'Alice', 'Findable', 'Woman');
    const aliceUrl = page.url();
    await createContact(page, 'Bob', 'Excluded', 'Man');

    await page.goto('/people');

    const rows = page.locator('table.vgt-table tbody tr');
    await expect(rows.filter({ hasText: 'Alice' })).toHaveCount(1);
    await expect(rows.filter({ hasText: 'Bob' })).toHaveCount(1);

    // Same selector as the smoke spec (L340). vgt-table's global search
    // input lives inside .vgt-global-search__input.
    const searchInput = page.locator('.vgt-global-search__input input.vgt-input');
    await searchInput.fill('Alice');

    // The table debounces then server-fetches; auto-waiting assertions
    // ride the round-trip.
    await expect(rows.filter({ hasText: 'Alice' })).toHaveCount(1);
    await expect(rows.filter({ hasText: 'Bob' })).toHaveCount(0);

    // Click anywhere on Alice's row. ContactList.vue's @row-click handler
    // (line 187) calls preventDefault on the event and sets
    // window.location.href = row.route — a full-document navigation.
    await rows.filter({ hasText: 'Alice' }).first().click();
    await expect(page).toHaveURL(aliceUrl);

    consoleGate.assertNoUnknownErrors('/people (inline search → detail)');
  });
});
