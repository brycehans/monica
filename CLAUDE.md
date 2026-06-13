# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

A community maintenance fork of Monica v4 (Laravel 12 + Vue 3.5 personal CRM). The default branch is `4.x`, pinned to the upstream v4.1.2 release (`32028ce`) plus a maintenance ladder of follow-on fixes (PHP 8.4, Laravel 12, Vue 3.5, Vite 8). See `README.md` for the full posture; the short version is: **no new features, no UI redesign, no full-SPA conversion — but internal modernization (Composition API, TypeScript on the frontend, dropping Bootstrap 4 + jQuery, service-layer cleanup) is explicitly in scope.**

If `CLAUDE.local.md` and `.migration/` exist in your working tree, they hold fork-local context that isn't checked in — read them first when present. The triage workbench in `.migration/triage.db` is a SQLite mirror of the upstream issue tracker; it's where decisions about the imported backlog live before anything is applied to the fork on GitHub.

## Stack

- **PHP 8.4**, **Laravel 12**, **Composer** — see `.tool-versions`, `composer.json`.
- **Node 20**, **Yarn 1.22**, **Vite 8** + **@vitejs/plugin-vue 6** — see `package.json`.
- **Vue 3.5** (cutover from 2.7 shipped in #730), Bootstrap 4 + Tachyons, **vue-i18n 10** in composition mode (`legacy: false`, `globalInjection: false` — `useI18n()` everywhere, no template `$t` fallback).
- **MySQL** is the only supported database. Postgres/SQLite are not tested.
- Static analysis: **PHPStan** + **Larastan** (`phpstan.neon`) runs after the PHPUnit suite via `yarn run test` (the `posttest` hook). Psalm was retired in #647 — it had been pulled in phase 2 because v5 crashed on PHP 8.4, and re-enablement at v6 didn't justify the dev-dep surface once PHPStan/Larastan were carrying the load. See `composer.json` `extra.fork-notes.psalm-retired`.
- E2E: **Playwright** (`tests/playwright/`) for the UI surface, and Laravel **Dusk** (`tests/Browser/`) for auth / 2FA / DAV.
- JS unit/component tests: **Vitest** + **@vue/test-utils** (`yarn run test:js`) — introduced in #759 to replace the retired Cypress component harness.

## Common commands

Frontend / assets:
```
yarn install                 # install JS deps (frozen lockfile via `yarn run inst`)
yarn run dev                 # one-shot dev build (also regenerates JS lang files)
yarn run watch               # rebuild on change
yarn run prod                # production build
yarn run lint                # eslint over resources/js + root JS
yarn run lint:fix            # eslint --fix
```

Backend:
```
composer install
php artisan key:generate
php artisan setup:test       # fresh DB + seed dev data (admin@admin.com / admin0)
php artisan monica:seed-regression-demo  # browser-regression demo (test@example.com / password) + blank account
php artisan migrate          # apply migrations
php artisan lang:generate    # rebuild JS-side translation strings
php artisan passport:install # OAuth client tokens (only needed for the API)
php artisan ide-helper:models --write  # refresh @property/@method blocks on Eloquent models (after schema changes)
```

`monica:seed-regression-demo` is the opt-in dataset for spotting user-facing regressions after each dependency-upgrade tranche. Run it against a freshly migrated DB, then walk the dashboard / contact list / contact detail / reminders / journal / activities / settings / search as the demo user, and the empty-state screens as the blank user. Useful options: `--fresh-demo` (rebuild only the demo accounts, abort otherwise), `--seed=12345` (default), `--random` (fresh seed printed for repro), `--contacts=20` (supporting contact count). Spec at `docs/superpowers/specs/2026-05-19-browser-regression-seed-data-design.md`.

Tests:
```
yarn run test                # full suite: migrate testing DB → phpunit → phpstan
vendor/bin/phpunit           # phpunit only, skips the pre/post hooks
vendor/bin/phpunit --filter SomeTest                           # single test class
vendor/bin/phpunit tests/Unit/Services/Contact/SomeServiceTest.php  # single file
vendor/bin/phpstan analyse
php artisan dusk             # browser tests (needs Chrome + a running app)
yarn run e2e                 # playwright e2e suite (see tests/playwright/README.md)
yarn run test:js             # vitest run (vue component + js unit tests)
yarn run test:js:watch       # vitest watch mode
```

`yarn run test` always re-migrates a fresh testing DB first (`pretest` hook). The `phpunit.xml` testsuites group tests by area (`Api`, `Feature`, `Commands-Other`, `Commands-Scheduling`, `Unit-Models`, `Unit-Services`) — useful for running one slice via `phpunit --testsuite Unit-Services`.

Local dev via Docker:
```
yarn install && yarn run prod                 # populate public/build/ on the host first (see note below)
docker compose -f docker-compose.dev.yml up   # https://localhost:8443 (caddy) + http://localhost:8082 (apache), phpmyadmin :3000, mailhog :8025/:1025
```

The dev compose mounts `./public/build:/var/www/html/public/build`, so the container's Apache serves whatever the host last built. **`yarn run prod` is a cold-start prereq** — without it the mount overlays the image's baked-in assets with an empty directory and every blade page 500s on the missing `manifest.json`. For iteration, `yarn run watch` rebuilds incrementally on file change.

**HTTPS via Caddy sidecar (#711).** A `caddy:2-alpine` service terminates TLS on host `:8443` and reverse-proxies to Apache's internal `:80`. The cert is minted by Caddy's own internal CA and persisted in the `caddy_data` volume — no per-developer `mkcert` setup. The `:8082` HTTP port stays bound for quick health checks. Use the HTTPS origin when working on anything gated on `isSecureContext` (WebAuthn, Web Crypto's SubtleCrypto, Service Workers, PWA install, SharedArrayBuffer). The browser will warn until you trust Caddy's CA — run `docker compose -f docker-compose.dev.yml exec caddy caddy trust` and import the resulting root from the `caddy_data` volume, or just click through (Playwright already passes `ignoreHTTPSErrors`).

**PHP-side edits and OpCache.** The dev image's PHP-FPM caches bytecode via OpCache. When you edit a `.php` file (controller, model, helper, etc.), `php artisan optimize:clear` clears Laravel-level caches but **does NOT invalidate OpCache** — Apache will keep serving the old bytecode. To pick up the new PHP, restart the container: `docker restart monica-app-1`. The mounted source is live (no `docker cp` needed) but the OpCache layer in front of it is not. Symptom: planted bugs in PHP don't reproduce until you restart. Vue/JS source edits don't hit this — they're rebundled by `yarn run prod`/`watch` and served via the public/build mount.

**Root-level config files aren't mounted.** Only `app/`, `database/`, `resources/`, `routes/`, `tests/`, `config/`, and `phpunit.xml` live-mount into the container (plus `public/build`). Edits to root config (`phpstan.neon`, `composer.json`, `package.json`, `vite.config.js`, `.env`) sit on the host but the container keeps using the image-baked copy. Symptom: change `phpstan.neon`'s `ignoreErrors`, re-run `vendor/bin/phpstan` in the container, see the old behavior. Fix: `docker cp phpstan.neon monica-app-1:/var/www/html/phpstan.neon` (or rebuild the image). `.env` is the same — to flip a config value for one-off browser verification, edit the container's `.env` directly via `docker exec` + `sed`, then `docker restart`.

## Architecture

Standard Laravel + Vue monolith. Worth knowing before changing things:

**Multi-tenancy by `account_id`.** Every domain table has an `account_id` column and the account-deletion / reset jobs walk that column to clean up. If you add a new table, it MUST have `account_id` — otherwise account deletion silently leaks rows.

**Controllers stay thin; business logic lives in `app/Services/`.** Services are grouped by aggregate (`Account/`, `Contact/`, `Auth/`, `DavClient/`, `Instance/`, `Task/`, `User/`, `VCalendar/`, `VCard/`), with each operation as its own class extending `BaseService`. Controllers translate HTTP → service call; tests usually exercise the service directly.

**HTTP layout (`app/Http/Controllers/`)** mirrors the web routes:
- `Api/` — REST API consumed by mobile apps and integrations (routes in `routes/api.php`, OAuth in `routes/oauth.php`).
- `Contacts/`, `Settings/`, `Account/`, `Auth/`, `Settings/`, `DAV/` — server-rendered Blade views in `resources/views/`.
- `DAV/` is the CardDAV/CalDAV surface via `sabre/dav` + `monicahq/laravel-sabre`.

**Frontend is mixed-paradigm.** Most pages are Blade templates with islands of Vue 3 components mounted by `resources/js/app.ts` (via `createApp(...)`). Components live in `resources/js/components/`. 82 SFCs total; 4 converted to `<script setup lang="ts">` in the #798 pilot (RateDay, Genders, MfaActivate, Tags) — the remaining 78 are still Options API and on the modernization ladder. New components or files being touched substantively should land in `<script setup lang="ts">`. **Do not introduce jQuery for new behaviour** (the existing jQuery is legacy Bootstrap-plugin glue and is on the removal list); use Vue. New CSS should prefer Tachyons utility classes over new SASS — Bootstrap 4 is being phased out.

**Composables available in `resources/js/composables/`** (importable from `<script setup>` blocks):
- `useHtmlDir()` → `{ dirltr: boolean }` — replaces `this.$root.htmldir === 'ltr'` (39 callsites pre-pilot)
- `useNotify()` → `{ notify }` from `@kyvg/vue3-notification` — replaces `this.$notify` (25 callsites pre-pilot)
- `useRowModal(Component)` — per-row modal with attr-reset between opens (vue-final-modal wrapper)
- `useModalSelfClose()` — for modals that close themselves on save

**Conventions for Options-API → `<script setup>` conversions** are documented in `docs/plans/2026-06-13-798-composition-api-pilot.md`. Non-obvious traps from the pilot: `_.toArray(response.data)` is load-bearing for shape AND null-safety on Collator-sorted endpoints (use `Object.values(response.data ?? {})`, not a naive `as T[]` cast); `defineExpose` defaults to NO exposure (template-driven specs); `trigger('keydown.esc')` doesn't fire `@keydown.esc` in happy-dom (use `trigger('keydown', { key: 'Escape' })`).

**Localization.** Source strings live in `resources/lang/en/*.php`. Crowdin owns every other locale — don't edit non-`en` files by hand. Strings used in Vue need `php artisan lang:generate` to be regenerated into JS, then `yarn run prod` to bundle them. PHP side uses `trans('file.key')`. Vue side uses `vue-i18n` in composition mode — destructure `t` from `useI18n()` in `setup()` and call `t('file.key')` (plural form: `t('file.key', namedParams, count)`). There is no template `$t` fallback — `globalInjection: false`. The legacy `$tc` helper is gone (dropped from vue-i18n 11's legacy mode and from composition mode entirely; use `t` with the count argument).

**Migrations should not use Eloquent.** Data manipulation inside a migration should go through raw SQL or the query builder (`DB::table(...)`). Eloquent models drift; migrations need to keep working forever. This is enforced socially, not by tooling.

**Models in `app/Models/`** are grouped by aggregate (`Account/`, `Contact/`, `Journal/`, `Relationship/`, `Settings/`, `User/`, `Instance/`). The `ModelBinding*` traits implement hash-ID route binding and account scoping — extend the right base when adding a model that hangs off a contact.

**Model PHPDocs (`@property` / `@method`).** Generated by `barryvdh/laravel-ide-helper` via `php artisan ide-helper:models --write`. These keep larastan's static analysis happy with `$model->some_column` and `Model::whereSomeColumn()`. The blocks sit above each model class — checked into git, regenerate after any schema change that adds/removes columns or relationships and commit alongside the migration. Do not hand-edit; the tool overwrites between markers.

**Scheduling.** `app/Console/Kernel.php` defines the cron-style schedule. Two of the more load-bearing entries:
- `send:reminders` / `send:notifications` — hourly, drive the email reminder system.
- `monica:calculatestatistics` — nightly, populates per-instance metrics.

## Coding conventions

- **Conventional Commits** for PR titles (`feat:`, `fix:`, `chore:`, `ci:`, `docs:`, `refactor:`, `test:`, `perf:`, `style:`, `revert:`). Bodies and intra-branch commits don't have to follow this — only the squashed title matters because semantic-release reads it.
- Commit messages are lowercase.
- The upstream codebase follows a soft form of [object calisthenics](http://www.slideshare.net/guilhermeblanco/object-calisthenics-applied-to-php): one indentation level per method, no `else`, short classes, document public methods. Match the style of nearby code rather than treating these as hard rules.

## Review rules

Fork-internal review rules live under `docs/review-rules/`. Read these before reviewing or writing Vue SFC changes:

- [`vue3-proxy-after-unmount.md`](docs/review-rules/vue3-proxy-after-unmount.md) — Vue 2 → 3 cutover footgun: `$t` / `$refs` / `$emit('update')` after self-unmount across a `.then` or `await` boundary crashes silently. Both flavours documented with a reviewer checklist. Closes #743.

## Composer wrinkles

**`spatie/ray` and `spatie/laravel-ray` are explicitly suppressed.** They were stowaway transitive deps (zero callers anywhere in `vendor/`) pulled in via `psalm/plugin-laravel → orchestra/testbench → orchestra/workbench`. The root `composer.json` declares them in `replace`, and `composer.lock` has been hand-pruned to drop them and their now-orphaned transitive deps (`rector/rector`, the `zbateson/*` chain, `pimple/pimple`, `symfony/polyfill-iconv`).

If `composer update` ever reintroduces them, **fresh installs will fail** (composer correctly refuses to let the root project coexist with a package it replaces). That's intentional — it's the visible alarm that says the suppression has slipped. The original trigger (`psalm/plugin-laravel` pulling `orchestra/workbench → spatie/laravel-ray → spatie/ray`) is now gone — psalm was retired entirely in #647 — so the `replace` block is cheap defense-in-depth against the chain reappearing via a different package. Safe to remove if you want to tidy.

Full root cause: see `composer.json` `extra.fork-notes.replace-spatie-ray` and issue #613. The proximate trigger was `spatie/ray/src/helpers.php` registering a shutdown handler that called `class_exists()` on a class whose file composer had just deleted, fatalling `composer install --no-dev` runs inside live dev containers.

## Fork-specific scope

Anything not on the modernization ladder is out of scope. The ladder, in rough priority order (from `README.md`):

1. Continued security patches against the current dependency graph (`composer audit` / `yarn audit` reduction)
2. Triage of the imported issue and PR queue
3. **Frontend modernization** (active): Options API → Composition API with TypeScript adoption on the .vue side; typing the shared `.js` modules in `resources/js/` first so their types flow into the eventual Vue rewrites; dropping Bootstrap 4 + jQuery in favour of Tachyons-only. Constraint: zero user-facing behaviour change.

Already landed (kept here as context for older docs that may still list these as "things we plan to do"):

- PHP 8.4 compatibility
- Modern Laravel (currently 12.x)
- Modern Node / build chain (Vite 8 + `@vitejs/plugin-vue 6`)
- Vue 2.7 → Vue 3.5 cutover (#730) and post-cutover cleanups: vue-i18n composition-mode migration (#744 + #746/#755/#756/#757/#758), `vue-final-modal` `useModal()` composable (#724), Vitest harness (#759)

Hard constraints:

- **No new features.** User-facing functionality is frozen at the upstream v4.1.2 surface plus the bug fixes that have shipped in this fork. Internal refactors that don't change behaviour are fine.
- **No UI redesigns.** Visual design and information architecture stay as upstream shipped them. Class swaps (Bootstrap → Tachyons) that produce visually-equivalent output are not UI redesigns.
- **No full-SPA conversion.** The Blade-rendered pages with Vue-component islands architecture stays. Refactors inside that hybrid (Composition API, TypeScript, dropping Bootstrap/jQuery, service-layer cleanup) are explicitly in scope.

If you're being asked to do something that doesn't fit those constraints, stop and confirm with the user before proceeding.

## Triage workbench

`.migration/` (gitignored) holds a one-time bulk-import script and a local SQLite triage database (`.migration/triage.db`) that mirrors the upstream issue tracker. `CLAUDE.local.md` has the schema and operating notes. `.migration/DESIGN.md` documents the import pipeline; `.migration/PROJECT_CONTEXT.md` documents the upstream project history that informs triage decisions. If you're working on triage, start there.
