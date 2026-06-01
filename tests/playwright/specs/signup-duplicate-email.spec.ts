/**
 * Signup duplicate email rejection (T2.2).
 *
 * Ports the only live test in tests/cypress/e2e/auth/signup.cy.js (the
 * other two are commented out — happy path needs Mailtrap API to follow
 * the verification link, and the policy-required test is unenforced).
 * Guards the email-uniqueness validation on /register, which isn't
 * otherwise driven through a browser by the smoke or other ports.
 */

import { test, expect } from '../support/console-gate';

test.describe('Monica v4 — signup duplicate email', () => {
  test('registering with an already-used email shows a visible error and keeps the URL on /register', async ({ page, consoleGate }) => {
    const email = `t22-${Date.now()}@example.com`;
    const password = 'Test1234!';

    // --- First registration (happy path; just needs to succeed enough to seed the email) ---
    await page.goto('/register');
    await page.getByLabel('Enter a valid email address').fill(email);
    await page.getByLabel(/^First name$/).fill('First');
    await page.getByLabel(/^Last name$/).fill('Last');
    await page.getByLabel(/^Password$/, { exact: true }).fill(password);
    await page.getByLabel(/Password confirmation/).fill(password);
    await page.getByLabel(/Signing up signifies/).check();
    await page.getByRole('button', { name: 'Register' }).click();
    await page.waitForURL('**/dashboard');

    // Logout to clear the session so the second register page renders.
    await page.goto('/logout');

    // --- Second registration with the same email — must be rejected ---
    await page.goto('/register');
    await page.getByLabel('Enter a valid email address').fill(email);
    await page.getByLabel(/^First name$/).fill('First');
    await page.getByLabel(/^Last name$/).fill('Last');
    await page.getByLabel(/^Password$/, { exact: true }).fill(password);
    await page.getByLabel(/Password confirmation/).fill(password);
    await page.getByLabel(/Signing up signifies/).check();
    await page.getByRole('button', { name: 'Register' }).click();

    // Laravel surfaces the unique-constraint validation as "The email has
    // already been taken." inside the form's .alert block.
    await expect(page).toHaveURL(/\/register$/);
    await expect(page.locator('body')).toContainText(/email has already been taken/i);

    consoleGate.assertNoUnknownErrors('/register (duplicate email)');
  });
});
