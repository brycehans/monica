/**
 * Contact CRUD helpers.
 *
 * createContact(page, firstName, lastName, gender) drives the form at
 * /people/add. Mirrors tests/cypress/support/helpers/contacts.js's
 * `Cypress.Commands.add('createContact', ...)` so the playwright port can
 * stand up named test contacts the same way the cypress suite does.
 *
 * After the create-store action redirects to the new contact's detail page
 * (/people/h:<hash>), the helper resolves. Callers can chain from
 * `await expect(page).toHaveURL(...)` if they want to assert the redirect.
 */

import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

export type Gender = 'Man' | 'Woman' | 'Rather not say';

export async function createContact(
  page: Page,
  firstName: string,
  lastName: string,
  gender: Gender,
): Promise<void> {
  await page.goto('/people');
  await page.getByRole('link', { name: 'Add someone' }).click();
  await expect(page).toHaveURL(/\/people\/add$/);
  await page.getByLabel(/First name/i).fill(firstName);
  await page.getByLabel(/Last name/i).fill(lastName);
  await page.getByLabel(/Gender/i).selectOption({ label: gender });
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await expect(page).toHaveURL(/\/people\/h:[A-Za-z0-9]+$/);
}
