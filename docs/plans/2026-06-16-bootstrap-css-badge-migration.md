# Bootstrap badge migration — implementation plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the three remaining Bootstrap-flavoured `.badge` / `.badge-success` / `.badge-danger` call sites with inlined Tachyons utility combos at the markup, and rename the colour-bearing SCSS rules off the Bootstrap namespace. End state: no `.badge*` selector anywhere in source or compiled CSS; two small project-named colour utilities (`.bg-monica-success`, `.bg-monica-danger`) carry the exact hex values previously held by `.badge-success` / `.badge-danger`.

**Architecture:** Three Blade call sites currently rely on a global `.badge` base rule plus colour modifier plus (for one site) a nested footer override on font-size/weight. Inlining the base rule's properties as Tachyons utilities at each call site folds the footer cascade trick naturally — the footer site just picks `fw4` instead of `fw7`, no parent-selector match needed. Colour comes from the renamed `.bg-monica-*` classes (same single-property rule, just a non-Bootstrap name).

**Tech Stack:** Blade templates, SCSS (`resources/sass/app-ltr.scss`), Tachyons utility classes (already imported at `app-ltr.scss:18`). Verification via `yarn run prod` + token-diff grep, Playwright RTL smoke, full smoke suite.

---

## Scope (verified by grep, 2026-06-16 against `bb28358eb`)

| Surface | Sites | Where |
|---|---|---|
| Blade markup | 3 | `resources/views/settings/imports/report.blade.php:52,54` (status pills in import-report table), `resources/views/partials/check.blade.php:11` (new-version link, rendered in `partials.footer`) |
| SCSS rules | 4 | `resources/sass/app-ltr.scss:142-153` (`.badge` base), `:155-157` (`.badge-success`), `:159-161` (`.badge-danger`), `:589-592` (nested `footer .badge-success` font-size/weight override) |

No Vue SFCs reference `.badge*`. The `_badge` partial is already commented out at `resources/sass/_custom_bootstrap.scss:34`.

Companion doc: [`2026-06-16-bootstrap-css-audit.md`](2026-06-16-bootstrap-css-audit.md) (the call-site map and recommended PR sequence). PR 1 in the sequence landed as #817 (`bb28358eb`).

---

## Design decisions

Reached via brainstorming session 2026-06-16. The two real forks were:

**(1) Option (a) inline-to-Tachyons vs option (b) rename global classes to non-Bootstrap names.** Chose **(a)**. With only 3 call sites the duplication cost of inlining is trivial, and the existing `footer .badge-success` override is an argument *for* (a) — it's a context-dependent style that maps cleanly to "this site uses different utilities" rather than to a cascade trick. (b) would have left a follow-up PR to actually reach Tachyons end-state.

**(2) How to handle colours that Tachyons doesn't carry.** Original lime-green `#32cd32` and Bootstrap-red `#d9534f` are not in Tachyons' default palette. Three sub-options considered:

