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
 *     Returns { userId, accountId }. The User factory creates a fresh
 *     account per user; we look up `account_id` via a follow-up tinker
 *     shellout so tests that need to toggle premium on the isolated
 *     account can do so without falling back to admin.
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

export type FreshUser = { userId: string; accountId: string; email: string };

export async function loginAsFreshUser(page: Page): Promise<FreshUser> {
  const user = await createFreshUser();
  // /_dusk/login returns 200 with an empty body. Use page.request rather
  // than page.goto so the empty / non-HTML response doesn't trip navigation;
  // cookies still persist into the page context.
  const response = await page.request.get(`/_dusk/login/${user.userId}`);
  if (!response.ok()) {
    throw new Error(`/_dusk/login/${user.userId} returned ${response.status()}`);
  }
  return user;
}

/**
 * Mint a fresh user without driving the Dusk login bridge. Used by specs
 * that need to act as a logged-out visitor (e.g. password reset).
 */
export async function createFreshUser(): Promise<FreshUser> {
  // PHP versions with display_errors=on interleave deprecation warnings with
  // the command's stdout; the user id is always the last non-empty line. See
  // #592 for the cypress equivalent that taught us this.
  const userId = lastLine(artisan('setup:frontendtestuser'));
  // Look up account_id + email so callers can target the isolated account
  // and address it in flows that route through email (reset, verify, etc.).
  const out = lastLine(
    artisan(
      'tinker',
      '--execute',
      `$u = App\\Models\\User\\User::find(${userId}); echo $u->account_id . '|' . $u->email;`,
    ),
  );
  const [accountId, email] = out.split('|');
  return { userId, accountId, email };
}

function lastLine(stdout: string): string {
  return stdout.trim().split(/\r?\n/).pop()!.trim();
}
