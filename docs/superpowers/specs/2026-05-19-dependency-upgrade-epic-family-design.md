# Dependency Upgrade Epic Family Design

## Context

This maintenance fork exists to keep Monica v4 secure and runnable while creating a path toward modern supported dependencies. The current stack is Laravel 9, PHP dependencies managed by Composer, Vue 2.6, Laravel Mix 6, Yarn 1, Node 20 in `package.json` and CI, and an older Node pin in `.tool-versions`.

Dependency work has two competing needs:

- Reduce current security exposure quickly.
- Create a credible path toward latest supported versions across PHP, Laravel, frontend tooling, Vue, Docker, and CI.

These should not be handled as one large upgrade branch. Security fixes need to land independently from framework and frontend migrations.

## Goals

- Split dependency modernization into independently shippable epics.
- Make the first epic security-first.
- Separate advisory cleanup from broader patch and minor dependency currency.
- Preserve a clear path toward latest versions of the backend and frontend stacks.
- Keep each tranche reviewable, testable, and mergeable on its own.

## Non-Goals

- Do not upgrade every dependency in the first tranche.
- Do not couple security advisory cleanup to Laravel or Vue major-version migrations.
- Do not treat the old Vue 2.6 constraint as permanent for the full modernization program.
- Do not mix unrelated feature work into dependency branches.

## Epic Structure

### Epic 1: Security Stabilization

Epic 1 is the first deliverable and is split into two tranches.

#### Epic 1A: Advisory Cleanup

Clear known Composer and Yarn security advisories with the smallest dependency graph changes possible.

Expected work:

- Run Composer and Yarn audit tooling.
- Identify vulnerable direct and transitive packages.
- Prefer targeted upgrades that keep the current app stack intact.
- Remove unused vulnerable packages when removal is lower risk than upgrade.
- Document any advisory exceptions with rationale, affected package, exposure assessment, and follow-up owner.
- Keep lockfile changes focused on advisory remediation.

Success criteria:

- `composer audit` has no material unresolved advisories, or all remaining advisories are documented exceptions.
- `yarn audit` has no material unresolved advisories, or all remaining advisories are documented exceptions.
- The branch does not include major Laravel, Vue, or build-tool migrations unless an advisory has no lower-risk remediation.
- Existing verification commands still pass for the touched surface.

#### Epic 1B: Safe Currency

After Epic 1A lands, apply patch and minor updates compatible with the current baseline.

Current baseline means:

- Laravel 9.
- Existing Composer major constraints unless a minor-compatible relaxation is needed.
- Vue 2.6.
- Laravel Mix 6.
- Yarn 1.
- Node 20 for package and CI behavior, while resolving the `.tool-versions` mismatch.

Expected work:

- Update direct dependencies to safe patch and minor versions within current major constraints.
- Refresh Composer and Yarn lockfiles.
- Fix compatibility issues caused by safe dependency movement.
- Keep major framework and frontend migrations out of this tranche.
- Align local and CI runtime pins when they are already intended to represent the same supported baseline.

Success criteria:

- Patch and minor updates are applied where compatible.
- Known skipped packages are listed with reasons.
- PHP tests, static analysis, frontend build, and relevant lint/audit checks pass or have documented blockers.
- The branch remains mergeable without requiring later modernization epics.

### Epic 2: Runtime Modernization

Align the runtime platform around modern PHP, with PHP 8.4 compatibility as the first target.

Expected work:

- Update Composer PHP constraints and CI PHP matrix deliberately.
- Update Docker and local tooling pins.
- Fix PHP 8.4 deprecations and runtime incompatibilities.
- Keep framework migration work out unless required for PHP compatibility.

### Epic 3: Backend Framework Modernization

Move Laravel and tightly coupled backend packages toward the latest supported Laravel line.

Expected work:

- Upgrade Laravel one major line at a time unless tooling proves a larger jump is safer.
- Handle framework changes in auth, queues, mail, filesystem, database, validation, and service provider behavior.
- Upgrade tightly coupled packages such as Passport, Cashier, Dusk, Collision, Ignition, Larastan, Psalm plugins, and Symfony components as part of the Laravel path.
- Keep frontend framework migration out of this epic unless required for asset compilation.

### Epic 4: Frontend Modernization

Move the frontend stack toward latest versions, including Vue latest as the target ambition.

Expected work:

- Replace or upgrade Laravel Mix, Webpack-era dependencies, lint tooling, test tooling, and frontend package management as needed.
- Plan and execute the Vue migration explicitly rather than treating it as incidental package churn.
- Upgrade Cypress and browser-test infrastructure.
- Preserve user-facing behavior unless a deliberate compatibility change is documented.

### Epic 5: Dependency Automation and Release Hardening

After the main modernization blockers are reduced, improve ongoing dependency maintenance.

Expected work:

- Revisit Dependabot or Renovate strategy.
- Decide which ecosystems should use lockfile-only updates and which should open manifest updates.
- Add or tune audit gates.
- Review CI cache keys, matrix coverage, Docker base images, and release checks.
- Document the recurring dependency maintenance process.

## Sequencing Rules

- Ship Epic 1A before Epic 1B.
- Ship Epic 1B before major modernization branches unless a critical advisory requires a major upgrade.
- Keep each epic branch independently reviewable and mergeable.
- Do not let frontend latest-version work block backend security fixes.
- Do not let Laravel latest-version work block advisory cleanup.
- Treat documented advisory exceptions as temporary follow-up items, not permanent acceptance.

## Verification Strategy

Verification should scale with each tranche:

- Epic 1A: audit commands, dependency install, targeted tests for affected packages, and a production asset build if frontend packages moved.
- Epic 1B: full dependency install, Composer validation, PHP unit suites or representative CI matrix, PHPStan, Psalm, frontend production build, linting, and audit checks.
- Runtime and framework epics: CI matrix expansion, full PHP test suites, static analysis, browser tests where routes or assets are affected, and Docker smoke tests.
- Frontend modernization: production build, linting, Cypress coverage, critical Blade/Vue island smoke tests, and asset manifest validation.

## Open Decisions for Later Planning

- Whether to use Dependabot, Renovate, or both after modernization.
- Whether to migrate from Yarn 1 to npm, pnpm, Yarn Berry, or another package manager.
- Whether the frontend migration should move directly to Vue latest or first bridge through Vue 2.7 compatibility tooling.
- Whether Laravel upgrades should target the newest supported line directly or move one major version at a time.
- How strict audit gates should be for low-severity advisories with no practical exploit path.
