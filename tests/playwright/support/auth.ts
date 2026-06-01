/**
 * Auth helpers.
 *
 * Two login flows:
 *
 *   loginAsAdmin(page)
 *     Form login as the seeded admin user (admin@admin.com / admin0 by
 *     default; override via SMOKE_ADMIN_EMAIL / SMOKE_ADMIN_PASSWORD).
 *     Used by the smoke walkthrough and any spec that exercises the seeded
 *     admin's account (e.g. tests that need REQUIRES_SUBSCRIPTION toggles
 *     or that don't want to spend the time creating a fresh user).
 *
 *   loginAsFreshUser(page)
 *     Creates a brand-new user via `php artisan setup:frontendtestuser`,
 *     then drives Laravel Dusk's /_dusk/login/<userId> bridge to establish
 *     the session cookie. Mirrors the cypress
 *     Cypress.Commands.add('login', ...) pattern. Each test that needs
 *     isolation from admin's polluted state — anything that creates
 *     contacts, journal entries, notes, etc. — should prefer this so the
 *     state graph stays bounded across runs.
 *
 *     Returns the user id (string). The user's account_id is created fresh
 *     by the User factory and isn't returned here; if a test also needs to
 *     setPremium() on the new account, it can either run the test against
 *     admin (accountId=1) or extend this helper later to look up
 *     account_id via a follow-up shellout.
 */

import type { Page } from '@playwright/test';
import { artisan } from './artisan';

const ADMIN_EMAIL = process.env.SMOKE_ADMIN_EMAIL ?? 'admin@admin.com';
const ADMIN_PASSWORD = process.env.SMOKE_ADMIN_PASSWORD ?? 'admin0';

export async function loginAsAdmin(page: Page): Promise<void> {
  await page.goto('/login');
  await page.getByRole('textbox', { name: 'Email' }).fill(ADMIN_EMAIL);
  await page.getByRole('textbox', { name: 'Password' }).fill(ADMIN_PASSWORD);
  await page.getByRole('button', { name: 'Login' }).click();
  await page.waitForURL('**/dashboard');
}

export async function loginAsFreshUser(page: Page): Promise<string> {
  // PHP versions with display_errors=on interleave deprecation warnings with
  // the command's stdout; the user id is always the last non-empty line. See
  // #592 for the cypress equivalent that taught us this.
  const userId = artisan('setup:frontendtestuser').trim().split(/\r?\n/).pop()!.trim();
  // /_dusk/login returns 200 with an empty body. Use page.request rather
  // than page.goto so the empty / non-HTML response doesn't trip navigation;
  // cookies still persist into the page context.
  const response = await page.request.get(`/_dusk/login/${userId}`);
  if (!response.ok()) {
    throw new Error(`/_dusk/login/${userId} returned ${response.status()}`);
  }
  return userId;
}
