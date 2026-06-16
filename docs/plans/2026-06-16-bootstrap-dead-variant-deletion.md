# Bootstrap dead-variant deletion — implementation plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Strip the Bootstrap-CSS-era button variant tokens that paint nothing in production (`.btn-secondary`, `.btn-success`, `.btn-approve`, `.btn-add`) from the source tree. Pure source-readability cleanup with provable visual no-op.

**Architecture:** PurgeCSS (`vite.config.js:67-105`) already strips these selectors from production CSS because no SCSS rule defines them outside of one scoped Vue style. The change is therefore a pure source edit — markup-only swaps of `class="btn btn-secondary"` → `class="btn"` plus deletion of one `.btn-add` SCSS block and one orphaned scoped-style rule. Final compiled `app-ltr-*.css` / `app-rtl-*.css` must contain the same `btn-?` selector set as today.

**Tech Stack:** Vite 8 + PurgeCSS, Blade templates, Vue 3.5 `<script setup>` SFCs, SCSS. Verification via `yarn run prod` + grep diff, Playwright RTL smoke, dep-upgrade smoke.

---

## Scope (verified by grep, 2026-06-16 against `5b7fb4141`)

Dead button-variant tokens actually present in `resources/`:

| Token | Sites | Where |
|---|---|---|
| `btn-secondary` | 32 in 28 files (22 Blade, 6 Vue) + 1 scoped SCSS rule in `Message.vue` (renamed, not deleted — see Task 4 rationale) | Cancel/dismiss/delete buttons |
| `btn-success` | 1 site (`vendor/passport/authorize.blade.php:38`) | Paired with also-dead `btn-approve` |
| `btn-add` (SCSS) | 1 rule block (`buttons.scss:95-102`) | Zero markup references |

Tokens audited *and confirmed absent* from source: `btn-info`, `btn-light`, `btn-dark`, `btn-link`, `btn-outline-*`, `btn-sm`, `btn-lg`. **Not in scope.**

Companion docs: [`2026-06-16-bootstrap-css-audit.md`](2026-06-16-bootstrap-css-audit.md) (the call-site map + PurgeCSS finding), [`2026-06-16-rtl-playwright-smoke-design.md`](2026-06-16-rtl-playwright-smoke-design.md) (the safety net).

---

## Task 1: Branch + baseline capture

**Files:** none modified yet.

**Step 1: Cut a topic branch off 4.x.**

```bash
git switch -c chore/bootstrap-dead-variant-deletion
```

**Step 2: Re-grep the source to confirm scope hasn't shifted.**

```bash
grep -rEn "btn-(secondary|success|info|light|dark|link|outline-[a-z]+|sm|lg|add|approve)" resources/
```

Expected: 32 `btn-secondary` lines + 1 `btn-success` + 1 `btn-approve` + 1 `.btn-add` SCSS rule. If anything else surfaces (new variants introduced since this plan was written, or a count delta in the existing tokens) STOP and update the plan before editing.

**Step 3: Capture the production-CSS baseline.**

```bash
yarn run prod
grep -oE "\.btn-?[a-z]*" public/build/assets/app-ltr-*.css | sort -u > /tmp/btn-tokens-before.txt
grep -oE "\.btn-?[a-z]*" public/build/assets/app-rtl-*.css | sort -u >> /tmp/btn-tokens-before.txt
sort -u /tmp/btn-tokens-before.txt -o /tmp/btn-tokens-before.txt
cat /tmp/btn-tokens-before.txt
```

Expected: `.btn`, `.btn-danger`, `.btn-primary`, `.btn-warning` from app code, plus the `btn-bar`/`btn-base`/`btn-in`/etc. tokens from phpdebugbar chrome. Save this file — it becomes the proof artifact for the PR body.

**Step 4: Commit nothing yet.** Baseline is in `/tmp`, not in the tree.

---

## Task 2: Strip `btn-secondary` from Blade templates

**Files (22 Blade files, single literal swap each):**

For every file below: `class="btn btn-secondary…"` → `class="btn…"`. Whitespace between tokens collapses to one space. Other classes on the same `class=` attribute (`tc`, `w-100`, `pointer`, `mb2`, etc.) stay.

