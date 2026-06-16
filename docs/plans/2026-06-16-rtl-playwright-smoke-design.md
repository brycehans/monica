# RTL Playwright Smoke — Design

**Goal:** Add a Playwright smoke spec that catches direction-flipping regressions during the upcoming Bootstrap-CSS → Tachyons migration. The migration will touch every SCSS file with `$htmldir == ltr` branches (6 files, 22 conditional blocks) and every Vue SFC using `useHtmlDir()` (9 SFCs); none of those surfaces currently has automated RTL regression coverage.

**Constraint:** No new features, zero user-facing change. The smoke is verification infrastructure — added only because the migration's primary risk class (silent RTL breakage) has no existing safety net.

**Tech Stack:** Playwright (existing `tests/playwright/` suite), TypeScript, Hebrew (`he`) as the RTL locale, layout-property assertions (computed style + bounding-box positions), no screenshots.

---

## Background

The Bootstrap-CSS audit (2026-06-16, session `5d55aeb9-7c85-47d2-9ea5-93bcdeb4f310`) found:

- **22 `$htmldir == ltr` SCSS branches** across `header.scss`, `journal.scss`, `modal.scss`, `people.scss`, `settings.scss`, `app-ltr.scss` — these produce a meaningfully different `app-rtl.css` (~15% byte divergence from `app-ltr.css`).
- **9 Vue SFCs use `useHtmlDir()`** to flip Tachyons utilities (`fl`/`fr`, `mr3`/`ml3`, `tr`/`tl`) based on direction. Concentrated in the journal feature (5 SFCs) plus dashboard widgets and settings.
- **40+ Blade templates** use `htmldir() == 'ltr' ? ... : ...` for the same purpose.
- **Bootstrap 4 itself contributes zero RTL handling** — `node_modules/bootstrap/scss/` has no `[dir=rtl]` selectors. So the active Bootstrap partials don't help in either direction.
- **Zero automated RTL coverage exists** — no Playwright tests, no Dusk tests, no PHPUnit view assertions exercise RTL.

Locales `he`, `ar`, `fa` are at file-count parity in `resources/lang/` (14 files each, matching `en`). Crowdin keeps them synced. Choice between them is mostly aesthetic; Hebrew chosen for simpler text rendering and more stable bounding-box assertions.

---

## Architecture

### File structure

- **New spec:** `tests/playwright/specs/rtl-smoke.spec.ts` — single sequential walkthrough using `test.describe.serial(...)`, mirroring the existing `dependency-upgrade-smoke.spec.ts` pattern.
- **New helper:** `tests/playwright/support/rtl.ts` — exports `setUserLocale(page, locale)` and `expectRtl(page)`.
- **README update:** `tests/playwright/README.md` gains a third bullet under the smoke-categories list.
- **Runner script:** `tests/playwright/package.json` gains `"rtl-smoke": "playwright test specs/rtl-smoke.spec.ts"`.

### Helpers

```ts
// tests/playwright/support/rtl.ts

export async function setUserLocale(page: Page, locale: 'he' | 'en'): Promise<void> {
  await page.goto('/settings/personalization');
  await page.locator('select[name="locale"]').selectOption(locale);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/settings/);
  await expect(page.locator('html')).toHaveAttribute(
    'dir',
    locale === 'he' ? 'rtl' : 'ltr',
  );
}

export async function expectRtl(page: Page): Promise<void> {
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
}
```

The post-save `expect(html).toHaveAttribute('dir', ...)` inside `setUserLocale` is the gate: if the locale flip silently fails (form error, wrong selector, locale not persisted), failures show up in the helper rather than as confusing layout-assertion failures three surfaces later.

### Setup phase

Single `beforeAll`:

1. Login as admin (`admin@admin.com` / `admin0`, seeded by `setup:test`).
2. Create one note on the first contact — needed for Surface 4's modal walkthrough. Cheaper than extending the seed.
3. Call `setUserLocale(page, 'he')` once.

