# Bootstrap-CSS migration — Card family (PR 5/n)

**Date:** 2026-06-17
**Tracker:** [#821](https://github.com/brycehans/monica/issues/821)
**Scope:** Drop the active `_card` Bootstrap partial. Inline its one remaining call site (`.card-body` on the email-verify page) with a Tachyons utility.

This PR is the next step in the Bootstrap-CSS → Tachyons migration arc. Following the same pattern as PR #4 (Alert): identify call sites, decide rename-vs-inline-vs-delete, make the swap, comment out the `@import` in `_custom_bootstrap.scss`, browser-verify on the dev container, and ship.

The Card family is **far smaller in practice than the audit's "12 sites" count suggested** — that figure was a stale projection from the pre-#815 days. As of `b45ae9285`, a fresh grep against `resources/views/` and `resources/js/` finds exactly **one** Bootstrap `.card-*` token in the codebase: `class="card-body"` at `resources/views/auth/verify.blade.php:17`. No `class="card"`. No `card-header`/`card-footer`/`card-title`/`card-img`/`card-link`. No Vue SFC references. No project SCSS rules outside the Bootstrap partial. (Font Awesome's `fa-id-card-o` / `fa-address-card-o` / `fa-credit-card` icon classes are unrelated false positives; the Stripe `elements.create('card', …)` in `Subscription.vue:195` is a JS string literal for the Stripe.js SDK and does not produce a CSS class.)

The compiled production bundle (`public/build/assets/app-ltr-*.css`) currently surfaces `.card` and `.card-body` selectors — `.card-body` survives PurgeCSS legitimately (the token is in the verify template); `.card` survives only because PurgeCSS's default extractor sees the literal token `card` inside the Stripe call-site string and assumes a possible class match. Dead-by-design.

---

## Decision: inline with `pa3` rather than project-rename

For PRs 2 (Badge), 3 (Breadcrumb), and 4 (Alert), the established pattern has been:

- **Multi-site families** → rename Bootstrap token to project-owned (`.page-alert`, `.page-breadcrumb`, etc.) and copy the rule body verbatim into `app-ltr.scss`. Preserves byte-equivalent compiled CSS.
- **One-off or trivial families** → inline a Tachyons utility at the call site; no new SCSS.

Card sits firmly in the second bucket. Pattern:

```diff
- <div class="card-body">
+ <div class="pa3">
```

**Visual contract:** Bootstrap's `.card-body` emits

```scss
.card-body {
  flex: 1 1 auto;   // no-op — parent (.signup-box) is block, not flex
  min-height: 1px;  // no-op — content has natural height
  padding: 1.25rem; // = 20px at the default 16px html font (but Monica's app sets 14px html font, so 17.5px effective)
  color: $card-color; // null in this stack — no rule emitted
}
```

The only visually meaningful property is `padding: 1.25rem`. Replacing with `pa3` (Tachyons: `padding: 1rem` = 14px effective under Monica's 14px html font) gives a ~3.5px difference per side. In a layout where the parent `.signup-box` already provides `padding: 50px 20px 20px` (`marketing.scss:170-174`), the inner `.card-body` padding is decorative spacing for visual cradling, not load-bearing alignment — the 3.5px shrink is imperceptible.

A project-rename alternative (`.page-card-body { padding: 1.25rem }`) would buy byte-equivalence but pay one new SCSS rule for a single-use selector. The audit's PR-sequencing column favours Tachyons-first replacements where the visual stake is low, so we go with `pa3`.

---

## Call sites

Verified via `grep -rEn 'class="[^"]*\b(card|card-body|card-header|…)\b' resources/views resources/js` against `b45ae9285`:

| # | File:line | Token | Replacement |
|---|---|---|---|
| 1 | `resources/views/auth/verify.blade.php:17` | `card-body` | `pa3` |

Nothing else. No tests reference `.card` or `.card-body`. No JS classList manipulation on card tokens. No dynamic class composition.

---

## SCSS

`resources/sass/_custom_bootstrap.scss:31` — comment out:

```diff
- @import "bootstrap/scss/_card";
+ // @import "bootstrap/scss/_card";
```

Active partials count goes from 11 → 10.

No project SCSS rules under `resources/sass/` reference `.card*` (verified by `grep -rEn '\.card' resources/sass/` — empty). The DataTables vendor CSS at `resources/sass/_datatable.min.scss:63` uses `ul.pagination` (pagination, not card) — separate concern, PR #6.

---

## Verification procedure

Same shape as PR #4:

1. `yarn run prod` — confirm `.card` and `.card-body` selectors are absent from `public/build/assets/app-ltr-*.css` and `app-rtl-*.css`.
2. `docker exec monica-app-1 php artisan view:clear && docker restart monica-app-1` — flush Blade view cache + OpCache so the dev container serves the new template.
3. Browser-verify `/email/verify` (after `php artisan setup:test` to seed an unverified user, log in, get redirected). Confirm the email-verification card renders with the expected `pa3` padding inside the signup box — content sits comfortably with the surrounding 50px/20px box padding.
4. `yarn run smoke` (Playwright, 93 specs, ~3min) — no spec references `.card` / `.card-body`, but the smoke covers `/login` and the verify page transitively.
5. RTL smoke (`yarn run e2e tests/playwright/specs/rtl-smoke.spec.ts`) — no direction-sensitive change, but the safety net is part of the arc.

---

## Commit shape

```
chore(bootstrap-css): inline .card-body on verify page, drop _card partial (pr 5/n)

Single Bootstrap card-family call site in the app: auth/verify.blade.php
uses class="card-body" as a padding wrapper inside .signup-box. Inline
with Tachyons pa3 (visually equivalent — 3.5px tighter padding inside a
50px-padded outer box, imperceptible) and comment out the _card partial
in _custom_bootstrap.scss.

Bundle effect: .card and .card-body selectors leave public/build/. The
.card rule was already dead — PurgeCSS retained it as a false-positive
match on the Stripe.js elements.create('card', …) string literal.

Active Bootstrap partials in _custom_bootstrap.scss: 11 → 10. Tracker:
#821. Audit: docs/plans/2026-06-16-bootstrap-css-audit.md.

Claude-Session: <session_id>
Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
```
