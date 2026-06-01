/**
 * Activity-types premium gate (T2.7).
 *
 * Ports the 1st test in tests/cypress/e2e/settings/activity_types.cy.js.
 * Verifies that when REQUIRES_SUBSCRIPTION is on and the account is not
 * marked premium, the settings/personalization activity-types section
 * surfaces the upgrade message and hides the "Add a new activity type
 * category" trigger.
 *
 * Runs against the seeded admin account: REQUIRES_SUBSCRIPTION is true
 * in the dev compose stack by default (set by docker-compose.dev.yml so
 * the subscription-flow smoke can drive the upgrade routes), so we just
 * need to ensure admin is not premium during the assertion.
 */

import { test, expect } from '../support/console-gate';
import { loginAsAdmin } from '../support/auth';
import { setPremium } from '../support/premium';

test.describe('Monica v4 — activity-types premium gate', () => {
  test('non-premium admin sees the upgrade gate on /settings/personalization and the create CTA is hidden', async ({ page, consoleGate }) => {
    // Defensive: revoke premium in case a prior test in the run granted
    // it and didn't roll back cleanly. The withPremiumAccount helper
    // always pairs grant/revoke in a finally, but tests can crash before
    // the finally runs.
    setPremium(false, '1');

    try {
      await loginAsAdmin(page);
      await page.goto('/settings/personalization');
      await expect(page).toHaveURL(/\/settings\/personalization$/);

      // The upgrade gate copy. ActivityTypes.vue renders the
      // personalisation_paid_upgrade_vue string inside an info-message
      // block when `limited === true`.
      await expect(page.locator('body')).toContainText(/This is a premium feature/);

      // The "Add a new activity type category" link only renders when
      // `!limited`. Under the gate it must not exist.
      await expect(page.getByRole('link', { name: 'Add a new activity type category' })).toHaveCount(0);

      consoleGate.assertNoUnknownErrors('/settings/personalization (premium gate)');
    } finally {
      // No-op: we left admin in the same not-premium state we found it
      // in. Listed here so the symmetry with withPremiumAccount is clear.
    }
  });
});
