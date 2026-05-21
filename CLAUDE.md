# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

A community maintenance fork of Monica v4 (Laravel 9 + Vue 2.6 personal CRM). The default branch is `4.x`, pinned to the upstream v4.1.2 release (`32028ce`) plus a small number of follow-on fixes. See `README.md` for the full posture; the short version is: **stability is the feature, no new features, no rewrite, no Vue 3 migration.**

If `CLAUDE.local.md` and `.migration/` exist in your working tree, they hold fork-local context that isn't checked in — read them first when present. The triage workbench in `.migration/triage.db` is a SQLite mirror of the upstream issue tracker; it's where decisions about the imported backlog live before anything is applied to the fork on GitHub.

## Stack

- **PHP 8.1**, **Laravel 9**, **Composer** — see `.tool-versions`, `composer.json`.
- **Node 20**, **Yarn 1.22**, **Laravel Mix 6** — see `package.json`.
- **Vue 2.6** (intentional — do not upgrade), Bootstrap 4 + Tachyons, vue-i18n.
- **MySQL** is the only supported database. Postgres/SQLite are not tested.
- Static analysis: **PHPStan** (`phpstan.neon`) and **Psalm** (`psalm.xml`) — both run after the PHPUnit suite via `yarn run test`.
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
```

`monica:seed-regression-demo` is the opt-in dataset for spotting user-facing regressions after each dependency-upgrade tranche. Run it against a freshly migrated DB, then walk the dashboard / contact list / contact detail / reminders / journal / activities / settings / search as the demo user, and the empty-state screens as the blank user. Useful options: `--fresh-demo` (rebuild only the demo accounts, abort otherwise), `--seed=12345` (default), `--random` (fresh seed printed for repro), `--contacts=20` (supporting contact count). Spec at `docs/superpowers/specs/2026-05-19-browser-regression-seed-data-design.md`.

Tests:
```
yarn run test                # full suite: migrate testing DB → phpunit → phpstan → psalm
vendor/bin/phpunit           # phpunit only, skips the pre/post hooks
vendor/bin/phpunit --filter SomeTest                           # single test class
vendor/bin/phpunit tests/Unit/Services/Contact/SomeServiceTest.php  # single file
vendor/bin/phpstan analyse
vendor/bin/psalm
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

**Scheduling.** `app/Console/Kernel.php` defines the cron-style schedule. Two of the more load-bearing entries:
- `send:reminders` / `send:notifications` — hourly, drive the email reminder system.
- `monica:calculatestatistics` — nightly, populates per-instance metrics.

## Coding conventions

- **Conventional Commits** for PR titles (`feat:`, `fix:`, `chore:`, `ci:`, `docs:`, `refactor:`, `test:`, `perf:`, `style:`, `revert:`). Bodies and intra-branch commits don't have to follow this — only the squashed title matters because semantic-release reads it.
- Commit messages are lowercase.
- The upstream codebase follows a soft form of [object calisthenics](http://www.slideshare.net/guilhermeblanco/object-calisthenics-applied-to-php): one indentation level per method, no `else`, short classes, document public methods. Match the style of nearby code rather than treating these as hard rules.

## Composer wrinkles

**`spatie/ray` and `spatie/laravel-ray` are explicitly suppressed.** They were stowaway transitive deps (zero callers anywhere in `vendor/`) pulled in via `psalm/plugin-laravel → orchestra/testbench → orchestra/workbench`. The root `composer.json` declares them in `replace`, and `composer.lock` has been hand-pruned to drop them and their now-orphaned transitive deps (`rector/rector`, the `zbateson/*` chain, `pimple/pimple`, `symfony/polyfill-iconv`).

If `composer update` ever reintroduces them, **fresh installs will fail** (composer correctly refuses to let the root project coexist with a package it replaces). That's intentional — it's the visible alarm that says the suppression has slipped. To unwind cleanly: drop the `replace` block, or upgrade `psalm/plugin-laravel` to `>= 2.10.1` (which dropped the orchestra chain entirely, but requires Laravel ^10.48 — blocked on the Laravel 9 → 10 modernization).

Full root cause: see `composer.json` `extra.fork-notes.replace-spatie-ray` and issue #613. The proximate trigger was `spatie/ray/src/helpers.php` registering a shutdown handler that called `class_exists()` on a class whose file composer had just deleted, fatalling `composer install --no-dev` runs inside live dev containers.

## Fork-specific scope

Anything not on the modernization ladder is out of scope. The ladder, in rough priority order (from `README.md`):

1. PHP 8.4 compatibility
2. Modern Laravel (current supported version)
3. Modern Node / build chain with `npm audit` clean
4. Security patches against the current dependency graph
5. Triage of the imported issue and PR queue

Hard constraints carried in from the README and `CLAUDE.local.md`:

- **No Vue 3 migration.** Vue 2.6 is intentional.
- **No new features.** Stability is the feature.
- **No architectural refactors.** Match upstream's structure.
- **No UI redesigns.**

If you're being asked to do something that doesn't fit one of those five rungs, stop and confirm with the user before proceeding.

## Triage workbench

`.migration/` (gitignored) holds a one-time bulk-import script and a local SQLite triage database (`.migration/triage.db`) that mirrors the upstream issue tracker. `CLAUDE.local.md` has the schema and operating notes. `.migration/DESIGN.md` documents the import pipeline; `.migration/PROJECT_CONTEXT.md` documents the upstream project history that informs triage decisions. If you're working on triage, start there.
