# Playwright smoke walkthrough

Standalone Playwright suite for verifying the user-facing app after a dependency-upgrade tranche. Drives the exact walkthrough documented in `CLAUDE.md` as the phase-close gate: login → dashboard → contact list → contact detail → vCard export → journal → reminders → settings → search → logout.

## Why it's here and not in `tests/cypress/`

- **Scope.** Cypress runs as part of the existing e2e gate (`yarn run e2e`). The smoke walkthrough is a separate ad-hoc verification step — run before merging composer/npm bump PRs, not on every CI build. Mixing it into the Cypress suite would slow CI for everyone.
- **Lockfile isolation.** This directory has its own `package.json`. The root `yarn.lock` won't churn when `@playwright/test` is bumped, and the npm-side audit pass (PR-B / PR-C under [milestone #2](https://github.com/brycehans/monica/milestone/2)) won't fight with this dep tree.
- **The MCP path is already Playwright.** Sessions that drive the walkthrough through `mcp__playwright__*` tools (as in PR #623's verification) can encode their steps here verbatim.

## Running it

From the **`docker-compose.dev.yml` rig running on `localhost:8082`**:

```bash
# 1) Bring up the dev stack
docker compose -f docker-compose.dev.yml up -d

# 2) Seed an admin account + 20 contacts.
#    --user www-data avoids the trap documented in #629 (php artisan as root
#    leaves storage/logs/laravel.log root-owned, breaking subsequent web reqs).
docker compose -f docker-compose.dev.yml exec --user www-data app \
  sh -c 'printf "yes\n20\n" | php artisan setup:test'

# 3) Run the smoke from this directory
cd tests/playwright
yarn install
npx playwright install chromium   # first run only
yarn run smoke
```

Other targets:

```bash
yarn run smoke:headed    # watch it in a visible browser
yarn run smoke:debug     # PWDEBUG=1, step-through inspector
yarn run smoke:report    # open the HTML report after a failing run
```

## Configuration

| Env var                 | Default                 | Purpose                                               |
| ----------------------- | ----------------------- | ----------------------------------------------------- |
| `SMOKE_BASE_URL`        | `http://localhost:8082` | Where Monica is running                               |
| `SMOKE_ADMIN_EMAIL`     | `admin@admin.com`       | Login email (matches `setup:test` defaults)           |
| `SMOKE_ADMIN_PASSWORD`  | `admin0`                | Login password                                        |

If `setup:test` ever switches the default admin creds, override here rather than editing the spec.

## Console-noise allowlist

The walkthrough fails on **any unexpected** Vue or browser console error — that's the whole point of running it after a bump. To keep the signal:noise ratio honest, the spec carries a short allowlist of *known* pre-existing console messages that have open issues filed against them:

| Pattern                                                | Issue |
| ------------------------------------------------------ | ----- |
| `ContactSelect` undefined blur/focus handlers          | [#624](https://github.com/brycehans/monica/issues/624) |
| `<error>` unknown custom element                       | [#625](https://github.com/brycehans/monica/issues/625) |
| PWA manifest missing `url`/`id`                        | [#626](https://github.com/brycehans/monica/issues/626) |
| marked.js `sanitize`/`sanitizer` deprecation           | [#627](https://github.com/brycehans/monica/issues/627) |

When one of those issues is closed, drop its entry from `KNOWN_CONSOLE_NOISE` in `specs/dependency-upgrade-smoke.spec.ts`.

## What this is NOT

- Not part of `yarn run test` or any CI gate.
- Not a substitute for `tests/cypress/` or `tests/Browser/` (Dusk) — those cover regression of specific user flows.
- Not exhaustive coverage. It's a **smoke** suite: the goal is to catch a bump that wholesale breaks login / blade rendering / sabre vcard / search APIs in a couple of minutes, not to replace the manual walkthrough at phase close.
