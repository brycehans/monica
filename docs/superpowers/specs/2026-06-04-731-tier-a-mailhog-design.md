# Playwright e2e coverage backfill: Tier A Mailhog-coupled subset

- Issue: [#731](https://github.com/brycehans/monica/issues/731) (umbrella)
- Predecessor PR: [#739](https://github.com/brycehans/monica/pull/739) — Tier A in-app subset (A.3–A.6)
- Date: 2026-06-04
- Status: design accepted

## Problem

#731's Tier A has six items. PR #739 shipped the four in-app ones (A.3 audit log, A.4 export, A.5 import, A.6 reminder persistence) and explicitly deferred the two Mailhog-coupled flows:

- **A.1 — Password reset.** Visit `/password/reset`, submit an email, retrieve the reset token from the email, set a new password, log in with it.
- **A.2 — Email verification.** Trigger a verification email, click the signed URL, assert the user lands on `/dashboard` as a verified account.

Both flows depend on reading email content from the dev compose's Mailhog service (`localhost:8025`). The predecessor PR deferred them so the Mailhog support module could be designed against settled spec idioms.

## Goal

Add the missing two specs and the shared `tests/playwright/support/mailhog.ts` helper, lifting #731's Tier A acceptance from 4/6 to 6/6.

## Non-goals

- **Bulk-clearing Mailhog's inbox before each test.** Filtering by recipient (each fresh user has a faker-generated unique email) disambiguates without coupling specs to a shared global state.
- **Tier B / C / D from #731.** Out of scope; this PR closes Tier A only.
- **Mailtrap or other external mail providers.** Helper targets Mailhog HTTP API exclusively; production mail backends use SMTP/SES/Mailgun and are out of scope for e2e.
- **CSRF / signed-URL expiry edge cases.** The acceptance contract is "click the link Monica sent → it works." Expiry handling is a separate spec if anyone wants it.

## Approach

### Mailhog helper shape

New module: `tests/playwright/support/mailhog.ts`. One exported function plus URL extraction helper.

```typescript
export async function waitForEmailTo(
  recipient: string,
  opts?: { timeoutMs?: number; since?: Date }
): Promise<MailhogMessage>;

export function extractUrl(message: MailhogMessage, pattern: RegExp): string;
```

`waitForEmailTo` polls `http://localhost:8025/api/v2/messages?limit=100` every 250ms up to `timeoutMs` (default 5000), filtering by `To[].Mailbox + '@' + To[].Domain === recipient`. Returns the most recent match. Throws on timeout with a message listing the recipients seen, to make flake diagnosis easy.

`extractUrl` decodes the message body (multipart quoted-printable, `=\r\n` soft-wrap unwrap, `=XX` hex decode), then runs `pattern.exec()` and returns the first capture group. Pattern is supplied by the caller so the helper stays generic across reset/verify/etc.

Host is configurable via `PW_MAILHOG_URL` (default `http://localhost:8025`).

No clear-inbox method exposed; recipient filtering is sufficient and avoids cross-spec coupling.

### A.1 password reset spec

`tests/playwright/specs/password-reset.spec.ts`:

1. Mint a fresh user via `loginAsFreshUser(page)` — but we want a *logged-out* user, so use the existing artisan call directly. Add `createFreshUser()` to `auth.ts` that returns `{ userId, accountId, email }` without driving `/_dusk/login`. (Reuses 90% of `loginAsFreshUser`'s body; emails come back via the same lastLine tinker idiom.)
2. `page.goto('/password/reset')`.
3. Fill the email field with the user's email. Click "Send Password Reset Link" (or whatever the button name resolves to — verify during writing).
4. Assert visible success flash on the page.
5. `await waitForEmailTo(email)`. Extract the URL matching `/password/reset/[^\s)"]+/`.
6. `page.goto(resetUrl)`. Fill new password, confirmation, submit.
7. Assert redirect to `/dashboard` (Laravel's `ResetsPasswords` auto-logs-in on success).
8. `consoleGate.assertNoUnknownErrors('/password/reset')`.

### A.2 email verification spec

The dev rig's `monica.signup_double_optin` defaults to `false`, which makes `User::sendEmailVerificationNotification()` a no-op and `RegisterController::registered()` auto-verify. The `/email/resend` route still goes through that gated notification method, so flipping `signup_double_optin=true` would be needed to drive the full register-then-resend flow.

Globally flipping `signup_double_optin` in `.env.dev` would break `signup-duplicate-email.spec.ts` (which asserts post-registration redirect to `/dashboard` — the `verified` middleware would bounce that to `/email/verify` once the auto-verify is gated). The cleanest path that keeps every existing spec passing is to **simulate the unverified state in-test**:

`tests/playwright/specs/email-verification.spec.ts`:

1. Mint a fresh user via `loginAsFreshUser(page)` — gives `{ userId, accountId, email }` and an active session.
2. Run a tinker one-liner that:
   - Sets `email_verified_at = null` on the user.
   - Calls `$user->notify(new \Illuminate\Auth\Notifications\VerifyEmail())` (mirrors what `App\Jobs\SendVerifyEmail` does, bypassing the `signup_double_optin` gate).
3. `await waitForEmailTo(email)`. Extract the signed verification URL matching `/email/verify/\d+/[a-f0-9]+\?expires=\d+&signature=[a-f0-9]+/`.
4. `page.goto(verifyUrl)`. The `verified` middleware on `/dashboard` requires a logged-in session, which we already have from step 1.
5. Assert redirect to `/dashboard` and that the user's `email_verified_at` is now populated (via a follow-up tinker query, or — simpler — via the absence of the verification gate page).
6. `consoleGate.assertNoUnknownErrors('/email/verify/...')`.

The trade-off: we test the verification *handler* end-to-end (signed URL, hash match, redirect, DB flag flip), but not the registration→notification dispatch chain. The dispatch chain is gated by a single config flag and is exercised by Laravel's own framework tests; the high-blast-radius failure mode (broken verify URL handler — bricks new signups when `signup_double_optin=true`) is covered.

### Auth helper extension

`tests/playwright/support/auth.ts` gains one new exported function:

```typescript
export async function createFreshUser(): Promise<FreshUser & { email: string }>;
```

Same body as `loginAsFreshUser` minus the `/_dusk/login` call, plus an extra tinker shellout to fetch the user's email. Used by A.1.

`loginAsFreshUser` itself extends its return type to include `email`; existing callers ignore it (TS structural typing).

### Spec-layer pattern (same as #739)

Both new specs:

- Import `test` / `expect` from `../support/console-gate`.
- Use `loginAsFreshUser` (A.2) or the new `createFreshUser` (A.1).
- Select by ARIA role / visible text / form label. No `.monica-modal__panel`, `.dp__*`, `.multiselect-*`, `.vgt-*`.
- Call `consoleGate.assertNoUnknownErrors(label)` at the end.

### Execution order on the branch

1. **`mailhog.ts` helper.** Standalone module, no spec deps. Validates the polling + decode + extraction shape.
2. **`auth.ts` extension** (`createFreshUser`, email in `FreshUser`).
3. **A.1 password reset.** Exercises the helper against Laravel's stock password-reset email.
4. **A.2 email verification.** Exercises the helper against Monica's verification notification + the in-test unverify trick.
5. **README + comment on #731.**

### Acceptance

- Two new specs added; both green locally via the dev compose rig (`docker compose -f docker-compose.dev.yml up`, `yarn run prod`, `cd tests/playwright && npx playwright test specs/password-reset.spec.ts specs/email-verification.spec.ts`).
- `tests/playwright/support/mailhog.ts` added and unit-clean (no spec imports it transitively unless it's listed in this PR).
- All existing specs still pass on a fresh `tests/playwright` run.
- `tests/playwright/README.md`'s feature-spec list extended with one bullet per new spec.
- Umbrella issue #731's Tier A acceptance ticks A.1 and A.2 in a PR comment.

## Risks

- **Mailhog API rate / pagination.** With `limit=100` and recipient filtering, the dev rig's accumulated message count (~9 today, much more after a long session) sits well inside one page. If a long-running session pushes past 100, switch to `start=N` paging — but this is a future concern, not a launch blocker.
- **Quoted-printable decoding edge cases.** Laravel's reset email is a multipart message; the plain-text leg is the one we want to parse. If the URL straddles a `=\r\n` soft-wrap boundary, the decode has to be done before regex matching, not after. Spec test: write a fixture-based decode unit smoke (or skip this and rely on the integration spec; the dev rig's actual email is the only fixture we care about).
- **Signed-URL session coupling for A.2.** The `verified` middleware redirects to `/dashboard` only when the user is logged in. We log in via `loginAsFreshUser` *before* clearing `email_verified_at`. The session cookie persists; the verified middleware on `/dashboard` is the only gate. Verify by writing the spec and observing — if the verify-URL handler logs the user out, we'll need an extra login step after step 4.
- **Stale Mailhog messages from prior runs.** Recipient is unique per `setup:frontendtestuser` run (faker email). Even with multi-day stale messages in the inbox, the filter resolves to the new user's email. The `since` option in `waitForEmailTo` is a defensive belt-and-braces if a deterministic-email regression ever happens.
- **Tinker-dispatched notification timing.** `QUEUE_CONNECTION=sync` in `.env.dev` (already confirmed in #739's spec) means `$user->notify(...)` blocks until the SMTP send completes. No worker fixture needed.

## Out-of-scope follow-ups

- **Restore the register→verify chain in a future spec.** Requires either a dev-compose env-flip mode or a per-spec config override mechanism. File only if appetite emerges.
- **Mailhog inbox cleanup hook.** Not needed today; useful if specs ever start cross-matching on subject or sender domain.
- **CSV import path** (carryover from #739).
- **Tier B/C/D** of #731.
