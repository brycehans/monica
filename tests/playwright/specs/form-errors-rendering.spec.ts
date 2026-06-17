/**
 * FormErrors rendering across every host modal (#625).
 *
 * After renaming `partials/Error.vue` to `partials/FormErrors.vue` and
 * collapsing the `<error>` / `<errors>` aliases to a single `<form-errors>`
 * tag, this spec locks down that the component resolves and renders in
 * every modal that mounts it. Without it, a regression to the old tag
 * names would be silent — Vue 3 treats unknown lowercase tags as
 * `HTMLUnknownElement` (no warning), so the only symptom is an alert that
 * never appears.
 *
 * Each test intercepts the POST that the modal would otherwise fire and
 * fulfils a 422 with a server-shaped errors body, so the assertion is
 * focused on rendering — not on whatever the server-side validator
 * happens to enforce. The five hosts: ContactFieldTypes (create + edit),
 * PersonalAccessTokens, Clients, CreateGift, CreateActivity.
 */

import type { Page, Route } from '@playwright/test';
import { test, expect } from '../support/console-gate';
import { loginAsFreshUser } from '../support/auth';
import { createContact } from '../support/contacts';

async function fulfil422(page: Page, urlGlob: string, body: Record<string, string[]>): Promise<void> {
  await page.route(urlGlob, async (route: Route) => {
    const method = route.request().method();
    if (method !== 'POST' && method !== 'PUT') {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 422,
      contentType: 'application/json',
      body: JSON.stringify(body),
    });
  });
}

/**
 * Every test in this file intentionally triggers a 422; Chromium logs
 * `[error] Failed to load resource: 422` for those, and the console gate
 * would otherwise flag them. Allowlist scoped per test so a 422 fired by
 * an unrelated request still trips the gate.
 */
const EXPECTED_422_NOTICE = /Failed to load resource.*422/;

