/**
 * Favorite toggle + contact-list ordering (T1.4).
 *
 * Ported from the 6th test in tests/cypress/e2e/contacts/contacts.cy.js.
 * Two interlinked invariants:
 *
 *   1. The favorite star on a contact's detail page toggles its
 *      aria-pressed state when clicked (Vue reactivity guard — broken
 *      reactivity is invisible to the eye on toggle).
 *   2. Favorited contacts sort to the top of /people regardless of
 *      alphabetical order (ApiContactController + ContactList sort
 *      contract).
 *
 * The favorite button used to be a bare `<svg>` with @click and no role,
 * which made it un-testable via getByRole and silently inaccessible to
 * screen readers. The companion commit wraps it in a proper `<button
 * type="button" aria-pressed="..." aria-label="...">` so we can anchor
 * here. Same 1-line a11y/testability nudge applied to ContactSelect
 * (T1.1) and MonicaModal (T1.2).
 */

import { test, expect } from '../support/console-gate';
import { loginAsFreshUser } from '../support/auth';
import { createContact } from '../support/contacts';

const FAVORITE_TOOLTIP = /Favorite contacts are placed at the top of the contact list/i;

test.describe('Monica v4 — contact favorite toggle + list ordering', () => {
  test('favorite star toggles aria-pressed and lifts the contact to the top of /people', async ({ page, consoleGate }) => {
    await loginAsFreshUser(page);

    await createContact(page, 'John', 'Doe', 'Man');
    // createContact lands on John's detail page.
    const favoriteButton = page.getByRole('button', { name: FAVORITE_TOOLTIP });
    await expect(favoriteButton).toBeVisible();
    await expect(favoriteButton).toHaveAttribute('aria-pressed', 'false');

    // Click to favourite. The aria-pressed attribute is bound to isFavorite,
    // which the store action flips after the POST resolves.
    await favoriteButton.click();
    await expect(favoriteButton).toHaveAttribute('aria-pressed', 'true');

    // Add a second contact alphabetically ahead of John — so default
    // (alphabetical) ordering would put Abc before John. Favorite ordering
    // is the only thing that puts John back on top.
    await createContact(page, 'Abc', 'Abc', 'Man');

    // Visit the contact list and verify the favorited contact sorts to
    // the top. Both contacts are linked via /people/h:<hash>; the order
    // of those links is the order of the list rows.
    await page.goto('/people');
    const contactLinks = page.locator('a[href*="/people/h:"]');
    // The list renders both contacts; getByText is safe because both
    // names are unique to the fresh user's account.
    await expect(contactLinks.filter({ hasText: 'John Doe' })).toBeVisible();
    await expect(contactLinks.filter({ hasText: 'Abc Abc' })).toBeVisible();

    // Order check: collect the order they appear in the DOM and assert
    // John comes before Abc.
    const orderedNames = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href*="/people/h:"]')) as HTMLAnchorElement[];
      return links.map(a => a.textContent?.trim() ?? '').filter(s => s.length > 0);
    });
    const johnIndex = orderedNames.findIndex(n => n.includes('John Doe'));
    const abcIndex = orderedNames.findIndex(n => n.includes('Abc Abc'));
    expect(johnIndex).toBeGreaterThanOrEqual(0);
    expect(abcIndex).toBeGreaterThanOrEqual(0);
    expect(johnIndex).toBeLessThan(abcIndex);

    consoleGate.assertNoUnknownErrors('/people (favorite ordering)');
  });
});
