/**
 * Account data export — JSON + SQL (#731 A.4).
 *
 * Backup / disaster-recovery surface with zero E2E coverage before this
 * spec. Dev compose runs QUEUE_CONNECTION=sync, so ExportAccount::dispatch
 * resolves in-process during the POST handler and the job lands in the
 * "Last exports" list with status="Done" by the time the redirect renders.
 *
 * For each export type, we:
 *   1. Submit the export form.
 *   2. Assert the success flash and the new "Done" row in the list.
 *   3. Click Download and capture the browser download event; assert the
 *      suggested filename matches the controller's Content-Disposition.
 */

import { test, expect } from '../support/console-gate';
import { loginAsFreshUser } from '../support/auth';

test.describe('Monica v4 — account data export', () => {
  test('JSON export submits, completes, and downloads as monica.json', async ({ page, consoleGate }) => {
    await loginAsFreshUser(page);

    await page.goto('/settings/export');
    await expect(page.getByRole('heading', { name: 'Export your account data' })).toBeVisible();

    await page.getByRole('button', { name: 'Export to Json' }).click();

    await expect(page).toHaveURL(/\/settings\/export$/);
    // Scope to .alert-success — the dev container's Laravel Debugbar
    // dumps the session into the page footer, which duplicates flash text
    // and trips strict-mode matching against an unscoped getByText.
    await expect(page.locator('.alert-success').getByText('Your export has been submitted')).toBeVisible();

    // The exports list has a single "Done" row (fresh user — no prior
    // runs). Exact text match disambiguates from the "Json export is in
    // preview mode" banner that also contains the phrase "Json export".
    await expect(page.getByText('Json export', { exact: true })).toBeVisible();
    await expect(page.getByText('Done', { exact: true })).toBeVisible();

    // Download form is a POST with a JS-triggered submit on the anchor.
    // page.waitForEvent('download') captures the response regardless.
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('link', { name: 'Download' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('monica.json');

    consoleGate.assertNoUnknownErrors('/settings/export (json)');
  });

  test('SQL export submits, completes, and downloads as monica.sql', async ({ page, consoleGate }) => {
    await loginAsFreshUser(page);

    await page.goto('/settings/export');
    await page.getByRole('button', { name: 'Export to SQL' }).click();

    await expect(page).toHaveURL(/\/settings\/export$/);
    // Scope to .alert-success — the dev container's Laravel Debugbar
    // dumps the session into the page footer, which duplicates flash text
    // and trips strict-mode matching against an unscoped getByText.
    await expect(page.locator('.alert-success').getByText('Your export has been submitted')).toBeVisible();
    await expect(page.getByText('SQL export', { exact: true })).toBeVisible();
    await expect(page.getByText('Done', { exact: true })).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('link', { name: 'Download' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('monica.sql');

    consoleGate.assertNoUnknownErrors('/settings/export (sql)');
  });
});
