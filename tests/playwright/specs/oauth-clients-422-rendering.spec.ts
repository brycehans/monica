/**
 * Server-side 422 rendering via FormErrors + validationErrorsFromAxios.
 *
 * The composition-API migration (#805) extracted a single
 * `validationErrorsFromAxios` helper that ALL 7 converted form SFCs
 * consume in their catch blocks. The helper runtime-validates the
 * Laravel envelope and falls back when the shape is unrecognised.
 *
 * Until this spec landed, the validation path was exercised only by
 * unit tests on the helper itself — no end-to-end coverage proved
 * that a real 422 from the server actually flows through the catch
 * block, lands in `form.errors`, and renders in FormErrors.vue.
 *
 * Why route-mock instead of finding a form whose server is stricter
 * than vuelidate:
 *
 * - The 7 affected forms all use `useVuelidate` with rules that mirror
 *   (or strictly subset) the server-side rules — submitting through
 *   the UI in a way that passes vuelidate but fails the server is
 *   contrived and brittle (e.g. relies on duplicate-name races).
 * - The goal here is to exercise the JS-side pipeline. Whether the
 *   server actually emits a 422 for a given input is a separate
 *   contract that lives in phpunit feature tests, not Playwright.
 * - Route mocking with `page.route` is deterministic, fast, and
 *   directly drives the realistic Laravel envelope shape into axios's
 *   error handler — the same shape errors.spec.ts unit-tests, but
 *   now through the real network stack.
 *
 * The form chosen (OAuth Clients at /settings/api) is the smallest
 * surface area: no contact-hash routing, no relationship setup, two
 * fields both with vuelidate `required` + (for redirect) `url`.
 */
import { test, expect } from '../support/console-gate';
import { loginAsAdmin } from '../support/auth';

