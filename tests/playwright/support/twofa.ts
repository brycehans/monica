/**
 * Two-factor authentication helper.
 *
 * Wraps the /settings/security 2FA enrollment + recovery-code UI and
 * exposes a small set of tinker-backed reads/computes so specs can
 * assert against the underlying state without re-implementing the
 * Google2FA OTP math in JS.
 *
 * Pattern:
 *
 *   import { enable2faViaUi, showRecoveryCodesViaUi,
 *            regenerateRecoveryCodesViaUi, fetchRecoveryCodes,
 *            fetch2faSecret, currentOtp } from '../support/twofa';
 *
 *   const { secret } = await enable2faViaUi(page);
 *   await showRecoveryCodesViaUi(page);          // triggers lazy gen
 *   const codes = fetchRecoveryCodes(user.userId);
 *
 * Why UI-drive enrollment and tinker-bridge OTP:
 *
 *   - Dusk's MultiFAControllerTest has the enrollment test, but every
 *     method is markTestIncomplete('Ignore 2fa tests for now.'), so
 *     today there is no end-to-end coverage of the enrollment modal.
 *     Driving it from this helper backfills that surface.
 *   - PragmaRX\Google2FA is already a composer dep, so computing OTPs
 *     server-side via tinker avoids adding a JS TOTP library (otplib
 *     etc.) and the clock-skew failure mode that comes with it. The
 *     OTP is read at the moment of fill, never earlier, so the 30s
 *     window doesn't roll over between read and submit.
 *   - Recovery codes are surfaced lazily by the controller (POST
 *     /settings/security/recovery-codes generates rows only when the
 *     user has none). showRecoveryCodesViaUi mirrors the real user
 *     flow (click "Get recovery codes"); fetchRecoveryCodes then reads
 *     the now-populated rows from the DB.
 */

import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { artisan } from './artisan';

/**
 * Drive /settings/security to enable 2FA. Opens the enable modal, reads
 * the server-issued secret from #secretkey, computes the current OTP
 * server-side, submits, and waits for the disable link to appear (which
 * is the page's signal that 2FA is now active).
 *
 * Returns the secret so callers can compute further OTPs (e.g. for the
 * disable form in B.2).
 */
export async function enable2faViaUi(page: Page): Promise<{ secret: string }> {
  await page.getByRole('link', { name: 'Enable Two Factor Authentication' }).click();

  // The modal renders the server-generated secret inside <code id="secretkey">.
  // MfaActivate.vue fetches the secret via axios.get then sets enableModalOpen,
  // so visibility implies the secret is bound. textContent includes the
  // surrounding whitespace from the template, so trim before handing off.
  const secretLocator = page.locator('#secretkey');
  await expect(secretLocator).toBeVisible();
  const secret = (await secretLocator.textContent())?.trim();
  if (!secret) {
    throw new Error('enable2faViaUi: failed to read secret from #secretkey');
  }

  // Compute OTP at the moment of fill so the 30s TOTP window doesn't
  // roll over between read and submit.
  //
  // form-input renders its <input> with id = `<id-prop><vue-uid>`, so
  // selecting the field by literal `#one_time_password1` misses. The
  // <label for> binding is on the same suffixed id, so getByLabel works
  // and the smoke spec calls this out at L666 of dependency-upgrade-smoke.
  const otp = currentOtp(secret);
  await page.getByLabel('Two factor authentication code').fill(otp);
  await page.locator('#verify1').click();

  // Confirm enrollment succeeded: the link flips from Enable to Disable.
  await expect(
    page.getByRole('link', { name: 'Disable Two Factor Authentication' }),
  ).toBeVisible();

  return { secret };
}

/**
 * Click "Get recovery codes" to open the modal. Triggers lazy code
 * generation server-side if the user has none yet (the controller's
 * index() generates when count === 0). Leaves the modal open so the
 * caller can drive regenerate from it; pair with a closeRecoveryCodesModal
 * (out of scope here — specs that need to close it just navigate away).
 */
export async function showRecoveryCodesViaUi(page: Page): Promise<void> {
  await page.getByRole('link', { name: 'Get recovery codes' }).click();
  // The modal contains the recovery_help_intro string. Wait for it so
  // the regenerate button is interactable.
  await expect(page.getByText('These are your recovery codes:')).toBeVisible();
}

/**
 * Click "Generate new codes…" inside the open recovery-codes modal.
 * Caller is responsible for having opened the modal via
 * showRecoveryCodesViaUi first. Waits for the regenerate axios POST
 * to complete by waiting for the response.
 */
export async function regenerateRecoveryCodesViaUi(page: Page): Promise<void> {
  const regeneratePost = page.waitForResponse(
    (r) =>
      r.url().endsWith('/settings/security/generate-recovery-codes')
      && r.request().method() === 'POST'
      && r.status() === 200,
  );
  await page.getByRole('link', { name: /Generate new codes/ }).click();
  await regeneratePost;
}

/**
 * Read the user's recovery codes (the plain `recovery` column on the
 * recovery_codes table) via artisan tinker. Returns an array of
 * recovery strings in DB insertion order.
 *
 * Note: the schema stores codes in plaintext (no Crypt), so a direct
 * column read is sufficient — no decryption needed.
 */
export function fetchRecoveryCodes(userId: string): string[] {
  const out = artisan(
    'tinker',
    '--execute',
    `echo App\\Models\\User\\User::find(${userId})->recoveryCodes()->pluck('recovery')->implode("\\n");`,
  );
  return out
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && /^[A-Z0-9-]+$/.test(line));
}

/**
 * Read the user's google2fa_secret via artisan tinker. The User model
 * encrypts on write and decrypts on read via its accessor, so we hit
 * the model accessor (echo $user->google2fa_secret) rather than the
 * raw column. Returns the empty string when 2FA is disabled (the
 * disable controller sets the column to null).
 */
export function fetch2faSecret(userId: string): string {
  const out = artisan(
    'tinker',
    '--execute',
    `echo App\\Models\\User\\User::find(${userId})->google2fa_secret ?? '';`,
  );
  return out
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .pop() ?? '';
}

/**
 * Compute the current Google2FA OTP for a given base32 secret. Bridges
 * to the PragmaRX\Google2FA library that the app itself uses, so the
 * OTP we submit is computed by the same library that will validate it.
 */
export function currentOtp(secret: string): string {
  const out = artisan(
    'tinker',
    '--execute',
    `echo (new PragmaRX\\Google2FA\\Google2FA())->getCurrentOtp('${secret}');`,
  );
  // tinker may interleave deprecation warnings; OTP is the last non-empty
  // line of stdout.
  return out
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => /^\d{6}$/.test(line))
    .pop() ?? '';
}
