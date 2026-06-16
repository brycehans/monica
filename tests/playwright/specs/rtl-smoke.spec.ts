/**
 * RTL safety net for the Bootstrap-CSS → Tachyons migration.
 *
 * Design: docs/plans/2026-06-16-rtl-playwright-smoke-design.md
 *
 * Walks six direction-sensitive surfaces in Hebrew (`he`) and asserts
 * direction-flipping layout properties via computed style. Layout-property
 * assertions are deliberately chosen over screenshots — stable across legit
 * redesigns, catches exactly the regression class the migration is at risk
 * of (an `$htmldir == ltr` SCSS branch deleted in error, or a Vue
 * `dirltr ? 'mr3' : 'ml3'` ternary inverted).
 *
 * Coverage:
 *   1. Dashboard chrome     (header.scss   — 3 $htmldir branches)
 *   2. Contact list         (people.scss   — 7 $htmldir branches)
 *   3. Contact detail       (people/_header.blade.php — 5 dirltr ternaries)
 *   4. Note delete modal    (modal direction inheritance sanity)
 *   5. Journal calendar     (JournalCalendar.vue — useHtmlDir() class swap)
 *   6. Settings personalization (ReminderRules.vue — dirltr ? 'tr' : 'tl')
 *
 * Run prerequisites (full instructions in ../README.md):
 *
 *   1. `docker compose -f docker-compose.dev.yml up -d`
 *   2. `docker compose -f docker-compose.dev.yml exec --user www-data app \
 *        sh -c 'printf "yes\n20\n" | php artisan setup:test'`
 *   3. `yarn run prod` on the host (mounts assets into the container)
 *   4. From this directory: `yarn run rtl-smoke`
 *
 * The spec is idempotent: a re-run finds the locale already Hebrew, the
 * selectOption is a no-op, every assertion still holds. At teardown it
 * flips back to English so other admin-bound smokes (dependency-upgrade,
 * subscription-flow) keep seeing the English navigation accessible names
 * they were written against.
 */

import { test, expect } from '../support/console-gate';
import { loginAsAdmin } from '../support/auth';
import { setUserLocale, expectRtl } from '../support/rtl';

