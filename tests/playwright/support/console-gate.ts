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
 * KNOWN_CONSOLE_NOISE is the allowlist of *globally known* pre-existing
 * console messages — entries here apply to every spec that uses the gate.
 * Reserve this list for noise that genuinely fires across the app (e.g.
 * #624's ContactSelect handler warnings show up everywhere ContactSelect
 * mounts). For noise scoped to a single surface, prefer
 * `consoleGate.allow(pattern, issue)` inside the relevant spec so an
 * unrelated regression with the same message text in a different part of
 * the app doesn't get silently swallowed.
 *
 * When one of the referenced issues is closed, drop its entry from
 * KNOWN_CONSOLE_NOISE (or from the spec-level allow() call).
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
];

export class ConsoleGate {
  readonly unknown: UnknownConsole[] = [];
  readonly allKnown: KnownConsole[] = [];
  private readonly extraNoise: ConsoleNoiseEntry[] = [];

  constructor(page: Page) {
    page.on('console', (msg: ConsoleMessage) => {
      if (msg.type() !== 'error' && msg.type() !== 'warning') return;
      const text = msg.text();
      const matched = this.matchNoise(text);
      if (matched) {
        this.allKnown.push({ issue: matched.issue, text });
        return;
      }
      this.unknown.push({ type: msg.type(), text, url: msg.location().url });
    });
    page.on('pageerror', (err) => {
      const text = err.message;
      const matched = this.matchNoise(text);
      if (matched) {
        this.allKnown.push({ issue: matched.issue, text });
        return;
      }
      this.unknown.push({ type: 'pageerror', text, url: '' });
    });
  }

  /**
   * Register a noise pattern scoped to the current test only. Use this for
   * surface-specific known bugs that shouldn't be allowlisted globally —
   * e.g. a defect inside a single Vue component, where matching the message
   * text globally would also hide an unrelated regression with the same
   * message in a different surface.
   */
  allow(pattern: RegExp, issue: string): void {
    this.extraNoise.push({ match: pattern, issue });
  }

  assertNoUnknownErrors(pageLabel: string): void {
    if (this.unknown.length === 0) return;
    const lines = this.unknown
      .map((e) => `  [${e.type}] ${e.text}${e.url ? ` @ ${e.url}` : ''}`)
      .join('\n');
    throw new Error(`Unexpected console output on ${pageLabel}:\n${lines}`);
  }

  private matchNoise(text: string): ConsoleNoiseEntry | undefined {
    return KNOWN_CONSOLE_NOISE.find((entry) => entry.match.test(text))
      ?? this.extraNoise.find((entry) => entry.match.test(text));
  }
}

export const test = baseTest.extend<{ consoleGate: ConsoleGate }>({
  consoleGate: async ({ page }, use) => {
    const gate = new ConsoleGate(page);
    await use(gate);
  },
});

export const expect = baseExpect;