- Modify: `resources/views/journal/edit.blade.php:59`
- Modify: `resources/views/journal/add.blade.php:54`
- Modify: `resources/views/settings/imports/upload.blade.php:78`
- Modify: `resources/views/settings/subscriptions/update.blade.php:63`
- Modify: `resources/views/settings/users/add.blade.php:69`
- Modify: `resources/views/auth/recovery/login.blade.php:38`
- Modify: `resources/views/people/edit.blade.php:155`
- Modify: `resources/views/people/create.blade.php:140`
- Modify: `resources/views/people/create.blade.php:143`
- Modify: `resources/views/people/debt/form.blade.php:42`
- Modify: `resources/views/people/relationship/new.blade.php:172`
- Modify: `resources/views/people/relationship/edit.blade.php:148`
- Modify: `resources/views/people/food-preferences/edit.blade.php:55`
- Modify: `resources/views/people/conversations/edit.blade.php:81`
- Modify: `resources/views/people/conversations/new.blade.php:71`
- Modify: `resources/views/people/work/edit.blade.php:53`
- Modify: `resources/views/people/avatar/edit.blade.php:32`
- Modify: `resources/views/people/reminders/form.blade.php:87`
- Modify: `resources/views/people/introductions/edit.blade.php:104`
- Modify: `resources/views/partials/components/people-upgrade-sidebar.blade.php:7`
- Modify: `resources/views/partials/check-modal.blade.php:21`

**Step 1: Edit each file.**

Use `Edit` per file, not `sed` (the constraint comes from CLAUDE.local.md). For each line above the pattern is identical: locate `btn btn-secondary` and replace with `btn`. Examples:

```
class="btn btn-secondary"                          → class="btn"
class="btn btn-secondary w-100 mb2 pb0-ns tc"      → class="btn w-100 mb2 pb0-ns tc"
class="btn btn-secondary w-auto-ns w-100 mb2 pb0-ns" → class="btn w-auto-ns w-100 mb2 pb0-ns"
class="btn btn-secondary tc w-auto-ns w-100 mb2 pb0-ns" → class="btn tc w-auto-ns w-100 mb2 pb0-ns"
```

Care: some lines have leading text like `☆ {{ trans(...) }}` after the closing `>`. Do not touch that. Only the `class="…"` value changes.

**Step 2: Verify no `btn-secondary` remains in Blade.**

```bash
grep -rn "btn-secondary" resources/views/
```

Expected: empty output. If anything remains, edit it before proceeding.

**Step 3: Commit (Blade-only commit so the diff stays scannable).**

Write the commit message to `tmp/commit-msg.txt` (per CLAUDE.local.md — heredocs are blocked):

```
chore(bootstrap-css): drop btn-secondary from blade templates

source-readability cleanup. .btn-secondary is undefined anywhere in
resources/sass/ and is already absent from production css via
purgecss. swap is visual no-op.

part of the bootstrap-css → tachyons migration (audit:
docs/plans/2026-06-16-bootstrap-css-audit.md).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
Claude-Session: <SESSION_ID>
```

Then:

```bash
git add resources/views/
git commit -F tmp/commit-msg.txt
rm tmp/commit-msg.txt
```

---

## Task 3: Strip `btn-secondary` from Vue components (excluding Message.vue)

**Files (6 SFCs, single literal swap each):**

Same pattern as Task 2 (`btn btn-secondary` → `btn`). All sites are in markup, not in `<script>` or `<style>`.

- Modify: `resources/js/components/journal/RateDay.vue:186`
- Modify: `resources/js/components/settings/Subscription.vue:73`
- Modify: `resources/js/components/people/Notes.vue:20`
- Modify: `resources/js/components/people/calls/PhoneCallList.vue:106`
- Modify: `resources/js/components/people/calls/PhoneCallList.vue:194`
- Modify: `resources/js/components/people/lifeevent/CreateLifeEvent.vue:139`
- Modify: `resources/js/components/people/gifts/CreateGift.vue:213`
- Modify: `resources/js/components/people/activity/CreateActivity.vue:115`
- Modify: `resources/js/components/people/conversation/Conversation.vue:47`

**Step 1: Edit each file.**

