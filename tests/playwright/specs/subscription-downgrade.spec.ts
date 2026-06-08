/**
 * Subscription downgrade flow (D.5 of #731 Tier D).
 *
 * Companion to subscription-flow.spec.ts (which covers the upgrade path).
 * Drives the downgrade-checklist view through to the success page:
 *
 *   /settings/subscriptions/downgrade → checklist heading renders → "Downgrade"
 *   button is enabled (all three downgrade rules pass for a freshly minted
 *   single-user account with zero contacts) → submit → lands on
 *   /settings/subscriptions/downgrade/success → "You are back to the Free plan!"
 *
 * Why this works without Stripe state: SubscriptionsController::downgrade gates
 * on `$account->isSubscribed() || $account->getSubscribedPlan()`, and
 * isSubscribed() short-circuits to true when has_access_to_paid_version_for_free
 * is set — the same flag that `account:setpremium` toggles (see
 * support/premium.ts). subscriptionCancel() then no-ops because
 * getSubscribedPlan() returns null (no real Cashier subscription row), so the
 * controller reaches the success redirect without round-tripping stripe-mock.
 *
 * Isolation: fresh user. The seeded admin account is used by the smoke
 * walkthrough's premium-gated tests (subscription-flow.spec.ts and
 * activity-types.spec.ts), so mutating account-1 here would risk cross-test
 * order coupling. Setting premium on the per-test account_id keeps the state
 * change scoped, and the finally-block revoke keeps it symmetric so a failed
 * assertion doesn't leak.
 */

import { test, expect } from '../support/console-gate';
import { loginAsFreshUser } from '../support/auth';
import { setPremium } from '../support/premium';

test.describe('Monica v4 — subscription downgrade', () => {
  test('renders the checklist and clicking Downgrade lands on the success page', async ({ page, consoleGate }) => {
    const { accountId } = await loginAsFreshUser(page);
    setPremium(true, accountId);

    try {
      await page.goto('/settings/subscriptions/downgrade');

      // Checklist heading. `h2` rather than role=heading-with-name because
      // "Downgrade your account" also appears as the CTA button label
      // (cta = "Downgrade" via subscriptions_downgrade_cta, but adjacent
      // copy mentions the full phrase).
      await expect(
        page.locator('h2', { hasText: 'Downgrade your account to the free plan' }),
      ).toBeVisible();

      // The Downgrade button is rendered enabled iff canDowngrade is true.
      // For a fresh single-user account with zero contacts and zero pending
      // invitations all three rules pass — so the v-if branch in
      // downgrade-checklist.blade.php:66 wins and we get a non-disabled
      // <button>. Asserting toBeEnabled() guards against a regression that
      // flips the gate off (which would render the disabled branch and
      // strand the user on the checklist).
      const downgradeButton = page.getByRole('button', { name: 'Downgrade', exact: true });
      await expect(downgradeButton).toBeEnabled();

      // Submit. processDowngrade() bounces to the success page when
      // canDowngrade is true; subscriptionCancel() returns false (no
      // Cashier plan to cancel) without throwing, so the controller
      // proceeds to the success redirect.
      await downgradeButton.click();

      await page.waitForURL(/\/settings\/subscriptions\/downgrade\/success$/);
      await expect(page.getByText('You are back to the Free plan!')).toBeVisible();
      await expect(
        page.getByRole('link', { name: 'Back to settings' }),
      ).toBeVisible();
    } finally {
      // Symmetric cleanup: revoke premium so the next test that uses this
      // account (none today, but the helper contract is "leave state as
      // you found it") doesn't see leftover paid-access state.
      setPremium(false, accountId);
    }

    consoleGate.assertNoUnknownErrors('/settings/subscriptions/downgrade');
  });
});
