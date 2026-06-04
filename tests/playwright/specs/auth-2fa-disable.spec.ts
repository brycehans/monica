/**
 * 2FA disable + regenerate-recovery-codes round trip (#731 Tier B.2).
 *
 * Dusk's MultiFAControllerTest has a disable test but it's
 * markTestIncomplete; nothing else covers the disable path or the
 * "Generate new codes" rotation. This spec exercises both halves:
 *
 *   - Disable: enable 2FA via UI → open the disable modal → submit a
 *     fresh OTP → assert the Enable link is back and google2fa_secret
 *     is cleared on the user row.
 *   - Regenerate: re-enable → open the recovery-codes modal (lazily
 *     generates the first set) → click "Generate new codes…" → assert
 *     the recovery_codes table now holds a different set of codes of
 *     the same cardinality.
 *
 * Design rationale lives in docs/superpowers/specs/2026-06-04-731-tier-b-design.md.
 */

import { test, expect } from '../support/console-gate';
import { loginAsFreshUser } from '../support/auth';
import {
  enable2faViaUi,
  showRecoveryCodesViaUi,
  regenerateRecoveryCodesViaUi,
  fetchRecoveryCodes,
  fetch2faSecret,
  currentOtp,
} from '../support/twofa';

test.describe('Monica v4 — 2FA disable + regenerate', () => {
  test('2FA can be disabled and recovery codes can be rotated', async ({ page, consoleGate }) => {
    const user = await loginAsFreshUser(page);
    await page.goto('/settings/security');

    // ---- Enable -------------------------------------------------------
    const { secret } = await enable2faViaUi(page);

    // ---- Disable ------------------------------------------------------
    await page.getByRole('link', { name: 'Disable Two Factor Authentication' }).click();
    // Disable modal accepts either an OTP or a recovery code; we use a
    // freshly computed OTP. Same labelled-input pattern as enable.
    await page
      .getByLabel('Enter a two factor authentication code or a recovery code')
      .fill(currentOtp(secret));
    await page.locator('#verify2').click();

    // UI invariant: Enable link is back.
    await expect(page.getByRole('link', { name: 'Enable Two Factor Authentication' }))
      .toBeVisible();
    // DB invariant: google2fa_secret column is cleared. A controller
    // that returned success without persisting would slip past the UI
    // check alone.
    expect(fetch2faSecret(user.userId)).toBe('');

    // ---- Re-enable + regenerate recovery codes ------------------------
    await enable2faViaUi(page);
    await showRecoveryCodesViaUi(page);

    // Lazy generation fired on the click above; the codes now exist.
    const codesBefore = fetchRecoveryCodes(user.userId);
    expect(codesBefore.length).toBeGreaterThan(0);

    await regenerateRecoveryCodesViaUi(page);

    const codesAfter = fetchRecoveryCodes(user.userId);
    // Rotation invariant: same cardinality, fully disjoint set.
    expect(codesAfter.length).toBe(codesBefore.length);
    expect(codesAfter).not.toEqual(codesBefore);
    expect(codesAfter.some((c) => codesBefore.includes(c))).toBe(false);

    consoleGate.assertNoUnknownErrors('/settings/security 2FA disable + regenerate');
  });
});