`Notes.vue:20` has `class="pointer btn btn-secondary"` → `class="pointer btn"`.
Most others are `class="btn btn-secondary tc w-auto-ns w-100 mb2 pb0-ns"` → `class="btn tc w-auto-ns w-100 mb2 pb0-ns"`.
`Subscription.vue:73` uses `class="btn btn-secondary w-100 tc"` → `class="btn w-100 tc"`.
`Conversation.vue:47` is `class="btn btn-secondary pointer"` → `class="btn pointer"`.

**Step 2: Verify no `btn-secondary` remains in non-Message Vue files.**

```bash
grep -rn "btn-secondary" resources/js/ | grep -v Message.vue
```

Expected: empty. Message.vue is intentionally still present at this point (handled in Task 4).

**Step 3: Commit.**

`tmp/commit-msg.txt`:

```
chore(bootstrap-css): drop btn-secondary from vue components

source-readability cleanup. same justification as the blade swap:
.btn-secondary is undefined globally and stripped from prod css by
purgecss. message.vue handled separately because it also defines a
scoped .btn-secondary rule that becomes dead.

part of the bootstrap-css → tachyons migration.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
Claude-Session: <SESSION_ID>
```

```bash
git add resources/js/
git commit -F tmp/commit-msg.txt
rm tmp/commit-msg.txt
```

---

## Task 4: Rename `btn-secondary` → `delete-message-btn` in Message.vue (preserve visual)

**Why a rename, not a deletion** (key finding from plan verification, 2026-06-16):

`Message.vue:12` is the ONLY place in source that defines `.btn-secondary` — a scoped style overriding `font-size: 12px; padding: 4px 10px` on the delete-message button. PurgeCSS keeps the scoped rule because `Message.vue:22` references the class literally. If we strip the class token AND delete the rule, the delete button reverts from (12px, 4px 10px) to the standard `.btn` size (14px, 6px 12px) — a real visual change, and the prod-CSS token diff in Task 7 will show `.btn-secondary` disappearing. The "zero visual change" claim breaks.

A pure rename to `.delete-message-btn` keeps the visual identical, removes the misleading `btn-secondary` name (it isn't a Bootstrap variant in any meaningful sense — just a local size override), and keeps the Task 7 token diff truly empty (the regex `\.btn-?[a-z]*` doesn't match `.delete-message-btn`).

**Files:**

- Modify: `resources/js/components/people/conversation/Message.vue:12` (rule selector: `.btn-secondary` → `.delete-message-btn`)
- Modify: `resources/js/components/people/conversation/Message.vue:22` (`class="pointer btn btn-secondary"` → `class="pointer btn delete-message-btn"`)

**Step 1: Read the current state.**

The file has a scoped `<style>` block:

```css
.btn-secondary {
  font-size: 12px;
  padding: 4px 10px;
}
```

Used at line 22:

```html
<a class="pointer btn btn-secondary" href="" @click.prevent="deleteMessage">
```

**Step 2: Rename the selector on line 12.**

```css
.delete-message-btn {
  font-size: 12px;
  padding: 4px 10px;
}
```

The rule body (font-size + padding) stays identical.

**Step 3: Rename the consumer on line 22.**

`class="pointer btn btn-secondary"` → `class="pointer btn delete-message-btn"`.

**Step 4: Verify the file no longer contains `btn-secondary`.**

```bash
grep -n "btn-secondary" resources/js/components/people/conversation/Message.vue
```

Expected: empty.

**Step 5: Verify the rename is internally consistent.**

```bash
grep -c "delete-message-btn" resources/js/components/people/conversation/Message.vue
```

Expected: 2 (one selector, one class application).

**Step 6: Commit.**

`tmp/commit-msg.txt`:

```
chore(bootstrap-css): rename message.vue scoped style off bootstrap name

message.vue had a scoped .btn-secondary rule (font-size: 12px, padding:
4px 10px) overriding the delete-message button to be smaller than .btn.
.btn-secondary is otherwise undefined in source — this scoped style was
the only definition. rename to .delete-message-btn to drop the misleading
bootstrap name without changing the visual (purgecss keeps the renamed
selector since its consumer still references it literally).

part of the bootstrap-css → tachyons migration.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
Claude-Session: <SESSION_ID>
```

```bash
git add resources/js/components/people/conversation/Message.vue
git commit -F tmp/commit-msg.txt
rm tmp/commit-msg.txt
```

