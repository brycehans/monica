# Bootstrap breadcrumb migration — implementation plan

**Goal:** Drop the Bootstrap-namespace `.breadcrumb` class from this fork. End state: zero `.breadcrumb` selectors anywhere in source or compiled CSS; one project-named `.page-breadcrumb` rule carries the exact styling that lived under `.breadcrumb`.

**Architecture:** This is a **pure rename**, not an inlining. The Bootstrap `_breadcrumb` partial has been commented out at `resources/sass/_custom_bootstrap.scss:32` for a long time — none of the rules under `.breadcrumb` are Bootstrap's; they're a custom design that happens to occupy the Bootstrap class name. Renaming the selector to `.page-breadcrumb` deletes the namespace collision (the deliverable for this PR) without touching the visual.

**Tech Stack:** Blade templates, SCSS (`resources/sass/app-ltr.scss`, `people.scss`, `settings.scss`). No Vue SFC references exist. Verification via `yarn run prod` + token-diff grep, Playwright RTL smoke (the `:after` separator has direction-sensitive margins), full smoke suite.

---

## Scope (verified by grep, 2026-06-17 against `20c0a4a47`)

| Surface | Sites | Where |
|---|---|---|
| Blade markup (`class="breadcrumb"`) | 33 | All under `resources/views/settings/` (24) and `resources/views/people/` (9). Each is the identical 9-line wrapper: `<div class="breadcrumb"><div class="{fluid}"><div class="row"><div class="col-12"><ul class="horizontal"><li>...</li></ul></div></div></div></div>`. |
| SCSS rules | 3 | `resources/sass/app-ltr.scss:414-432` (base: `background-color`, child `ul` `font-size`+`padding`, `:after` separator with htmldir branches), `resources/sass/people.scss:11-14` (`.people-list .breadcrumb { border-bottom }` — only matches `people/index.blade.php`), `resources/sass/settings.scss:1-4` (`.settings .breadcrumb { margin-bottom }` — matches every settings file wrapped in `<div class="settings">`). |

No Vue SFCs reference `.breadcrumb`. Zero JS reads `.breadcrumb` via `classList` or selectors. The `_breadcrumb.scss` Bootstrap partial is commented out.

Companion doc: [`2026-06-16-bootstrap-css-audit.md`](2026-06-16-bootstrap-css-audit.md). Predecessor PRs in this arc: #817 (dead variants, `bb28358eb`), #818 (badges, `30641d908`).

---

## Design decisions

The interesting question was **rename-only vs full Tachyons inlining**. Inlining was rejected because the underlying styling doesn't have clean Tachyons equivalents:

| Property | Tachyons mapping | Verdict |
|---|---|---|
| `background-color: #fafafa` | No exact match. `bg-near-white` is `#f4f4f4` (drift); `bg-gray-monica` is `#f2f4f8` (drift). | Inlining would require a new project utility or accept visual drift — neither buys readability over keeping the existing single-property rule. |
| `font-size: 12px` | `f7` (exact). | Maps, but the cost-benefit of inlining one property while keeping the rest as SCSS is negative — splits the rule across two surfaces. |
| `padding: 30px 0 24px` | No match. Tachyons' vertical scale is 0/0.25/0.5/1/2/4/8/16rem — `30px`/`24px` aren't on it. | Inlining would require new project utilities or accept ~6px drift. |
| `li:not(:last-child):after { content: '>' }` | No equivalent — Tachyons doesn't carry pseudo-element generators. | Cannot be inlined as utility classes. The only inlining option is embedding `&gt;` literally in markup between each `<li>` (33 files × 2–3 separators each); journal pages already do this. Considered and rejected — touching 33 templates' separator markup is a much bigger blast radius than the rename, and the literal-`&gt;` flavour also needs explicit RTL spacing handling per-call-site (the CSS rule has `@if $htmldir == ltr` branches that the markup form would have to replicate as ternaries). |

A pure rename keeps the SCSS as the single source of truth for the breadcrumb visual, drops the Bootstrap namespace (the actual goal), and avoids a 33-file template churn that would not produce a more-Tachyons codebase — just a more-verbose one.

**Naming.** `.page-breadcrumb` chosen for the new selector — `page-` prefix signals "structural page chrome", not Bootstrap-conventional. Alternative `.monica-breadcrumb` rejected as redundant with the project namespace. Alternative `.app-breadcrumb` rejected as conflict-prone with the existing `.app` and `.ph-app-*` selectors.

**`.horizontal` left alone.** The `<ul class="horizontal">` wrapper is `ul.horizontal { li { display: inline; } }` defined at `app-ltr.scss:276-280`. It has 38 call sites across the project (not just breadcrumbs) and is project-custom, not Bootstrap. Out of scope for this PR; revisit when the bigger "list utility" sweep happens.

---

## Changes

### SCSS

