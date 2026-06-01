# Playwright suite

Standalone Playwright suite for verifying the user-facing app. Two distinct sets of specs:

1. **`dependency-upgrade-smoke.spec.ts`** — the phase-close gate per `CLAUDE.md`: login → dashboard → contact list → contact detail → vCard export → journal → reminders → settings → search → logout. Run before merging composer/npm bump PRs.
2. **`subscription-flow.spec.ts`** — drives the Stripe-gated `/settings/subscriptions/*` routes through stripe-mock.
3. **`<feature>.spec.ts`** — cypress-port coverage (#725). Each spec covers a focused UI-binding / cross-component invariant that phpunit alone can't reach:
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

## Why it's here and not in `tests/cypress/`

- **Scope.** Cypress runs as part of the existing e2e gate (`yarn run e2e`). The smoke walkthrough is a separate ad-hoc verification step — run before merging composer/npm bump PRs, not on every CI build. Mixing it into the Cypress suite would slow CI for everyone.
- **Lockfile isolation.** This directory has its own `package.json`. The root `yarn.lock` won't churn when `@playwright/test` is bumped, and the npm-side audit pass (PR-B / PR-C under [milestone #2](https://github.com/brycehans/monica/milestone/2)) won't fight with this dep tree.
- **The MCP path is already Playwright.** Sessions that drive the walkthrough through `mcp__playwright__*` tools (as in PR #623's verification) can encode their steps here verbatim.

## Running it

From the **`docker-compose.dev.yml` rig running on `localhost:8082`**:

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

# 4) Run the smoke from this directory
cd tests/playwright
yarn install
npx playwright install chromium   # first run only
yarn run smoke
```

When iterating on Vue/JS sources, re-run `yarn run prod` (or `yarn run watch`
for incremental rebuilds) on the host — the container picks up the new
bundle on the next request. No `docker cp` step needed.

Other targets:

```bash
yarn run smoke:headed    # watch it in a visible browser
yarn run smoke:debug     # PWDEBUG=1, step-through inspector
yarn run smoke:report    # open the HTML report after a failing run
```

## Configuration

| Env var                  | Default                 | Purpose                                                                  |
| ------------------------ | ----------------------- | ------------------------------------------------------------------------ |
| `SMOKE_BASE_URL`         | `http://localhost:8082` | Where Monica is running                                                  |
| `SMOKE_ADMIN_EMAIL`      | `admin@admin.com`       | Login email (matches `setup:test` defaults)                              |
| `SMOKE_ADMIN_PASSWORD`   | `admin0`                | Login password                                                           |
| `SMOKE_ACCOUNT_ID`       | `1`                     | Account id used by `account:setpremium` for the admin-bound tests        |
| `PW_USE_DOCKER`          | `true`                  | `false`/`0`/`no` skips `docker exec` for artisan shellouts (run on host) |
| `PW_DOCKER_CONTAINER`    | `monica-app-1`          | docker-compose service container name                                    |
| `PW_DOCKER_USER`         | `www-data`              | `--user` passed to `docker exec`; empty string runs as root              |

If `setup:test` ever switches the default admin creds, override `SMOKE_ADMIN_EMAIL`/`SMOKE_ADMIN_PASSWORD` rather than editing the spec. The cypress-port specs (#725) that use `loginAsFreshUser` provision their own accounts via `setup:frontendtestuser`, so admin creds don't gate them.

## Console-noise allowlist

Specs fail on **any unexpected** Vue or browser console error or `pageerror` — that's the whole point of running them after a bump. To keep the signal:noise ratio honest, the shared `support/console-gate.ts` fixture carries a short allowlist of *known* pre-existing messages that have open issues filed against them:

| Pattern                                                | Issue |
| ------------------------------------------------------ | ----- |
| `ContactSelect` undefined blur/focus handlers          | [#624](https://github.com/brycehans/monica/issues/624) |
| `<error>` unknown custom element                       | [#625](https://github.com/brycehans/monica/issues/625) |
| PWA manifest missing `url`/`id`                        | [#626](https://github.com/brycehans/monica/issues/626) |
| `vm is not defined` in CreateGift error path           | [#732](https://github.com/brycehans/monica/issues/732) |

When one of those issues is closed, drop its entry from `KNOWN_CONSOLE_NOISE` in `support/console-gate.ts`.

## What this is NOT

- Not part of `yarn run test` or any CI gate (yet).
- Not a substitute for `tests/Browser/` (Dusk), which covers auth + 2FA + DAV through its own harness.
- The cypress suite at `tests/cypress/` will be retired once the #725 port is fully landed (PR-b drops the directory + scripts entirely); for now both harnesses coexist.
- Not exhaustive coverage. The smoke spec catches bumps that break login / blade rendering / sabre vcard / search APIs in a couple of minutes; the cypress-port specs cover focused UI-binding behaviour. Manual walkthrough at phase close still happens.
