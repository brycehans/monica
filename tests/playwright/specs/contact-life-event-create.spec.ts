/**
 * Contact life-event create flow (C.5 of #731 Tier C).
 *
 * Extends dependency-upgrade-smoke.spec.ts:881-907 (life-events tab mount-only)
 * with the positive create contract. The tab is switched by clicking the
 * "Life events" span which fires updateDefaultProfileView('life-events').
 * The LifeEventList blank state then renders an "Add a life event" CTA;
 * clicking it mounts CreateLifeEvent inline with a three-step wizard:
 *
 *   categories  → click a category row → GET /lifeevents/categories/<id>/types
 *   types       → click a type row     → switches view to 'add'
 *   add         → date defaults to today; click "Add" → POST
 *                 /people/<hash>/lifeevents → response pushed into
 *                 lifeEvents → renders an .life-event-list-icon row.
 *
 * The spec picks the FIRST category and the FIRST type in each list. The
 * categories and types are seeded by the account-create lifecycle; their
 * order is deterministic per user (id ASC) but their localised names
 * aren't — picking by position keeps the selector resilient to i18n
 * changes that have bitten the cypress equivalents historically.
 *
 * No subscription gate on life-events at the blade level (verified in
 * resources/views/people/life-events/index.blade.php — the <life-event-list>
 * mount is unconditional). The fresh-user account works without paid-access
 * toggling, unlike documents.
 */

import { test, expect } from '../support/console-gate';
import { loginAsFreshUser } from '../support/auth';
import { createContact } from '../support/contacts';

test.describe('Monica v4 — contact life event create', () => {
  test('tab → CTA → category → type → submit → row in timeline', async ({ page, consoleGate }) => {
    await loginAsFreshUser(page);

    await createContact(page, 'Alice', 'Anniversary', 'Woman');

    // Switch to the Life events tab. Same span pattern as smoke L894.
    // The rendered text is "new Life events (0)" for users whose
    // profile_new_life_event_badge_seen flag is still false (which fresh
    // accounts always are), so anchor on the stable middle substring.
    await page.locator('span').filter({ hasText: /Life events/ }).first().click();

    // LifeEventList blank-state CTA. people.life_event_list_cta =
    // "Add life event". <a> with href="" qualifies as a link role.
    await page.getByRole('link', { name: 'Add life event', exact: true }).click();

    // CreateLifeEvent mounts with view='categories'. Categories are
    // fetched async via GET /lifeevents/categories — wait for the first
    // row to appear before clicking.
    const firstCategory = page.locator('.life-event-add-row').first();
    await expect(firstCategory).toBeVisible();
    await firstCategory.click();

    // After click, view='types' and getType POSTs to fetch the type list.
    // Wait for the new rows then click the first.
    const firstType = page.locator('.life-event-add-row').first();
    await expect(firstType).toBeVisible();
    await firstType.click();

    // The 'add' view renders the date form (defaulted to today) and the
    // primary "Add" button at the bottom. We submit without changing any
    // fields — date defaults to today, type-specific content is optional.
    const persist = page.waitForResponse(
      (r) => /\/people\/h:[A-Za-z0-9]+\/lifeevents$/.test(r.url())
        && r.request().method() === 'POST'
        && r.ok(),
    );
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await persist;

    // After store(), parent updates lifeEvents — the populated list
    // renders one .life-event-list-icon per row.
    await expect(page.locator('.life-event-list-icon')).toHaveCount(1);

    consoleGate.assertNoUnknownErrors('/people/h:<contact> (life event create)');
  });
});
