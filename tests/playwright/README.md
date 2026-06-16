# Playwright suite

Standalone Playwright suite for verifying the user-facing app. Two distinct sets of specs:

1. **`dependency-upgrade-smoke.spec.ts`** — the phase-close gate per `CLAUDE.md`: login → dashboard → contact list → contact detail → vCard export → journal → reminders → settings → search → logout. Run before merging composer/npm bump PRs.
2. **`subscription-flow.spec.ts`** — drives the Stripe-gated `/settings/subscriptions/*` routes through stripe-mock.
3. **`rtl-smoke.spec.ts`** — safety net for the Bootstrap-CSS → Tachyons migration. Flips the admin user's locale to Hebrew and asserts direction-sensitive layout properties across six surfaces (dashboard, contact list, contact detail, note modal, journal, settings personalization). Run for any PR touching `resources/sass/`, `resources/views/`, or files using `useHtmlDir()` (see `docs/plans/2026-06-16-rtl-playwright-smoke-design.md`).
4. **`<feature>.spec.ts`** — UI-binding / cross-component invariant coverage (#725) + Tier A & B coverage-gap backfill (#731). Each spec covers behaviour that phpunit alone can't reach:
   - `contact-introductions.spec.ts` — ContactSelect multiselect ARIA contract + filter behaviour
   - `activity-types.spec.ts` — settings → activity-add cross-flow (premium-gated)
   - `activity-journal-side-effect.spec.ts` — activity-create inserts a non-deletable journal row
   - `contact-favorite-ordering.spec.ts` — favorite star reactivity + list-ordering side-effect
   - `note-modal-crud.spec.ts` — inline edit + modal-confirm delete pattern
   - `contact-create-validation.spec.ts` — HTML5 required blocks /people/add
   - `signup-duplicate-email.spec.ts` — `unique:users` validation on /register
   - `journal-rate-day.spec.ts` — sad reaction → comment box → save
   - `conversation-create.spec.ts` — picker + message submit on /conversations/create
   - `activity-types-premium-gate.spec.ts` — non-premium account sees the upgrade block
   - `gift-crud.spec.ts` — gift create / inline edit / modal delete
   - `reminder-persistence.spec.ts` — reminder create persists and surfaces in the contact's reminders list (#731 A.6)
   - `audit-log.spec.ts` — contact-create surfaces in `/settings/auditlogs` (#731 A.3)
   - `account-export.spec.ts` — JSON + SQL export submit, complete, and download with the right filename (#731 A.4)
   - `account-import-vcard.spec.ts` — vCard upload lands an imported contact on `/people` (#731 A.5)
   - `password-reset.spec.ts` — Mailhog-delivered reset token round-trips through `/password/reset` (#731 A.1)
   - `email-verification.spec.ts` — Mailhog-delivered signed verify URL marks the account verified (#731 A.2)
   - `auth-recovery-codes.spec.ts` — 2FA recovery-code login challenge (#731 B.1)
   - `auth-2fa-disable.spec.ts` — 2FA disable + regenerate-recovery-codes round trip (#731 B.2)
   - `auth-logout.spec.ts` — logout deep contract: protected routes redirect, header identity cleared (#731 B.3)

## Why it's a separate suite

- **Scope.** The smoke walkthrough is an ad-hoc verification step — run before merging composer/npm bump PRs, not on every CI build. The feature specs cover focused UI-binding behaviour and are intended for the same local-only invocation. Neither is a CI gate yet.
- **Lockfile isolation.** This directory has its own `package.json`. The root `yarn.lock` won't churn when `@playwright/test` is bumped, and the npm-side audit pass (PR-B / PR-C under [milestone #2](https://github.com/brycehans/monica/milestone/2)) won't fight with this dep tree.
- **The MCP path is already Playwright.** Sessions that drive the walkthrough through `mcp__playwright__*` tools (as in PR #623's verification) can encode their steps here verbatim.

## Running it

From the **`docker-compose.dev.yml` rig running on `https://localhost:8443`** (Caddy sidecar terminates TLS in front of the Apache app container; the plain `http://localhost:8082` port also stays bound for quick health checks):

```bash
# 1) Build the Vite assets on the host. The dev compose mounts
#    ./public/build:/var/www/html/public/build, so the container's Apache
#    serves whatever the host last built. Without this step, the mount
#    overlays the image's baked-in assets with an empty directory and
#    every blade page 500s trying to read public/build/manifest.json.
yarn install
yarn run prod

# 2) Bring up the dev stack
docker compose -f docker-compose.dev.yml up -d

# 3) Seed an admin account + 20 contacts.
#    --user www-data avoids the trap documented in #629 (php artisan as root
#    leaves storage/logs/laravel.log root-owned, breaking subsequent web reqs).
docker compose -f docker-compose.dev.yml exec --user www-data app \
  sh -c 'printf "yes\n20\n" | php artisan setup:test'

# 3b) Create the Passport personal access client (needed by personal-access-token-crud.spec.ts).
#     setup:test does not run passport:install. Skip if you already ran it.
docker compose -f docker-compose.dev.yml exec --user www-data app \
  php artisan passport:client --personal --no-interaction --name="Personal Access Client"

# 4) Run the smoke from this directory
cd tests/playwright
yarn install
npx playwright install chromium   # first run only
yarn run smoke
```

When iterating on Vue/JS sources, re-run `yarn run prod` (or `yarn run watch`
for incremental rebuilds) on the host — the container picks up the new
bundle on the next request. No `docker cp` step needed.

When iterating on **PHP** sources (controllers / models / artisan commands),
`yarn run prod` does nothing — there's no Vite step for PHP. The dev image's
PHP-FPM also caches bytecode via OpCache, which `php artisan optimize:clear`
does **not** invalidate. After editing a `.php` file, restart the container
so Apache picks up the new bytecode:

```bash
docker restart monica-app-1
```

This is especially relevant to the planted-violation methodology used
across the #725 specs: if you flip an assertion in PHP and re-run the spec
without restarting, you'll see the old behaviour and assume the assertion
is loose when it actually bites.

Other targets:

```bash
yarn run smoke:headed    # watch it in a visible browser
yarn run smoke:debug     # PWDEBUG=1, step-through inspector
yarn run smoke:report    # open the HTML report after a failing run
```

## Configuration

| Env var                  | Default                 | Purpose                                                                  |
| ------------------------ | ----------------------- | ------------------------------------------------------------------------ |
| `SMOKE_BASE_URL`         | `https://localhost:8443` | Where Monica is running (HTTPS via Caddy sidecar; HTTP on `:8082` also works) |
| `SMOKE_ADMIN_EMAIL`      | `admin@admin.com`       | Login email (matches `setup:test` defaults)                              |
| `SMOKE_ADMIN_PASSWORD`   | `admin0`                | Login password                                                           |
| `SMOKE_ACCOUNT_ID`       | `1`                     | Account id used by `account:setpremium` for the admin-bound tests        |
| `PW_USE_DOCKER`          | `true`                  | `false`/`0`/`no` skips `docker exec` for artisan shellouts (run on host) |
| `PW_DOCKER_CONTAINER`    | `monica-app-1`          | docker-compose service container name                                    |
| `PW_DOCKER_USER`         | `www-data`              | `--user` passed to `docker exec`; empty string runs as root              |

If `setup:test` ever switches the default admin creds, override `SMOKE_ADMIN_EMAIL`/`SMOKE_ADMIN_PASSWORD` rather than editing the spec. The #725 specs that use `loginAsFreshUser` provision their own accounts via `setup:frontendtestuser`, so admin creds don't gate them.

## Console-noise allowlist

Specs fail on **any unexpected** Vue or browser console error or `pageerror` — that's the whole point of running them after a bump. To keep the signal:noise ratio honest, the shared `support/console-gate.ts` fixture carries a short *global* allowlist of pre-existing messages that have open issues filed against them:

| Pattern                                                | Issue |
| ------------------------------------------------------ | ----- |
| `ContactSelect` undefined blur/focus handlers          | [#624](https://github.com/brycehans/monica/issues/624) |
| `<error>` unknown custom element                       | [#625](https://github.com/brycehans/monica/issues/625) |
| PWA manifest missing `url`/`id`                        | [#626](https://github.com/brycehans/monica/issues/626) |

When one of those issues is closed, drop its entry from `KNOWN_CONSOLE_NOISE` in `support/console-gate.ts`.

Surface-specific noise — bugs that fire on a single Vue component, where a global allowlist would risk swallowing unrelated regressions with the same message text — should be registered per-spec via `consoleGate.allow(pattern, issue)` at the top of the test. No spec-scoped entries are currently active.

## What this is NOT

- Not part of `yarn run test` or any CI gate (yet).
- Not a substitute for `tests/Browser/` (Dusk), which covers auth + 2FA + DAV through its own harness.
- Not exhaustive coverage. The smoke spec catches bumps that break login / blade rendering / sabre vcard / search APIs in a couple of minutes; the #725 specs cover focused UI-binding behaviour. Manual walkthrough at phase close still happens.