test.describe('Monica v4 — OAuth client form: 422 rendering', () => {
  test('server 422 with modern Laravel envelope renders inline via FormErrors and validationErrorsFromAxios', async ({ page, consoleGate }) => {
    // The browser logs an "error" line whenever a fetch returns ≥400;
    // that's the expected outcome here, not a regression. Allowlist
    // it so the console-gate assertion stays meaningful for genuinely
    // unexpected noise.
    // Console matcher only sees msg.text() (the URL lives in msg.location()),
    // so anchor on the 422 status code. Scope is per-test — this allow
    // doesn't leak to other specs.
    consoleGate.allow(/Failed to load resource.*422.*Unprocessable/i, 'deliberate 422 in this spec');

    // Two probe strings that are deliberately verbose so we can grep
    // for them unambiguously in the rendered modal. The "MOCK-422 …"
    // prefix wouldn't appear anywhere else in the i18n catalog.
    const nameError = 'MOCK-422 server rejected the client name';
    const redirectError = 'MOCK-422 redirect URL is not on the allow-list';

    // Intercept POST /oauth/clients BEFORE navigating, so the route is
    // registered when the modal's Save button fires the request. Modern
    // Laravel envelope: { message, errors: { field: [msgs] } }.
    // validationErrorsFromAxios flattens this via Object.values + .flat
    // to ['The given data was invalid.', { name: [...], redirect: [...] }];
    // FormErrors.vue suppresses errors[0] (well-known banner) and renders
    // errors[1] via its nested per-field v-for.
    await page.route('**/oauth/clients', async (route) => {
      if (route.request().method() !== 'POST') {
        await route.continue();
        return;
      }
      await route.fulfill({
        status: 422,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'The given data was invalid.',
          errors: {
            name: [nameError],
            redirect: [redirectError],
          },
        }),
      });
    });

    await loginAsAdmin(page);
    await page.goto('/settings/api');

    // Open the create-client modal. The page exposes a single "Create
    // new client" anchor that flips `showModalClient` on Vue's side.
    await page.getByRole('link', { name: /create new client/i }).click();

    // Scope a Locator to the modal's panel so we don't collide with the
    // (now hidden) page-level h3 that also says "OAuth Clients".
    // Scope by the "Redirect URL" label (unique to this modal among the
    // ones on /settings/api — Personal Access Tokens' modal has no
    // redirect field).
    const modal = page.locator('.monica-modal__panel').filter({ hasText: /Redirect URL/i }).first();
    await expect(modal).toBeVisible();

    // Both inputs need vuelidate-valid values or `store()` short-circuits
    // before the axios call ever fires. (`v$.value.$invalid` → return.)
    // Use realistic shapes: an arbitrary name and a syntactically valid URL.
    await modal.getByRole('textbox', { name: /Name/i }).first().fill('mock client name');
    await modal.getByRole('textbox', { name: /Redirect URL/i }).first().fill('https://example.com/cb');

    // Wait on the mocked response so we know the catch block has had a
    // chance to run before we assert. Awaiting on `waitForResponse`
    // returning before checking the DOM also rules out a race where the
    // assertion runs while errors.value is still []. The matching
    // resource is the one our `route.fulfill` returns (status 422).
    const responsePromise = page.waitForResponse((r) =>
      /\/oauth\/clients$/.test(r.url()) && r.request().method() === 'POST' && r.status() === 422);
    await modal.getByRole('link', { name: /^Create$|^Save$/i }).click();
    const response = await responsePromise;
    expect(response.status()).toBe(422);

    // FormErrors.vue v-for renders each field's message list as <li>
    // bullets. The banner "The given data was invalid." is suppressed by
    // the v-if at line 15. Both probe strings should appear textually.
    await expect(modal).toContainText(nameError);
    await expect(modal).toContainText(redirectError);

    // The well-known banner is suppressed — verify it does NOT appear.
    // (If a future change made errors[0] render unconditionally, this
    // catches the regression.)
    await expect(modal).not.toContainText('The given data was invalid.');

    consoleGate.assertNoUnknownErrors('/settings/api (422 mock)');
  });

  test('server 422 with legacy envelope (field-keyed only) also renders inline', async ({ page, consoleGate }) => {
    // Console matcher only sees msg.text() (the URL lives in msg.location()),
    // so anchor on the 422 status code. Scope is per-test — this allow
    // doesn't leak to other specs.
    consoleGate.allow(/Failed to load resource.*422.*Unprocessable/i, 'deliberate 422 in this spec');

    // Some older Monica controllers may still emit the legacy envelope
    // shape (`{ field: [msgs] }` directly, no `message`/`errors` wrapper).
    // `Object.values(legacy).flat()` collapses that to a flat string[],
    // which FormErrors renders via its `errors[0]` path (not the index-1
    // nested v-for). Locks in both consumer branches.
    const legacyError = 'MOCK-422-LEGACY name was rejected';

    await page.route('**/oauth/clients', async (route) => {
      if (route.request().method() !== 'POST') {
        await route.continue();
        return;
      }
      await route.fulfill({
        status: 422,
        contentType: 'application/json',
        body: JSON.stringify({ name: [legacyError] }),
      });
    });

    await loginAsAdmin(page);
    await page.goto('/settings/api');

    await page.getByRole('link', { name: /create new client/i }).click();
    // Scope by the "Redirect URL" label (unique to this modal among the
    // ones on /settings/api — Personal Access Tokens' modal has no
    // redirect field).
    const modal = page.locator('.monica-modal__panel').filter({ hasText: /Redirect URL/i }).first();
    await expect(modal).toBeVisible();

    await modal.getByRole('textbox', { name: /Name/i }).first().fill('mock client name');
    await modal.getByRole('textbox', { name: /Redirect URL/i }).first().fill('https://example.com/cb');

    const responsePromise = page.waitForResponse((r) =>
      /\/oauth\/clients$/.test(r.url()) && r.request().method() === 'POST' && r.status() === 422);
    await modal.getByRole('link', { name: /^Create$|^Save$/i }).click();
    await responsePromise;

    await expect(modal).toContainText(legacyError);

    consoleGate.assertNoUnknownErrors('/settings/api (legacy 422 mock)');
  });
});
