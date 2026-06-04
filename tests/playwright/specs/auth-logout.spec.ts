/**
 * Logout deep contract (#731 Tier B.3).
 *
 * Extends the smoke spec's shallow logout assertion at L577 (which only
 * checks "URL is /(login)? and body mentions Login"). This spec carries
 * the deep behavioural contract:
 *
 *   - the logout link is visible while authenticated,
 *   - hitting /logout terminates the session,
 *   - protected routes redirect to the login surface afterwards
 *     (route('loginRedirect') = '/' — the login form is rendered at the
 *     root path, not at /login; see App\Http\Middleware\Authenticate),
 *   - the header partial that hosts the logout link is gone.
 *
 * Smoke L577 deliberately stays in place as a fast canary in the
 * dependency-upgrade pass — see docs/superpowers/specs/2026-06-04-731-tier-b-design.md
 * decision (1) for why.
 *
 * The header logout link is selected via data-testid="header-logout"
 * (added to both viewport variants in resources/views/partials/header.blade.php)
 * because (a) the desktop icon variant has no accessible name and
 * (b) the mobile text variant is display:none on default Playwright
 * viewport, so getByRole('link', { name: 'Logout' }) matches nothing.
 */

import { test, expect } from '../support/console-gate';
import { loginAsFreshUser } from '../support/auth';

test.describe('Monica v4 — logout deep contract', () => {
  test('hitting /logout terminates the session and clears header identity', async ({ page, consoleGate }) => {
    await loginAsFreshUser(page);
    await page.goto('/dashboard');

    // Pre-condition: the header partial is rendered while authenticated,
    // so at least one header-logout link exists in the DOM. .first()
    // picks the viewport-visible variant.
    await expect(page.getByTestId('header-logout').first()).toBeVisible();

    await page.goto('/logout');

    // Contract 1: subsequent visit to a protected route redirects to the
    // login surface. App\Http\Middleware\Authenticate sends guests to
    // route('loginRedirect'), which is '/' — the login form is rendered
    // there directly without a further redirect to '/login'.
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/(login)?$/);

    // Contract 2: the entire header partial is no longer rendered, so
    // both header-logout variants are gone. Using toHaveCount(0) instead
    // of toBeHidden() because the elements are absent from the DOM, not
    // hidden by CSS.
    await expect(page.getByTestId('header-logout')).toHaveCount(0);

    // Contract 3: the re-entry surface (login form) is rendered.
    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();

    consoleGate.assertNoUnknownErrors('/logout deep');
  });
});
