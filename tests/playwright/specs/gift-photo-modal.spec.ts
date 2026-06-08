/**
 * #781 GF.1 — gift photo viewer modal (resources/js/components/people/gifts/Gift.vue).
 *
 * Locks down the read-only photo modal nested inside each gift card. Click
 * a photo thumbnail → modalPhoto(photo) flips showModalPhoto=true and a
 * <monica-modal> renders a single <img alt="Photos"> at the larger size.
 * No backend call, no form — pure presentation.
 *
 * gift-crud.spec.ts already covers the *parent* Gifts.vue's delete-confirm
 * modal. The per-photo modal in the child Gift.vue had no coverage; this
 * spec is the regression net for the #724 useModal() port of Gift.vue.
 *
 * Seeding shape: the in-UI path to attach a photo to a gift is multi-step
 * (Add a gift → Add a photo → drop file → save → PUT associate) and
 * unrelated to what we're asserting. Tinker-seed gift + photo + pivot
 * directly. Mirrors SeedRegressionDemo's photo-on-contact recipe at
 * app/Console/Commands/SeedRegressionDemo.php:1039-1063.
 */

import { test, expect } from '../support/console-gate';
import { loginAsFreshUser } from '../support/auth';
import { createContact } from '../support/contacts';
import { artisan } from '../support/artisan';

// 67-byte 1x1 transparent PNG. Same fixture the avatar / photo upload
// smoke tests use — small enough to embed inline, valid enough for
// Intervention\Image's mime sniff if the disk read fires.
const TINY_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkAAIAAAoAAv/lxKUAAAAASUVORK5CYII=';

test.describe('Monica v4 — gift photo viewer modal (#781 GF.1)', () => {
  test('clicking a gift photo opens the larger-image modal and closes via Escape', async ({ page, consoleGate }) => {
    const user = await loginAsFreshUser(page);
    await createContact(page, 'Gift', 'Photographer', 'Woman');

    // createContact lands on /people/h:<hash>; the hash isn't needed
    // server-side (we resolve contact by account_id) but capture it so we
    // can return to this URL post-seed.
    const contactUrl = page.url();
    expect(contactUrl).toMatch(/\/people\/h:[A-Za-z0-9]+$/);

    const giftName = `Spec gift ${Date.now()}`;

    // Seed: drop PNG bytes onto the configured disk, create the Photo
    // model row, create a Gift on the just-created contact, attach via the
    // gift_photo pivot. The photo's `link` (PhotoResource::url()) routes
    // through Storage::disk()->url($new_filename); the bytes need to exist
    // on disk so any background-image fetch the browser issues 200s and
    // doesn't trip console noise.
    artisan(
      'tinker',
      '--execute',
      [
        `$contact = App\\Models\\Contact\\Contact::where('account_id', ${user.accountId})->firstOrFail();`,
        `$disk = Illuminate\\Support\\Facades\\Storage::disk(config('filesystems.default'));`,
        `$visibility = config('filesystems.default_visibility');`,
        `$newFilename = 'photos/spec-' . \\Illuminate\\Support\\Str::random(20) . '.png';`,
        `$disk->put($newFilename, base64_decode('${TINY_PNG_BASE64}'), $visibility);`,
        `$photo = App\\Models\\Account\\Photo::create([`,
        `  'account_id' => ${user.accountId},`,
        `  'original_filename' => 'spec-photo.png',`,
        `  'new_filename' => $newFilename,`,
        `  'filesize' => 67,`,
        `  'mime_type' => 'image/png',`,
        `]);`,
        `$gift = App\\Models\\Contact\\Gift::create([`,
        `  'account_id' => ${user.accountId},`,
        `  'contact_id' => $contact->id,`,
        // Gifts.vue defaults to the 'idea' tab on load (Gifts.vue:34);
        // seed there so the card is in the active pane without an
        // extra tab click. gift-crud.spec.ts implicitly relies on the
        // same default — UI-create defaults to status='idea' too.
        `  'status' => 'idea',`,
        `  'name' => '${giftName}',`,
        `]);`,
        `$gift->photos()->syncWithoutDetaching([$photo->id]);`,
      ].join(' '),
    );

    // Reload so Gifts.vue refetches /people/{hash}/gifts and the seeded
    // gift+photo render.
    await page.goto(contactUrl);

    // Locate the gift card by its name. Gift cards on the contact page
    // wrap each entry in a div bordered with Tachyons `.ba.b--gray-monica`
    // (same selector gift-crud.spec.ts uses at L51).
    const giftCard = page.locator('div.ba.b--gray-monica').filter({ hasText: giftName }).first();
    await expect(giftCard).toBeVisible();

    // The photo thumbnail is a clickable div with the component-scoped
    // `.photo` class (defined in Gift.vue's <style scoped>) and a
    // background-image. No semantic role — it's a clickable image preview.
    // Scope to the card so we don't pick up unrelated thumbnails.
    const thumbnail = giftCard.locator('div.photo').first();
    await expect(thumbnail).toBeVisible();

    // Before click: the modal's <img alt="Photos"> isn't mounted yet
    // (v-model boolean is false, monica-modal renders nothing).
    const photoImg = page.getByAltText('Photos');
    await expect(photoImg).toHaveCount(0);

    // Open: clicking the thumbnail fires modalPhoto(photo) which sets
    // url + showModalPhoto=true.
    await thumbnail.click();
    await expect(photoImg).toBeVisible();
    // The <img src> mirrors photo.link — the seeded new_filename should
    // appear in it.
    await expect(photoImg).toHaveAttribute('src', /photos\/spec-/);

    // Close: photo modal renders MonicaModal without `:blocking`, so esc
    // closes it (MonicaModal.vue:52, esc-to-close="!blocking").
    await page.keyboard.press('Escape');
    await expect(photoImg).toBeHidden();

    consoleGate.assertNoUnknownErrors('/people/h:<contact> (gift photo viewer)');
  });
});
