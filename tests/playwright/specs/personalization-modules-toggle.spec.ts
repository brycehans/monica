/**
 * Personalization → modules toggle persistence (D.3 sub-PR of #731).
 *
 * Third of the D.3 carve. Modules.vue is toggle-only — modules are seeded
 * per-account by PopulateModulesTable (Conversations, Documents, Food
 * preferences, …) and the user can disable any of them on a per-account
 * basis. There's no create / delete path, so "CRUD" in the umbrella issue's
 * framing collapses to **toggle-persistence**, exactly like reminder rules.
 *
 * Smoke (dependency-upgrade-smoke.spec.ts:780) already covers the "Features"
 * h3 mount. This adds the persistence leg:
 *
 *   /settings/personalization → modules section ("Features" h3) →
 *   Conversations toggle checked (seeded active=1) → click → unchecked →
 *   reload → still unchecked (server persisted via index GET) →
 *   click again to restore → checked.
 *
 * Gating: when `limited` is true the toggle renders with `:disabled="true"`.
 * setPremium(true, accountId) clears the limited gate via
 * has_access_to_paid_version_for_free so the click actually fires.
 *
 * Note: every module's form-toggle uses `:iclass="'module-'"` (no per-id
 * suffix — that's the upstream code), so the row anchor is the module
 * name text, not a class selector.
 *
 * Isolation: fresh user via loginAsFreshUser, symmetric click-back at the
 * end so the spec doesn't degrade if reused against a shared account.
 */

import { test, expect } from '../support/console-gate';
import { loginAsFreshUser } from '../support/auth';
import { setPremium } from '../support/premium';

test.describe('Monica v4 — personalization modules toggle persistence', () => {
  test('disabling a module persists across a reload', async ({ page, consoleGate }) => {
    const { accountId } = await loginAsFreshUser(page);
    setPremium(true, accountId);

    try {
      await page.goto('/settings/personalization');

      // Scope to the Modules.vue wrapper. The h3 is "Features"
      // (settings.personalization_module_title). The Features section also
      // reuses the `.reminder-rules` class on its root div (yes really —
      // both ReminderRules.vue and Modules.vue use the same class), so
      // anchoring by the unique h3 text is the only safe disambiguator.
      const modulesSection = page
        .locator('div.reminder-rules')
        .filter({ has: page.getByRole('heading', { name: 'Features', exact: true }) });
      await expect(modulesSection).toBeVisible();

      // Target the Conversations row. Its name is rendered from the
      // translated `people.conversation_list_title` via the controller's
      // format() method, so the row text is the literal "Conversations"
      // string. (Alternate seeded modules: Documents, Food preferences.)
      const conversationsRow = modulesSection.locator('.dt-row', { hasText: 'Conversations' });
      const conversationsToggle = conversationsRow.locator('label.toggle-switch');
      const conversationsCheckbox = conversationsRow.locator('input.toggle-switch__input');

      // Seeded active=1 — the toggle should start checked. Asserts the
      // baseline before mutation; a regression that ships modules
      // default-off would surface here.
      await expect(conversationsCheckbox).toBeChecked();

      // Toggle off. Same FormToggle wrapping-label pattern as the
      // reminder-rules spec — the input itself has opacity:0 +
      // pointer-events:none. waitForResponse gates the reload.
      const toggleOff = page.waitForResponse(
        (resp) =>
          resp.url().includes('/settings/personalization/modules/') &&
          resp.request().method() === 'POST',
      );
      await conversationsToggle.click();
      await toggleOff;
      await expect(conversationsCheckbox).not.toBeChecked();

      // Persistence check.
      await page.reload();
      const refreshedSection = page
        .locator('div.reminder-rules')
        .filter({ has: page.getByRole('heading', { name: 'Features', exact: true }) });
      const refreshedCheckbox = refreshedSection
        .locator('.dt-row', { hasText: 'Conversations' })
        .locator('input.toggle-switch__input');
      await expect(refreshedCheckbox).not.toBeChecked();

      // Restore.
      const toggleOn = page.waitForResponse(
        (resp) =>
          resp.url().includes('/settings/personalization/modules/') &&
          resp.request().method() === 'POST',
      );
      await refreshedSection.locator('.dt-row', { hasText: 'Conversations' }).locator('label.toggle-switch').click();
      await toggleOn;
      await expect(refreshedCheckbox).toBeChecked();
    } finally {
      setPremium(false, accountId);
    }

    consoleGate.assertNoUnknownErrors('/settings/personalization (modules toggle)');
  });
});
