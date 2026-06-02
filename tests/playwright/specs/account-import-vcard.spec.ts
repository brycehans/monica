/**
 * Account data import — vCard (#731 A.5).
 *
 * Onboarding-critical surface with zero E2E coverage before this spec.
 * Uploads a minimal one-contact vCard fixture from /settings/import/upload,
 * asserts the import job lands in the index list as completed, then
 * verifies the imported contact appears in /people.
 *
 * CSV imports route through a different code path and are deferred per
 * the design spec (#731 A.5 secondary scope).
 */

import path from 'node:path';
import { test, expect } from '../support/console-gate';
import { loginAsFreshUser } from '../support/auth';
import { withPremiumAccount } from '../support/premium';

const FIXTURE = path.resolve(__dirname, '../fixtures/contact-minimal.vcf');

test.describe('Monica v4 — account data import (vCard)', () => {
  test('uploading a vCard creates a contact visible on /people', async ({ page, consoleGate }) => {
    const { accountId } = await loginAsFreshUser(page);

    // Import is gated by AccountHelper::hasLimitations — the dev stack
    // pins REQUIRES_SUBSCRIPTION=true so a fresh account hits the
    // /settings/subscriptions redirect on /settings/import/upload until
    // premium is granted. Grant it for the duration of this test.
    await withPremiumAccount(async () => {
      // /settings/import is the blank state for a fresh user — the
      // controller short-circuits to settings.imports.blank.
      await page.goto('/settings/import');
      await expect(page.getByRole('heading', { name: 'You haven’t imported any contacts yet.' })).toBeVisible();

      await page.getByRole('link', { name: 'Import vCard' }).click();
      await expect(page).toHaveURL(/\/settings\/import\/upload$/);

      // setInputFiles bypasses the OS file picker and points the <input
      // name="vcard"> directly at the fixture. The behaviour <select>
      // defaults to BEHAVIOUR_ADD, so we only have to attach the file.
      await page.locator('input[name="vcard"]').setInputFiles(FIXTURE);
      await page.getByRole('button', { name: 'Upload' }).click();

      // After upload the controller redirects to /settings/import, which
      // now renders the index (one job exists). The fresh user's import
      // ran sync (QUEUE_CONNECTION=sync) so the row already has its
      // completed result, not the in-progress placeholder.
      await expect(page).toHaveURL(/\/settings\/import$/);
      await expect(page.getByRole('link', { name: 'View report' })).toBeVisible();

      // The imported contact appears in /people.
      await page.goto('/people');
      await expect(page.getByText('Pwfixture Vcardimport')).toBeVisible();

      consoleGate.assertNoUnknownErrors('/settings/import + /people (vcard import)');
    }, accountId);
  });
});