- **A1 inline `style="background-color:#..."`** — exact, but inline styles violated the migration arc's "Tachyons-only" direction.
- **A2 swap to Tachyons `bg-green` / `bg-red`** — drift (`#19a974` and `#ff4136` aren't the same shades). Violates the CLAUDE.md "zero user-facing behaviour change" hard constraint.
- **A3 rename the existing colour rules to project utilities** (`.bg-monica-success`, `.bg-monica-danger`). Chosen. Tachyons-shaped (atomic, single-property, named by intent), exact colour preservation, no Bootstrap names left in tree.

**(3) `padding: 4px 5px` mapping.** Tachyons has `ph1` (4px) and `ph2` (8px), neither exactly 5px. Accepted `ph1` (1px loss horizontally). Invisible on single-line status pills; the compiled-CSS proof grep can't catch a 1px regression but the visual walk can.

**(4) Doc & commit shape.** Combined plan doc as first commit on the topic branch, then one commit per concern (Blade edits, SCSS edits). Matches #817's reviewer-liked shape and the handoff's explicit precedent.

---

## Task 1: Branch + baseline capture

**Files:** none modified yet.

**Step 1: Cut the topic branch off 4.x** (already done at session start).

```bash
git switch -c bootstrap-css-badge-migration
```

**Step 2: Re-grep the source to confirm scope hasn't shifted.**

```bash
grep -rEn "badge[- ]?(success|danger)?" resources/views/ resources/sass/ resources/js/
```

Expected: 3 markup matches in the two Blade files above, 4 SCSS matches in `app-ltr.scss` (lines 142, 155, 159, 589 — selector starts), no Vue matches, no other Blade matches. If anything else surfaces STOP and update this plan before editing.

**Step 3: Capture the production-CSS baseline.**

```bash
yarn run prod
grep -oh "\.badge[a-z-]*" public/build/assets/*.css | sort -u > tmp/badge-tokens-before.txt
cat tmp/badge-tokens-before.txt
```

Expected: `.badge`, `.badge-danger`, `.badge-success`. Save the file — it becomes the proof artifact for the PR body. (The single `*.css` glob covers all five compiled bundles per the handoff's full-bundle sweep convention.)

**Step 4: Commit nothing yet.** Baseline lives in `tmp/`, not in the tree.

---

## Task 2: Commit the plan doc

**Files:** `docs/plans/2026-06-16-bootstrap-css-badge-migration.md` (this file).

**Step 1: Stage and commit.**

`tmp/commit-msg.txt`:

```
docs(plans): bootstrap badge migration plan (pr 2/n)

migration plan for the second pr in the bootstrap-css → tachyons arc:
inline .badge / .badge-success / .badge-danger styling into tachyons
utilities at the 3 remaining call sites, and rename the colour rules
off the bootstrap namespace.

audit doc: docs/plans/2026-06-16-bootstrap-css-audit.md.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
Claude-Session: <SESSION_ID>
```

```bash
git add docs/plans/2026-06-16-bootstrap-css-badge-migration.md
git commit -F tmp/commit-msg.txt
rm tmp/commit-msg.txt
```

---

## Task 3: Inline badge styling at 3 Blade markup sites

**Files (3 Blade files, single literal swap each):**

The Tachyons combo carries the structural properties of the old `.badge` base rule. The `bg-monica-*` class carries the colour. The footer call site uses `fw4` instead of `fw7` to absorb the old nested override.

- Modify: `resources/views/settings/imports/report.blade.php:52`
- Modify: `resources/views/settings/imports/report.blade.php:54`
- Modify: `resources/views/partials/check.blade.php:11`

**Step 1: Edit `report.blade.php:52`.**

```
<span class="badge badge-success">{{ trans('settings.import_report_status_imported') }}</span>
```

→

```
<span class="dib pv1 ph1 f7 fw7 lh-solid white tc nowrap v-base br2 bg-monica-success">{{ trans('settings.import_report_status_imported') }}</span>
```

**Step 2: Edit `report.blade.php:54`.**

```
<span class="badge badge-danger">{{ trans('settings.import_report_status_skipped') }}</span>
```

→

```
<span class="dib pv1 ph1 f7 fw7 lh-solid white tc nowrap v-base br2 bg-monica-danger">{{ trans('settings.import_report_status_skipped') }}</span>
```

**Step 3: Edit `check.blade.php:11`** (note `fw4` not `fw7` — absorbs the old `footer .badge-success { font-weight: 400 }` override). The `onclick` and other attributes stay untouched.

```
<a href="" class="badge badge-success" onclick="document.dispatchEvent(new CustomEvent('monica:show-version-modal')); return false;">{{ trans('app.footer_new_version') }}</a>
```

→

```
<a href="" class="dib pv1 ph1 f7 fw4 lh-solid white tc nowrap v-base br2 bg-monica-success" onclick="document.dispatchEvent(new CustomEvent('monica:show-version-modal')); return false;">{{ trans('app.footer_new_version') }}</a>
```

**Step 4: Verify no `class=".*badge` remains in Blade.**

```bash
grep -rnE 'class="[^"]*\bbadge\b' resources/views/
```

Expected: empty output.

**Step 5: Commit (Blade-only commit so the diff stays scannable).**

`tmp/commit-msg.txt`:

```
refactor(bootstrap-css): inline badge styling into tachyons at 3 blade sites (pr 2/n)

replaces `class="badge badge-{success,danger}"` with tachyons utility
combos plus `.bg-monica-{success,danger}` (renamed in the scss commit
that follows). visual no-op modulo 1px horizontal padding (5px → 4px
via ph1).

the footer call site (partials/check.blade.php) uses fw4 instead of
fw7 to absorb what was previously the `footer .badge-success` nested
override on font-weight. font-size is the same (12px) in both flavours
via f7.

part of the bootstrap-css → tachyons migration (audit:
docs/plans/2026-06-16-bootstrap-css-audit.md).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
Claude-Session: <SESSION_ID>
```

```bash
git add resources/views/
git commit -F tmp/commit-msg.txt
rm tmp/commit-msg.txt
```

---

## Task 4: Rename colour rules + delete base rule + delete footer override in `app-ltr.scss`

**Files:**

- Modify: `resources/sass/app-ltr.scss` — three contiguous edits:
  - Lines 142-153: delete `.badge { … }` base rule entirely
  - Lines 155-161: replace `.badge-success` / `.badge-danger` with `.bg-monica-success` / `.bg-monica-danger` (same single-property bodies)
  - Lines 589-592: delete the nested `footer .badge-success` block (the rest of the `footer { … }` rule stays)

**Step 1: Re-read the file's current state around lines 140 and 585.**

Confirm the line ranges match what's in this plan. If the file has drifted since `bb28358eb`, recompute the offsets before editing.

**Step 2: Replace lines 142-161** with:

```scss
.bg-monica-success {
  background-color: #32cd32;
}

.bg-monica-danger {
  background-color: #d9534f;
}
```

(The `.badge` base rule's 11 properties move to per-call-site Tachyons utilities — see Task 3. The two colour rules keep their bodies; only the selector renames.)

**Step 3: Delete the nested `footer .badge-success` block** inside the `footer { … }` rule near line 589. Lines to remove:

```scss
  .badge-success {
    font-size: 12px;
    font-weight: 400;
  }
```

The surrounding `footer { … }` keeps its other nested rules (`.show-version`, etc.). Be careful not to accidentally remove an extra closing `}` and leave the file unbalanced.

**Step 4: Verify no `.badge` selectors remain in any SCSS.**

```bash
grep -rnE '\.badge[a-z-]*' resources/sass/
```

Expected: empty (the previously-commented-out `@import "bootstrap/scss/_badge"` line at `_custom_bootstrap.scss:34` is a comment match for `_badge`, not `.badge`, so it shouldn't fire — confirm).

**Step 5: Verify the new colour utilities are present.**

```bash
grep -n "bg-monica-" resources/sass/app-ltr.scss
```

Expected: 2 lines (one selector each).

**Step 6: Commit.**

`tmp/commit-msg.txt`:

```
refactor(bootstrap-css): rename badge colour rules off bootstrap namespace + delete .badge base (pr 2/n)

deletes `.badge` base rule (11 properties moved to per-call-site
tachyons utilities in the previous commit) and the nested
`footer .badge-success` font override (the one footer call site now
picks fw4 directly in markup).

renames `.badge-success` / `.badge-danger` to `.bg-monica-success` /
`.bg-monica-danger` — same single-property bodies, just non-bootstrap
names. these may be reused in later prs in the migration arc; their
size justifies keeping them rather than going inline-style.

part of the bootstrap-css → tachyons migration.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
Claude-Session: <SESSION_ID>
```

```bash
git add resources/sass/app-ltr.scss
git commit -F tmp/commit-msg.txt
rm tmp/commit-msg.txt
```

---

## Task 5: Verify production CSS — expected token-set change

**Files:** none modified.

This task differs from #817's Task 7: the token set is *expected to change* this time. The proof artifact is "expected vs actual diff", not "before == after".

**Step 1: Rebuild.**

```bash
yarn run prod
```

**Step 2: Capture the post-edit token set.**

```bash
grep -oh "\.badge[a-z-]*" public/build/assets/*.css | sort -u > tmp/badge-tokens-after.txt
cat tmp/badge-tokens-after.txt
```

Expected: **empty file.** Every `.badge*` selector should be gone from compiled CSS.

**Step 3: Confirm the new colour utilities ARE in compiled CSS.**

```bash
grep -oh "\.bg-monica-[a-z]*" public/build/assets/*.css | sort -u > tmp/bg-monica-tokens-after.txt
cat tmp/bg-monica-tokens-after.txt
```

Expected: `.bg-monica-danger`, `.bg-monica-success`. PurgeCSS keeps both because the literal class names appear in the Blade templates (the safelist regex in `vite.config.js` matches anything appearing in template strings).

**Step 4: Confirm no other bundles regressed** (the audit doc's expected baseline at #817 covered `.btn*` — that family should still match).

```bash
grep -oh "\.btn[a-z-]*" public/build/assets/*.css | sort -u
```

Expected: same set as #817's post-merge baseline (`.btn`, `.btn-danger`, `.btn-primary`, `.btn-warning`, plus phpdebugbar's `.btn-bar` / `.btn-in` etc. served from the package, plus `.btn-title` from `ActivityList.vue`'s scoped style if present in the Vue SFC bundle).

**Step 5: Stash for the PR body.**

```bash
{
  echo "=== before ==="
  cat tmp/badge-tokens-before.txt
  echo "=== after ==="
  cat tmp/badge-tokens-after.txt
  echo "=== new tokens ==="
  cat tmp/bg-monica-tokens-after.txt
} > tmp/badge-tokens-proof.txt
```

---

## Task 6: Run the safety net (RTL smoke + full smoke)

**Files:** none modified.

**Step 1: Bring up the dev stack** (if not already running).

```bash
docker compose -f docker-compose.dev.yml up -d
```

**Step 2: Run the RTL smoke.**

```bash
cd tests/playwright && yarn run rtl-smoke
```

Expected: 6 specs, all green in ~4-5s. The settings-page surface specifically exercises the import-report area indirectly via the settings nav.

**Step 3: Run the full smoke as belt-and-braces.**

```bash
yarn run smoke
```

Expected: 93 specs pass in ~3min. (Spec count corrected from the prior handoff's stale "44" figure.)

**Step 4: Capture results for the PR body.**

Note pass/fail count + wall time for both runs.

---

## Task 7: Visual walk in dev container

**Files:** none modified.

The compiled-CSS grep can't catch the 1px horizontal padding loss or any subtle visual regression. Visual confirmation closes that gap.

**Step 1: Ensure the dev stack is up with HTTPS** (`https://localhost:8443`).

**Step 2: Confirm the import-report page renders status pills correctly.**

- Log in as `admin@admin.com` / `admin0` (from `php artisan setup:test`) or use a regression-demo account.
- Navigate to Settings → Imports.
- If there's no completed import job, upload a small vCard to generate one.
- Confirm green "imported" pills and red "skipped" pills render visually identical to the pre-change baseline (lime green `#32cd32` and `#d9534f` respectively, 12px font, 700 weight).

**Step 3: Confirm the version-check footer link renders correctly.**

The version-check link only appears when `config('monica.check_version')` is truthy AND `$instance->latest_version > config('monica.app_version')`. Two paths to surface it:
- Temporarily set `MONICA_CHECK_VERSION=true` in the container's `.env` and seed an `Instance` with a higher `latest_version`, then `docker restart monica-app-1`.
- Or skip the live check and inspect the rendered markup directly via browser devtools after manually toggling `display:block` on the hidden `<li>`.

Confirm the badge link renders with 12px font, 400 weight (lighter than the report pills), on a lime-green pill.

**Step 4: Note any visual differences.** Anything beyond invisible (e.g. a clear shape or colour shift) is a regression — stop and investigate.

---

## Task 8: Push branch and open the PR

**Files:** none.

**Step 1: Push.**

```bash
git push -u origin bootstrap-css-badge-migration
```

**Step 2: Open the PR with `gh pr create --body-file`.**

Write the body to `tmp/pr-body.md` first:

```markdown
## Summary

Second PR in the Bootstrap-CSS → Tachyons migration arc ([audit doc](docs/plans/2026-06-16-bootstrap-css-audit.md), [implementation plan](docs/plans/2026-06-16-bootstrap-css-badge-migration.md)).

Inlines the three remaining `.badge` / `.badge-success` / `.badge-danger` call sites into Tachyons utility combos at the markup, and renames the colour-bearing SCSS rules off the Bootstrap namespace:

- **3 Blade markup sites** — 2 status pills in import-report table, 1 version-check link in the page footer
- **4 SCSS rules deleted/renamed in `app-ltr.scss`** — `.badge` base (11 properties → Tachyons at each call site), `.badge-success` / `.badge-danger` (renamed to `.bg-monica-success` / `.bg-monica-danger`, same colours), nested `footer .badge-success` override (now picked up directly in the markup via `fw4`)

No Vue SFCs reference these classes. End state: `.badge*` does not appear anywhere in source or compiled CSS.

## Visual no-op (within 1px horizontal padding)

Tachyons `ph1` is 4px; original `.badge` padding was 5px horizontally. Accepted as invisible on single-line status pills — confirmed by visual walk (see Test plan).

## Proof of token-set change

`grep -oh "\.badge[a-z-]*" public/build/assets/*.css | sort -u`:

\`\`\`
<paste contents of tmp/badge-tokens-proof.txt>
\`\`\`

## Safety net

- RTL Playwright smoke (`tests/playwright/specs/rtl-smoke.spec.ts`): **<paste pass count + wall time>**
- Full smoke suite (`yarn run smoke`, 93 specs): **<paste pass count + wall time>**

## Out of scope

- `_breadcrumb` migration (next: PR 3/n per audit doc)
- Bootstrap utility class drift (`mr-2`, `text-muted`, `d-flex`, …)
- Live `.btn-*` brand variants — last in the sequence

## Test plan

- [x] `grep -rEn 'class="[^"]*\bbadge\b' resources/views/` returns empty
- [x] `grep -rnE '\.badge[a-z-]*' resources/sass/` returns empty
- [x] `yarn run prod` rebuilds clean
- [x] `tmp/badge-tokens-after.txt` is empty (no `.badge*` in compiled CSS)
- [x] `tmp/bg-monica-tokens-after.txt` shows the two new utility classes
- [x] RTL smoke passes
- [x] Full smoke passes
- [x] Visual walk: import-report status pills look identical pre/post
- [x] Visual walk: footer version-check link looks identical pre/post

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

Then:

```bash
gh pr create --title "chore(bootstrap-css): inline badge styling into tachyons (pr 2/n)" --body-file tmp/pr-body.md
rm tmp/pr-body.md
```

**Step 3: Verify PR url returned.** Post the URL back to the user.

---

## Rollback plan

If verification at Task 5 shows `.badge*` still present in compiled CSS, or the smoke suites flag a regression, the topic branch is throwaway:

```bash
git switch 4.x
git branch -D bootstrap-css-badge-migration
```

Nothing on `4.x` was touched. Likely causes to re-investigate:
- A `.badge*` selector elsewhere in resources/ that the scope grep missed (e.g. inside a Vue SFC scoped style that wasn't grepped, or in a vendored partial).
- PurgeCSS safelist hit keeping a dead `.badge*` token in compiled CSS (unlikely — the safelist matches template strings, and we're removing those strings).
- A new contributor surface introduced `.badge*` between `bb28358eb` and now — re-run the Task 1 grep to confirm.

---

## Out-of-scope follow-ups

These stay for later PRs in the migration sequence:

- **Breadcrumb migration** (PR 3/n) — 36 settings-only sites, `_breadcrumb.scss` partial already commented out, custom rules live in `app-ltr.scss`. Same brainstorm pattern as PR 2 will likely apply.
- **Bootstrap utility class drift** — `mr-2`, `text-muted`, `d-flex` and friends. RTL-incorrect, ~95 sites.
- **Live `.btn-*` brand variants** — `.btn-primary`, `.btn-danger`, `.btn-warning`. Last in the sequence; carries the brand palette and needs a design call rather than a mechanical swap.

The audit doc's "Recommended PR sequence" section is the running roadmap.
