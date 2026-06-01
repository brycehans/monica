/**
 * Contact introductions — ContactSelect ARIA contract (T1.1).
 *
 * Guards the Vue-3 cutover's `vue-select` → `@vueform/multiselect` swap
 * (PR #702, the riskiest single component swap in the cutover). The picker
 * is mounted on /people/h:<contact>/introductions/edit as `<contact-select>`
 * — the same component reused across relationships, activities, and
 * messages. Ported from tests/cypress/e2e/contacts/introductions.cy.js.
 *
 * Assertions are user-observable: ARIA `combobox` / `listbox` / `option`
 * roles, visible link text, and the form labels surfaced by
 * `<form-input>` / `<contact-select>`. No vendor classes
 * (`.multiselect-*`).
 *
 * Isolation: spins up a fresh user via setup:frontendtestuser so the picker
 * sees only the contacts this test creates. Without isolation, the filter
 * assertion ("typing John excludes Jane Doe and Joe Shmoe") would break the
 * moment another run pollutes the account with more Doe contacts.
 */

import { test, expect } from '../support/console-gate';
import { loginAsFreshUser } from '../support/auth';
import type { Page } from '@playwright/test';

test.describe('Monica v4 — contact introductions ARIA contract', () => {
  test('contact picker exposes ARIA roles, filters on input, persists selection', async ({ page, consoleGate }) => {
    await loginAsFreshUser(page);

    // Create three contacts. The third call ends with a redirect to the
    // active contact's detail page (Joe), so we start the picker flow from
    // /people/h:JOE.
    await createContact(page, 'John', 'Doe', 'Man');
    await createContact(page, 'Jane', 'Doe', 'Woman');
    await createContact(page, 'Joe', 'Shmoe', 'Man');

    await expect(page).toHaveURL(/\/people\/h:[A-Za-z0-9]+$/);

    // Open the "How you met" editor via the blank-state CTA. The sidebar
    // shows "Indicate how you met Joe" when no introduction has been
    // recorded yet.
    await page.getByRole('link', { name: /Indicate how you met Joe/i }).click();
    await expect(page).toHaveURL(/\/introductions\/edit$/);

    // Fill the typed-context marker so we can verify it round-trips
    // after the form submit.
    const marker = `intro-marker-${Date.now()}`;
    await page.getByLabel(/Explain how and where you met/i).fill(marker);

    // Open the contact picker — `<contact-select id="metThrough">` mounts
    // a @vueform/multiselect, which renders an ARIA combobox/listbox/option
    // tree. The combobox is the input the user types into. We anchor on
    // its accessible name (set via `aria-labelledby` to the localised
    // `<contact-select>` title) so the locator doesn't match the page's
    // other comboboxes (the first-met-date day/month/year selects, hidden
    // until the "I know the date" radio toggles them in).
    const combobox = page.getByRole('combobox', { name: /Has someone introduced you to this person/i });
    await expect(combobox).toBeVisible();
    await combobox.click();

    const listbox = page.getByRole('listbox');
    await expect(listbox).toBeVisible();

    // Joe Shmoe is the active contact; ContactSelect's userContactId filter
    // excludes him from his own picker. John Doe + Jane Doe should appear.
    await expect(listbox.getByRole('option', { name: 'John Doe' })).toBeVisible();
    await expect(listbox.getByRole('option', { name: 'Jane Doe' })).toBeVisible();
    await expect(listbox.getByRole('option', { name: 'Joe Shmoe' })).toHaveCount(0);

    // Type "John" to exercise the in-memory filter. Jane Doe drops out
    // (substring miss); Joe was already filtered as self.
    await combobox.fill('John');
    await expect(listbox.getByRole('option', { name: 'John Doe' })).toBeVisible();
    await expect(listbox.getByRole('option', { name: 'Jane Doe' })).toHaveCount(0);
    await expect(listbox.getByRole('option', { name: 'Joe Shmoe' })).toHaveCount(0);

    // Select John Doe and submit.
    await listbox.getByRole('option', { name: 'John Doe' }).click();
    await page.getByRole('button', { name: 'Save' }).click();

    // Land back on Joe's detail page; the "How you met" sidebar should now
    // surface the marker text and a link to the introducer (John Doe).
    await expect(page).toHaveURL(/\/people\/h:[A-Za-z0-9]+$/);
    await expect(page.getByText(marker)).toBeVisible();
    await expect(page.getByRole('link', { name: 'John Doe' })).toBeVisible();

    consoleGate.assertNoUnknownErrors('/people/h:JOE/introductions/edit');
  });
});

async function createContact(
  page: Page,
  firstName: string,
  lastName: string,
  gender: 'Man' | 'Woman' | 'Rather not say',
): Promise<void> {
  await page.goto('/people');
  await page.getByRole('link', { name: 'Add someone' }).click();
  await expect(page).toHaveURL(/\/people\/add$/);
  await page.getByLabel(/First name/i).fill(firstName);
  await page.getByLabel(/Last name/i).fill(lastName);
  await page.getByLabel(/Gender/i).selectOption({ label: gender });
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  // The contact-store action redirects to /people/h:<hash>.
  await expect(page).toHaveURL(/\/people\/h:[A-Za-z0-9]+$/);
}
