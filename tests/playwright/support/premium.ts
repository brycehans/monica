/**
 * Premium-access + subscription-gating helpers.
 *
 * The dev compose stack pins REQUIRES_SUBSCRIPTION=true so the Stripe upgrade
 * smoke (subscription-flow.spec.ts) can render the blank/upgrade views. That
 * flag makes AccountHelper::hasLimitations return true on the seeded admin
 * account, which short-circuits limited-mode-gated features (StayInTouch,
 * FormToggle in Modules, etc.) before they can be exercised end-to-end.
 *
 * AccountHelper::hasLimitations checks `has_access_to_paid_version_for_free`
 * BEFORE the env-var-driven `requires_subscription`, so flipping the per-
 * account flag bypasses limited mode without touching the env (which would
 * break the Stripe smoke). The `account:setpremium {id} [--revoke]` artisan
 * command toggles the flag.
 *
 * withPremiumAccount(fn) grants premium before fn runs and revokes it in a
 * finally — symmetric so a failed test doesn't leak premium state into the
 * next run. The helper is a no-op (with a console.warn) when SMOKE_BASE_URL
 * points outside the local compose stack; tests that depend on premium will
 * then fail naturally instead of silently mutating the wrong account.
 *
 * setRequiresSubscription(value) flips REQUIRES_SUBSCRIPTION via
 * `php artisan config:cache` so the subscription-gate tests can exercise both
 * branches without restarting the compose stack. The post-test caller should
 * either revert the flag or call `artisan config:clear` to reset.
 */

import { artisan, dockerExec } from './artisan';

const SMOKE_BASE_URL = process.env.SMOKE_BASE_URL ?? 'http://localhost:8082';
const SMOKE_ACCOUNT_ID = process.env.SMOKE_ACCOUNT_ID ?? '1';
// Only mutate account state when we're talking to a local dev stack. If
// someone points SMOKE_BASE_URL at a remote target we still call artisan
// locally (or via docker) but that target's DB is a different DB, so the
// mutation would be off-target and silent. Fail loud instead.
const PREMIUM_ENABLED = /^https?:\/\/localhost(:\d+)?$/i.test(SMOKE_BASE_URL);

export function setPremium(grant: boolean, accountId: string = SMOKE_ACCOUNT_ID): void {
  if (!PREMIUM_ENABLED) {
    console.warn(
      `[playwright] SMOKE_BASE_URL=${SMOKE_BASE_URL} is not the local compose stack; ` +
      `skipping account:setpremium ${grant ? '' : '--revoke'} (test may fail on limited-mode gates).`,
    );
    return;
  }
  const args = ['account:setpremium', accountId];
  if (!grant) args.push('--revoke');
  artisan(...args);
}

export async function withPremiumAccount<T>(fn: () => Promise<T>, accountId: string = SMOKE_ACCOUNT_ID): Promise<T> {
  setPremium(true, accountId);
  try {
    return await fn();
  } finally {
    setPremium(false, accountId);
  }
}

export function setRequiresSubscription(value: boolean): void {
  if (!PREMIUM_ENABLED) {
    console.warn(
      `[playwright] SMOKE_BASE_URL=${SMOKE_BASE_URL} is not the local compose stack; ` +
      `skipping REQUIRES_SUBSCRIPTION=${value} reconfigure.`,
    );
    return;
  }
  // config:cache bakes env vars into bootstrap/cache/config.php so the
  // app picks them up on the next request. We route the assignment through
  // `sh -lc` so the env-var binding is local to the artisan invocation —
  // tests are expected to call clearCachedConfig() to roll back to whatever
  // the .env file says (typically REQUIRES_SUBSCRIPTION=true under the dev
  // compose stack).
  dockerExec('sh', '-lc', `REQUIRES_SUBSCRIPTION=${value ? 'true' : 'false'} php artisan config:cache`);
}

export function clearCachedConfig(): void {
  if (!PREMIUM_ENABLED) return;
  artisan('config:clear');
}
