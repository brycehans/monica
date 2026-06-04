/**
 * Contact photos upload (C.4 of #731 Tier C).
 *
 * Extends dependency-upgrade-smoke.spec.ts:849-878 (photos tab mount-only)
 * with the positive upload contract. PhotoList.vue / PhotoUpload.vue render
 * inside the Photos tab on /people/h:<hash>, conditioned on
 * global_profile_default_view === 'photos'. Clicking the "Photos" tab span
 * fires updateDefaultProfileView('photos'); the section then renders the
 * "Upload photo" CTA which reveals the upload zone.
 *
 * Flow:
 *   1. Click Photos tab → PhotoList mounts, list is empty.
 *   2. Click "Upload photo" CTA → PhotoUpload's displayUploadZone = true,
 *      hidden <input id="file"> becomes target-able.
 *   3. setInputFiles with a tiny PNG → POST /people/<hash>/photos → on
 *      success, PhotoList's handleNewPhoto pushes the new photo into the
 *      grid. The card carries a background-image: url(<photo.link>) which
 *      we assert via inline style attribute matching the storage path.
 *
 * Isolation: fresh user, fresh contact, empty photo list. No try/finally
 * tab restoration needed (the persisted default-view preference is on the
 * fresh user, who is discarded at session end).
 */

import { test, expect } from '../support/console-gate';
import { loginAsFreshUser } from '../support/auth';
import { createContact } from '../support/contacts';

// 67-byte 1x1 transparent PNG. Same buffer the smoke avatar tests use
// (dependency-upgrade-smoke.spec.ts:1482-1485). UploadPhoto's `image`
// validator accepts this.
const tinyPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkAAIAAAoAAv/lxKUAAAAASUVORK5CYII=',
  'base64',
);

test.describe('Monica v4 — contact photos upload', () => {
  test('Photos tab → CTA → file input → POST → photo appears in grid', async ({ page, consoleGate }) => {
    await loginAsFreshUser(page);

    await createContact(page, 'Alice', 'Photographed', 'Woman');
    // createContact lands on /people/h:<hash> (the default notes view).
    // Click the Photos tab to flip global_profile_default_view = 'photos'.
    await page.locator('span').filter({ hasText: /^Photos$/ }).click();

    // PhotoList renders its title only inside the 'photos' view. Use it
    // as the gate that the tab swap completed before clicking the CTA.
    await expect(page.getByRole('heading', { name: 'Related photos' })).toBeVisible();

    // PhotoList CTA: people.photo_list_cta = "Upload photo". Anchor; same
    // role/text pattern as the documents CTA.
    await page.getByRole('link', { name: 'Upload photo', exact: true }).click();

    // POST /people/<hash>/photos round-trip. handleNewPhoto pushes the
    // PhotoResource into PhotoList.photos which renders as a w-third-ns
    // card with style="background-image: url(...);".
    const persist = page.waitForResponse(
      (r) => /\/people\/h:[A-Za-z0-9]+\/photos$/.test(r.url())
        && r.request().method() === 'POST'
        && r.ok(),
    );

    await page.locator('input#file').setInputFiles({
      name: 'tier-c4.png',
      mimeType: 'image/png',
      buffer: tinyPng,
    });
    await persist;

    // PhotoList renders one .photo card per uploaded image, with the
    // image-link injected as an inline background-image style. Asserting
    // count rather than parsing the URL keeps the spec resilient to the
    // storage backend (filesystem vs s3) and signed-URL query params.
    await expect(page.locator('.photo')).toHaveCount(1);

    consoleGate.assertNoUnknownErrors('/people/h:<contact> (photos upload)');
  });
});
