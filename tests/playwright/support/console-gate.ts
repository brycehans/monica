/**
 * Console-gate fixture.
 *
 * Lifts the dependency-upgrade smoke's console-noise capture into a shared
 * Playwright fixture so every spec can opt in by destructuring `consoleGate`.
 * Re-exports `test` (extended with the fixture) and `expect` so specs import
 * from this module instead of '@playwright/test' directly.
 *
 * Pattern:
 *
 *   import { test, expect } from '../support/console-gate';
 *
 *   test('whatever', async ({ page, consoleGate }) => {
 *     await page.goto('/foo');
 *     consoleGate.assertNoUnknownErrors('/foo');
 *   });
 *
 * The fixture attaches page.on('console') + page.on('pageerror') handlers when
 * the test destructures `consoleGate`; tests that don't request the gate get
 * the unmodified @playwright/test `test`. Capture is per-test (test-scope).
 *
 * KNOWN_CONSOLE_NOISE is the allowlist of pre-existing console messages we
 * have open issues filed against. Anything outside the allowlist is treated
 * as a regression — call `consoleGate.assertNoUnknownErrors(label)` after the
 * relevant interaction(s) to fail the test on unexpected output.
 *
 * When one of the referenced issues is closed, drop its entry from
 * KNOWN_CONSOLE_NOISE.
 */

import { test as baseTest, expect as baseExpect, Page, ConsoleMessage } from '@playwright/test';

export type ConsoleNoiseEntry = { match: RegExp; issue: string };
export type UnknownConsole = { type: string; text: string; url: string };
export type KnownConsole = { issue: string; text: string };

export const KNOWN_CONSOLE_NOISE: ConsoleNoiseEntry[] = [
  // #624 — ContactSelect references undefined blur/focus handlers
  { match: /Property or method "(?:blur|focus)" is not defined/, issue: '#624' },
  { match: /Invalid handler for event "search:(?:blur|focus)"/, issue: '#624' },
  // #625 — Unknown <error> element in ContactFieldTypes.vue
  { match: /Unknown custom element: <error>/, issue: '#625' },
  // #626 — PWA manifest missing url/id in related_applications
  { match: /Manifest: one of 'url' or 'id' is required/, issue: '#626' },
  // #732 — CreateGift._errorHandle else-branch references undeclared `vm`;
  // fires twice when storePhoto's $refs.upload is undefined.
  { match: /vm is not defined/, issue: '#732' },
];

export class ConsoleGate {
  readonly unknown: UnknownConsole[] = [];
  readonly allKnown: KnownConsole[] = [];

  constructor(page: Page) {
    page.on('console', (msg: ConsoleMessage) => {
      if (msg.type() !== 'error' && msg.type() !== 'warning') return;
      const text = msg.text();
      const matched = KNOWN_CONSOLE_NOISE.find((entry) => entry.match.test(text));
      if (matched) {
        this.allKnown.push({ issue: matched.issue, text });
        return;
      }
      this.unknown.push({ type: msg.type(), text, url: msg.location().url });
    });
    page.on('pageerror', (err) => {
      const text = err.message;
      const matched = KNOWN_CONSOLE_NOISE.find((entry) => entry.match.test(text));
      if (matched) {
        this.allKnown.push({ issue: matched.issue, text });
        return;
      }
      this.unknown.push({ type: 'pageerror', text, url: '' });
    });
  }

  assertNoUnknownErrors(pageLabel: string): void {
    if (this.unknown.length === 0) return;
    const lines = this.unknown
      .map((e) => `  [${e.type}] ${e.text}${e.url ? ` @ ${e.url}` : ''}`)
      .join('\n');
    throw new Error(`Unexpected console output on ${pageLabel}:\n${lines}`);
  }
}

export const test = baseTest.extend<{ consoleGate: ConsoleGate }>({
  consoleGate: async ({ page }, use) => {
    const gate = new ConsoleGate(page);
    await use(gate);
  },
});

export const expect = baseExpect;
