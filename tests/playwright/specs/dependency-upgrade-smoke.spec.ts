/**
 * Dependency-upgrade smoke walkthrough.
 *
 * Drives the exact path documented in CLAUDE.md as the manual gate after each
 * dependency tranche: dashboard → contact list → contact detail → reminders
 * → journal → settings → search → vCard export → logout. Captures Vue 2 /
 * browser console errors per page; fails on anything outside the baseline
 * allowlist (which tracks the open issues filed during PR #623 verification).
 *
 * Run prerequisites (full instructions in ../README.md):
 *
 *   1. `docker compose -f docker-compose.dev.yml up -d`
 *   2. `docker compose -f docker-compose.dev.yml exec --user www-data app \
 *        sh -c 'printf "yes\n20\n" | php artisan setup:test'`
 *   3. From this directory: `yarn install && yarn run smoke`
 *
 * Override target with SMOKE_BASE_URL=http://other.host:1234 if not using the
 * local compose stack.
 */

import { test, expect, Page, ConsoleMessage } from '@playwright/test';

const ADMIN_EMAIL = process.env.SMOKE_ADMIN_EMAIL ?? 'admin@admin.com';
const ADMIN_PASSWORD = process.env.SMOKE_ADMIN_PASSWORD ?? 'admin0';

// Console messages we know about and have filed issues for. Anything new and
// outside this list fails the smoke. Keep entries short and link the issue.
const KNOWN_CONSOLE_NOISE: { match: RegExp; issue: string }[] = [
  // #624 — ContactSelect references undefined blur/focus handlers
  { match: /Property or method "(?:blur|focus)" is not defined/, issue: '#624' },
  { match: /Invalid handler for event "search:(?:blur|focus)"/, issue: '#624' },
  // #625 — Unknown <error> element in ContactFieldTypes.vue
  { match: /Unknown custom element: <error>/, issue: '#625' },
  // #626 — PWA manifest missing url/id in related_applications
  { match: /Manifest: one of 'url' or 'id' is required/, issue: '#626' },
];

type UnknownConsole = { type: string; text: string; url: string };

function attachConsoleCapture(page: Page): { unknown: UnknownConsole[]; allKnown: { issue: string; text: string }[] } {
  const unknown: UnknownConsole[] = [];
  const allKnown: { issue: string; text: string }[] = [];
  const handler = (msg: ConsoleMessage) => {
    if (msg.type() !== 'error' && msg.type() !== 'warning') return;
    const text = msg.text();
    const matched = KNOWN_CONSOLE_NOISE.find((entry) => entry.match.test(text));
    if (matched) {
      allKnown.push({ issue: matched.issue, text });
      return;
    }
    unknown.push({ type: msg.type(), text, url: msg.location().url });
  };
  page.on('console', handler);
  page.on('pageerror', (err) => unknown.push({ type: 'pageerror', text: err.message, url: '' }));
  return { unknown, allKnown };
}

function assertNoUnknownConsoleErrors(unknown: UnknownConsole[], pageLabel: string) {
  if (unknown.length === 0) return;
  const lines = unknown.map((e) => `  [${e.type}] ${e.text}${e.url ? ` @ ${e.url}` : ''}`).join('\n');
  throw new Error(`Unexpected console output on ${pageLabel}:\n${lines}`);
}

async function login(page: Page): Promise<void> {
  await page.goto('/login');
  await page.getByRole('textbox', { name: 'Email' }).fill(ADMIN_EMAIL);
  await page.getByRole('textbox', { name: 'Password' }).fill(ADMIN_PASSWORD);
  await page.getByRole('button', { name: 'Login' }).click();
  await page.waitForURL('**/dashboard');
}

// Base64url-no-padding decode. The PHP server (web-auth/webauthn-lib) decodes
// `clientDataJSON` and `id` via ParagonIE\ConstantTime\Base64UrlSafe::decodeNoPadding,
// which is strict — it only accepts the base64url charset (`-`, `_`) and rejects
// any string ending in `=`. Mirroring that exact contract here lets the test
// fail loudly if the client ever regresses to plain base64.
function decodeBase64UrlNoPadding(value: string): Uint8Array {
  if (/[^A-Za-z0-9_-]/.test(value)) throw new Error(`not base64url: ${value.slice(0, 32)}…`);
  if (value.endsWith('=')) throw new Error('base64url-no-padding required, got padding');
  const pad = value.length % 4 === 0 ? '' : '='.repeat(4 - (value.length % 4));
  return Uint8Array.from(Buffer.from(value.replace(/-/g, '+').replace(/_/g, '/') + pad, 'base64'));
}

