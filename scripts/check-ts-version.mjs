// Asserts that the locally-resolved `typescript` package satisfies the
// minimum floor declared in package.json's `toolFloors.typescript`.
// (Kept out of `engines` because yarn 1 warns on unknown engine keys —
// typescript isn't a runtime engine, it's a dev tool.) This script
// runs in CI (.github/workflows/static.yml) so a downgrade of the
// typescript dep is caught before vue-tsc tries to use a feature
// (e.g. array.every-as-type-guard narrowing in
// resources/js/api/errors.ts) that the older compiler can't handle.

import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const pkgPath = join(here, '..', 'package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));

const floorSpec = pkg.toolFloors?.typescript;
if (!floorSpec) {
  console.error('package.json has no toolFloors.typescript entry; nothing to check.');
  process.exit(1);
}

const m = /^>=\s*(\d+)\.(\d+)/.exec(floorSpec);
if (!m) {
  console.error(`engines.typescript = "${floorSpec}"; this script only understands ">=X.Y" ranges.`);
  process.exit(1);
}
const [, floorMajStr, floorMinStr] = m;
const floorMaj = Number(floorMajStr);
const floorMin = Number(floorMinStr);

const require = createRequire(import.meta.url);
const ts = require('typescript');
const [majStr, minStr] = ts.version.split('.');
const maj = Number(majStr);
const min = Number(minStr);

const ok = maj > floorMaj || (maj === floorMaj && min >= floorMin);
if (!ok) {
  console.error(
    `TypeScript ${ts.version} is below the toolFloors.typescript floor of ${floorMaj}.${floorMin}.`,
  );
  console.error(
    'Required for: `array.every(predicate)`-as-type-guard narrowing in resources/js/api/errors.ts',
  );
  process.exit(1);
}

console.log(
  `TypeScript ${ts.version} meets the toolFloors.typescript floor of ${floorMaj}.${floorMin}.`,
);