test.describe.serial('Monica v4 — RTL smoke', () => {
  test('six direction-sensitive surfaces render correctly in Hebrew', async ({ page, consoleGate }) => {
    await loginAsAdmin(page);
    await setUserLocale(page, 'he');

    try {
      // --- Surface 1: Dashboard chrome ---------------------------------
      //
      // header.scss:34-39 flips .header-nav text-align: right → left.
      await page.goto('/dashboard');
      await expectRtl(page);
      await expect.poll(
        async () => page.locator('.header-nav').evaluate((el) => getComputedStyle(el).textAlign),
      ).toBe('left');

      // --- Surface 2: Contact list sort dropdown wrapper ---------------
      //
      // people.scss:92-99 absolute-positions .people-list-item.sorting
      // .options with `right: 10px` in LTR; that flips to `left: 10px` in
      // RTL. `right` becomes auto-resolved (a px value computed from the
      // parent), so we assert on `left` being the literal `10px`.
      await page.goto('/people');
      await expect.poll(
        async () => page.locator('.people-list-item.sorting .options').evaluate((el) => getComputedStyle(el).left),
      ).toBe('10px');

      // --- Surface 3: Contact detail page header -----------------------
      //
      // people/_header.blade.php line 57 wraps the birthday icon in a
      // `<span class="{{ htmldir() == 'ltr' ? 'mr1' : 'ml1' }}">`. In
      // RTL, the span's computed margin should be ml=3.5px / mr=0px
      // (Tachyons .ml1).
      //
      // Selector strategy: the first icon list on the contact-detail
      // page is `ul.tc-ns.mb3` (renders next to the page title); its
      // first <li> contains the birthday icon span.
      const firstContactLink = page.locator('a[href*="/people/h:"]').first();
      await firstContactLink.click();
      await expect(page).toHaveURL(/\/people\/h:/);

      const birthdayIconSpan = page.locator('ul.tc-ns.mb3 > li').first().locator('span').first();
      const birthdayMargins = await birthdayIconSpan.evaluate((el) => {
        const cs = getComputedStyle(el);
        return { marginLeft: cs.marginLeft, marginRight: cs.marginRight };
      });
      expect(birthdayMargins.marginLeft).toBe('3.5px');
      expect(birthdayMargins.marginRight).toBe('0px');

      // --- Surface 4: Note delete modal --------------------------------
      //
      // Open delete-note modal on the contact-detail page. We're not
      // asserting on Bootstrap modal close-button position (orphan CSS —
      // modal.scss:13-17 targets a `.close` class no markup uses).
      // Instead this surface guards the modal portal's direction
      // inheritance: if a future refactor teleports the modal somewhere
      // outside <html>, the RTL context would be lost silently. CSS
      // `direction: rtl` resolved on the dialog confirms the chain still
      // holds.
      //
      // The admin seed may have no notes on the first contact; ensure
      // one exists by adding a stamped note via Notes.vue's add form.
      // Notes.vue tags every action trigger with `cy-name` via
      // v-cy-name — stable across i18n (the rendered text is
      // t('app.add')/t('app.delete'), which is what we're avoiding).
      let deleteNoteTrigger = page.locator('[cy-name^="delete-note-button-"]').first();
      if (!(await deleteNoteTrigger.count())) {
        const noteAddArea = page.locator('[cy-name="add-note-textarea"]');
        await noteAddArea.click();
        await noteAddArea.fill(`rtl-smoke note ${Date.now()}`);
        await page.locator('[cy-name="add-note-button"]').click();
        deleteNoteTrigger = page.locator('[cy-name^="delete-note-button-"]').first();
        await expect(deleteNoteTrigger).toBeVisible();
      }
      await deleteNoteTrigger.click();
      // Two elements carry role="dialog" — the outer vfm wrapper and the
      // inner `.monica-modal__panel`. Anchor on the inner panel (the
      // panel is what carries the actual content + aria-label), filtered
      // by a child that only exists inside the delete-confirm modal.
      const dialog = page.locator('.monica-modal__panel').filter({
        has: page.locator('[cy-name^="delete-mode-note-button-"]'),
      });
      await expect(dialog).toBeVisible();
      const dialogDirection = await dialog.evaluate((el) => getComputedStyle(el).direction);
      expect(dialogDirection).toBe('rtl');
      await page.keyboard.press('Escape');
      await expect(dialog).toBeHidden();

      // --- Surface 5: Journal calendar ---------------------------------
      //
      // JournalCalendar.vue applies :class="dirltr ? 'fl' : 'fr'" on
      // .journal-calendar-box. In RTL that becomes Tachyons .fr → float:
      // right.
      await page.goto('/journal');
      await expect.poll(
        async () => page.locator('.journal-calendar-box').first().evaluate((el) => getComputedStyle(el).cssFloat),
      ).toBe('right');

      // --- Surface 6: Settings personalization -------------------------
      //
      // ReminderRules.vue line 32 applies :class="dirltr ? 'tr' : 'tl'"
      // on the actions column cell. The data-testid added in this PR
      // pins the selector against translation drift; in RTL the computed
      // text-align is `left` (Tachyons .tl).
      await page.goto('/settings/personalization');
      const actionsCell = page.locator('[data-testid="reminder-rule-actions-cell"]').first();
      await expect(actionsCell).toBeVisible();
      await expect.poll(
        async () => actionsCell.evaluate((el) => getComputedStyle(el).textAlign),
      ).toBe('left');

      consoleGate.assertNoUnknownErrors('/dashboard, /people, /people/h:<contact>, /journal, /settings/personalization (RTL)');
    } finally {
      // Restore admin to en so subsequent admin-bound smokes
      // (dependency-upgrade-smoke, subscription-flow) see the English
      // nav accessible-names they expect.
      await setUserLocale(page, 'en');
    }
  });
});
