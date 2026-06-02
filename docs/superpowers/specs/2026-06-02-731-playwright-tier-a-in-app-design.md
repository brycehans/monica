# Playwright e2e coverage backfill: Tier A in-app subset

- Issue: [#731](https://github.com/brycehans/monica/issues/731) (umbrella)
- Date: 2026-06-02
- Status: design accepted

## Problem

#731 catalogues user-facing flows with no end-to-end coverage in playwright, cypress (since-retired in #725), the existing playwright smoke, or Dusk. Tier A is the high-blast-radius half: regressions here would silently break disaster recovery, onboarding, compliance, or core CRM persistence.

Tier A has six sub-items. Two (A.1 password reset, A.2 email verification) depend on Mailhog's HTTP API for token retrieval and need a new support module. The other four (A.3 audit log, A.4 export, A.5 import, A.6 reminder persistence) are purely in-app and share the existing support layer.

This PR ships the in-app four and defers A.1/A.2 to a follow-up so the Mailhog integration can be designed against a settled spec idiom.

## Goal

Add four playwright specs covering A.3–A.6 with user-observable selectors and the shared console-error gate, lifting the umbrella's Tier A checklist from 0/6 to 4/6.

## Non-goals

- **A.1 / A.2 Mailhog-coupled flows.** Deferred to a follow-up. Adding the Mailhog HTTP helper alongside four spec patterns is too much novelty per PR.
- **CSV import path (A.5 secondary).** Monica's import surface treats vCard as the primary format and CSV as a separate flow; folding both into one spec dilutes the assertion shape. CSV gets a follow-up if appetite remains.
- **Reminder cron-driven email dispatch.** Per #731 non-goal 3. Persistence + UI surfacing only.
- **Async-queue worker fixtures.** The dev compose runs `QUEUE_CONNECTION=sync` (default `.env.example:107`), so `ExportAccount::dispatch` and `AddContactFromVCard::dispatch` complete in-process during the POST handler. No worker gymnastics needed.

## Approach

### Branch and PR shape

One branch (`test/playwright-tier-a-in-app`) off `4.x`, one PR carving Tier A's in-app subset off the umbrella #731. Commit per spec on the branch so review can follow the increment.

### Spec inventory

Four new spec files under `tests/playwright/specs/`:

| Spec file | #731 ref | Triggers | Asserts |
|---|---|---|---|
| `reminder-persistence.spec.ts` | A.6 | Create contact → open Add Reminder → fill title/date/frequency → submit | Reminder row appears in contact's reminder list by visible title |
| `audit-log.spec.ts` | A.3 | Create contact | `/settings/auditlogs` timeline shows the action with actor + timestamp |
| `account-export.spec.ts` | A.4 | Click Export to JSON (and SQL in a second test) | Flash message renders; export-list row shows status "done"; download event fires with `monica.json` / `monica.sql` suggested filename |
| `account-import-vcard.spec.ts` | A.5 | Upload `fixtures/contact-minimal.vcf` to `/settings/import` | Import report shows one contact processed; `/people` lists the imported contact by visible name |

### Shared pattern

All four specs:

- Import `test` / `expect` from `../support/console-gate` (not `@playwright/test` directly).
- Destructure `consoleGate` from the test context. Call `consoleGate.assertNoUnknownErrors(label)` at the end of each test.
- Establish session via `loginAsFreshUser(page)` from `../support/auth`, not `loginAsAdmin` — keeps state isolation per test, matches the #725 PRs' pattern across `gift-crud`, `note-modal-crud`, etc.
- Select by ARIA role / visible text / form label / button name. No `.monica-modal__panel`, `.dp__*`, `.multiselect-*`, `.vgt-*`, or other vendor classes.

### Fixture layout

New directory `tests/playwright/fixtures/`. Initial content:

- `contact-minimal.vcf` — single vCard 3.0 entry with `FN`, `N`, `EMAIL`. ~10 lines.

No fixture file fits A.3 / A.4 / A.6 (those create their data in-test).

### Support layer

No new top-level support modules. Re-use:

- `auth.ts` for `loginAsFreshUser`.
- `console-gate.ts` for the shared gate fixture.
- `artisan.ts` if a spec needs to shell out (none in this PR).
- `contacts.ts` (33 lines today). If it doesn't yet expose `createContact(page, name)`, add it as part of A.6's commit — three of the four specs need a contact and will benefit.

Resist building a "settings-page navigator" or "import upload" abstraction. Four call sites is below the threshold where the abstraction pays for itself.

### Execution order on the branch

1. **A.6 reminder persistence.** Touches a path the smoke already mounts (`L284`). Lowest risk of surface surprises. Validates the fresh-user + console-gate idiom for this batch. Likely surfaces `createContact()` helper need.
2. **A.3 audit log.** Self-contained. Re-uses A.6's contact-create helper. No fixtures.
3. **A.4 export.** First spec to exercise playwright's `page.waitForEvent('download')`. JSON + SQL as two `test()` blocks in one file. If `QUEUE_CONNECTION` is overridden in any path I missed, scope down to "submitted flash appears" and file a follow-up — but I don't expect this.
4. **A.5 import vCard.** Last because it needs the fixture file and exercises the upload path, the most novel surface in the batch.

### Acceptance for the PR

- Four new specs added; all green locally via the dev-compose rig (`docker compose -f docker-compose.dev.yml up`, `yarn run prod`, `cd tests/playwright && npx playwright test specs/<name>.spec.ts`).
- All four import from `console-gate`, use `loginAsFreshUser`, and pass `assertNoUnknownErrors`.
- Zero new vendor-class selectors anywhere in `tests/playwright/`.
- `tests/playwright/README.md`'s feature-spec list extended with one bullet per new spec.
- Umbrella issue #731's Tier A acceptance gets 4/6 ticked in a comment on the PR. A.1/A.2 listed as deferred with a one-line forward pointer.

## Risks

- **Queue connection assumption.** Plan depends on `QUEUE_CONNECTION=sync`. If overridden in the dev compose or a test-only env, A.4/A.5 hang waiting for a worker. Mitigation: scope down to flash-message assertion and file a follow-up. Cost: one re-commit.
- **Import upload selector drift.** Settings/import uses a non-standard upload UI. Mitigation: open the page during writing, use playwright's codegen to confirm the actual labels.
- **vCard fixture format mismatch.** Monica's import is strict about vCard version / required fields. Mitigation: if the fixture is rejected, swap to a vCard exported from the same Monica via A.4's JSON download workflow as a known-good shape.
- **Audit log latency.** If audit entries are written via a queued listener (rather than sync), A.3's "create then visit auditlog" race could flake. Mitigation: same as above — verify during writing, scope down if needed.

## Out-of-scope follow-ups

- A.1 password reset + A.2 email verification, with a new `tests/playwright/support/mailhog.ts` helper.
- A.5 CSV import path.
- Tier B (auth surface) and Tier C (discoverability / content management) per #731.