---

## Task 5: Strip `btn-success btn-approve` from passport authorize view

**Files:**

- Modify: `resources/views/vendor/passport/authorize.blade.php:38`

This is the published Laravel Passport authorize view (customised at fork time). Both `btn-success` (Bootstrap variant, undefined here) and `btn-approve` (zero other references in the tree) paint nothing.

**Step 1: Edit line 38.**

```
<button type="submit" class="btn btn-success btn-approve">Authorize</button>
```

→

```
<button type="submit" class="btn">Authorize</button>
```

**Step 2: Verify no `btn-success` or `btn-approve` remains anywhere.**

```bash
grep -rEn "btn-success|btn-approve" resources/
```

Expected: empty.

**Step 3: Commit.**

`tmp/commit-msg.txt`:

```
chore(bootstrap-css): drop btn-success + btn-approve from passport authorize view

both classes paint nothing — .btn-success is an undefined bootstrap
variant, .btn-approve has no rule anywhere. published passport view,
hand-customised already; staying on a future vendor:publish refresh
isn't a concern.

part of the bootstrap-css → tachyons migration.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
Claude-Session: <SESSION_ID>
```

```bash
git add resources/views/vendor/passport/authorize.blade.php
git commit -F tmp/commit-msg.txt
rm tmp/commit-msg.txt
```

---

## Task 6: Delete `.btn-add` block from buttons.scss

**Files:**

- Modify: `resources/sass/buttons.scss:95-102` (delete the entire `.btn-add { … }` block, plus the blank line that follows so `.small-btn` becomes adjacent to `.btn-warning`)

**Step 1: Re-confirm zero references.**

```bash
grep -rEn "btn-add" resources/
```

Expected: only `resources/sass/buttons.scss:95:.btn-add {`. If any usage exists in markup, STOP — the audit was wrong, escalate before deleting.

**Step 2: Delete lines 95-102 in `buttons.scss`** including the trailing blank line so the file is left with `.btn-warning { … }` followed by `.small-btn { … }`.

**Step 3: Verify `.small-btn` survived.**

```bash
grep -n "small-btn" resources/sass/buttons.scss
```

Expected: one match at the new line number (around 95). `Emotion.vue:49` is its sole consumer; do NOT delete it.

**Step 4: Commit.**

`tmp/commit-msg.txt`:

```
chore(bootstrap-css): delete dead .btn-add scss block

zero references anywhere in resources/. already absent from prod css
via purgecss. source-readability cleanup.

part of the bootstrap-css → tachyons migration.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
Claude-Session: <SESSION_ID>
```

```bash
git add resources/sass/buttons.scss
git commit -F tmp/commit-msg.txt
rm tmp/commit-msg.txt
```

---

## Task 7: Verify production CSS is unchanged

**Files:** none modified.

**Step 1: Rebuild.**

```bash
yarn run prod
```

**Step 2: Capture the post-edit token set.**

```bash
grep -oE "\.btn-?[a-z]*" public/build/assets/app-ltr-*.css | sort -u > /tmp/btn-tokens-after.txt
grep -oE "\.btn-?[a-z]*" public/build/assets/app-rtl-*.css | sort -u >> /tmp/btn-tokens-after.txt
sort -u /tmp/btn-tokens-after.txt -o /tmp/btn-tokens-after.txt
```

**Step 3: Diff before/after.**

```bash
diff /tmp/btn-tokens-before.txt /tmp/btn-tokens-after.txt
```

Expected: **empty diff.** If any token is present in only one file, STOP — investigate before merging.

Also stash the two files for the PR body:

```bash
echo "=== before ===" > /tmp/btn-tokens-proof.txt
cat /tmp/btn-tokens-before.txt >> /tmp/btn-tokens-proof.txt
echo "=== after ===" >> /tmp/btn-tokens-proof.txt
cat /tmp/btn-tokens-after.txt >> /tmp/btn-tokens-proof.txt
```

---

## Task 8: Run the safety net (RTL smoke + dep-upgrade smoke)

**Files:** none modified.

**Step 1: Bring up the dev stack** (if not already running).

```bash
docker compose -f docker-compose.dev.yml up -d
```

**Step 2: Run the RTL smoke.**

```bash
cd tests/playwright && yarn run rtl-smoke
```

