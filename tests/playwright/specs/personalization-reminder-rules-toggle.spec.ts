/**
 * Personalization → reminder rules toggle persistence (D.3 sub-PR of #731).
 *
 * The reminder-rules surface on /settings/personalization is toggle-only —
 * rules are seeded per-account (7 + 30 days before, both active; see
 * Account::populateDefaultReminderRulesTable) and the user just flips them on
 * and off. There's no create / delete path, so this spec covers the actual
 * gap: the toggle action POSTs and the new state survives a reload.
 *
 * dependency-upgrade-smoke.spec.ts L1454 already asserts the rules section
 * mounts and the plural "X days before" copy renders. What it does NOT cover
 * is the persistence side: clicking the toggle hits
 * `POST /settings/personalization/reminderrules/{id}`, the API flips
 * `active`, and a page reload reflects the new value via the index GET.
 *
 *   /settings/personalization → reminder-rules section → 7-days-before
 *   toggle starts checked (seeded active=1) → click → checkbox flips
 *   unchecked → reload → checkbox still unchecked (server persisted) →
 *   click again to restore → checkbox checked again.
 *
 * Isolation: fresh user. The seeded admin account would also work (the
 * smoke spec runs against it), but driving toggles on the shared admin
 * account risks cross-test ordering issues — another spec could see the
 * flipped state mid-run. Per-test isolation keeps the toggle scoped.
 */

import { test, expect } from '../support/console-gate';
import { loginAsFreshUser } from '../support/auth';

test.describe('Monica v4 — reminder rules toggle persistence', () => {
  test('toggling a rule persists across a reload', async ({ page, consoleGate }) => {
    await loginAsFreshUser(page);
    await page.goto('/settings/personalization');

    // Scope to the reminder-rules wrapper. The personalization page also
    // mounts Modules.vue which reuses similar table chrome, so anchor by
    // the unique <h3> the ReminderRules component owns. Same disambiguator
    // the smoke spec uses (L1445-1448).
    const reminderRules = page
      .locator('div.reminder-rules')
      .filter({ has: page.getByRole('heading', { name: 'Reminder rules', exact: true }) });
    await expect(reminderRules).toBeVisible();

    // The 7-days-before toggle. ReminderRules.vue:36 sets
    // `:iclass="'reminder-rule-' + reminderRule.number_of_days_before"`,
    // so the wrapping <label> picks up `.reminder-rule-7`. The actual
    // checkbox is `.toggle-switch__input` inside it.
    const rule7Toggle = reminderRules.locator('label.reminder-rule-7');
    const rule7Checkbox = rule7Toggle.locator('input.toggle-switch__input');

    // Seed: 7 days rule starts active. Asserts the seeded state before we
    // mutate — protects against a regression that changes the default.
    await expect(rule7Checkbox).toBeChecked();

    // Toggle off. Click the wrapping <label> rather than the (visually
    // hidden) input — the input has `opacity: 0; pointer-events: none`
    // and isn't directly clickable; the label drives the change. Wait
    // for the POST so the second goto() doesn't race the server write.
    const togglePostOff = page.waitForResponse(
      (resp) => resp.url().includes('/settings/personalization/reminderrules/') && resp.request().method() === 'POST',
    );
    await rule7Toggle.click();
    await togglePostOff;
    await expect(rule7Checkbox).not.toBeChecked();

    // Persistence check: reload and assert the toggle survived the
    // round-trip via the GET index endpoint. This is the actual gap —
    // without this, the test would pass against a local-state-only
    // regression (toggle visually flipped, never persisted).
    await page.reload();
    await expect(rule7Checkbox).not.toBeChecked();

    // Restore: flip it back on so the per-account state ends symmetric
    // (the fresh user is throwaway, but the symmetric pattern means this
    // spec doesn't degrade if it's ever rerun on a shared account).
    const togglePostOn = page.waitForResponse(
      (resp) => resp.url().includes('/settings/personalization/reminderrules/') && resp.request().method() === 'POST',
    );
    await rule7Toggle.click();
    await togglePostOn;
    await expect(rule7Checkbox).toBeChecked();

    consoleGate.assertNoUnknownErrors('/settings/personalization (reminder rules toggle)');
  });
});
