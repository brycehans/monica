// Self-closing custom elements like `<modals-container />` are NOT supported
// in DOM templates — the browser's HTML parser treats the `/>` as part of the
// opening tag and silently swallows everything that follows as children.
// When the surrounding template is Vue's in-DOM template (Blade pages that
// mount `#app` and let Vue parse the existing innerHTML), the component
// referenced by the self-closing tag is never instantiated and you get a
// silent no-op with no console error.
//
// See https://vuejs.org/guide/essentials/component-basics.html#in-dom-template-parsing-caveats
//
// Bit us once during #724 phase 1 when <modals-container /> rendered nothing
// even though useModal().open() populated dynamicModals correctly. This guard
// fails CI if any future change reintroduces the pattern in a Blade template.
//
// Scope: only `resources/views/**/*.blade.php`. SFC templates (.vue) are
// parsed by Vue's compiler and self-closing IS valid there.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import path from 'node:path';

const REPO_ROOT = path.resolve(__dirname, '..', '..');

// Match a self-closing kebab-case tag: at least one hyphen in the name,
// followed by any attributes, ending with `/>`. Excludes Blade components
// (`<x-foo />`) which Laravel compiles server-side before HTML parsing.
const SELF_CLOSING_CUSTOM_ELEMENT = /<(?!x-)([a-z][a-z0-9]*-[a-z0-9-]+)\b[^>]*\/>/g;

function listBladeFiles() {
  // Use git ls-files so we honour .gitignore and don't scan vendor/ or
  // storage/framework/views/ (which contain compiled blade output that
  // *would* legitimately self-close).
  const out = execSync('git ls-files "resources/views/**/*.blade.php"', {
    cwd: REPO_ROOT,
    encoding: 'utf8',
  });
  return out.split('\n').filter(Boolean);
}

describe('blade templates — no self-closing custom elements', () => {
  it('keeps every kebab-cased custom element fully-closed in DOM templates', () => {
    const offenders = [];
    for (const relPath of listBladeFiles()) {
      const abs = path.join(REPO_ROOT, relPath);
      const src = readFileSync(abs, 'utf8');
      const lines = src.split('\n');
      lines.forEach((line, idx) => {
        SELF_CLOSING_CUSTOM_ELEMENT.lastIndex = 0;
        let match;
        while ((match = SELF_CLOSING_CUSTOM_ELEMENT.exec(line)) !== null) {
          offenders.push(`${relPath}:${idx + 1}  <${match[1]} ... />`);
        }
      });
    }
    expect(offenders, [
      'Self-closing custom elements are silently no-op in Vue DOM templates.',
      'Convert each to an explicit closing tag, e.g. `<x></x>`.',
      'Offenders:\n  ' + offenders.join('\n  '),
    ].join('\n')).toEqual([]);
  });
});
