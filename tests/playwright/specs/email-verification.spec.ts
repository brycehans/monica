/**
 * Email verification flow (#731 Tier A.2).
 *
 * Exercises the signed-URL verify handler on /email/verify/{id}/{hash}.
 * Drives a fresh user into the "unverified" state in-test, dispatches the
 * VerifyEmail notification, fetches the signed URL from Mailhog, navigates
 * to it, and asserts the user lands on /dashboard with email_verified_at
 * populated.
 *
 * The dev rig's monica.signup_double_optin defaults to false, so the real
 * register → notification chain is short-circuited (RegisterController
 * auto-marks the user verified). Flipping that config globally would break
 * signup-duplicate-email.spec.ts and any other spec asserting post-register
 * redirect to /dashboard. We therefore simulate the unverified state on a
 * fresh user and dispatch the notification directly via tinker — the
 * verify-URL handler is what's under test, and the dispatch chain is
 * gated by a single config flag covered by Laravel's framework tests.
 */

import { test, expect } from '../support/console-gate';
import { loginAsFreshUser } from '../support/auth';
import { artisan } from '../support/artisan';
import { waitForEmailTo, extractUrl, urlPathOnly } from '../support/mailhog';

test.describe('Monica v4 — email verification', () => {
  test('signed verification URL marks the account verified and lands on dashboard', async ({ page, consoleGate }) => {
    const beforeRequest = new Date();
    const user = await loginAsFreshUser(page);

    // Drop the verified flag, then send the VerifyEmail notification
    // directly so the dispatch is independent of monica.signup_double_optin.
    artisan(
      'tinker',
      '--execute',
      `$u = App\\Models\\User\\User::find(${user.userId}); ` +
        `$u->forceFill(['email_verified_at' => null])->save(); ` +
        `$u->notify(new Illuminate\\Auth\\Notifications\\VerifyEmail());`,
    );

    const message = await waitForEmailTo(user.email, { since: beforeRequest, timeoutMs: 10000 });
    const verifyUrl = urlPathOnly(extractUrl(
      message,
      /(https?:\/\/[^\s)"'<>]+\/email\/verify\/\d+\/[^\s)"'<>]+)/,
    ));

    await page.goto(verifyUrl);

    // The signed URL handler redirects to VerificationController::$redirectTo
    // ('/dashboard'). The session from loginAsFreshUser is still active, so
    // the verified middleware now lets us through.
    await page.waitForURL('**/dashboard');

    // Confirm the DB flag flipped — guards against a regression that
    // 302s to /dashboard but doesn't actually persist the verification.
    const verifiedAt = artisan(
      'tinker',
      '--execute',
      `echo App\\Models\\User\\User::find(${user.userId})->email_verified_at;`,
    )
      .trim()
      .split(/\r?\n/)
      .pop()!
      .trim();
    expect(verifiedAt).not.toBe('');

    consoleGate.assertNoUnknownErrors('/email/verify/{id}/{hash}');
  });
});