test.describe('Monica v4 — FormErrors rendering (#625)', () => {
  test('ContactFieldTypes create modal renders alert on 422', async ({ page, consoleGate }) => {
    await loginAsFreshUser(page);
    consoleGate.allow(EXPECTED_422_NOTICE, '#625-test-intercept');
    await fulfil422(page, '**/settings/personalization/contactfieldtypes', {
      name: ['Field type create: intercepted message'],
    });

    await page.goto('/settings/personalization');
    await page.getByRole('link', { name: 'Add new field type' }).click();
    await page.getByRole('textbox', { name: 'Name' }).fill('Anything');
    await page.getByRole('link', { name: 'Save', exact: true }).click();

    await expect(
      page.locator('.page-alert.page-alert-danger').filter({ hasText: 'Field type create: intercepted message' }),
    ).toBeVisible();

    consoleGate.assertNoUnknownErrors('contactfieldtypes/create');
  });

  test('ContactFieldTypes edit modal renders alert on 422 (regression for #625 root cause)', async ({ page, consoleGate }) => {
    await loginAsFreshUser(page);
    consoleGate.allow(EXPECTED_422_NOTICE, '#625-test-intercept');
    // PUT to /settings/personalization/contactfieldtypes/<id>
    await fulfil422(page, '**/settings/personalization/contactfieldtypes/*', {
      name: ['Field type edit: intercepted message'],
    });

    await page.goto('/settings/personalization');

    // Wait for the contact-field-types list to render (account seeding
    // populates the standard set: LinkedIn, Facebook, Email, Phone…).
    const linkedInRow = page.locator('.dt-row').filter({ hasText: 'LinkedIn' }).first();
    await expect(linkedInRow).toBeVisible();
    await linkedInRow.locator('.fa-pencil-square-o').click();

    // editForm.name pre-fills with the row's name; clear+refill so the
    // request actually fires.
    const nameInput = page.getByRole('textbox', { name: 'Name' });
    await nameInput.fill('LinkedIn edited');
    await page.getByRole('link', { name: 'Edit', exact: true }).click();

    await expect(
      page.locator('.page-alert.page-alert-danger').filter({ hasText: 'Field type edit: intercepted message' }),
    ).toBeVisible();

    consoleGate.assertNoUnknownErrors('contactfieldtypes/edit');
  });

  test('PersonalAccessTokens create modal renders alert on 422', async ({ page, consoleGate }) => {
    await loginAsFreshUser(page);
    consoleGate.allow(EXPECTED_422_NOTICE, '#625-test-intercept');
    await fulfil422(page, '**/oauth/personal-access-tokens', {
      name: ['Token create: intercepted message'],
    });

    await page.goto('/settings/api');
    await page.getByRole('link', { name: 'Create New Token' }).click();
    await page.locator('input[name="create-token-name"]').fill('TestToken');
    // Submit is rendered as an <a class="btn btn-primary">, not <button>.
    await page.getByRole('link', { name: 'Create', exact: true }).click();

    await expect(
      page.locator('.page-alert.page-alert-danger').filter({ hasText: 'Token create: intercepted message' }),
    ).toBeVisible();

    consoleGate.assertNoUnknownErrors('oauth/personal-access-tokens/create');
  });

  test('OAuth Clients create modal renders alert on 422', async ({ page, consoleGate }) => {
    await loginAsFreshUser(page);
    consoleGate.allow(EXPECTED_422_NOTICE, '#625-test-intercept');
    await fulfil422(page, '**/oauth/clients', {
      name: ['Client create: intercepted message'],
    });

    await page.goto('/settings/api');
    await page.getByRole('link', { name: 'Create New Client' }).click();
    await page.locator('input[name="client-name"]').fill('TestClient');
    await page.locator('input[name="redirect-url"]').fill('https://example.com/callback');
    // Submit is rendered as an <a class="btn btn-primary">, not <button>.
    await page.getByRole('link', { name: 'Create', exact: true }).click();

    await expect(
      page.locator('.page-alert.page-alert-danger').filter({ hasText: 'Client create: intercepted message' }),
    ).toBeVisible();

    consoleGate.assertNoUnknownErrors('oauth/clients/create');
  });

  test('CreateGift modal renders alert on 422', async ({ page, consoleGate }) => {
    await loginAsFreshUser(page);
    await createContact(page, 'Gift', 'Tester', 'Man');
    consoleGate.allow(EXPECTED_422_NOTICE, '#625-test-intercept');
    await fulfil422(page, '**/people/h:*/gifts', {
      name: ['Gift create: intercepted message'],
    });

    await page.getByRole('link', { name: 'Add a gift' }).click();
    // CreateGift form opens inline below the gifts section heading. The
    // visible "Gift name" field is the vuelidate-bound input; fill it so
    // v$.$invalid is false and the request actually fires.
    await page.getByLabel('Gift name').fill('A gift');
    await page.getByRole('button', { name: 'Add', exact: true }).click();

    await expect(
      page.locator('.page-alert.page-alert-danger').filter({ hasText: 'Gift create: intercepted message' }),
    ).toBeVisible();

    consoleGate.assertNoUnknownErrors('people/h:<contact>/gifts/create');
  });

  test('CreateActivity modal renders alert on 422', async ({ page, consoleGate }) => {
    await loginAsFreshUser(page);
    await createContact(page, 'Activity', 'Tester', 'Woman');
    consoleGate.allow(EXPECTED_422_NOTICE, '#625-test-intercept');
    await fulfil422(page, '**/activities', {
      summary: ['Activity create: intercepted message'],
    });

    // Blank-state link reads "Add an activity"; the post-first-activity
    // section heading reads "Add activity". Either opens the same form.
    await page.getByRole('link', { name: /Add an? activity/ }).click();
    // The summary input's label is the parameterised "What did you do
    // with {name}?" — match the leading literal.
    await page.getByLabel(/What did you do with/).fill('An activity');
    await page.getByRole('button', { name: 'Add', exact: true }).click();

    await expect(
      page.locator('.page-alert.page-alert-danger').filter({ hasText: 'Activity create: intercepted message' }),
    ).toBeVisible();

    consoleGate.assertNoUnknownErrors('activities/create');
  });
});
