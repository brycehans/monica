/**
 * Password reset flow (#731 Tier A.1).
 *
 * Visit /password/reset as a logged-out user, submit the registered email,
 * follow the Mailhog-delivered reset token URL, set a new password, and
 * confirm the new credentials log in successfully.
 *
 * The flow exercises Laravel's stock SendsPasswordResetEmails +
 * ResetsPasswords traits behind Monica's ForgotPasswordController and
 * ResetPasswordController — a regression here silently breaks every
 * self-hoster's "I lost my password" recovery path.
 */

import { test, expect } from '../support/console-gate';
import { createFreshUser } from '../support/auth';
import { waitForEmailTo, extractUrl, urlPathOnly } from '../support/mailhog';

test.describe('Monica v4 — password reset', () => {
  test('forgot-password email delivers a working reset URL', async ({ page, consoleGate }) => {
    const beforeRequest = new Date();
    const user = await createFreshUser();
    const newPassword = 'NewPassword!2026';

    await page.goto('/password/reset');
    await page.getByLabel('E-Mail Address').fill(user.email);
    await page.getByRole('button', { name: 'Send Password Reset Link' }).click();

    // Laravel surfaces the post-submit confirmation via session('status'),
    // rendered into a .page-alert-success block on the same view.
    await expect(page.locator('body')).toContainText(
      /password reset link|we have emailed/i,
    );

    const message = await waitForEmailTo(user.email, { since: beforeRequest, timeoutMs: 10000 });
    const resetUrl = urlPathOnly(extractUrl(
      message,
      /(https?:\/\/[^\s)"'<>]+\/password\/reset\/[^\s)"'<>]+)/,
    ));

    await page.goto(resetUrl);
    // The view pre-fills the email from the URL's `email` query param; assert
    // it before typing the password so a routing regression surfaces here
    // rather than later as "credentials rejected".
    await expect(page.getByLabel('E-Mail Address')).toHaveValue(user.email);
    await page.getByLabel('Password', { exact: true }).fill(newPassword);
    await page.getByLabel('Confirm Password').fill(newPassword);
    await page.getByRole('button', { name: 'Reset Password' }).click();

    // ResetsPasswords::sendResetResponse auto-logs the user in and redirects
    // to the configured home — Monica's RouteServiceProvider::HOME is
    // /dashboard.
    await page.waitForURL('**/dashboard');

    // Belt-and-braces: log out, log back in with the new password, prove the
    // credential was persisted (not just the active session).
    await page.goto('/logout');
    await page.goto('/login');
    await page.getByRole('textbox', { name: 'Email' }).fill(user.email);
    await page.getByRole('textbox', { name: 'Password' }).fill(newPassword);
    await page.getByRole('button', { name: 'Login' }).click();
    await page.waitForURL('**/dashboard');

    consoleGate.assertNoUnknownErrors('/password/reset → reset → login');
  });
});