From this point every navigation in the spec carries the RTL session. Playwright spins a fresh browser context per spec file, so no teardown is required.

The setup phase is idempotent: re-running the spec finds the locale already set to Hebrew, the selectOption is a no-op, the assertion still passes.

### LTR baseline values

Two strategies, mixed by assertion type:

- **For property-flip assertions** (`text-align: left` vs `right`, `float: right` vs `left`, `margin-left` vs `margin-right`) — hard-code the expected RTL value as a constant in the spec. These are flip-direction not flip-magnitude; no positional math needed.
- **For positional assertions** (Surface 1's widget X-positions, Surface 2's dropdown alignment, Surface 4's modal close button position) — capture LTR values in a one-off `beforeAll` LTR pass, flip to Hebrew, then assert flipped values. Robust against legit layout changes that shift the magnitude but preserve the direction.

The LTR baseline pass costs ~5s of additional wall-clock. Worth it for the positional assertions; not worth it for the property-flip ones.

---

## The six surfaces

Each surface follows: `navigate → expectRtl(page) → 2-4 direction-sensitive assertions`. Selectors must not depend on Hebrew translation strings — use `data-testid`, `role`, or stable CSS classes. Adding new `data-testid` attributes during this PR is in scope where a surface has no stable selector.

### Surface 1 — Dashboard + header

Navigate to `/dashboard`. Assertions:

- `getComputedStyle(.header-nav).textAlign === 'left'` (LTR: `'right'` — from `header.scss:34-39`).
- Dashboard top-left widget's bounding-box `left` is to the right of its LTR baseline X-position (captured during the LTR pre-pass).

Covers `header.scss` (3 `$htmldir` branches) and the top-of-app chrome.

### Surface 2 — Contact list sort dropdown

Navigate to `/people`. Click the sort dropdown trigger. Assertions:

- Dropdown menu's `getBoundingClientRect().left` is to the **left of** its trigger's `left` (LTR: dropdown aligns right). This is the **single Bootstrap-style dropdown in the codebase** (`resources/views/people/index.blade.php:76-100`) — the migration's highest-risk surface.

Covers `people.scss` (7 `$htmldir` branches) and the only Bootstrap dropdown call site.

### Surface 3 — Contact detail page

Open the first contact. Assertions:

- `_header.blade.php`'s birthday icon has `margin-left: 0.25rem` (Tachyons `ml1`), `margin-right: 0` (the `dirltr ? 'mr1' : 'ml1'` ternary).
- Sidebar tabs are right-anchored — `getBoundingClientRect().right` near the viewport right edge.

Covers `_header.blade.php` direction ternaries and the contact-detail-specific layout.

### Surface 4 — Note modal

From the contact, click "Add a note" (or the existing note added in `beforeAll`). Assertions:

- Modal inherits `dir="rtl"` from `html`.
- Modal close button's `getBoundingClientRect().left` is in the **left half** of the modal's bounding box (Bootstrap modals default close to top-right; we verify the RTL flip).

Covers `modal.scss` (`$htmldir` branch) plus the Bootstrap modal class family the migration will touch.

### Surface 5 — Journal calendar

Navigate to `/journal`. Assertions:

- `getComputedStyle(.journal-calendar-box).float === 'right'` (LTR: `'left'` — from `JournalCalendar.vue`'s `dirltr ? 'fl' : 'fr'`).
- Day-rating widget icons have `margin-left` set, `margin-right: 0` (from `JournalContentRate.vue`'s `dirltr ? 'mr3' : 'ml3'`).

Covers `journal.scss` (1 `$htmldir` branch) and 5 Vue SFCs using `useHtmlDir()`.

### Surface 6 — Settings sub-page

Navigate to `/settings/tags` or `/settings/reminder-rules` (decide during implementation based on which has the densest direction-sensitive layout). Assertions:

- At least one direction-sensitive computed property differs from its LTR value — likely a `padding-right` vs `padding-left` flip from `settings.scss`'s 4 `$htmldir` branches.
- If `/settings/reminder-rules`: `ReminderRules.vue`'s `.dtc` cells have `text-align: left` (LTR: `right`) per the `dirltr ? 'tr' : 'tl'` ternary.

Covers `settings.scss` (4 `$htmldir` branches) and settings-specific Vue components using `useHtmlDir()`.

---

## Integration with existing suite

### Categorization

Following `tests/playwright/README.md`'s smoke-category taxonomy, this is a **third smoke category** alongside:

1. `dependency-upgrade-smoke.spec.ts` — composer/npm bump verification
2. `subscription-flow.spec.ts` — Stripe-gated routes
3. **`rtl-smoke.spec.ts` (new)** — RTL safety net for the Bootstrap-CSS migration

### CI posture

**Not a CI gate.** Matches existing convention — README states "Neither is a CI gate yet." The RTL smoke is local-verification, run by the migration PR author. We don't change CI posture in this PR.

### Per-PR migration workflow

For PRs touching `resources/sass/`, `resources/views/`, or files using `useHtmlDir()`:

```bash
yarn run prod
cd tests/playwright
yarn run rtl-smoke
```

Failure messages name the exact computed property that changed. PR body includes the smoke result.

---

## Maintenance

### Expected triggers for spec updates

1. **Legit layout redesigns during migration** (e.g. journal-calendar floats become Tachyons `fl-l`/`fr-l`). The property-name expectations may need updating, but the *direction* expectations (LTR `right` vs RTL `left`) stay valid. Updates are mechanical.
2. **New direction-sensitive surfaces.** Unlikely given the "no new features" constraint, but if the migration introduces one, add a 7th surface.

### What this spec does NOT catch

- Subtle visual regressions (gradient direction, shadow offset, color shifts) — accepted limitation; chose layout assertions over screenshots to keep the spec stable.
- Direction-sensitive behavior in routes the spec doesn't visit — e.g. Stripe subscription flow, OAuth screens, DAV surfaces. Out of scope for this PR.
- Translation-string regressions — by design; the spec uses non-text selectors specifically to isolate direction-flip faults from i18n issues.

---

## Out of scope for this PR

- Adding RTL coverage to other specs (e.g. running `dependency-upgrade-smoke` in both directions). The standalone RTL smoke is the targeted safety net; broader cross-cutting RTL infrastructure is a future decision after we see what the migration actually breaks.
- Making the RTL smoke a CI gate. Existing smoke convention is local-only; this PR preserves that.
- Migrating to logical CSS properties (`padding-inline-start` etc.) as a way to remove the `$htmldir` SCSS branches and `dirltr ?` template ternaries. That would eliminate the entire class of bug this spec catches, but it's a separate, larger refactor.

---

## Open questions resolved during brainstorming

- **Locale-flip mechanism:** Per-user locale via `/settings/personalization`, not direct `htmldir()` config override. More realistic, exercises the same code path real users hit.
- **RTL locale choice:** Hebrew (`he`). Simpler bidirectional rendering than Arabic; identical Crowdin coverage to Arabic and Persian.
- **Assertion strategy:** Layout properties (`getComputedStyle` + `getBoundingClientRect`), not screenshots. Stable across legit redesigns; catches the exact regression class the migration is at risk of.
- **Coverage breadth:** Six surfaces (dashboard, contact list, contact detail, modal, journal, settings). Hits every SCSS file with `$htmldir` branches and the densest Vue `useHtmlDir()` concentrations.

## Risks

- **Locale flip silently fails.** Mitigated by the post-save `dir` attribute assertion inside `setUserLocale`.
- **Hebrew translation gaps surface as test instability.** Mitigated by using non-text selectors throughout — `data-testid`, `role`, stable CSS classes. Adding test hooks where needed is in scope.
- **The single Bootstrap dropdown in `/people` is replaced by the new `Dropdown.vue` from #815 mid-migration**, changing Surface 2's selectors. Acceptable churn — the spec's purpose is to enforce a property contract; selector updates as the markup evolves are expected.
