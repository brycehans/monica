# Bootstrap alert migration — implementation plan

**Goal:** Drop the Bootstrap-namespace `.alert` family from this fork. End state: zero `.alert*` selectors anywhere in source or compiled CSS; one project-named rule set (`.page-alert` / `.page-alert-success` / `.page-alert-danger`) carries the exact same visual contract.

**Architecture:** Unlike the breadcrumb rename (PR #3, #819), the alert visual is currently provided by Bootstrap itself — `@import "bootstrap/scss/_alert";` at `resources/sass/_custom_bootstrap.scss:36` is the source of `.alert` / `.alert-success` / `.alert-danger` body styling. This PR must therefore **materialise** the three rules we use into project SCSS before dropping the import. It's still a one-for-one swap at the call-site layer, but the SCSS side is "extract + own" rather than "rename in place."

**Tech Stack:** Blade templates, Vue SFCs (2 sites), SCSS (`resources/sass/_custom_bootstrap.scss`, `resources/sass/app-ltr.scss`). Verification via `yarn run prod` + token-diff grep, Playwright RTL smoke, full smoke suite.

---

## Scope (verified by grep, 2026-06-17 against `c49470b49`)

| Surface | Sites | Where |
|---|---|---|
| Blade markup (`class="alert alert-success"` / `…alert-danger`) | 26 | 21 success, 5 danger. Spread across `auth/` (10), `settings/` (6), `people/` (6), `partials/` (3), `errors/` (2). All literal class strings — no Blade interpolation. |
| Vue SFC markup | 2 | `resources/js/components/partials/FormErrors.vue:2` (`alert alert-danger`), `resources/js/components/settings/Subscription.vue:6` (`alert alert-danger w-100`). Both static class strings. |
| SCSS rules | 2 surfaces | `resources/sass/_custom_bootstrap.scss:36` (`@import "bootstrap/scss/_alert";` — the source of `.alert`, `.alert-success`, `.alert-danger` body styling), `resources/sass/app-ltr.scss:329-331` (`.alert-success { margin: 20px 0 }` override). |

Audit-as-of-snapshot had 30 sites (23 + 7). The 22 + 7 = 29 figure above is one less success-variant — drift since the audit was written. Counts re-verified by `grep -roh 'alert-success\|alert-danger' resources/views resources/js | sort | uniq -c`.

No Bootstrap-modifier alert classes are used anywhere — `.alert-dismissible`, `.alert-link`, `.alert-heading` greps come back empty. The full Bootstrap `_alert.scss` partial (50 lines) ships rules for all of those plus eight colour variants we don't use; PurgeCSS strips them in production but the dev bundle carries the lot.

No JS reads `.alert*` via `classList` or query selectors (audited at #815, re-checked this session).

Companion doc: [`2026-06-16-bootstrap-css-audit.md`](2026-06-16-bootstrap-css-audit.md). Predecessor PRs in this arc: #817 (dead variants, `bb28358e`), #818 (badges, `30641d90`), #819 (breadcrumb, `c49470b4`).

---

## Design decisions

### Approach: extract Bootstrap's rules into project SCSS under a new selector

The alternative — **inline as Tachyons utilities at every call site** — was considered and rejected. Tachyons mapping for the visual:

| Property | Tachyons mapping | Verdict |
|---|---|---|
| `padding: .75rem 1.25rem` (12px / 20px) | No clean match. `pa3` is `1rem` (16px) all around — ±4px drift in both axes. `pv2 ph3` is 8/16, also drift. | Inlining would require new project utilities or accept visible spacing drift. |
| `border-radius: .25rem` | `br2` (exact, 0.25rem). | Maps, but would split the rule across two surfaces if the other properties don't map. |
| `border: 1px solid transparent` then variant `border-color` | `ba b--transparent` + `b--monica-success-border` etc. | Requires new project border-colour utilities for `#c3e6cb` (success) and `#f5c6cb` (danger). |
| `background-color: #d4edda` / `#f8d7da` | No Tachyons match. Would need `.bg-monica-alert-success` / `.bg-monica-alert-danger` project utilities (echoing the badge PR's `.bg-monica-success`/`.bg-monica-danger`). | Requires new project bg colour utilities. |
| `color: #155724` / `#721c24` | No Tachyons match. | Requires new project text colour utilities. |
| `margin: 20px 0` (the override on `.alert-success` only) | 20px isn't on Tachyons' scale (0/0.25/0.5/1/2/4/8/16rem). | Requires a project utility or visible spacing drift. |

Five of six properties would need new project utilities to stay visually equivalent. At that point we're inventing six new utility classes that paint the same thing as one self-contained component selector. Worse, every call site grows from one literal class token to six. A self-contained `.page-alert*` rule set keeps the visual centralised, the call sites readable, and (the actual deliverable) drops the Bootstrap import.

This matches the breadcrumb PR's choice (#819) — same trade-off, same outcome — and is in tension with the badge PR's choice (#818) only because badges are a single small chip where inlining Tachyons IS cleaner. Alerts are bigger and have more properties; the equation flips.

### Naming: `.page-alert`

`.page-alert`, `.page-alert-success`, `.page-alert-danger`. Consistent with `.page-breadcrumb` (#819) — `page-` prefix signals "project-owned, not Bootstrap-conventional." Alternatives considered:

- `.app-alert` — collides with the existing `.app` class. Rejected.
- `.monica-alert` — redundant with the project namespace (same rationale as breadcrumb). Rejected.
- `.flash` / `.banner` / `.notice` — introduces new vocabulary mid-migration. The migration arc's job is to drop Bootstrap, not invent a design language. Rejected.

If a future PR introduces an `.alert-warning` or `.alert-info` variant the project actually uses, it extends `.page-alert-*` cleanly.

### Visual contract preserved exactly, including the margin asymmetry

The current compiled output (verified via `grep -oE '\.alert[a-z-]*[^{]*\{[^}]*\}' public/build/assets/app-ltr-*.css`) is:

```css
.alert         { border:1px solid transparent; border-radius:.25rem; margin-bottom:1rem; padding:.75rem 1.25rem; position:relative }
.alert-success { color:#155724; background-color:#d4edda; border-color:#c3e6cb }
.alert-success { margin:20px 0 }                       /* the app-ltr.scss:329 override */
.alert-danger  { color:#721c24; background-color:#f8d7da; border-color:#f5c6cb }
```

The two `.alert-success` rules cascade — the override comes later, so `.alert-success` ends up with vertical margin `20px 0` (replacing `margin-bottom:1rem` AND adding `margin-top:20px`), while `.alert-danger` keeps the base `margin-bottom:1rem` only. This means **success alerts have 20px top + 20px bottom margin; danger alerts have 0 top + 16px bottom margin** — an asymmetry that's been live since pre-fork. Preserved as-is; "no user-facing behaviour change" rules out tidying it.

The new `.page-alert-success` rule will fold the margin override into the variant rule so the SCSS is one block per variant. The compiled output stays identical (one rule per selector instead of two cascading rules with the same selector).

The Bootstrap source-of-truth for the base styling is `node_modules/bootstrap/scss/_alert.scss:5-11` — six properties via SCSS variables (`$alert-padding-y`, `$alert-padding-x`, `$alert-margin-bottom`, `$alert-border-width`, `$alert-border-radius`). The variable defaults in Bootstrap 4 (which is what this project pins) compile to the literal values shown above. The project doesn't override any of those variables, so the literal values are the contract — no need to keep the variable indirection.

### Bootstrap import: drop in the same PR

`resources/sass/_custom_bootstrap.scss:36` carries `@import "bootstrap/scss/_alert";`. Once the rules are materialised into project SCSS and the call sites swapped, the import becomes dead. Drop it in the same PR so the headline outcome ("`_custom_bootstrap.scss` active-imports goes from 12 → 11") ships atomically with the rename.

This is structurally different from PRs #2 and #3 — both `_badge.scss` and `_breadcrumb.scss` were *already commented out* at the time of those PRs (the partial-comment was done at the dawn of the fork). PR #4 is the first one in this arc to actually retire an active Bootstrap partial.

---

## Changes

### SCSS

**`resources/sass/_custom_bootstrap.scss:36`** — comment out the import (matching the existing pattern for retired partials):

```diff
-@import "bootstrap/scss/_alert";
+// @import "bootstrap/scss/_alert";
```

**`resources/sass/app-ltr.scss:329-331`** — replace the single-property override with three project-owned rules carrying the full visual contract:

```diff
-.alert-success {
-  margin: 20px 0;
-}
+.page-alert {
+  position: relative;
+  padding: 0.75rem 1.25rem;
+  margin-bottom: 1rem;
+  border: 1px solid transparent;
+  border-radius: 0.25rem;
+}
+
+.page-alert-success {
+  color: #155724;
+  background-color: #d4edda;
+  border-color: #c3e6cb;
+  margin: 20px 0;
+}
+
+.page-alert-danger {
+  color: #721c24;
+  background-color: #f8d7da;
+  border-color: #f5c6cb;
+}
```

The `margin: 20px 0` rule on `.page-alert-success` overrides the inherited `margin-bottom: 1rem` from `.page-alert`, exactly as `.alert-success`'s override worked before. Same cascade, one fewer rule pair.

### Blade

All 26 templates get a `class="alert alert-success"` → `class="page-alert page-alert-success"` (or `…alert-danger` → `…page-alert-danger`) swap on the wrapper element. File list:

- `resources/views/auth/emailchange1.blade.php`
- `resources/views/auth/emailchange2.blade.php`
- `resources/views/auth/login.blade.php` (4 sites: 2× success, 2× danger)
- `resources/views/auth/passwords/email.blade.php`
- `resources/views/auth/recovery/login.blade.php`
- `resources/views/auth/register.blade.php`
- `resources/views/auth/verify.blade.php` (preserves `role="alert"` ARIA attribute, separate from the class)
- `resources/views/errors/402.blade.php`
- `resources/views/errors/403.blade.php`
- `resources/views/partials/errors.blade.php`
- `resources/views/partials/notification.blade.php` (the `:timeout="4000"` attribute is unrelated cruft — a dead Vue-binding from the v2 era that compiles to a literal `timeout="4000"` HTML attribute on the `<div>`. Out of scope.)
- `resources/views/partials/subscription.blade.php`
- `resources/views/people/_header.blade.php`
- `resources/views/people/conversations/edit.blade.php`
- `resources/views/people/conversations/new.blade.php`
- `resources/views/people/create.blade.php`
- `resources/views/people/relationship/edit.blade.php`
- `resources/views/people/relationship/new.blade.php`
- `resources/views/settings/export.blade.php` (2 sites)
- `resources/views/settings/index.blade.php`
- `resources/views/settings/security/index.blade.php`
- `resources/views/settings/subscriptions/update.blade.php` (preserves `ma3` Tachyons class composition)
- `resources/views/settings/tags.blade.php`

### Vue

- `resources/js/components/partials/FormErrors.vue:2` — `class="alert alert-danger"` → `class="page-alert page-alert-danger"`
- `resources/js/components/settings/Subscription.vue:6` — `class="alert alert-danger w-100"` → `class="page-alert page-alert-danger w-100"`

Both are static class strings. No reactive binding involved.

### Tests

The Playwright and Dusk suites both target the alert DOM by class selector. Found during verification — eight Playwright specs failed on the first prod-build run because they were still asserting against `.alert.alert-danger` / `.alert-success`. Updated the selectors in-place to match the new class names so the suites stay green:

- `tests/playwright/specs/form-errors-rendering.spec.ts` — six `.alert.alert-danger` → `.page-alert.page-alert-danger` selectors.
- `tests/playwright/specs/account-export.spec.ts` — two `.alert-success` → `.page-alert-success` selectors (and the inline comment that anchors them).
- `tests/playwright/specs/dependency-upgrade-smoke.spec.ts`, `signup-duplicate-email.spec.ts`, `password-reset.spec.ts` — comment-only references updated for accuracy. No functional change.
- `tests/Browser/Pages/Page.php:18` — Dusk page-element shortcut `'alert' => '.alert'` → `'.page-alert'`. Used by `hasDivAlert()` / `getDivAlert()` in `tests/DuskTestCase.php`.
- `tests/Browser/Settings/MultiFAControllerTest.php:222` — `assertStringContainsString('alert-danger', …)` → `'page-alert-danger'`.

Dusk isn't part of the standard verification cycle (`yarn run test` doesn't run it, neither does `yarn run e2e`), but the change is mechanical and the same migration logic applies — left out it'd be a latent regression for the next person to run `php artisan dusk`.

### Locale-strings cleanup (`class="alert-link"`)

Bootstrap's `.alert-link` rule (`font-weight: 700` on links inside alerts) shipped via `bootstrap/scss/_alert.scss` and is also retired by this PR's import drop. The `class="alert-link"` token appears in 53 locale-PHP files (23 `lang/{locale}/auth.php` for the `confirmation_again` string, plus 30 `lang/vendor/confirmation/{locale}/confirmation.php` for a now-removed package's `again` string). These translation strings are *not* in PurgeCSS's content glob (`vite.config.js:67-105` scans Blade/Vue/JS/PHP under `app/`, `resources/views`, `resources/js` — `resources/lang/` is intentionally excluded), so PurgeCSS already silently stripped the `.alert-link` rule from production CSS pre-PR. **Net effect pre-PR: the class rendered as bold-link only in dev builds; prod was a no-op.** Post-PR neither dev nor prod styles it.

The dead attribute is stripped from all 53 locale files in this PR. This relaxes the "Crowdin owns non-en, don't hand-edit" rule, justified by:

1. The change is **structural** (HTML-attribute hygiene), not a translation edit — the translatable text is byte-identical before/after the strip.
2. Source-state consistency: the plan claims "zero `.alert*` selectors anywhere in source," and `.alert-link` would otherwise contradict that.
3. The `vendor/confirmation/` strings have zero callers in the current app (grep `confirmation::` and `trans('confirmation` both return empty), so 30/53 of the edits are also dead-translation cleanup as a bonus.

A future Crowdin sync that re-introduces `class="alert-link"` from the upstream TM will need either a re-strip or a Crowdin-side TM update — flagged in the commit message for the next person who runs the sync.

---

## PurgeCSS

`vite.config.js:67-105` scans Blade/Vue/JS/PHP for literal class tokens. After this PR:

- `.page-alert`, `.page-alert-success`, `.page-alert-danger` appear literally in 28 source files → PurgeCSS keeps the rules.
- `.alert`, `.alert-success`, `.alert-danger` have zero remaining mentions → PurgeCSS strips them from the bundle, which is the intent.

No dynamic class composition — all wrapper classes are literal strings. The audit's count of `0` dynamic-CSS-class compositions stays at `0`.

The Bootstrap `_alert.scss` partial defines ~12 rules total (base + 8 colour variants + alert-dismissible + alert-link + alert-heading). PurgeCSS was already stripping 9 of those (the unused colour variants + modifier classes); dropping the import means the dev bundle also loses them. No regression possible — dev bundle is non-shipping and the prod bundle's selector inventory matches the current state.

---

## RTL

Bootstrap 4's `_alert.scss` itself has zero direction-sensitive selectors (no `[dir=rtl]`, no `@if $htmldir`). The project override `.alert-success { margin: 20px 0 }` is also direction-neutral (vertical margins only). The new `.page-alert*` rules preserve the same direction-neutral property set.

The LTR and RTL compiled bundles will therefore differ for the alert selectors *only* in the selector name swap — body identical between bundles. The RTL smoke spec doesn't cover alert markup directly (its six surfaces are the header chrome, settings sidebar, contact-list rows, breadcrumb separators, journal nav, dashboard chrome — none of which contain alerts in the seeded state) but it still gates against bundle-level breakage. Run it after the rename to verify both bundles emit `.page-alert*` and have stripped `.alert*`.

---

## Verification

Pre-commit sweep:

```bash
# Old selectors should be gone from source and compiled CSS
grep -rn '\balert-success\|\balert-danger\|class="alert"\|class="alert ' resources/sass resources/views resources/js   # → empty
yarn run prod
grep -oh '\.page-alert[a-z-]*' public/build/assets/*.css | sort -u  # → .page-alert, .page-alert-danger, .page-alert-success
grep -oh '\.alert[a-z-]*'      public/build/assets/*.css | sort -u  # → empty

# Active partials in _custom_bootstrap.scss should drop from 12 to 11
grep -c '^@import' resources/sass/_custom_bootstrap.scss   # → 11
```

Smoke:

```bash
yarn run e2e -- specs/rtl-smoke.spec.ts         # ~5s
yarn run smoke                                  # ~3min
```

Manual visual eval (because the alert visual is structurally being re-materialised, not just renamed): hit one success surface (e.g. `/settings` after a settings save, or `/auth/login` after a logout-redirect) and one danger surface (e.g. `/auth/login` with bad credentials, or any form-submit with validation errors). Confirm the green/red banner renders with identical padding, border, radius, and margin to current `4.x`.

PR body must include both smoke results plus the manual eval observation.

---

## Commit shape

Two commits on the topic branch:

1. `docs(plans): bootstrap alert migration plan (pr 4/n)` — this file.
2. `refactor(bootstrap-css): migrate .alert → .page-alert (pr 4/n)` — all SCSS, Blade, and Vue edits in one commit. Splitting "SCSS first" from "markup after" would temporarily break the styling chain for the markup-only intermediate state, which makes the diff harder to review. Combined commit is mechanically a single rename across 30 files plus the Bootstrap import drop.
