# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

A community maintenance fork of Monica v4 (Laravel 12 + Vue 2.7 personal CRM, with a Vue 3 migration on the modernization ladder). The default branch is `4.x`, pinned to the upstream v4.1.2 release (`32028ce`) plus a small number of follow-on fixes. See `README.md` for the full posture; the short version is: **stability is the feature, no new features, no rewrite, no UI redesign.**

If `CLAUDE.local.md` and `.migration/` exist in your working tree, they hold fork-local context that isn't checked in — read them first when present. The triage workbench in `.migration/triage.db` is a SQLite mirror of the upstream issue tracker; it's where decisions about the imported backlog live before anything is applied to the fork on GitHub.

## Stack

- **PHP 8.4**, **Laravel 12**, **Composer** — see `.tool-versions`, `composer.json`.
- **Node 20**, **Yarn 1.22**, **Vite ~7** + **@vitejs/plugin-vue2** — see `package.json`. (`vitejs/vite-plugin-vue2` is archived upstream; the v8 ceiling on Vite is what keeps us at vite ~7. Vue 3 migration lifts that.)
- **Vue 2.7** (current line; Vue 3 migration is a planned ladder rung — see "Fork-specific scope"), Bootstrap 4 + Tachyons, vue-i18n.
- **MySQL** is the only supported database. Postgres/SQLite are not tested.
- Static analysis: **PHPStan** (`phpstan.neon`) runs after the PHPUnit suite via `yarn run test` (the `posttest` hook). Psalm is currently removed from `require-dev` — see `composer.json` `extra.fork-notes.psalm-removed-on-php84` for why (it crashes on PHP 8.4); the re-add path is psalm ^6 once `thecodingmachine/safe ^3` is unblocked. `psalm.xml` lingers in the tree but is unused.
- E2E: **Cypress** (`cypress.json`, `tests/cypress/`) and Laravel **Dusk** (`tests/Browser/`).

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
yarn run e2e                 # cypress headless
yarn run e2e-gui             # cypress interactive
```

`yarn run test` always re-migrates a fresh testing DB first (`pretest` hook). The `phpunit.xml` testsuites group tests by area (`Api`, `Feature`, `Commands-Other`, `Commands-Scheduling`, `Unit-Models`, `Unit-Services`) — useful for running one slice via `phpunit --testsuite Unit-Services`.

Local dev via Docker:
```
docker compose -f docker-compose.dev.yml up   # app on :8082, phpmyadmin :3000, mailhog :8025/:1025
```

## Architecture

Standard Laravel + Vue monolith. Worth knowing before changing things:

**Multi-tenancy by `account_id`.** Every domain table has an `account_id` column and the account-deletion / reset jobs walk that column to clean up. If you add a new table, it MUST have `account_id` — otherwise account deletion silently leaks rows.

**Controllers stay thin; business logic lives in `app/Services/`.** Services are grouped by aggregate (`Account/`, `Contact/`, `Auth/`, `DavClient/`, `Instance/`, `Task/`, `User/`, `VCalendar/`, `VCard/`), with each operation as its own class extending `BaseService`. Controllers translate HTTP → service call; tests usually exercise the service directly.

**HTTP layout (`app/Http/Controllers/`)** mirrors the web routes:
- `Api/` — REST API consumed by mobile apps and integrations (routes in `routes/api.php`, OAuth in `routes/oauth.php`).
- `Contacts/`, `Settings/`, `Account/`, `Auth/`, `Settings/`, `DAV/` — server-rendered Blade views in `resources/views/`.
- `DAV/` is the CardDAV/CalDAV surface via `sabre/dav` + `monicahq/laravel-sabre`.

**Frontend is mixed-paradigm.** Most pages are Blade templates with islands of Vue 2 components mounted by `resources/js/app.js`. Components live in `resources/js/components/`. **Do not introduce jQuery for new behaviour** (the existing jQuery is legacy); use Vue. New CSS should prefer Tachyons utility classes over new SASS — Bootstrap is being phased out.

**Localization.** Source strings live in `resources/lang/en/*.php`. Crowdin owns every other locale — don't edit non-`en` files by hand. Strings used in Vue need `php artisan lang:generate` to be regenerated into JS, then `yarn run prod` to bundle them. PHP side uses `trans('file.key')`; Vue side uses `$t('file.key')` / `$tc(...)` for plurals.

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

## Composer wrinkles

**`spatie/ray` and `spatie/laravel-ray` are explicitly suppressed.** They were stowaway transitive deps (zero callers anywhere in `vendor/`) pulled in via `psalm/plugin-laravel → orchestra/testbench → orchestra/workbench`. The root `composer.json` declares them in `replace`, and `composer.lock` has been hand-pruned to drop them and their now-orphaned transitive deps (`rector/rector`, the `zbateson/*` chain, `pimple/pimple`, `symfony/polyfill-iconv`).

If `composer update` ever reintroduces them, **fresh installs will fail** (composer correctly refuses to let the root project coexist with a package it replaces). That's intentional — it's the visible alarm that says the suppression has slipped. The original trigger (`psalm/plugin-laravel` pulling `orchestra/workbench → spatie/laravel-ray → spatie/ray`) is currently moot because psalm itself is removed from `require-dev` (see `extra.fork-notes.psalm-removed-on-php84`); the `replace` block stays as defense-in-depth in case psalm comes back via the same chain. Unwind cleanly by either dropping the `replace` block once psalm is confirmed not to return via that path, or by holding the line until `psalm/plugin-laravel >= 2.10.1` (which dropped the orchestra dep entirely — now reachable on the current Laravel 12 line) ends up in the lock alongside `psalm ^6`.

Full root cause: see `composer.json` `extra.fork-notes.replace-spatie-ray` and issue #613. The proximate trigger was `spatie/ray/src/helpers.php` registering a shutdown handler that called `class_exists()` on a class whose file composer had just deleted, fatalling `composer install --no-dev` runs inside live dev containers.

## Fork-specific scope

Anything not on the modernization ladder is out of scope. The ladder, in rough priority order (from `README.md`):

1. Vue 3 migration
2. Continued security patches against the current dependency graph (`composer audit` / `yarn audit` reduction)
3. Triage of the imported issue and PR queue

Already landed (kept here as context for older docs that may still list these as "things we plan to do"):

- PHP 8.4 compatibility
- Modern Laravel (currently 12.x)
- Modern Node / build chain (Vite + plugin-vue2; `yarn audit` reduction ongoing)

Hard constraints carried in from the README and `CLAUDE.local.md`:

- **No new features.** Stability is the feature.
- **No architectural refactors.** Match upstream's structure.
- **No UI redesigns.**

If you're being asked to do something that doesn't fit one of those rungs, stop and confirm with the user before proceeding.

## Triage workbench

`.migration/` (gitignored) holds a one-time bulk-import script and a local SQLite triage database (`.migration/triage.db`) that mirrors the upstream issue tracker. `CLAUDE.local.md` has the schema and operating notes. `.migration/DESIGN.md` documents the import pipeline; `.migration/PROJECT_CONTEXT.md` documents the upstream project history that informs triage decisions. If you're working on triage, start there.