Expected: 6 specs across the direction-sensitive surfaces, all green in ~4s. The English-restore teardown should hold.

**Step 3: Run the dep-upgrade smoke as belt-and-braces.**

```bash
yarn run smoke
```

Expected: 44 tests pass.

**Step 4: Capture results for the PR body.**

Note pass/fail count + wall time for both runs.

---

## Task 9: Push branch and open the PR

**Files:** none.

**Step 1: Push.**

```bash
git push -u origin chore/bootstrap-dead-variant-deletion
```

**Step 2: Open the PR with `gh pr create --body-file`.**

Write the body to `tmp/pr-body.md` first (per CLAUDE.local.md — `--body "$(cat <<EOF…)"` is blocked):

```markdown
## Summary

First PR in the Bootstrap-CSS → Tachyons migration arc ([audit doc](docs/plans/2026-06-16-bootstrap-css-audit.md), [implementation plan](docs/plans/2026-06-16-bootstrap-dead-variant-deletion.md)).

Strips four dead button-variant tokens from the source tree:

- **`btn-secondary`** — 32 sites across 28 files (22 Blade + 6 Vue + Message.vue's scoped style)
- **`btn-success`** + **`btn-approve`** — 1 site, `vendor/passport/authorize.blade.php`
- **`.btn-add`** — SCSS-only, `buttons.scss:95-102`, zero markup refs

None of these paint anything in production: PurgeCSS (`vite.config.js:67-105`) already strips them from `app-ltr-*.css` / `app-rtl-*.css`. This is **source-readability cleanup, not bundle-size cleanup.**

## Proof of visual no-op

`grep -oE "\.btn-?[a-z]*" public/build/assets/app-{ltr,rtl}-*.css | sort -u` before and after:

\`\`\`
<paste contents of /tmp/btn-tokens-proof.txt>
\`\`\`

Token sets identical. (Non-`.btn` tokens like `.btn-bar` / `.btn-in` / `.btn-base` come from phpdebugbar chrome, not app styles — present in both.)

## Safety net

- RTL Playwright smoke (`tests/playwright/specs/rtl-smoke.spec.ts`, merged in #816): **<paste pass count + wall time>**
- Dep-upgrade smoke (`yarn run smoke`): **<paste pass count + wall time>**

## Out of scope (verified absent from source)

`btn-info`, `btn-light`, `btn-dark`, `btn-link`, `btn-outline-*`, `btn-sm`, `btn-lg` — none of these tokens appear in `resources/`. The broad regex in the handoff suggested they might; the verification grep confirmed they don't.

## Test plan

- [x] `grep -rEn "btn-(secondary|success|approve|add)" resources/` returns empty
- [x] `yarn run prod` rebuilds clean
- [x] `diff /tmp/btn-tokens-before.txt /tmp/btn-tokens-after.txt` is empty
- [x] RTL smoke passes
- [x] Dep-upgrade smoke passes
- [ ] Reviewer spot-check on the 30+ file diff — every change should be a literal token strip with no whitespace surprises

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

Then:

```bash
gh pr create --title "chore(bootstrap-css): delete dead button variants (pr 1/n)" --body-file tmp/pr-body.md
rm tmp/pr-body.md
```

**Step 3: Verify PR url returned.** Post the URL back to the user.

---

## Rollback plan

If verification at Task 7 shows ANY token set diff, or the smoke suites flag a regression, the topic branch is throwaway:

```bash
git switch 4.x
git branch -D chore/bootstrap-dead-variant-deletion
```

Nothing on `4.x` was touched. Re-investigate (likely cause: a token I missed survived to a CSS rule somewhere, or a Tachyons class was deleted by mistake when stripping the `btn-secondary` token).

---

## Out-of-scope follow-ups

These are deliberately left for later PRs in the migration sequence:

- **Badge migration** (PR 2/n per audit doc's recommended sequence)
- **Bootstrap utility class drift** (`mr-2`, `text-muted`, `d-flex` — ~95 sites, RTL-incorrect)
- **Live `btn-*` variants** (`.btn-primary`, `.btn-danger`, `.btn-warning`) — last in the sequence because they carry the brand palette and need a design decision, not a mechanical swap

The audit doc's "Recommended PR sequence" section is the running roadmap.
