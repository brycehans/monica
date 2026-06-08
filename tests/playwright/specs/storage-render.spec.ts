/**
 * Storage usage page render (D.4 of #731 Tier D).
 *
 * Zero E2E coverage today. The issue scopes this row at smoke-style
 * render-only — no upload/delete interaction; the upload paths are already
 * covered by C.3 (documents) and C.4 (photos).
 *
 *   /settings/storage → "Storage" heading → account-info line with the
 *   substituted MB/percent values → description paragraph → table header
 *   row (Timestamp / Object / Size (Kb) / Subject) is rendered.
 *
 * Isolation: fresh user. A freshly minted account has zero documents and
 * zero photos, so the `@foreach($elements as $element)` body in
 * settings/storage/index.blade.php contributes no data rows — only the
 * static header row is asserted. Running this against the seeded admin
 * would still pass, but the data-row count would drift with dev usage.
 */

import { test, expect } from '../support/console-gate';
import { loginAsFreshUser } from '../support/auth';

test.describe('Monica v4 — storage settings page', () => {
  test('renders heading, account-info line, description, and table header', async ({ page, consoleGate }) => {
    await loginAsFreshUser(page);
    await page.goto('/settings/storage');

    // Heading. `h3` rather than role=heading-with-name to disambiguate from
    // the sidebar link (which has accessible name "Storage" too).
    await expect(page.locator('h3', { hasText: 'Storage' })).toBeVisible();

    // Account-info paragraph. Substitutes :accountLimit / :currentAccountSize
    // / :percentUsage server-side; asserting against the rendered text proves
    // the substitution path ran (a regression that left placeholders
    // unrendered would surface as literal ":accountLimit" in the DOM).
    //
    // `\s` rather than a literal space between the number and "MB" because
    // Laravel's translator emits a U+2009 THIN SPACE (char code 8201) between
    // the substituted numeric placeholder and the trailing literal token —
    // not a regular U+0020. `\s` matches both.
    await expect(
      page.getByText(/Your account limit is \d+\s+MB\. Your current usage is \d+\s+MB \(about \d+%\)\./),
    ).toBeVisible();

    // Description paragraph.
    await expect(
      page.getByText('Here you can see all the documents and photos uploaded about your contacts.'),
    ).toBeVisible();

    // Table header row. Fresh user has no documents/photos, so this is the
    // only row in the table. Anchors the columns the storage view exposes.
    await expect(page.getByText('Timestamp', { exact: true })).toBeVisible();
    await expect(page.getByText('Object', { exact: true })).toBeVisible();
    await expect(page.getByText('Size (Kb)', { exact: true })).toBeVisible();
    await expect(page.getByText('Subject', { exact: true })).toBeVisible();

    consoleGate.assertNoUnknownErrors('/settings/storage');
  });
});