test.describe('Monica v4 — dependency-upgrade smoke walkthrough', () => {
  test('login lands on dashboard with expected nav', async ({ page }) => {
    const { unknown } = attachConsoleCapture(page);

    await login(page);

    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Contacts' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Journal' })).toBeVisible();

    // Statistics tiles confirm the seed data is loaded
    await expect(page.locator('body')).toContainText(/Contacts/);
    await expect(page.locator('body')).toContainText(/Activities/);

    assertNoUnknownConsoleErrors(unknown, '/dashboard');
  });

  test('contact list renders with expected count', async ({ page }) => {
    const { unknown } = attachConsoleCapture(page);

    await login(page);
    await page.goto('/people');

    // The contact list links use /people/h:<hash>. Count is approximate (seed
    // generates >= 20) — we just want to confirm it's not empty.
    const contactLinks = await page.locator('a[href*="/people/h:"]').count();
    expect(contactLinks).toBeGreaterThan(10);

    assertNoUnknownConsoleErrors(unknown, '/people');
  });

  test('contact detail renders the full section graph', async ({ page }) => {
    const { unknown } = attachConsoleCapture(page);

    await login(page);
    await page.goto('/people');
    const firstContact = page.locator('a[href*="/people/h:"]').first();
    await firstContact.click();
    await page.waitForURL(/\/people\/h:[A-Za-z0-9]+$/);

    // The contact detail aggregates relationships, conversations, calls,
    // activities, reminders, gifts, debts, documents. Each is a recognisable
    // heading; a bump that breaks Eloquent / blade-rendering tends to take out
    // one or more of these.
    for (const heading of [
      /Conversations/i,
      /Phone calls/i,
      /Activities/i,
      /Reminders/i,
      /Gifts/i,
      /Debts/i,
      /Documents/i,
    ]) {
      await expect(page.locator('body')).toContainText(heading);
    }

    assertNoUnknownConsoleErrors(unknown, '/people/h:<contact>');
  });

  test('add-note flow: note persists into list with typed body', async ({ page }) => {
    // Guards the exact regression PR-D's cypress 15 bump retired: PR-C's
    // marked → DOMPurify swap broke the notes render path on Electron 12's
    // Chromium 89, but CI didn't notice (no cypress workflow). Modern
    // Chromium (this playwright run, cypress 15's Electron 37) renders fine;
    // having the assertion here means a future marked / DOMPurify / axios
    // bump that breaks the POST-then-update-list path fails the per-PR smoke.
    const { unknown } = attachConsoleCapture(page);

    await login(page);
    await page.goto('/people');
    const firstContact = page.locator('a[href*="/people/h:"]').first();
    await firstContact.click();
    await page.waitForURL(/\/people\/h:[A-Za-z0-9]+$/);

    const marker = `smoke note ${Date.now()}`;
    await page.locator('textarea[cy-name=add-note-textarea]').click();
    await page.locator('textarea[cy-name=add-note-textarea]').fill(marker);
    await page.locator('a[cy-name=add-note-button]').click();

    // Notes.vue calls getNotes() after the POST resolves; the list ul must
    // contain the new marker text once the round-trip + re-render settle.
    await expect(page.locator('ul[cy-name=notes-body]')).toContainText(marker);

    assertNoUnknownConsoleErrors(unknown, '/people/h:<contact> (add-note)');
  });

  test('add-journal-entry flow: entry persists into list with typed body', async ({ page }) => {
    // Same regression guard as the add-note test above, but for the journal
    // surface — JournalContentEntry.vue's compiledMarkdown was the other PR-C
    // casualty on Electron 12. The /journal route shows the entry list after
    // submission via JournalList.vue, which re-fetches and re-renders.
    const { unknown } = attachConsoleCapture(page);

    await login(page);
    await page.goto('/journal');

    const marker = `smoke entry ${Date.now()}`;
    await page.locator('a[cy-name=add-entry-button]').click();
    await page.waitForURL(/\/journal\/add$/);
    await page.locator('[name=entry]').fill(marker);
    await page.locator('[cy-name=save-entry-button]').click();
    await page.waitForURL(/\/journal$/);

    await expect(page.locator('[cy-name=journal-entries-body]')).toContainText(marker);

    assertNoUnknownConsoleErrors(unknown, '/journal (add-entry)');
  });

  test('vCard export downloads a valid VCARD 4.0', async ({ page }) => {
    const { unknown } = attachConsoleCapture(page);

    await login(page);
    await page.goto('/people');
    const firstContact = page.locator('a[href*="/people/h:"]').first();
    const contactHref = await firstContact.getAttribute('href');
    expect(contactHref).toBeTruthy();

    // Use the page's request context (carries the session cookie) rather than
    // page.goto() — the vcard endpoint sets Content-Disposition: attachment,
    // which Chromium aborts the navigation for.
    const response = await page.request.get(`${contactHref}/vcard`);
    expect(response.status()).toBe(200);
    const vcard = await response.text();

    expect(vcard).toContain('BEGIN:VCARD');
    expect(vcard).toContain('VERSION:4.0');
    expect(vcard).toMatch(/PRODID:.*Sabre VObject/);
    expect(vcard).toContain('FN:');
    expect(vcard).toContain('END:VCARD');

    assertNoUnknownConsoleErrors(unknown, '/people/h:<contact>/vcard');
  });

  test('journal page renders', async ({ page }) => {
    const { unknown } = attachConsoleCapture(page);

    await login(page);
    await page.goto('/journal');
    // Journal renders even with no entries — what we care about is no crash.
    // `exact: true` is required to avoid matching the "Add a journal entry"
    // button alongside the navbar link.
    await expect(page.getByRole('link', { name: 'Journal', exact: true })).toBeVisible();

    assertNoUnknownConsoleErrors(unknown, '/journal');
  });

  test('reminders create form renders', async ({ page }) => {
    const { unknown } = attachConsoleCapture(page);

    await login(page);
    await page.goto('/people');
    const firstContact = page.locator('a[href*="/people/h:"]').first();
    const contactHref = await firstContact.getAttribute('href');
    expect(contactHref).toBeTruthy();

    await page.goto(`${contactHref}/reminders/create`);

    // The form has 30 inputs / textareas / selects in v4.1.2; we accept >=10
    // so seed shape changes don't churn this. Catches "form refuses to render"
    // bumps (Carbon / validator issues / blade includes).
    const formFields = await page.locator('input, textarea, select').count();
    expect(formFields).toBeGreaterThan(10);
    const submitButtons = await page.locator('button[type="submit"], input[type="submit"]').count();
    expect(submitButtons).toBeGreaterThan(0);

    assertNoUnknownConsoleErrors(unknown, '/people/h:<contact>/reminders/create');
  });

  test('settings sub-nav exposes the expected sections', async ({ page }) => {
    attachConsoleCapture(page);  // captured but not asserted — see #624
    // /settings is the page with the known ContactSelect Vue noise (#624).
    // We don't assert clean console here — instead we just verify the page
    // structurally renders. The console-noise filter still tracks #624 errors
    // so any *new* error on this page would fail other tests via the same
    // KNOWN_CONSOLE_NOISE allowlist.

    await login(page);
    await page.goto('/settings');

    // Some of these are rendered with Tachyons responsive classes (e.g. `dn-l`
    // hides the text label at desktop sizes in favour of an icon). We assert
    // they're attached to the DOM, not necessarily visible — what matters here
    // is that the blade template still composes the full sub-nav after a bump,
    // not which breakpoint shows what.
    for (const sub of ['Settings', 'Personalization', 'Storage', 'Export data', 'Import data', 'Users', 'Tag management']) {
      await expect(page.locator('a[href*="/settings"]', { hasText: sub })).toBeAttached();
    }
  });

  test('search APIs return JSON with matching contact', async ({ page, request }) => {
    await login(page);

    // /api/contacts — the OAuth-secured REST endpoint
    const apiResponse = await page.request.get('/api/contacts?query=a', {
      headers: { Accept: 'application/json' },
    });
    expect(apiResponse.status()).toBe(200);
    const apiJson = await apiResponse.json();
    expect(apiJson.data).toBeDefined();
    expect(Array.isArray(apiJson.data)).toBe(true);
    expect(apiJson.data.length).toBeGreaterThan(0);

    // /people/list — the session-cookie autocomplete endpoint
    const listResponse = await page.request.get('/people/list?query=a', {
      headers: { Accept: 'application/json' },
    });
    expect(listResponse.status()).toBe(200);
    const listJson = await listResponse.json();
    expect(listJson.totalRecords).toBeGreaterThan(0);
    expect(Array.isArray(listJson.contacts)).toBe(true);
  });

  test('oauth client create flow: secret modal surfaces the plain secret once', async ({ page }) => {
    // Locks down the #703 fix: Clients.vue captures the create-response,
    // pushes the new client into the list locally, and opens a one-shot
    // <sweet-modal> showing the plain secret. v13 hashes secrets at
    // insertion so the plain value is only available in that response —
    // the previous "refetch the index" path silently dropped it.
    await login(page);
    await page.goto('/settings/api');

    const marker = `smoke client ${Date.now()}`;

    // Open the Create Client modal.
    await page.getByRole('link', { name: 'Create New Client' }).click();
    const createModal = page.locator('.sweet-modal-overlay').filter({ hasText: 'Create Client' });
    await expect(createModal).toBeVisible();

    // Fill name + redirect, submit.
    await createModal.locator('input[name="client-name"]').fill(marker);
    await createModal.locator('input[name="redirect-url"]').fill('https://example.com/oauth/cb');
    await createModal.getByRole('link', { name: 'Create', exact: true }).click();

    // Create modal closes, Client Secret modal opens with the plain value.
    await expect(createModal).toBeHidden();
    const secretModal = page.locator('.sweet-modal-overlay').filter({ hasText: 'Client Secret' });
    await expect(secretModal).toBeVisible();

    const secretText = (await secretModal.locator('[cy-name="client-secret-display"] code').textContent())?.trim() ?? '';
    expect(secretText.length).toBeGreaterThanOrEqual(40);
    // Passport generates Str::random(40) for the secret — alphanumeric only.
    expect(secretText).toMatch(/^[A-Za-z0-9]+$/);

    // Close the secret modal. The new client should still be in the list.
    await secretModal.getByRole('link', { name: 'Close', exact: true }).click();
    await expect(secretModal).toBeHidden();
    await expect(page.locator('body')).toContainText(marker);

    // Cleanup so the dev DB doesn't accumulate clients across smoke runs.
    const row = page.locator('.dt-row', { hasText: marker });
    await row.locator('em.fa-trash-o').click();
    await expect(page.locator('.dt-row', { hasText: marker })).toHaveCount(0);
  });

  // -------------------------------------------------------------------------
  // Vue 3 migration cutover guards (issue #702, pr-t1).
  //
  // Each scenario below exercises a user-observable surface that the cutover
  // swaps a vue-2-only library for a vue-3-compatible one. Assertions track
  // behaviour (a row count changes, a modal appears, a translated string is
  // rendered), not implementation, so they survive the plugin swap and act as
  // a contract the cutover PR has to honour.
  // -------------------------------------------------------------------------

  test('contact list table renders with pagination footer and search filtering', async ({ page }) => {
    // Guards the vue-good-table → vue-good-table-next swap in pr-v.
    // ContactList.vue is server-paginated; the dev seed only generates ~20
    // contacts (one page), so we don't assert that the next-page button does
    // something — only that the pagination footer is rendered, and that the
    // global search filters rows on the server round-trip.
    const { unknown } = attachConsoleCapture(page);

    await login(page);
    await page.goto('/people');

    // Initial rows
    const rows = page.locator('table.vgt-table tbody tr');
    await expect(rows.first()).toBeVisible();
    const initialRowCount = await rows.count();
    expect(initialRowCount).toBeGreaterThan(0);

    // Pagination footer is rendered (single-page or multi-page; just guard the widget renders)
    await expect(page.locator('.vgt-wrap__footer')).toBeVisible();

    // Search filters via the server. Use a string with no matches in the seed.
    const searchInput = page.locator('.vgt-global-search__input input.vgt-input');
    await searchInput.fill('zzzz-no-match-marker');
    await expect(page.locator('table.vgt-table')).toContainText('No results found');

    // Clear and confirm rows return.
    await searchInput.fill('');
    await expect(rows.first()).toBeVisible();
    expect(await rows.count()).toBeGreaterThan(0);

    assertNoUnknownConsoleErrors(unknown, '/people (vgt search)');
  });

  test('gender personalization modal: create persists into list', async ({ page }) => {
    // Guards the sweet-modal-vue → vue-final-modal swap (17 files, 32 modals).
    // The gender create modal is the simplest representative: open → fill →
    // save → list updates. If the modal can't open, can't render its form,
    // or the v-model on createForm.name breaks, this fails.
    const { unknown } = attachConsoleCapture(page);

    await login(page);
    await page.goto('/settings/personalization');

    const newGenderName = `smoke gender ${Date.now()}`;

    // The "Add new gender type" anchor opens the sweet-modal.
    await page.getByRole('link', { name: 'Add new gender type' }).click();

    // sweet-modal renders inside .sweet-modal-overlay. We scope to that
    // container so we don't pick up unrelated form-input components on the
    // page underneath (Genders / Contact field types / etc. all share the
    // same form-input).
    const modal = page.locator('.sweet-modal-overlay').filter({ hasText: 'Add gender type' });
    await expect(modal).toBeVisible();

    // The "Name" field — first text input inside the modal. form-input
    // generates dynamic IDs (`+_uid`) so we target by position rather than id.
    await modal.locator('input[type="text"]').first().fill(newGenderName);

    // The "Save" action is an <a class="btn btn-primary"> with text "Save".
    await modal.getByRole('link', { name: 'Save', exact: true }).click();

    // Modal closes and the new gender appears in the table.
    await expect(modal).toBeHidden();
    await expect(page.locator('body')).toContainText(newGenderName);

    assertNoUnknownConsoleErrors(unknown, '/settings/personalization (gender modal)');
  });

  test('personal access tokens: vuelidate flags empty name', async ({ page }) => {
    // Guards the vuelidate@0.7 → @vuelidate/core@2 migration (6 files,
    // $v → v$). The PAT create modal validates the name field with the
    // `required` rule; submitting empty must surface the inline error and
    // not POST. If validation breaks silently, the empty-name request would
    // 422 from the server instead — that's the regression this catches.
    const { unknown } = attachConsoleCapture(page);

    await login(page);
    await page.goto('/settings/api');

    await page.getByRole('link', { name: 'Create New Token' }).click();

    const modal = page.locator('.sweet-modal-overlay').filter({ hasText: 'Create Token' });
    await expect(modal).toBeVisible();

    // Click "Create" without filling the name field. The button is an
    // <a class="btn btn-primary"> with @click.prevent="store"; vuelidate's
    // $touch() runs, $invalid is true, store() returns early, and the
    // inline <small class="error"> appears under the Name input.
    await modal.getByRole('link', { name: 'Create', exact: true }).click();

    await expect(modal.locator('small.error')).toContainText('Token name is required');

    // Confirm the request never fired by checking the modal is still open
    // (the success path closes it and opens modalAccessToken instead).
    await expect(modal).toBeVisible();

    assertNoUnknownConsoleErrors(unknown, '/settings/api (vuelidate)');
  });

  test('conversations create form: datepicker input is interactive', async ({ page }) => {
    // Guards the @hokify/vuejs-datepicker → @vuepic/vue-datepicker rewrite.
    // The design issue says "reminders create form" but reminders/form.blade
    // uses a native <input type="date"> — the only blade surface that mounts
    // the Vue Date.vue datepicker is conversations/new.blade and journal
    // edit. We use conversations/new because journal/edit needs an existing
    // entry to navigate to.
    const { unknown } = attachConsoleCapture(page);

    await login(page);
    await page.goto('/people');
    const contactHref = await page.locator('a[href*="/people/h:"]').first().getAttribute('href');
    expect(contactHref).toBeTruthy();

    await page.goto(`${contactHref}/conversations/create`);

    // Click the "Another day" radio to expose the typeable date input.
    await page.locator('input#another').click();

    // form-date renders a visible <input> from the datepicker alongside a
    // hidden <input name="conversationDate"> that carries the YYYY-MM-DD
    // exchange value the server-side controller expects. The default-date
    // prop seeds the hidden input on mount.
    //
    // We assert the cross-library invariants only — a visible enabled
    // input exists, and the hidden input carries today's YYYY-MM-DD —
    // because the typeable input format and calendar markup differ
    // between @hokify/vuejs-datepicker and @vuepic/vue-datepicker. The
    // mount+emit contract is what the cutover PR has to preserve.
    const hiddenInput = page.locator('input[name="conversationDate"][type="hidden"]');
    await expect(hiddenInput).toHaveCount(1);
    await expect(hiddenInput).toHaveValue(/^\d{4}-\d{2}-\d{2}$/);

    // The visible input is somewhere inside the form-date wrapper; we
    // don't pin its container class. Just confirm at least one enabled
    // non-hidden input exists in the "Another day" cluster.
    const visibleInputs = page.locator(
      'div.di:has(input#another) input:not([type="hidden"]):not([type="radio"])',
    );
    expect(await visibleInputs.count()).toBeGreaterThan(0);
    await expect(visibleInputs.first()).toBeEnabled();

    assertNoUnknownConsoleErrors(unknown, '/people/h:<contact>/conversations/create');
  });

  test('locale switch to fr renders translated dashboard and reverts', async ({ page }) => {
    // Guards the vue-i18n@8 → vue-i18n@11 (legacy mode) migration. After
    // the cutover the locale mutation moves from `i18n.locale = lang` to
    // `i18n.global.locale = lang` (direct, not `.value` in legacy mode),
    // and the 7 $tc(...) call sites must be rewritten to $t(key, named,
    // count). If any of that regresses, switching the account locale and
    // navigating back to the dashboard would render English strings or
    // crash a Vue child component.
    //
    // The test reverts to English in the same block — if the spec aborts
    // mid-flight the dev DB is left in fr, which would break the other
    // English-string assertions in this suite on the next run. Use
    // setLocale() rather than try/finally because Playwright's afterEach
    // is per-test and we want the revert inline.
    const { unknown } = attachConsoleCapture(page);

    const setLocale = async (lang: 'en' | 'fr'): Promise<void> => {
      await page.goto('/settings');
      await page.locator('select#locale').selectOption(lang);
      // The Settings form has multiple submit buttons (Reset, Delete account);
      // the first one is the General "Save" action.
      await page.locator('form[action*="/settings"] button[type="submit"]').first().click();
      await page.waitForURL('**/settings');
    };

    await login(page);
    try {
      await setLocale('fr');

      // The breadcrumb on /dashboard reads "Tableau de bord" in fr.
      await page.goto('/dashboard');
      await expect(page.locator('body')).toContainText('Tableau de bord');

      // Revisit the contact list in fr — guards Vue components that pass
      // translated strings into vue-good-table options (perPage labels etc).
      await page.goto('/people');
      await expect(page.locator('table.vgt-table tbody tr').first()).toBeVisible();
    } finally {
      await setLocale('en');
    }

    assertNoUnknownConsoleErrors(unknown, '/settings (locale switch)');
  });

  test('moment locale registers fr — Vue-rendered dates use French month names under fr (regression guard for #718)', async ({ page }) => {
    // Guards the Vite-cutover regression where `moment/locale/<lang>` UMD
    // wrappers landed their `defineLocale(...)` calls on an orphan moment
    // instance, leaving `moment.locale('fr')` a silent no-op. After the fix
    // (resolve.alias `moment` → `moment/dist/moment.js` + `moment/dist/locale/*`
    // imports), the consumer-facing moment shares its instance with the
    // locale registrations and Vue-rendered dates honour the user's locale.
    //
    // We assert the user-visible behaviour: a freshly-added activity renders
    // its happened_at date with a French month name (e.g. "mai") rather than
    // an English one ("May"). Probing `moment.locales()` directly would be
    // bundle-path dependent (the hash changes each build); the DOM assertion
    // is bundle-agnostic.
    const { unknown } = attachConsoleCapture(page);

    const setLocale = async (lang: 'en' | 'fr'): Promise<void> => {
      await page.goto('/settings');
      await page.locator('select#locale').selectOption(lang);
      await page.locator('form[action*="/settings"] button[type="submit"]').first().click();
      await page.waitForURL('**/settings');
    };

    await login(page);
    try {
      await setLocale('fr');

      await page.goto('/people');
      // vue-good-table mounts the contact list asynchronously — wait for the
      // first row before clicking. Under fr the perPage strings hydrate
      // slower than the table chrome, so click-before-wait races.
      await expect(page.locator('table.vgt-table tbody tr').first()).toBeVisible();
      await page.locator('table.vgt-table tbody a[href*="/people/h:"]').first().click();
      await page.waitForURL(/\/people\/h:[A-Za-z0-9]+$/);

      // Open Log Activity form (button label is now French, but the cy-name
      // selector is locale-agnostic).
      await page.locator('[cy-name="add-activity-button"]').click();
      const summaryInput = page.locator('input[name="summary"]');
      await expect(summaryInput).toBeVisible();
      const marker = `smoke fr activity ${Date.now()}`;
      await summaryInput.fill(marker);
      await page.locator('[cy-name="save-activity-button"]').click();

      const activityRow = page.locator('[cy-name^="activity-body-"]').filter({ hasText: marker });
      await expect(activityRow).toHaveCount(1);

      // moment LL in French = "D MMMM YYYY" e.g. "28 mai 2026". Match on
      // French month names — if moment.locale('fr') is a no-op the date
      // renders as "May 28, 2026" and this regex misses.
      await expect(activityRow).toContainText(/\d{1,2}\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+\d{4}/);

      // Cleanup.
      await activityRow.locator('[cy-name^="delete-activity-button-"]').click();
      await activityRow.locator('[cy-name="confirm-delete-activity"]').click();
      await expect(activityRow).toHaveCount(0);
    } finally {
      await setLocale('en');
    }

    assertNoUnknownConsoleErrors(unknown, '/people/h:<contact> (fr locale moment guard)');
  });

  test('logout clears session', async ({ page }) => {
    await login(page);
    await page.goto('/logout');

    // After logout we end up at root with a login link visible.
    await expect(page).toHaveURL(/\/(login)?$/);
    await expect(page.locator('body')).toContainText(/Login|Sign in/i);
  });

  // -------------------------------------------------------------------------
  // pr-t2: Vue mount coverage for surfaces no prior smoke exercised.
  //
  // The bug pattern we're guarding against is "Vue component mounts but
  // renders nothing" — what bit /settings/api before #703/#705. Each test
  // asserts a piece of text or DOM that ONLY the inner Vue template renders
  // (not the surrounding Blade), so a silent mount failure fails the test
  // instead of being invisible. Visiting the contact detail page transitively
  // mounts ~10 components already exercised by earlier tests; the cases below
  // close the remaining gaps.
  // -------------------------------------------------------------------------

  test('settings/security mounts recovery-codes, mfa-activate, webauthn-connector', async ({ page }) => {
    // All three are gated by config('google2fa.enabled'). webauthn-connector
    // additionally requires config('webauthn.enable'). Both default on in
    // the dev compose stack. Each component renders its own <h3> from inside
    // the Vue template, so a silent mount failure means the heading is absent.
    const { unknown } = attachConsoleCapture(page);

    await login(page);
    await page.goto('/settings/security');

    await expect(page.getByRole('heading', { name: 'Recovery codes' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Two Factor Authentication mobile application' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Security key — WebAuthn protocol' })).toBeVisible();

    assertNoUnknownConsoleErrors(unknown, '/settings/security');
  });

  test('webauthn registration: virtual authenticator drives the register wire shape (swap contract for #710)', async ({ page, context }) => {
    // SWAP CONTRACT — locks in @simplewebauthn/browser's POST /webauthn/keys
    // wire shape against what web-auth/webauthn-lib's PHP server expects.
    //
    // What this exercises:
    //   1. POST /webauthn/keys/options  (server generates challenge + opts) → 200
    //   2. navigator.credentials.create() via a CDP-supplied virtual authenticator
    //   3. POST /webauthn/keys           (registration request body)
    //
    // Semantic asserts below mirror the server's decoder chain:
    //   - id            → Base64UrlSafe::decodeNoPadding   (strict)
    //   - rawId         → Util\Base64::decode              (tolerant)
    //   - clientDataJSON → Base64UrlSafe::decodeNoPadding  (strict; then JSON parse)
    //   - attestationObject → Util\Base64::decode          (tolerant; then CBOR)
    //
    // The "strict" decoder rejects `+`/`/` (plain-base64) characters and any
    // string ending in `=`. SimpleWebAuthn always emits base64url-no-padding,
    // which round-trips cleanly through both paths.
    //
    // We deliberately do NOT assert /webauthn/keys returns 201 — the dev stack
    // is HTTP and web-auth/webauthn-lib's CheckOrigin step rejects non-HTTPS
    // origins unless `localhost` is in `securedRelyingPartyId`, a knob
    // asbiin/laravel-webauthn doesn't expose. The wire shape IS the contract;
    // server-side acceptance is gated independently. If/when a dev-side
    // localhost RP override lands (e.g. #711), this test can flip the final
    // assertion to a 201 check without touching the semantic checks.
    const cdp = await context.newCDPSession(page);
    await cdp.send('WebAuthn.enable');
    const { authenticatorId } = await cdp.send('WebAuthn.addVirtualAuthenticator', {
      options: {
        protocol: 'ctap2',
        transport: 'internal',
        hasResidentKey: true,
        hasUserVerification: true,
        isUserVerified: true,
        automaticPresenceSimulation: true,
      },
    });

    try {
      await login(page);
      await page.goto('/settings/security');

      await page.getByRole('link', { name: 'Add a new security key' }).click();

      // The modal is a <sweet-modal-overlay>; scope by "Key name" body copy —
      // the underlying page also has a "Security key …" <h3>, which we'd
      // rather not collide with.
      const modal = page.locator('.sweet-modal-overlay').filter({ hasText: 'Key name' }).first();
      await expect(modal).toBeVisible();

      // form-input wraps the <input>, generating an id like `keyName<n>`
      // (Vue _uid suffix). Locate by accessible role/label instead.
      const keyName = `smoke vkey ${Date.now()}`;
      await modal.getByRole('textbox', { name: /Key name/i }).fill(keyName);

      // Capture the options + register POST round-trips.
      const optionsResp = page.waitForResponse((r) =>
        r.url().endsWith('/webauthn/keys/options') && r.request().method() === 'POST');
      const storeReq = page.waitForRequest((r) =>
        /\/webauthn\/keys$/.test(r.url()) && r.method() === 'POST');

      await modal.getByRole('link', { name: 'Next' }).click();

      const optionsResponse = await optionsResp;
      expect(optionsResponse.status()).toBe(200);
      const optionsBody = await optionsResponse.json();
      const serverChallenge = optionsBody.publicKey.challenge;
      expect(typeof serverChallenge).toBe('string');

      const requestBody = JSON.parse((await storeReq).postData() ?? '{}');

      // Field presence + the keyName the user typed.
      expect(requestBody.name).toBe(keyName);
      expect(requestBody.type).toBe('public-key');
      expect(typeof requestBody.id).toBe('string');
      expect(typeof requestBody.rawId).toBe('string');
      expect(typeof requestBody.response?.attestationObject).toBe('string');
      expect(typeof requestBody.response?.clientDataJSON).toBe('string');

      // Strict-base64url contract for the two fields the server decodes strictly.
      const idBytes = decodeBase64UrlNoPadding(requestBody.id);
      const rawIdBytes = decodeBase64UrlNoPadding(requestBody.rawId);
      // W3C spec: PublicKeyCredential.id is base64url(rawId).
      expect(Buffer.from(idBytes).equals(Buffer.from(rawIdBytes))).toBe(true);

      // clientDataJSON: decode + parse + verify type/challenge/origin all line up.
      const clientDataBytes = decodeBase64UrlNoPadding(requestBody.response.clientDataJSON);
      const clientData = JSON.parse(new TextDecoder().decode(clientDataBytes));
      expect(clientData.type).toBe('webauthn.create');
      expect(clientData.challenge).toBe(serverChallenge);
      const expectedOrigin = new URL(optionsResponse.url()).origin;
      expect(clientData.origin).toBe(expectedOrigin);

      // attestationObject: decodes as base64url AND begins with a CBOR map
      // tag. web-auth's AttestationObjectDenormalizer feeds this into a CBOR
      // decoder expecting `{fmt, attStmt, authData}` — so the top-level byte
      // must be a major-type-5 (map) marker (0xa0–0xb7 short form, or 0xb8
      // followed by a length byte).
      const attBytes = decodeBase64UrlNoPadding(requestBody.response.attestationObject);
      const major = attBytes[0] >> 5;
      expect(major).toBe(5);
    } finally {
      // Detach the virtual authenticator. (No DB row to clean up because the
      // server rejects the registration with 422 — see note above.)
      await cdp.send('WebAuthn.removeVirtualAuthenticator', { authenticatorId });
      await cdp.detach();
    }
  });

  test('settings/dav mounts dav-resources with the base URL input', async ({ page }) => {
    // DavResources renders the WebDAV / CardDAV / CalDAV headings + the
    // base-URL readonly input populated from the dav-route prop. If the
    // component fails to mount, the heading is supplied by the Vue
    // template (not Blade), so it disappears entirely.
    const { unknown } = attachConsoleCapture(page);

    await login(page);
    await page.goto('/settings/dav');

    await expect(page.getByRole('heading', { name: 'WebDAV' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'CardDAV' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'CalDAV' })).toBeVisible();

    // The component receives the dav-route prop and binds it to the input
    // value; an empty value would mean the prop wiring broke.
    const baseUrlInput = page.locator('input#dav_url_base');
    await expect(baseUrlInput).toBeVisible();
    const baseUrl = await baseUrlInput.inputValue();
    expect(baseUrl).toMatch(/\/dav\/?$/);

    assertNoUnknownConsoleErrors(unknown, '/settings/dav');
  });

  test('settings/personalization mounts contact-field-types, reminder-rules, activity-types, life-event-types, modules', async ({ page }) => {
    // Genders is already covered by the existing create-modal test. The
    // remaining five components on this page have never been asserted.
    // Each renders its own <h3> heading from the Vue template.
    const { unknown } = attachConsoleCapture(page);

    await login(page);
    await page.goto('/settings/personalization');

    for (const heading of [
      'Reminder rules',
      'Contact field types',
      'Activity type categories',
      'Life event categories',
      'Features',
    ]) {
      await expect(page.getByRole('heading', { name: heading })).toBeVisible();
    }

    assertNoUnknownConsoleErrors(unknown, '/settings/personalization');
  });

  test('settings/api mounts passport-authorized-clients with empty state', async ({ page }) => {
    // PassportAuthorizedClients is the third Vue component on /settings/api
    // (alongside PassportClients and PassportPersonalAccessTokens, both
    // covered above). It only renders content rows when the user has
    // authorized a third-party client — the seeded admin has not, so the
    // expected state is the empty-state copy from the Vue template.
    const { unknown } = attachConsoleCapture(page);

    await login(page);
    await page.goto('/settings/api');

    await expect(page.getByRole('heading', { name: 'List of authorized clients' })).toBeVisible();
    await expect(page.locator('body')).toContainText('There are no authorized clients yet.');

    assertNoUnknownConsoleErrors(unknown, '/settings/api (authorized clients)');
  });

  test('contact detail sidebar mounts contact-information, contact-address, pet', async ({ page }) => {
    // The existing contact-detail test asserts headings rendered by Blade
    // wrappers (Conversations / Phone calls / etc). The sidebar components
    // are different: their <h3> comes from inside the Vue template, gated
    // only by the module being enabled (default-on in the seed). These have
    // never been asserted on the contact-detail surface.
    const { unknown } = attachConsoleCapture(page);

    await login(page);
    await page.goto('/people');
    await page.locator('a[href*="/people/h:"]').first().click();
    await page.waitForURL(/\/people\/h:[A-Za-z0-9]+$/);

    await expect(page.getByRole('heading', { name: 'Contact information' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Addresses' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Pets' })).toBeVisible();

    assertNoUnknownConsoleErrors(unknown, '/people/h:<contact> (sidebar mounts)');
  });

  test('contact detail tasks section mounts contact-task component', async ({ page }) => {
    // ContactTask renders its own "Tasks" <h3> from people.section_personal_tasks
    // — the surrounding Blade has no heading for this section, so a missing
    // <h3> means the Vue component didn't render.
    //
    // ContactTask only renders inside the "Notes, reminders, …" tab
    // (global_profile_default_view === 'notes'). Earlier tests in this file
    // (or any prior smoke run) may have left the saved preference on
    // 'photos' or 'life-events' via /settings/updateDefaultProfileView,
    // so we click the Notes tab explicitly rather than trusting the
    // server-side default. The heading name is exact ("Tasks") so we use
    // a regex to allow the trailing edit/done link text inside the same h3.
    const { unknown } = attachConsoleCapture(page);

    await login(page);
    await page.goto('/people');
    await page.locator('a[href*="/people/h:"]').first().click();
    await page.waitForURL(/\/people\/h:[A-Za-z0-9]+$/);

    await page.locator('span').filter({ hasText: /Notes, reminders/ }).first().click();

    await expect(page.getByRole('heading', { name: /^Tasks/ })).toBeVisible();

    assertNoUnknownConsoleErrors(unknown, '/people/h:<contact> (tasks mount)');
  });

  test('contact detail photos tab mounts photo-list', async ({ page }) => {
    // PhotoList only renders when global_profile_default_view === 'photos'.
    // Clicking the Photos tab POSTs /settings/updateDefaultProfileView and
    // toggles the v-if; the PhotoList template then renders its "Related
    // photos" heading.
    //
    // The tab click persists server-side (per-user preference), so any
    // earlier-in-file tests that assume the notes tab would break on the
    // next smoke run if we didn't restore. Same try/finally pattern as
    // the locale-switch test above.
    const { unknown } = attachConsoleCapture(page);

    await login(page);
    await page.goto('/people');
    await page.locator('a[href*="/people/h:"]').first().click();
    await page.waitForURL(/\/people\/h:[A-Za-z0-9]+$/);

    try {
      // The Photos tab is a <span @click="updateDefaultProfileView('photos')">.
      // No role/aria — just visible text "Photos" inside the tab strip.
      await page.locator('span').filter({ hasText: /^Photos$/ }).click();

      await expect(page.getByRole('heading', { name: 'Related photos' })).toBeVisible();
    } finally {
      // Restore notes tab — other tests in this file (and any future smoke run)
      // assume Conversations/Activities/Phone calls/etc are visible on the
      // contact detail, which only renders inside the notes tab.
      await page.locator('span').filter({ hasText: /Notes, reminders/ }).first().click();
    }

    assertNoUnknownConsoleErrors(unknown, '/people/h:<contact> (photos tab)');
  });

  test('contact detail life-events tab mounts life-event-list', async ({ page }) => {
    // LifeEventList only renders when global_profile_default_view ===
    // 'life-events'. Same tab-click mechanism as the photos test. The
    // blank-state SVG is the stable cross-i18n indicator the component
    // rendered. Same try/finally restoration as the photos test — the tab
    // click persists per-user, and earlier tests in the file assume notes.
    const { unknown } = attachConsoleCapture(page);

    await login(page);
    await page.goto('/people');
    await page.locator('a[href*="/people/h:"]').first().click();
    await page.waitForURL(/\/people\/h:[A-Za-z0-9]+$/);

    try {
      await page.locator('span').filter({ hasText: /Life events/ }).first().click();

      // LifeEventList renders an inline SVG width=337 height=249 in its blank
      // state. Seeds without life events take this branch; if the seed had any,
      // the .life-event-list-icon class would appear instead — we accept either
      // by checking the wrapper has rendered child content beyond the tab strip.
      const blankSvg = page.locator('svg[width="337"][height="249"]');
      const populatedRow = page.locator('.life-event-list-icon');
      await expect(blankSvg.or(populatedRow).first()).toBeVisible();
    } finally {
      await page.locator('span').filter({ hasText: /Notes, reminders/ }).first().click();
    }

    assertNoUnknownConsoleErrors(unknown, '/people/h:<contact> (life-events tab)');
  });

  // -------------------------------------------------------------------------
  // Phase 1 housekeeping guards (vue 3 migration plan, docs/plans/
  // 2026-05-27-vue3-migration-design.md). Each test below locks in a
  // user-observable behaviour that a Phase 1 PR is about to refactor on
  // Vue 2:
  //
  //   pr-1a   strip `vue-clipboard2`, swap to `navigator.clipboard.writeText`
  //   pr-1b   strip `pretty-checkbox-vue` (PInput.vue → native <input>)
  //   pr-1c   refactor `Vue.filter('formatDate')` + local `filters:` blocks
  //           into methods/computeds
  //
  // Assertions track behaviour (a toast fires, a submit button enables, a
  // formatted date string appears) so they survive the refactor and act as a
  // contract each PR has to honour.
  // -------------------------------------------------------------------------

  test('settings/dav copy button surfaces success toast (pr-1a guard)', async ({ page, context }) => {
    // Guards the vue-clipboard2 → navigator.clipboard.writeText swap.
    // DAVResources.vue:111 calls `this.$copyText(text).then(() => this.notify(...))`.
    // Post-cutover, the same chain must produce the same dav_clipboard_copied
    // toast. We grant clipboard permissions up-front so the post-cutover code
    // (which uses navigator.clipboard.writeText — gated on permissions) does
    // not silently NotAllowedError into the .catch branch and skip the toast.
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    const { unknown } = attachConsoleCapture(page);

    await login(page);
    await page.goto('/settings/dav');

    // The first Copy anchor sits next to the davRoute (base URL) input. There
    // are 4 copy buttons on the page; targeting the first is sufficient — they
    // all share the copyIntoClipboard() handler.
    const firstCopy = page.getByRole('link', { name: 'Copy', exact: true }).first();
    await expect(firstCopy).toBeVisible();
    await firstCopy.click();

    // The dav_clipboard_copied toast renders inside the
    // <notifications group="dav"> mount on this component. vue-notification
    // doesn't expose a stable selector, so we match on the string.
    await expect(page.locator('body')).toContainText('Value copied into your clipboard');

    assertNoUnknownConsoleErrors(unknown, '/settings/dav (copy button)');
  });

  test('relationship/create: form-checkbox toggles checked state (pr-1b FormCheckbox guard)', async ({ page }) => {
    // Guards the pretty-checkbox-vue → native <input> swap. The settings/users
    // create form would be a cleaner target (its FormCheckbox controls a
    // submit-disabled state), but that route 302s to settings/subscriptions
    // whenever monica.requires_subscription is true — which it is by default
    // in dev. Relationship/create works on every account and exposes
    // <form-checkbox name="realContact" :model-value="true">, so toggling the
    // input verifies PInput's v-model wiring + slot rendering survive the
    // refactor.
    const { unknown } = attachConsoleCapture(page);

    await login(page);
    await page.goto('/people');
    await page.locator('a[href*="/people/h:"]').first().click();
    await page.waitForURL(/\/people\/h:[A-Za-z0-9]+$/);
    await page.goto(page.url() + '/relationships/create');

    // FormCheckbox renders `<input type="checkbox" name="realContact" value="1">`
    // through PInput. Initial state derives from :model-value="true" in the
    // blade, which PInput's mounted() hook flushes into its internal `prop`
    // and pretty-checkbox-vue's <p-input> reflects as checked.
    const checkbox = page.locator('input[type="checkbox"][name="realContact"]');
    await expect(checkbox).toBeVisible();
    await expect(checkbox).toBeChecked();

    // Click the input directly — avoids depending on pretty-checkbox-vue's
    // wrapper DOM, which the post-cutover swap will restructure.
    await checkbox.click();
    await expect(checkbox).not.toBeChecked();

    // Toggle back to confirm round-trip wiring.
    await checkbox.click();
    await expect(checkbox).toBeChecked();

    assertNoUnknownConsoleErrors(unknown, '/people/h:<contact>/relationships/create (form-checkbox toggle)');
  });

  test('contact detail: log-a-call form persists with LL-formatted date (pr-1b form-radio + pr-1c |moment guard)', async ({ page }) => {
    // Two guards in one test:
    //
    //   pr-1b   the Log Call form mounts <form-radio> (PInput-backed) for
    //           the "you called / contact called" toggle. We exercise it by
    //           leaving the default value, but the form rendering still
    //           depends on PInput's slot/v-model wiring not breaking.
    //   pr-1c   PhoneCallList.vue has a local `filters: { moment: ... }` block
    //           that renders `{{ call.called_at | moment }}` in the LL format
    //           ("Month D, YYYY"). pr-1c lifts this to a method/computed; the
    //           assertion below verifies that a freshly-saved call still
    //           renders with an LL date string.
    //
    // Cleans up the created call so repeated smoke runs don't accumulate rows.
    const { unknown } = attachConsoleCapture(page);

    await login(page);
    await page.goto('/people');
    await page.locator('a[href*="/people/h:"]').first().click();
    await page.waitForURL(/\/people\/h:[A-Za-z0-9]+$/);

    // Open the Log Call form. The add-call trigger has v-cy-name="add-call-button".
    await page.locator('[cy-name="add-call-button"]').click();
    await expect(page.locator('[cy-name="log-call-form"]')).toBeVisible();

    // Fill content. The form-textarea renders a real <textarea>.
    const marker = `smoke call ${Date.now()}`;
    await page.locator('[cy-name="log-call-form"] textarea').first().fill(marker);

    // Save. The button has v-cy-name="save-call-button"; click() bypasses the
    // <a class="btn">/<button> ambiguity.
    await page.locator('[cy-name="save-call-button"]').click();

    // The new call appears in the list with `{{ call.called_at | moment }}`
    // rendering today's date in LL format (e.g. "May 28, 2026"). Scope to the
    // calls section to avoid matching unrelated dates elsewhere on the page.
    const callsBody = page.locator('[cy-name="calls-body"]');
    await expect(callsBody).toContainText(marker);
    // moment LL = "MMMM D, YYYY" in English. Anchor on the marker's row so we
    // hit the date span next to the newly-added call.
    const row = callsBody.locator('div', { hasText: marker }).first();
    await expect(row).toContainText(/(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}/);

    // Cleanup: locate the row's delete link, confirm.
    const callRow = page.locator('[cy-name^="call-body-"]', { hasText: marker });
    await callRow.locator('[cy-name^="delete-call-button-"]').click();
    await callRow.locator('[cy-name^="delete-call-confirm-button-"]').click();
    await expect(page.locator('[cy-name="calls-body"]')).not.toContainText(marker);

    assertNoUnknownConsoleErrors(unknown, '/people/h:<contact> (log-a-call + |moment filter)');
  });

  test('contact detail: log-an-activity form persists with LL-formatted date (pr-1c ActivityList |moment guard)', async ({ page }) => {
    // Guards the `filters: { moment }` block on ActivityList.vue that renders
    // `{{ activity.happened_at | moment }}` in LL format ("Month D, YYYY").
    // pr-1c lifts this to a formatMomentLL method; the assertion below
    // verifies a freshly-saved activity still renders with an LL date string.
    //
    // Cleans up the created activity so repeated smoke runs don't accumulate.
    const { unknown } = attachConsoleCapture(page);

    await login(page);
    await page.goto('/people');
    await page.locator('a[href*="/people/h:"]').first().click();
    await page.waitForURL(/\/people\/h:[A-Za-z0-9]+$/);

    // Open the Log Activity form. ActivityList.vue toggles displayLogActivity
    // which v-if-mounts CreateActivity.vue. The trigger has v-cy-name="add-activity-button".
    await page.locator('[cy-name="add-activity-button"]').click();

    // CreateActivity.vue renders a FormInput with id="summary"; FormInput
    // passes :name="id" through to the underlying <input>, so input[name="summary"]
    // is a stable selector that survives the FormInput internals.
    const summaryInput = page.locator('input[name="summary"]');
    await expect(summaryInput).toBeVisible();
    const marker = `smoke activity ${Date.now()}`;
    await summaryInput.fill(marker);

    // Save via v-cy-name="save-activity-button".
    await page.locator('[cy-name="save-activity-button"]').click();

    // Match the freshly-saved row directly via its cy-name. We deliberately
    // avoid scoping under `[cy-name="activities-body"]` because ActivityList.vue
    // has two unkeyed bare-<div> siblings (the blank-state wrapper at line 25
    // and the activities-body div at line 46). When the activities array
    // transitions 1 → 0 on cleanup, Vue 2's vdom diff reuses the wrappers and
    // can leave the `cy-name="activities-body"` attribute attached to two DOM
    // nodes simultaneously — a Vue 2 quirk unrelated to the filter refactor.
    // Row-level locators sidestep it cleanly.
    const activityRow = page.locator('[cy-name^="activity-body-"]').filter({ hasText: marker });
    await expect(activityRow).toHaveCount(1);
    // moment LL = "MMMM D, YYYY" in English.
    await expect(activityRow).toContainText(/(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}/);

    // Cleanup: click the row's delete button, then the confirm link. The
    // confirm-delete-activity v-cy-name is not row-suffixed (it's a shared
    // name with v-show gated per-row), so we scope inside the activity row.
    await activityRow.locator('[cy-name^="delete-activity-button-"]').click();
    await activityRow.locator('[cy-name="confirm-delete-activity"]').click();
    await expect(activityRow).toHaveCount(0);

    assertNoUnknownConsoleErrors(unknown, '/people/h:<contact> (log-an-activity + |moment filter)');
  });

  test('dashboard debts tab: formatDate filter renders LL date (pr-1c global formatDate guard)', async ({ page }) => {
    // Guards the global `Vue.filter('formatDate')` registration in
    // resources/js/common.js. Its only consumer is DashboardLog.vue:118
    // `{{ debt.created_at | formatDate }}` inside the Debts tab. pr-1c will
    // lift the global filter to a method/util; this test asserts the LL
    // formatted date still renders against the dev seed.
    //
    // The dev seed (`php artisan setup:test`) populates each of 20 contacts
    // with 1-6 debts at 1/2 probability — vanishingly small chance of zero
    // debts in the seed. If the debts tab is empty, the test fails with a
    // clear hint rather than a confusing assertion miss.
    const { unknown } = attachConsoleCapture(page);

    await login(page);
    await page.goto('/dashboard');

    // The Debts tab is a <li @click="setActiveTab('debts')">. The rendered
    // text is whitespace-padded from the blade indentation, so use getByText
    // with exact: true rather than an anchored hasText regex. setActiveTab
    // gates getDebts() behind `if (! this.debtsAlreadyLoaded)`; we wait for
    // the resulting GET /dashboard/debts so the v-if branch settles to its
    // populated state before assertions.
    const debtsResponse = page.waitForResponse((r) => r.url().includes('/dashboard/debts') && r.status() === 200);
    await page.getByText('Debts', { exact: true }).click();
    await debtsResponse;

    // If the seed produced zero in-progress debts the blank-state copy fires.
    // Wait briefly for the populated <ul> first; only complain about the seed
    // if the date never appears.
    //
    // Scope tightly to the debt-row date span (`<li class="pb2"><span class=
    // "black-50 mr1 f6">{{ debt.created_at | formatDate }}</span>`). The
    // surrounding page contains other dashboard widgets (month-reminders,
    // upcoming events) which can render dates via the PHP DateHelper using `M
    // d, Y` (e.g. "May 28, 2026") — the same LL-shape — so a broader locator
    // would match those even when the formatDate filter is broken. The Calls
    // tab also uses `<li class="pb2">` for its rows, but Vue's v-if/v-else-if
    // tab switching removes the inactive block from the DOM, leaving only
    // debt-row spans under the active selector after the tab click.
    const monthRegex = /(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}/;
    const firstDebtDate = page.locator('li.pb2 span.black-50.mr1.f6').first();
    try {
      await expect(firstDebtDate).toHaveText(monthRegex, { timeout: 5_000 });
    } catch (err) {
      const blank = page.getByText('logged any debts', { exact: false });
      if (await blank.isVisible().catch(() => false)) {
        throw new Error('Dev seed produced no in-progress debts on the dashboard; rerun `php artisan setup:test`.');
      }
      throw err;
    }

    assertNoUnknownConsoleErrors(unknown, '/dashboard (debts tab formatDate)');
  });
});
