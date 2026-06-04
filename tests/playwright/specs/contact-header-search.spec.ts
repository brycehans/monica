/**
 * Header contact autosuggest — type → dropdown → click → contact detail
 * (C.2a of #731 Tier C).
 *
 * Covers the global <contact-search> in resources/views/partials/header.blade.php,
 * which mounts ContactSearch.vue → ContactAutosuggest.vue. Typing into the
 * header input POSTs to /people/search after a 200ms debounce; the dropdown
 * renders <li class="contact-autosuggest__result"> items. Clicking a match
 * fires onSelect → window.location = item.route, navigating to the contact
 * detail page.
 *
 * Isolation: fresh user with one named contact ("Alice Findable"). A fresh
 * account starts with zero contacts so the dropdown match is unambiguous.
 */

import { test, expect } from '../support/console-gate';
import { loginAsFreshUser } from '../support/auth';
import { createContact } from '../support/contacts';

test.describe('Monica v4 — header contact search', () => {
  test('type → dropdown match → click → contact detail', async ({ page, consoleGate }) => {
    await loginAsFreshUser(page);

    await createContact(page, 'Alice', 'Findable', 'Woman');
    const aliceUrl = page.url();

    // Land on a page where the header autosuggest is the only visible
    // autosuggest. The dashboard is the natural starting surface for a
    // fresh login.
    await page.goto('/dashboard');

    // The input carries `header-search-input` via ContactSearch.vue's
    // :input-class. That class is unique to this instance (verified by
    // grep of resources/) so it disambiguates from other ContactAutosuggest
    // mounts (e.g. ContactSelect.vue's form-create autocomplete).
    const searchInput = page.locator('.header-search-input');
    await expect(searchInput).toBeVisible();

    await searchInput.fill('Alice');

    // The dropdown is gated on items.length > 0 — render happens after the
    // 200ms debounce + the POST /people/search round-trip. Filter by the
    // full complete_name so we land on the real match, not the always-
    // present "add new contact" sentinel (id: -1) at the end of the list.
    const result = page
      .locator('.contact-autosuggest__result')
      .filter({ hasText: 'Alice Findable' });
    await expect(result).toBeVisible();

    // onSelect uses @mousedown.prevent (ContactAutosuggest.vue:69) to beat
    // the input's blur — Playwright's .click() dispatches mousedown first
    // so this path works. The click triggers window.location, which is a
    // full document navigation.
    await result.click();
    await expect(page).toHaveURL(aliceUrl);

    consoleGate.assertNoUnknownErrors('/dashboard (header autosuggest → detail)');
  });
});
