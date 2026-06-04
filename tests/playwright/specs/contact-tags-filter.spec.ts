/**
 * Contact tags filter — /people?tags[]=NAME (C.1 of #731 Tier C).
 *
 * Walks the user-observable contract end-to-end:
 *   1. Tags.vue's empty-state editor on the contact detail header attaches a
 *      new tag that persists to the server.
 *   2. The sidebar tag chip on /people links to /people?tags[]=NAME.
 *   3. The filtered list contains the tagged contact and excludes the
 *      untagged one.
 *   4. The "Clear filter" banner anchor returns to the unfiltered list.
 *
 * Isolation: fresh user with two contacts (one tagged, one not). The fresh
 * account starts with zero existing tags, so the chip and the marker text
 * inside the banner are unambiguous regardless of seeded admin state.
 *
 * The setup leg drives Tags.vue rather than POSTing /tags/update directly —
 * that gives this spec the side-effect of guarding the tag editor's
 * empty-state → input → Enter → persist path, which has no other E2E
 * coverage today.
 *
 * Design: docs/superpowers/specs/2026-06-04-731-tier-c-c1-design.md
 */

import { test, expect } from '../support/console-gate';
import { loginAsFreshUser } from '../support/auth';
import { createContact } from '../support/contacts';

test.describe('Monica v4 — contact tags filter', () => {
  test('add tag via editor, filter via sidebar chip, clear via banner link', async ({ page, consoleGate }) => {
    await loginAsFreshUser(page);

    // Create two contacts. createContact() lands on /people/h:<hash> for
    // each. Capture Alice's URL so we can come back to her detail page
    // after Bob's creation redirects us away.
    await createContact(page, 'Alice', 'Tagged', 'Woman');
    const aliceUrl = page.url();

    await createContact(page, 'Bob', 'Untagged', 'Man');

    // -- Setup: attach a unique tag to Alice via Tags.vue
    await page.goto(aliceUrl);
    const tagName = `vip-${Date.now()}`;

    // Empty-state CTA — "Add tags" (people.tag_add). Tags.vue mounts inside
    // the contact-detail header (resources/views/people/_header.blade.php:119).
    // The link is visible iff contactTags.length === 0 && !editMode — both
    // are true on first visit for a fresh user.
    await page.getByRole('link', { name: 'Add tags', exact: true }).click();

    // enterEditMode() flips editMode and focuses <input ref="tags">.
    // Pressing Enter fires Tags.vue#onEnter → store() → POST tags/update.
    const tagInput = page.getByPlaceholder('Add or search tags');
    await expect(tagInput).toBeFocused();
    await tagInput.fill(tagName);

    const persist = page.waitForResponse(
      (r) => /\/tags\/update$/.test(r.url()) && r.request().method() === 'POST' && r.ok(),
    );
    await tagInput.press('Enter');
    await persist;

    // -- Baseline: unfiltered /people shows both contacts and the chip
    await page.goto('/people');

    const rows = page.locator('table.vgt-table tbody tr');
    await expect(rows.filter({ hasText: 'Alice' })).toHaveCount(1);
    await expect(rows.filter({ hasText: 'Bob' })).toHaveCount(1);

    // Sidebar tag chip — `.sidebar .pretty-tag a` renders one anchor per
    // tag whose contact_count > 0. Scoping to .sidebar excludes the active
    // filter banner's `.pretty-tag` (which is rendered without an inner
    // anchor) and any future chip variants elsewhere on the page.
    const sidebarChip = page
      .locator('.sidebar .pretty-tag')
      .getByRole('link', { name: tagName });
    await expect(sidebarChip).toBeVisible();

    // -- Apply filter: click the sidebar chip
    await sidebarChip.click();
    // Browser keeps the [ ] literal in the visible URL (no percent-encoding
    // in the address bar). Escape the brackets for the regex.
    await expect(page).toHaveURL(new RegExp(`/people\\?tags\\[\\]=${tagName}`));

    const banner = page.locator('.clear-filter');
    await expect(banner).toContainText('Showing all the contacts tagged with');
    await expect(banner.getByText(tagName)).toBeVisible();

    const filteredRows = page.locator('table.vgt-table tbody tr');
    await expect(filteredRows.filter({ hasText: 'Alice' })).toHaveCount(1);
    await expect(filteredRows.filter({ hasText: 'Bob' })).toHaveCount(0);

    // -- Clear filter: click the banner anchor (plain <a href="/people">)
    await banner.getByRole('link', { name: 'Clear filter' }).click();
    await expect(page).toHaveURL(/\/people$/);
    await expect(page.locator('.clear-filter')).toHaveCount(0);

    const clearedRows = page.locator('table.vgt-table tbody tr');
    await expect(clearedRows.filter({ hasText: 'Alice' })).toHaveCount(1);
    await expect(clearedRows.filter({ hasText: 'Bob' })).toHaveCount(1);

    consoleGate.assertNoUnknownErrors('/people (tags filter round-trip)');
  });
});
