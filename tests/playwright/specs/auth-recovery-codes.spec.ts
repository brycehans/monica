/**
 * 2FA recovery-code login challenge (#731 Tier B.1).
 *
 * Exercises the "use a recovery code instead" branch of the 2FA login
 * gate. Dusk's MultiFAControllerTest covers the OTP branch but every
 * test in it is markTestIncomplete('Ignore 2fa tests for now.'), so
 * the recovery-code branch has zero end-to-end coverage today.
 *
 * The flow:
 *
 *   1. Mint a fresh user with a known bcrypt password (the Dusk session
 *      bridge bypasses the /login form and therefore bypasses the 2FA
 *      gate — we need a real form login here).
 *   2. Establish a session via the Dusk bridge (cheap) so we can drive
 *      /settings/security to enable 2FA via the UI.
 *   3. Click "Get recovery codes" — the controller lazily generates
 *      codes on first read, mirroring the real user flow.
 *   4. Read the now-populated codes from the DB.
 *   5. Logout, navigate to /login, submit credentials. Land on
 *      /validate2fa.
 *   6. Click the "recovery code" link (renders into the validate2fa
 *      view from auth.use_recovery).
 *   7. Submit a known code. Assert /dashboard renders, which is what
 *      RecoveryLoginController::$redirectTo resolves to.
 *
 * Design rationale lives in docs/superpowers/specs/2026-06-04-731-tier-b-design.md.
 */

import { test, expect } from '../support/console-gate';
import { createFreshUserWithPassword } from '../support/auth';
import {
  enable2faViaUi,
  showRecoveryCodesViaUi,
  fetchRecoveryCodes,
} from '../support/twofa';

test.describe('Monica v4 — 2FA recovery-code login', () => {
  test('user with 2FA enrolled can log in via a recovery code', async ({ page, consoleGate }) => {
    // ---- Setup: fresh user with known password + 2FA enrolled --------
    const user = await createFreshUserWithPassword('test-recovery-pw');

    // Establish a session via the Dusk bridge so the next request is
    // authenticated. Skipping the form login here is fine — the form
    // engages later, after we logout, and that's what's under test.
    const bridge = await page.request.get(`/_dusk/login/${user.userId}`);
    if (!bridge.ok()) {
      throw new Error(`/_dusk/login/${user.userId} returned ${bridge.status()}`);
    }

    await page.goto('/settings/security');
    await enable2faViaUi(page);
    await showRecoveryCodesViaUi(page);

    const recoveryCodes = fetchRecoveryCodes(user.userId);
    expect(recoveryCodes.length).toBeGreaterThan(0);

    // ---- Logout + form login engages the 2FA gate --------------------
    await page.goto('/logout');

    await page.goto('/login');
    await page.getByRole('textbox', { name: 'Email' }).fill(user.email);
    await page.getByRole('textbox', { name: 'Password' }).fill(user.password);
    await page.getByRole('button', { name: 'Login' }).click();

    // The 2FA middleware (PragmaRX\Google2FALaravel) does NOT redirect to
    // a dedicated URL — it renders the validate2fa view at whatever URL
    // the user was heading to (here /dashboard, the login redirect
    // target). We assert engagement by the page heading.
    await expect(page.getByRole('heading', { name: 'Two Factor Authentication' }))
      .toBeVisible();

    // ---- Recovery-code branch ----------------------------------------
    // auth.use_recovery renders as: "Or you can use a <a>recovery code</a>"
    await page.getByRole('link', { name: 'recovery code' }).click();
    await page.waitForURL('**/auth/login-recovery');

    await page.getByLabel('Recovery code').fill(recoveryCodes[0]);
    await page.getByRole('button', { name: 'Login' }).click();
    await page.waitForURL('**/dashboard');

    consoleGate.assertNoUnknownErrors('/auth/login-recovery');
  });
});
