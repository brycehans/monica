# Bootstrap-CSS audit — call-site map for the Tachyons migration

**Date:** 2026-06-16
**Scope:** `resources/views/**/*.blade.php` (140 files), `resources/js/**/*.vue` (83 files), `resources/sass/**/*.scss` (14 files).
**Purpose:** Durable record of what Bootstrap-CSS-era class names appear where, so the multi-PR migration to Tachyons doesn't have to re-derive the punch-list each session. Companion to [`2026-06-16-rtl-playwright-smoke-design.md`](2026-06-16-rtl-playwright-smoke-design.md) — that doc is the safety net; this one is the work-list.

The audit is a snapshot in time. Re-grep before acting on individual claims — call counts shift with every PR.

---

## Build-time CSS purging changes the deletion calculus

**Critical finding (verified this session):** `vite.config.js:67-105` wires `@fullhuman/postcss-purgecss` into production builds. PurgeCSS scans `resources/views/**/*.blade.php`, `resources/js/**/*.vue`, `resources/js/**/*.{js,ts}`, `app/**/*.php` for literal class tokens; any CSS rule whose selector isn't mentioned in those globs is stripped from the production bundle.

Implications:

1. **All "dead Bootstrap variants" are already absent from production CSS.** `.btn-secondary`, `.btn-success`, `.btn-info`, `.btn-light`, `.btn-dark`, `.btn-link`, `.btn-outline-*`, `.btn-sm`, `.btn-lg`, `.btn-add` — none paint anything in `public/build/assets/app-ltr-*.css`. The dead-variant deletion PR is **source-readability cleanup**, not bundle-size cleanup.

2. **The four "live" button variants survive both ways**, plus one scoped SFC override. Compiled CSS across all bundles contains `.btn`, `.btn-primary`, `.btn-danger`, `.btn-warning`, and `.btn-title` (verified at `30641d908` by `grep -oh "\.btn[a-z-]*" public/build/assets/*.css | sort -u`). `.btn-title` is a Vue-scoped rule in `ActivityList.vue` — PurgeCSS keeps it because the consuming SFC references it literally. **Correction to a prior version of this doc:** earlier text claimed `.btn-bar` / `.btn-base` / `.btn-in` from `phpdebugbar` were in the bundle. They are not — laravel-debugbar serves its CSS at runtime from the package, never bundled by Vite. The full-bundle sweep `public/build/assets/*.css` (LTR Sass + RTL Sass + Vue SFC `app-*.css` + `common-*.css` + `stripe-*.css`) is the authoritative verification surface.

3. **Dynamic class composition is a footgun.** PurgeCSS only sees literal tokens. A future migration step that introduces `:class="'btn-' + variant"` or `\`btn-${type}\`` would have the corresponding CSS rule silently stripped unless the rule is added to `safelist.standard`. Current audit found **0** incidents of dynamic CSS-class composition app-side (one Blade interpolation builds `{contactHash}-edit-relationship` as a JS/test hook, but no SCSS targets it). Migration PR template should call this out: **every dynamic class composition needs an explicit safelist entry**.

4. **Dev builds skip purging** ("dev builds keep every selector" per the vite.config.js comment). PurgeCSS-related migration surprises will only appear under `yarn run prod`, not `yarn run watch`. Worth knowing when iterating.

---

## Punch list (by call-site count)

