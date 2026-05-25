/**
 * Subscription-flow smoke walkthrough.
 *
 * Drives the four read-only pages of the /settings/subscriptions/* surface
 * (index, upgrade, upgrade-success) to confirm the controller wires through
 * to Cashier/Stripe end-to-end. All Stripe SDK traffic from the app is routed
 * at the local stripe-mock sidecar via Cashier::$apiBaseUrl — see
 * AppServiceProvider::boot() and docker-compose.dev.yml's app service env.
 *
 * What this verifies:
 *   - Login still lands on /dashboard.
 *   - /settings/subscriptions returns the blank-state view for a freshly seeded
 *     account (which has no Stripe customer / subscription).
 *   - /settings/subscriptions/upgrade?plan=annual renders the upgrade view
 *     (including a createSetupIntent() call into stripe-mock).
 *   - /settings/subscriptions/upgrade/success renders the post-upgrade view.
 *
 * What this does NOT do:
 *   - Drive the Stripe Elements iframe. The card-collection iframe is brittle
 *     to automate and stripe-mock does not fully replicate Elements behaviour.
 *     The unit + feature suite (tests/Unit/Traits/StripeCallTest.php,
 *     tests/Feature/SubscriptionsControllerTest.php, tests/Feature/AccountSubscriptionTest.php)
 *     covers the StripeCall trait and controller actions directly against
 *     stripe-mock.
 *
 * Run prerequisites (full instructions in ../README.md):
 *
 *   1. `docker compose -f docker-compose.dev.yml up -d`
 *      (brings up app + mysql + stripe-mock + phpmyadmin + mailhog)
 *   2. `docker compose -f docker-compose.dev.yml exec --user www-data app \
 *        sh -c 'printf "yes\n20\n" | php artisan setup:test'`
 *      (seeds admin@admin.com / admin0 — the credentials this spec uses)
 *   3. From this directory: `yarn install && yarn run smoke:subscription`
 *      (or `yarn run smoke -- subscription-flow.spec.ts` for the same effect).
 *
 * Override target with SMOKE_BASE_URL=http://other.host:1234 if not using the
 * local compose stack.
 */

import { test, expect } from '@playwright/test';

const ADMIN_EMAIL = process.env.SMOKE_ADMIN_EMAIL ?? 'admin@admin.com';
const ADMIN_PASSWORD = process.env.SMOKE_ADMIN_PASSWORD ?? 'admin0';

test.describe('Monica v4 — subscription-flow smoke', () => {
  test('upgrade path renders blank state, upgrade view, and success page', async ({ page }) => {
    // --- Login ---
    await page.goto('/login');
    await page.getByRole('textbox', { name: 'Email' }).fill(ADMIN_EMAIL);
    await page.getByRole('textbox', { name: 'Password' }).fill(ADMIN_PASSWORD);
    await page.getByRole('button', { name: 'Login' }).click();
    await page.waitForURL('**/dashboard');

    // --- /settings/subscriptions — blank state ---
    // Fresh seed accounts have no Stripe customer; getSubscribedPlan() returns
    // null and the controller renders settings.subscriptions.blank. The blank
    // view shows the "Pick a plan below..." copy from
    // settings.subscriptions_account_upgrade_choice. REQUIRES_SUBSCRIPTION must
    // be true in the compose env or the controller short-circuits to /settings.
    //
    // We assert the response status < 400 (a 500 error page can still happen
    // to contain "plan") and match on the exact copy block, not just /plan/i.
    const blankResponse = await page.goto('/settings/subscriptions');
    expect(blankResponse?.status() ?? 0).toBeLessThan(400);
    await expect(page).toHaveURL(/\/settings\/subscriptions$/);
    await expect(page.locator('body')).toContainText('Pick a plan');

    // --- /settings/subscriptions/upgrade?plan=annual — upgrade view ---
    // This route calls createSetupIntent() on the account, which round-trips
    // through stripe-mock. If STRIPE_API_BASE/CASHIER_SECRET wiring is broken
    // we'll either 500 here or hit the real Stripe API.
    //
    // The upgrade view renders "You picked the annual plan." from
    // settings.subscriptions_upgrade_choose with :plan substituted from
    // $planInformation['type'] (= 'annual'). Asserting that full phrase rules
    // out 500 / 404 / unrelated error pages that happen to contain "annual".
    const upgradeResponse = await page.goto('/settings/subscriptions/upgrade?plan=annual');
    expect(upgradeResponse?.status() ?? 0).toBeLessThan(400);
    await expect(page).toHaveURL(/\/settings\/subscriptions\/upgrade\?plan=annual$/);
    await expect(page.locator('body')).toContainText('You picked the annual plan');

    // --- /settings/subscriptions/upgrade/success — post-upgrade view ---
    // Static view; we just verify the route renders rather than navigating
    // through the Stripe Elements form (that iframe-in-iframe is brittle and
    // stripe-mock does not implement Elements). The success view shows
    // "Thank you! You are now subscribed." — distinctive enough to rule out
    // error fallbacks.
    const successResponse = await page.goto('/settings/subscriptions/upgrade/success');
    expect(successResponse?.status() ?? 0).toBeLessThan(400);
    await expect(page).toHaveURL(/\/settings\/subscriptions\/upgrade\/success$/);
    await expect(page.locator('body')).toContainText('Thank you! You are now subscribed.');
  });
});
