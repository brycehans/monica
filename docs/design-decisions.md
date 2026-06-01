# Design decisions

Notes on what's deliberately in and out of the fork, beyond what's covered by
the high-level scope in the [README](../README.md). Entries here document
choices that aren't obvious from reading the code or the upstream history.

## OAuth grant types: `password` and `authorization_code` only

Monica's OAuth surface (via [Laravel Passport](https://laravel.com/docs/passport))
supports two grants and no others:

- **`password` grant** — used by the official mobile clients.
- **`authorization_code` grant** — used by third-party integrations.

Explicitly **not supported**:

- **`device_code` grant (RFC 8628)** — disabled in
  `app/Providers/AuthServiceProvider::register()`. Passport 13 added this grant
  and ships it enabled by default; Monica neither needs it (no input-constrained
  clients like TVs, IoT, or CLIs in the user base) nor exposes a UI for it. The
  matching `oauth_device_codes` migration is still shipped, byte-identical to
  the vendor copy, so re-enabling the grant is a one-line flip if a future
  consumer ever needs it. See PR
  [#720](https://github.com/brycehans/monica/pull/720) for the full reasoning.

This isn't a divergence from upstream Monica — upstream v4 was on Passport 12,
which didn't have device-code grant at all. The fork's Laravel 12 / Passport 13
upgrade ([#677](https://github.com/brycehans/monica/pull/677)) inherited the
new grant by default; #720 turned it back off to match Monica's actual auth
surface.

## ETag conditional middleware: replaced inline

Upstream Monica pulled `werk365/etagconditionals` for three HTTP middlewares —
`SetEtag`, `IfMatch`, `IfNoneMatch` — wired onto `StorageController` to serve
conditional `GET`/`HEAD` requests against contact avatars, photos, and
documents. The fork now ships those three middlewares in-tree under
`App\Http\Middleware\Etag\*` and no longer depends on the package.

The trigger was the Laravel 13 readiness audit. Every other Laravel-touching
dependency in the lock either already supported Laravel 13 or had published a
compatible upgrade; `werk365/etagconditionals` was the lone holdout. Its L13
support PR ([werk365#28](https://github.com/365Werk/etagconditionals/pull/28))
had sat open since April 2026, the L11/L12 PR ([werk365#25](https://github.com/365Werk/etagconditionals/pull/25))
had been open for thirteen months before that, and the repo's last push at the
time of writing was nine months ago. The fork was already pinned to
`dev-master` of the package to get L11/L12 support — there was no tagged
release path forward. Options weighed:

- **Wait for upstream.** Open-ended; ties the Laravel 13 timeline to an
  inactive maintainer.
- **VCS-pin to PR #28's branch.** Quick but brittle — breaks on rebase, and
  composer's resolver is unhappy with PR-branch refs across `composer update`.
- **Soft-fork to `brycehans/etagconditionals`.** Same maintenance shape as
  `monicahq/laravel-sabre`, but for a package whose surface is ~120 lines of
  middleware. The ongoing cost of a separately-versioned fork outweighs the
  cost of carrying the code in-tree.
- **Replace inline.** Chosen. The middleware surface is small, behaviour is
  fully specified by the upstream tests (now ported to
  `tests/Feature/Http/Middleware/Etag/`), and `StorageController`'s existing
  integration tests act as a second regression guard.

Behaviour parity with the package, with two deliberate simplifications:

- **No `etagconditionals.if_match_weak` / `if_none_match_weak` config knobs.**
  Both directions hardcode weak comparison (`W/` prefix stripped before
  comparing). The package defaulted both to `true` and Monica never overrode
  the env vars; the knob existed only to let downstream code switch If-Match
  back to RFC 7232 strong comparison, which Monica had no use for.
- **No `etag` middleware group, no facade, no `Middleware` base class with a
  `name()` method.** Monica only ever referenced the three aliases
  individually (in `StorageController::__construct()`), so the group is dead
  weight. The aliases (`setEtag`, `ifMatch`, `ifNoneMatch`) now live in
  `app/Http/Kernel.php`'s `$routeMiddleware` array alongside the rest of
  Monica's middleware aliases, rather than being dynamically registered by a
  package service provider.

The static-state callback registration on
`App\Http\Middleware\Etag\EtagConditionals` (`etagGenerateUsing` / `getEtag`)
matches the upstream API verbatim — `AppServiceProvider::boot()` still
registers a `sha1($url)` cache-backed closure, which is the only consumer.

Future-tense: this isn't a step on the upgrade ladder, it removes a step.
With `werk365/etagconditionals` gone, the Laravel 12 → 13 bump no longer has
any unresolved dependency blockers (see `composer why-not laravel/framework
"^13.0"` after the change).