| # | Family | Sites | Partial active? | Notes |
|---|---|---|---|---|
| 1 | Buttons (`btn`, `btn-primary`, …) | 372 raw, ~150 *real* | NO — `_buttons.scss` commented | Real styling lives in `resources/sass/buttons.scss` — defines only `.btn` / `.btn-primary` / `.btn-danger` / `.btn-warning`. Custom palette: `#228b22` green, `#b22222` red, `#daa520` gold (NOT Bootstrap colors). |
| 2 | Grid (`row`, `col-*`) | 293 | yes (bundle) | Only `sm`/`md` breakpoints used. No `col-lg-*` / `col-xl-*`. |
| 3 | Tables | 230 raw, ~142 real | yes | `app-ltr.scss:447-492` defines a CUSTOM `display:table` system using `.table-row` / `.table-cell` / `.table-header` children — NOT Bootstrap's table-styling. Migration largely independent of Bootstrap. |
| 4 | Forms | 229 | yes | `form-group` dominates (135). One dynamic site at `StayInTouch.vue:131` for `form-group-error` (custom, not Bootstrap). |
| 5 | Modals | 118 | yes | Vue 102 / Blade 13. Mostly Vue-componentised via `MonicaModal` (vue-final-modal wrapper). |
| 6 | Breadcrumb | 36 | NO — `_breadcrumb.scss` commented | Blade only, settings pages. Custom styles in `app-ltr.scss`. |
| 7 | Alerts | 30 | yes | Only `alert-success` (23) + `alert-danger` (7) variants used. |
| 8 | Close | 30 | yes | Vue 26 / Blade 3. |
| 9 | Nav | 28 | yes | Blade only, no tabs/pills. |
| 10 | Dropdowns | 14 raw, ~8 in 1 file | yes | Already migrated to `Dropdown.vue` (from #815). Only `resources/views/people/index.blade.php:76-100` still has dropdown-style markup, and it's wrapped in the new `<dropdown>` Vue component. |
| 11 | Cards | 12 | yes | Almost no `card-body` / `card-header` — `.card` used standalone. |
| 12 | Pagination | 7 | yes | Always paired (`page-item` + `page-link`). |
| 13 | Badges | 7 | NO — `_badge.scss` commented | Blade only, 3 sites + custom SCSS in `app-ltr.scss:142-161`. |
| 14 | BS utilities (`mr-2`, `text-muted`, `d-flex`) | ~95 | NO — `_utilities.scss` commented | App is Tachyons-first; these are stragglers. RTL-incorrect (Bootstrap 4 utilities are physical, not logical, and not wrapped in `dirltr ? ...` ternaries) — the RTL smoke catches the visible cases. |

---

## Key non-obvious findings

1. **The handoff's "39 imports" claim was wrong.** Actual count of active partials in `resources/sass/_custom_bootstrap.scss` is **12**: `bootstrap-reboot`, `bootstrap-grid`, `_tables`, `_forms`, `_dropdown`, `_nav`, `_card`, `_pagination`, `_alert`, `_close`, `_modal`, `_print`. The rest (lines 21-48) are commented out.

2. **Dead button variants — provably no-op to delete.** None of the following are defined anywhere in `resources/sass/`: `.btn-secondary`, `.btn-success`, `.btn-info`, `.btn-light`, `.btn-dark`, `.btn-link`, `.btn-outline-*`, `.btn-sm`, `.btn-lg`. Bootstrap's `_buttons.scss` partial is commented out and the custom `buttons.scss` defines only the four real ones. **Confirmed at the compiled-CSS layer (full-bundle sweep at `30641d908`):** `grep -oh "\.btn[a-z-]*" public/build/assets/*.css | sort -u` returns `.btn`, `.btn-danger`, `.btn-primary`, `.btn-title`, `.btn-warning` — see finding #2 above for the `.btn-title` exception.

3. **JS never reads classList for Bootstrap class names.** Verified via `grep classList\|className` on `resources/js/**/*.{ts,vue}` filtered for `btn-`/`alert-`/`badge-`/`card-`/`modal-`/`nav-` → empty. The dead-variant deletion is provably safe at the JS level.

4. **`.btn-add` is dead code** in `buttons.scss:95-102` (zero references in `views/` or `js/`, zero presence in compiled CSS due to PurgeCSS). Safe to delete in SCSS.

5. **`.small-btn` has 1 reference** in `resources/js/components/people/Emotion.vue:49`. Survives PurgeCSS, keep.

6. **No JS dependency on Bootstrap class names anywhere.** Already-removed Bootstrap JS (#815) plus the JS audit proves the remaining Bootstrap CSS migration is purely visual.

7. **No dynamic class composition for any CSS-styled prefix.** Verified by greps for `'<prefix>-' +`, `\`<prefix>-${...}\``, `classList.add/toggle/replace` with non-literal args, and Blade `class="…{{ }}…"` mid-token interpolation. The only Blade dynamic-class instance (`_relationship.blade.php:32`) is a JS/test hook with no SCSS target.

8. **RTL story:**
   - `app-rtl.scss` is NOT dead code (earlier session claim was wrong due to a shell-escaping bug). 22 `$htmldir == ltr` SCSS branches exist across `header.scss` (3), `journal.scss` (1), `modal.scss` (1), `people.scss` (7), `settings.scss` (4), `app-ltr.scss` (6). The compiled `app-ltr-*.css` and `app-rtl-*.css` differ by ~15% of file size.
   - **Bootstrap 4 itself has ZERO RTL handling** — `node_modules/bootstrap/scss/` has no `[dir=rtl]` selectors. The Bootstrap migration doesn't need to consider RTL at the Bootstrap layer.
   - **Template-level direction flipping** lives in 9 Vue SFCs using `useHtmlDir()` and ~40+ Blade `htmldir() == 'ltr' ? … : …` ternaries. All flip Tachyons utilities (`fl`/`fr`, `mr3`/`ml3`, `tr`/`tl`), never Bootstrap classes.
   - **Automated RTL coverage:** `tests/playwright/specs/rtl-smoke.spec.ts` (merged #816, 2026-06-16) walks 6 direction-sensitive surfaces.

---

## Recommended PR sequence

Order optimised for "smallest unambiguous diff first → builds reviewer confidence → harder swaps come last":

1. **Dead-variant deletion** — ✅ done (#817 / `bb28358eb`). Stripped `.btn-secondary` (32 sites), `.btn-success` + `.btn-approve` (passport view), `.btn-add` (SCSS), and renamed `Message.vue`'s scoped `.btn-secondary` override to `.delete-message-btn`.
2. **Badge migration** — ✅ done (#818 / `30641d908`). Verified 3 markup sites + 4 SCSS rules (the audit's "7 sites" was the combined count). Inlined Tachyons utilities at each call site, renamed colour rules to `.bg-monica-success` / `.bg-monica-danger`, deleted `.badge` base + `footer .badge-success` nested override.
3. **Breadcrumb migration** — 36 sites, settings pages only. `_breadcrumb.scss` partial commented out; custom styles in `app-ltr.scss`. Next in sequence.
4. **Alert migration** — 30 sites, two variants only (success / danger).
5. **Card migration** — 12 sites, standalone `.card` predominantly.
6. **Pagination migration** — 7 sites, always paired.
7. **Form-group migration** — 229 sites, mechanical but bulk; do alongside SCSS partial removal.
8. **Grid migration** — 293 sites, the big one. Tachyons has `flex` utilities for layout, but most `row`/`col-*` usage is layout-structural and needs case-by-case judgement.
9. **Button colour-variant migration** — last, because the four "live" variants (`.btn-primary`, `.btn-danger`, `.btn-warning`) carry the brand palette (`#228b22`, `#b22222`, `#daa520`); replacing the styling without a Tachyons green/red/gold palette is a design decision, not a mechanical swap.

Run the RTL smoke locally between each PR (`tests/playwright/specs/rtl-smoke.spec.ts`, ~5s) plus the full smoke (`yarn run smoke`, currently 93 specs, ~3min). Each PR's body should include both results.

---

## What this doc deliberately omits

- **Tables migration** — `.table-row`/`.table-cell`/`.table-header` are custom (not Bootstrap), so they're out of scope for the Bootstrap-CSS removal. They're a separate refactor target.
- **Modal migration** — `MonicaModal` is already in place wrapping `vue-final-modal`. The 13 Blade modal sites and 102 Vue modal sites use that component, not Bootstrap's `.modal-dialog`/`.modal-content` classes. Verify the Blade ones during the migration but expect minimal scope.
- **Specific Tachyons class mappings.** This is a *call-site* audit, not a *replacement* dictionary. Each migration PR will derive its own mappings.

---

## Refresh procedure

This audit ages. Before relying on any specific count above:

```bash
# Active Bootstrap partials in _custom_bootstrap.scss
grep -c "^@import" resources/sass/_custom_bootstrap.scss

# Family-X selectors that survive PurgeCSS in prod — full-bundle sweep
# (LTR Sass + RTL Sass + Vue SFC app-*.css + common-*.css + stripe-*.css).
# Substitute btn/badge/alert/breadcrumb/etc. as needed.
grep -oh "\.btn[a-z-]*" public/build/assets/*.css | sort -u

# Dynamic class composition (should stay 0)
grep -rEn ":class=\"\[?'[a-z-]+-' *\+|:class=\"\[?\`[a-z-]+-\\\$\{" resources/js
grep -rEn "class=\"[^\"]*\{\{[^}]+\}\}[^\" ]" resources/views

# Direction-sensitive SCSS branches (touching these triggers the RTL smoke)
grep -rEn "\\\$htmldir" resources/sass | wc -l
```
