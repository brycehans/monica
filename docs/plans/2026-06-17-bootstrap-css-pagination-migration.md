# Bootstrap-CSS migration — Pagination family (PR 6/n)

**Date:** 2026-06-17
**Tracker:** [#821](https://github.com/brycehans/monica/issues/821)
**Scope:** Drop the active `_pagination` Bootstrap partial. Rename the only Laravel pagination template's three Bootstrap class names (`.pagination` / `.page-item` / `.page-link`) to project-owned equivalents and port the rule bodies into `app-ltr.scss`.

This PR is the next step in the Bootstrap-CSS → Tachyons migration arc. Following the same pattern as PR #2 (Badge), PR #3 (Breadcrumb), and PR #4 (Alert) for multi-rule families: byte-equivalent CSS rules, project-owned class names, partial comes out of `_custom_bootstrap.scss`.

---

## Decision: rename to `.pager*` family

Like Alert, the Pagination family has multiple rule bodies — state-style rules for hover, focus, active, disabled, plus border-radius pairing for first/last children. Inlining each into Tachyons would require composing 4-6 utility classes per element at every callsite *and* a custom rule for the active/disabled states (Tachyons has no built-in "highlight when ancestor has .active" facility). For 7 emit-sites in a single template, the cost of inlining exceeds the benefit.

So: same playbook as Alert / Breadcrumb. Rename the Bootstrap-named selectors to project-owned ones, copy the compiled rule bodies verbatim into `app-ltr.scss`, comment out the `@import "bootstrap/scss/_pagination";` in `_custom_bootstrap.scss`.

**Why `.pager*` and not `.page-pagination*`.** The established convention from the prior PRs has been `.page-<family>` (`.page-alert`, `.page-breadcrumb`). For pagination, the literal extension would be `.page-pagination` / `.page-pagination-item` / `.page-pagination-link` — awkward "page-page" repetition and the longest class name in the codebase. `.pager` is a single common word, semantically right, distinct from Bootstrap's now-removed `.pagination`, and **not referenced anywhere in the codebase or build artifacts** (verified by `grep -rEn '\.pager|class="pager' resources/ public/build/assets/` against `b45ae9285` — empty). This is a deliberate, documented one-off deviation from the `.page-*` convention.

Mapping:

| Bootstrap | Project-owned |
|---|---|
| `.pagination` | `.pager` |
| `.page-item` | `.pager-item` |
| `.page-link` | `.pager-link` |

The `.inline-flex` Tachyons class already on the `<ul>` is unrelated and stays.

---

## Call sites

Verified via `grep -rEn 'class="[^"]*\b(page-item|page-link|pagination)\b' resources/views resources/js` against `b45ae9285`:

| # | File:line | Token | Replacement |
|---|---|---|---|
| 1 | `resources/views/vendor/pagination/default.blade.php:2` | `pagination` | `pager` |
| 2 | `resources/views/vendor/pagination/default.blade.php:5` | `page-item` (+ `disabled`) | `pager-item` |
| 3 | `resources/views/vendor/pagination/default.blade.php:5` | `page-link` | `pager-link` |
| 4 | `resources/views/vendor/pagination/default.blade.php:7` | `page-item` | `pager-item` |
| 5 | `resources/views/vendor/pagination/default.blade.php:7` | `page-link` | `pager-link` |
| 6 | `resources/views/vendor/pagination/default.blade.php:14` | `page-item` (+ `disabled`) | `pager-item` |
| 7 | `resources/views/vendor/pagination/default.blade.php:14` | `page-link` | `pager-link` |
| 8 | `resources/views/vendor/pagination/default.blade.php:21` | `page-item` (+ `active`) | `pager-item` |
| 9 | `resources/views/vendor/pagination/default.blade.php:21` | `page-link` | `pager-link` |
| 10 | `resources/views/vendor/pagination/default.blade.php:23` | `page-item` | `pager-item` |
| 11 | `resources/views/vendor/pagination/default.blade.php:23` | `page-link` | `pager-link` |
| 12 | `resources/views/vendor/pagination/default.blade.php:31` | `page-item` | `pager-item` |
| 13 | `resources/views/vendor/pagination/default.blade.php:31` | `page-link` | `pager-link` |
| 14 | `resources/views/vendor/pagination/default.blade.php:33` | `page-item` (+ `disabled`) | `pager-item` |
| 15 | `resources/views/vendor/pagination/default.blade.php:33` | `page-link` | `pager-link` |

All 15 emissions are in the single Laravel vendor template. Nothing in Vue components. No tests reference these selectors. No JS classList manipulation. No dynamic class composition.

Note on `.pagination-box` (`resources/sass/app-ltr.scss:324`): a project-owned wrapper for centred pagination (`margin-top: 30px; text-align: center`). Despite the name overlap with the Bootstrap `.pagination` family, this is NOT a Bootstrap class. Verified-dead via `grep -rn 'pagination-box' resources/` against `b45ae9285` — zero template references; PurgeCSS strips it from the prod bundle. Untouched by this PR (cleanup is a job for the future SCSS dead-code sweep, not the Pagination-family migration).

Note on `_datatable.min.scss:63` (`div.dataTables_paginate ul.pagination`): vendor CSS for DataTables jQuery plugin, scoped under `.dataTables_paginate`. This CSS will continue to apply to the DataTables internal pagination markup (which lives outside `vendor/pagination/default.blade.php`). Out of scope for this PR.

---

## SCSS

### Comment out the Bootstrap partial

`resources/sass/_custom_bootstrap.scss:33`:

```diff
- @import "bootstrap/scss/_pagination";
+ // @import "bootstrap/scss/_pagination";
```

Active partials count goes from 11 → 10. (If PR #5 also lands first, then 10 → 9. Stacking order between PR #5 and PR #6 is independent — each strips its own partial.)

### Add `.pager*` family rules to `app-ltr.scss`

Port the compiled CSS verbatim (extracted from `public/build/assets/app-ltr-*.css` at `b45ae9285`). These bytes are what Bootstrap currently emits at the default variable values used in this stack:

```scss
.pager {
  display: flex;
  padding-left: 0;
  list-style: none;
  border-radius: 0.25rem;
}

.pager-link {
  position: relative;
  display: block;
  padding: 0.5rem 0.75rem;
  margin-left: -1px;
  line-height: 1.25;
  color: #007bff;
  background-color: #fff;
  border: 1px solid #dee2e6;
}

.pager-link:hover {
  z-index: 2;
  color: #0056b3;
  text-decoration: none;
  background-color: #e9ecef;
  border-color: #dee2e6;
}

.pager-link:focus {
  z-index: 3;
  outline: 0;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.pager-item:first-child .pager-link {
  margin-left: 0;
  border-top-left-radius: 0.25rem;
  border-bottom-left-radius: 0.25rem;
}

.pager-item:last-child .pager-link {
  border-top-right-radius: 0.25rem;
  border-bottom-right-radius: 0.25rem;
}

.pager-item.active .pager-link {
  z-index: 3;
  color: #fff;
  background-color: #007bff;
  border-color: #007bff;
}

.pager-item.disabled .pager-link {
  color: #6c757d;
  pointer-events: none;
  cursor: auto;
  background-color: #fff;
  border-color: #dee2e6;
}
```

Insertion point: just after the existing `.pagination-box` block in `app-ltr.scss` (~line 327), before the `.page-alert` block. Keeps thematically-related pagination rules together.

**Note on RTL.** The current LTR and RTL bundles emit identical pagination CSS (verified via `grep -oE '\.page-item:(first|last)-child[^{]*\{[^}]*\}' public/build/assets/app-*tl-*.css` against `b45ae9285`). Bootstrap's pagination has no `@if $htmldir == ltr` branches and RTLCSS doesn't auto-flip the first/last-child border-radius rules. This means in Hebrew today, the first-child pager item gets a *left*-rounded corner (visually wrong for a row that flows right-to-left, but that's the current visual contract). Preserving byte-equivalence preserves this inconsistency — fixing the RTL bug is a separate task and out of scope for this mechanical migration.

---

## Verification procedure

1. `yarn run prod` — diff `.pager*` rules in the rebuilt `public/build/assets/app-ltr-*.css` against the soon-to-be-removed `.page-link`/`.page-item`/`.pagination` rules. Should be byte-identical except for the leading selector token (`.pagination` → `.pager`, `.page-item` → `.pager-item`, `.page-link` → `.pager-link`).
2. `docker exec monica-app-1 php artisan view:clear && docker restart monica-app-1` — flush Blade view cache + OpCache.
3. Browser-verify: pagination renders on `/settings/audit-logs` and `/journal` after enough activity. Quickest path on a fresh dev DB: lower the `paginate()` count temporarily in `AuditLogController` (or seed audit entries via tinker) to force the second page, then visit the page and confirm:
   - Buttons render rectangular with gray borders
   - Active button is filled blue (#007bff)
   - Disabled `«` / `»` chevrons are grayed and unclickable
   - Hover state lightens background
   - First/last buttons have rounded outer corners
4. `yarn run e2e` (Playwright smoke, 93 specs) — no spec references pagination selectors, so the e2e check is for catching unrelated regressions.

---

## Commit shape

```
chore(bootstrap-css): rename .pagination → .pager, drop _pagination partial (pr 6/n)

Single Bootstrap pagination-family call site: the Laravel vendor template
resources/views/vendor/pagination/default.blade.php (rendered from
controllers under Journal, Contacts, AuditLog, Settings, Gift,
Introductions, Relationships, ContactAuditLog).

Rename .pagination → .pager, .page-item → .pager-item, .page-link →
.pager-link (15 emissions across one template). Port the compiled
rule bodies verbatim into resources/sass/app-ltr.scss; comment out
@import "bootstrap/scss/_pagination" in _custom_bootstrap.scss.

Bundle effect: .pagination / .page-item / .page-link selectors leave
public/build/assets/. Replaced by byte-equivalent .pager / .pager-item
/ .pager-link rules (verified by diffing rule bodies pre/post).

Active Bootstrap partials in _custom_bootstrap.scss: 11 → 10 (or 10 → 9
if PR #5 lands first; PRs stack independently).

Deviation from the `.page-*` rename convention used in PRs 2-4 (badge,
breadcrumb, alert): `.page-pagination` would be awkwardly named "page
page", so `.pager*` instead. Single-word, semantically right, no
collisions in the codebase or build artifacts. Documented in the plan.

Tracker: #821
Audit: docs/plans/2026-06-16-bootstrap-css-audit.md
Plan: docs/plans/2026-06-17-bootstrap-css-pagination-migration.md

Claude-Session: <session_id>
Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
```