**`resources/sass/app-ltr.scss:414`** — rename selector only, body unchanged:

```diff
-.breadcrumb {
+.page-breadcrumb {
   background-color: #fafafa;

   ul {
     font-size: 12px;
     padding: 30px 0 24px;

     li:not(:last-child):after {
       content: '>';
       @if $htmldir == ltr {
         margin-left: 5px;
         margin-right: 1px;
       } @else {
         margin-right: 5px;
         margin-left: 1px;
       }
     }
   }
 }
```

**`resources/sass/people.scss:12`** — rename child selector:

```diff
 .people-list {
-  .breadcrumb {
+  .page-breadcrumb {
     border-bottom: 1px solid #eeeeee;
   }
```

**`resources/sass/settings.scss:2`** — rename child selector:

```diff
 .settings {
-  .breadcrumb {
+  .page-breadcrumb {
     margin-bottom: 20px;
   }
```

### Blade

All 33 templates get a single `class="breadcrumb"` → `class="page-breadcrumb"` swap on the wrapper `<div>`. File list:

- `resources/views/people/debt/add.blade.php`
- `resources/views/people/debt/edit.blade.php`
- `resources/views/people/food-preferences/edit.blade.php`
- `resources/views/people/index.blade.php`
- `resources/views/people/introductions/edit.blade.php`
- `resources/views/people/profile.blade.php`
- `resources/views/people/reminders/add.blade.php`
- `resources/views/people/reminders/edit.blade.php`
- `resources/views/people/work/edit.blade.php`
- `resources/views/settings/api/index.blade.php`
- `resources/views/settings/auditlog/index.blade.php`
- `resources/views/settings/dav/index.blade.php`
- `resources/views/settings/export.blade.php`
- `resources/views/settings/imports/blank.blade.php`
- `resources/views/settings/imports/index.blade.php`
- `resources/views/settings/imports/report.blade.php`
- `resources/views/settings/imports/upload.blade.php`
- `resources/views/settings/index.blade.php`
- `resources/views/settings/personalization/index.blade.php`
- `resources/views/settings/security/index.blade.php`
- `resources/views/settings/storage/index.blade.php`
- `resources/views/settings/subscriptions/account.blade.php`
- `resources/views/settings/subscriptions/archive.blade.php`
- `resources/views/settings/subscriptions/blank.blade.php`
- `resources/views/settings/subscriptions/downgrade-checklist.blade.php`
- `resources/views/settings/subscriptions/downgrade-success.blade.php`
- `resources/views/settings/subscriptions/success.blade.php`
- `resources/views/settings/subscriptions/update.blade.php`
- `resources/views/settings/subscriptions/upgrade.blade.php`
- `resources/views/settings/tags.blade.php`
- `resources/views/settings/users/add.blade.php`
- `resources/views/settings/users/blank.blade.php`
- `resources/views/settings/users/index.blade.php`

---

## PurgeCSS

`vite.config.js:67-105` scans Blade/Vue/JS/PHP for literal class tokens. `.page-breadcrumb` is mentioned in all 33 templates by literal name, so PurgeCSS keeps the rule. The old `.breadcrumb` selector after this PR has zero mentions in scanned files → PurgeCSS will strip it on the next prod build, which is the intent.

No dynamic class composition involved (the wrapper class is a literal string, not interpolated).

---

## RTL

The `:after` separator has `@if $htmldir == ltr` branches in the base rule, so the LTR and RTL bundles will differ on this selector. `tests/playwright/specs/rtl-smoke.spec.ts` (merged #816) walks settings pages with breadcrumbs in RTL mode and asserts the separator margin direction. **Re-run that spec after the rename** — if it doesn't surface the rename in compiled CSS, the SCSS partial isn't re-emitting.

---

## Verification

Pre-commit sweep:

```bash
# Old selector should be gone from source and compiled CSS
grep -rn '\.breadcrumb\b' resources/sass resources/views resources/js   # → empty
yarn run prod
grep -oh '\.page-breadcrumb[a-z-]*' public/build/assets/*.css | sort -u  # → .page-breadcrumb
grep -oh '\.breadcrumb[a-z-]*'      public/build/assets/*.css | sort -u  # → empty
```

Smoke:

```bash
yarn run e2e -- specs/rtl-smoke.spec.ts         # ~5s
yarn run smoke                                  # ~3min
```

PR body must include both smoke results.

---

## Commit shape

Two commits on the topic branch:

1. `docs(plans): bootstrap breadcrumb migration plan (pr 3/n)` — this file.
2. `refactor(bootstrap-css): rename .breadcrumb → .page-breadcrumb (pr 3/n)` — all SCSS + Blade edits in one commit. Mechanically a single rename across 36 files; splitting it into "SCSS first, Blade after" or vice versa would temporarily break the rule-matching chain in a way that's worse for review than the combined diff.
