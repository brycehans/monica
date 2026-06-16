/**
 * RTL helpers for the rtl-smoke spec.
 *
 * The locale flip is per-user via /settings, NOT a config override —
 * exercises the same code path real users hit (User.locale → app.locale
 * middleware → htmldir() → SCSS branch + Vue useHtmlDir() reactivity).
 *
 * Note for future readers: the design called for /settings/personalization
 * but the actual locale form lives on /settings (route name settings.save),
 * with the personalization sub-page reserved for genders / contact-field-
 * types / reminder-rules CRUD.
 */

import { expect, type Page } from '@playwright/test';

export async function setUserLocale(page: Page, locale: 'he' | 'en'): Promise<void> {
  await page.goto('/settings');
  await page.locator('select[name="locale"]').selectOption(locale);
  // Multiple forms render on /settings (delete-account, reset-account…); scope
  // the submit to the settings.save form by its action attribute.
  await page.locator('form[action$="/settings/save"] button[type="submit"]').click();
  await page.waitForURL(/\/settings(?:$|[/?])/);
  // Gate the helper: if the flip silently failed (form error, wrong selector,
  // locale not persisted), fail here rather than as a confusing layout-
  // assertion failure three surfaces later.
  await expect(page.locator('html')).toHaveAttribute(
    'dir',
    locale === 'he' ? 'rtl' : 'ltr',
  );
}

export async function expectRtl(page: Page): Promise<void> {
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
}
