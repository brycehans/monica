/**
 * Contact documents upload (C.3 of #731 Tier C).
 *
 * Covers DocumentList.vue, mounted inline on the contact detail page under
 * the `documents` module (profile.blade.php:162-166). Drives the full
 * empty-state-to-populated flow:
 *
 *   1. Detail page mounts <document-list>; the empty-state CTA reads
 *      "Upload document" (people.document_list_cta).
 *   2. Clicking the CTA reveals the upload zone with a hidden
 *      <input id="file"> (opacity:0 absolute-overlay, accepts files via
 *      setInputFiles).
 *   3. POST /people/<hash>/documents stores the file via UploadDocument.
 *      On success, the response gets pushed into the documents array and
 *      rendered as a table row with original_filename.
 *
 * Isolation: fresh user with one contact, no existing documents. The
 * upload binary is a tiny inline buffer — no fixtures, no disk I/O.
 *
 * The fresh account is granted has_access_to_paid_version_for_free so the
 * documents/index.blade.php gate
 *   @if (config('monica.requires_subscription') && $accountHasLimitations)
 * falls through to the <document-list> branch. The dev rig hard-codes
 * REQUIRES_SUBSCRIPTION=true in docker-compose.dev.yml, so without the
 * paid-access toggle every fresh user sees the upgrade prompt instead of
 * the upload UI. auth.ts's docstring explicitly anticipates this toggle.
 */

import { test, expect } from '../support/console-gate';
import { loginAsFreshUser } from '../support/auth';
import { createContact } from '../support/contacts';
import { artisan } from '../support/artisan';

test.describe('Monica v4 — contact documents upload', () => {
  test('CTA → file input → POST → document appears in list', async ({ page, consoleGate }) => {
    const user = await loginAsFreshUser(page);
    artisan(
      'tinker',
      '--execute',
      `$a = App\\Models\\Account\\Account::find(${user.accountId}); ` +
        `$a->has_access_to_paid_version_for_free = true; $a->save();`,
    );

    await createContact(page, 'Alice', 'Documented', 'Woman');
    // createContact lands on /people/h:<hash> (the default notes view),
    // and the documents section is rendered inline within that view —
    // no tab click needed.

    // The DocumentList CTA is an <a class="btn edit-information"> with no
    // href, so getByRole('link') doesn't match (HTML/ARIA: bare <a> isn't
    // a link). Scope to the anchor class and filter by visible text. The
    // CTA is gated on no-upload-zone-active state — true on first visit
    // for a fresh contact.
    const filename = `tier-c3-${Date.now()}.txt`;
    const fileBuffer = Buffer.from('tier C.3 spec fixture content', 'utf-8');

    await page.locator('a.edit-information').filter({ hasText: 'Upload document' }).click();

    // Wait for the POST /people/<hash>/documents round-trip. The Vue
    // component pushes the response into `this.documents`, which the
    // template renders as a <div class="table-row"> containing
    // `{{ document.original_filename }}`.
    const persist = page.waitForResponse(
      (r) => /\/people\/h:[A-Za-z0-9]+\/documents$/.test(r.url())
        && r.request().method() === 'POST'
        && r.ok(),
    );

    await page.locator('input#file').setInputFiles({
      name: filename,
      mimeType: 'text/plain',
      buffer: fileBuffer,
    });
    await persist;

    // The new row carries the original_filename as a table-cell. Scope
    // the locator to the documents section by filtering on the unique
    // filename marker so we don't pick up matches elsewhere on the page.
    await expect(page.locator('.table-row').filter({ hasText: filename })).toHaveCount(1);

    consoleGate.assertNoUnknownErrors('/people/h:<contact> (documents upload)');
  });
});
