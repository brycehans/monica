/**
 * Red test for #808 — `test.fail()`-annotated regression spec.
 *
 * ContactFieldTypes.vue fires the success notification from `store()`
 * BEFORE awaiting `persistClient()`. That means even when the server
 * rejects the create with 422, the user sees "The contact field type
 * has been successfully added." appear alongside the inline form
 * errors. Pre-existing UX bug; predates the composition-API conversion
 * in PR #805 and was surfaced during the post-refactor audit.
 *
 * Test contract (what should be true after the fix):
 *   - Submitting an invalid form returns 422.
 *   - FormErrors renders the validation messages.
 *   - The success toast does NOT appear.
 *
 * Current state:
 *   - The toast fires synchronously when the user clicks Save —
 *     `store()` calls `persistClient(...)` without awaiting and then
 *     calls `notify(...)` on the next line. The toast renders, the
 *     persistClient promise eventually rejects, FormErrors renders
 *     the validation lines underneath. Both visible at the same time.
 *
 * `test.fail()` semantics:
 *   - Playwright runs the test, expects it to fail. If the assertion
 *     fails (bug present), Playwright counts it as a pass.
 *   - When #808 is fixed, the assertion will pass — Playwright then
 *     reports the test as an UNEXPECTED PASS (a regression in the
 *     test annotation), prompting the fix-author to delete the
 *     `test.fail()` line. The test then runs as a normal green spec.
 */
import { test, expect } from '../support/console-gate';
import { loginAsAdmin } from '../support/auth';

test.describe('Monica v4 — ContactFieldTypes eager-toast (#808)', () => {
  test.fail('success toast should NOT appear when persistClient is rejected', async ({ page, consoleGate }) => {
    consoleGate.allow(/Failed to load resource.*422.*Unprocessable/i, 'deliberate 422 in this spec');

    const fieldError = 'MOCK-CFT-422 name was rejected by the server';

    // Modern Laravel envelope, same shape oauth-clients-422-rendering uses.
    await page.route('**/settings/personalization/contactfieldtypes', async (route) => {
      if (route.request().method() !== 'POST') {
        await route.continue();
        return;
      }
      await route.fulfill({
        status: 422,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'The given data was invalid.',
          errors: { name: [fieldError] },
        }),
      });
    });

    await loginAsAdmin(page);
    await page.goto('/settings/personalization');

    // The "Add new field type" link is in the Contact Field Types panel
    // (one of several panels on /settings/personalization). The role+name
    // selector is unambiguous because no other panel uses this exact
    // English string.
    await page.getByRole('link', { name: 'Add new field type' }).click();

    // Scope by the modal's aria-label (MonicaModal sets it from `title`).
    // No cy-name on this modal yet — adding one would conflict with
    // keeping this commit narrowly scoped to the red test.
    const modal = page.getByRole('dialog', { name: /Add a new contact field type/i });
    await expect(modal).toBeVisible();

    // The form has three HTML5 `required` inputs (Name, Protocol, Icon);
    // the server-side mock won't honour any of these client-side
    // constraints, so we fill them with anything non-empty to get past
    // the browser-level required-field guard.
    await modal.getByRole('textbox', { name: /Name/i }).first().fill('mock-name');
    await modal.getByRole('textbox', { name: /Protocol/i }).first().fill('mock-protocol');
    await modal.getByRole('textbox', { name: /Icon/i }).first().fill('fa fa-mock');

    // Wait on the mocked response so we know the catch path has fired
    // and FormErrors has rendered before we make the assertion.
    const responsePromise = page.waitForResponse((r) =>
      /\/settings\/personalization\/contactfieldtypes$/.test(r.url())
        && r.request().method() === 'POST'
        && r.status() === 422);

    // The form's Save button — title key is `app.save` ("Save") for
    // existing rows and `app.create` ("Create") for new ones. New row
    // here, so "Create".
    await modal.getByRole('link', { name: /^Save$|^Create$/ }).click();
    await responsePromise;

    // Sanity: the inline validation error rendered.
    await expect(modal).toContainText(fieldError);

    // The contract: success toast must not appear when the server
    // rejected the submission. Short timeout because the bug, if
    // present, renders the toast synchronously — we want the
    // assertion to evaluate while the toast is still on screen
    // (notifications auto-dismiss after ~3s by default).
    //
    // When #808 is fixed: this assertion passes → test.fail()
    // surfaces as an unexpected pass → remove the .fail() annotation.
    const successToast = page.getByText('The contact field type has been successfully added.');
    await expect(successToast).not.toBeVisible({ timeout: 500 });
  });
});
