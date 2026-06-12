# TypeScript Conversion of Shared JS Modules

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Convert all 10 plain-JS modules in `resources/js/` and `resources/js/composables/` to TypeScript so their types flow into future Composition API rewrites of the `.vue` files.

**Architecture:** Rename `.js` → `.ts` in-place (no structural changes), add `tsconfig.json` + `vue-tsc` for type checking, wire a typecheck step into CI. `methods.ts` uses `this: any` because it's spread into a Vue Options-API root instance — a known limitation of the Options API with TypeScript that isn't worth resolving until those components are ported to `<script setup>`. Global window assignments in `bootstrap.ts` and `common.ts` get a shared `resources/js/globals.d.ts` declaration file rather than `as any` casts, keeping the type surface clean.

**Import convention:** Use bare (extensionless) imports throughout — `import './boot'` not `import './boot.ts'`. TypeScript's `moduleResolution: "bundler"` and Vite's resolver both find `.ts` files automatically. `allowImportingTsExtensions` is intentionally absent from `tsconfig.json`.

**Tech Stack:** TypeScript 6.x, vue-tsc 3.x (matched to Vue 3.5), `@types/lodash`, `@types/jquery`, Vite 8 (already handles `.ts` natively via esbuild), Vitest (already accepts `.spec.ts`)

**Note on scope vs. issue #797:** The issue acceptance criteria lists 9 files but `boot.js` is also in `resources/js/` root and is imported by both entry points — it is included here as Task 3. Everything else matches the issue list exactly.

---

### Task 1: Install TypeScript tooling and add `tsconfig.json`

**Files:**
- Modify: `package.json`
- Create: `tsconfig.json`

**Step 1: Install packages**

```bash
yarn add --dev typescript vue-tsc @types/lodash @types/jquery
```

Expected: `yarn.lock` updated; `package.json` devDependencies gains the four packages. No other output.

**Step 2: Verify installed versions look sane**

```bash
yarn vue-tsc --version
yarn tsc --version
```

Expected: `vue-tsc` prints something like `Version X.Y.Z` and `tsc` prints `Version 5.Y.Z`.

**Step 3: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "strict": true
  },
  "include": [
    "resources/js/**/*.ts",
    "resources/js/**/*.d.ts"
  ]
}
```

`moduleResolution: "bundler"` matches Vite's own resolution behaviour. `allowImportingTsExtensions: true` + `noEmit: true` lets files import `./foo.ts` directly without needing a build step. `.vue` files are intentionally excluded from `include` — vue-tsc will be added separately when SFC conversion starts.

**Step 4: Run vue-tsc to confirm it sees zero files (nothing to check yet)**

```bash
yarn vue-tsc --noEmit
```

Expected: exits 0 with no output (no `.ts` files exist yet, so nothing errors).

**Step 5: Commit**

Write to `tmp/commit-msg.txt`:
```
chore(js): add typescript + vue-tsc tooling (#797)

Install typescript, vue-tsc, @types/lodash, @types/jquery.
Add tsconfig.json configured for Vite + Vue (strict, isolatedModules, noEmit).
No source files converted yet.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
Claude-Session: 7f3e70b8-3e3f-48a4-964b-a5116ce82fb0
```

```bash
git add package.json yarn.lock tsconfig.json
git commit -F tmp/commit-msg.txt
rm tmp/commit-msg.txt
```

---

### Task 2: Create `resources/js/globals.d.ts` for Window augmentations

`bootstrap.ts` sets `window._`, `window.$`, `window.jQuery`, `window.Popper`, `window.axios`; `common.ts` sets `window.marked`, `window.DOMPurify`. Rather than littering `as any` casts across two files, declare them once.

**Files:**
- Create: `resources/js/globals.d.ts`

**Step 1: Create the file**

```typescript
import type Popper from 'popper.js';
import type { AxiosStatic } from 'axios';
import type { LoDashStatic } from 'lodash';
import type { marked as MarkedFn } from 'marked';
import type DOMPurify from 'dompurify';

declare global {
  interface Window {
    _: LoDashStatic;
    Popper: typeof Popper;
    $: JQueryStatic;
    jQuery: JQueryStatic;
    axios: AxiosStatic;
    marked: typeof MarkedFn;
    DOMPurify: typeof DOMPurify;
  }
}
```

**Step 2: Run vue-tsc — should still be clean**

```bash
yarn vue-tsc --noEmit
```

Expected: exits 0.

**Step 3: Commit**

Write to `tmp/commit-msg.txt`:
```
chore(js): add globals.d.ts for legacy window assignments (#797)

Declares window._, .Popper, .$, .jQuery, .axios (from bootstrap.ts) and
window.marked, .DOMPurify (from common.ts). Typed against bundled types;
no @types/dompurify or @types/marked needed (both ship their own .d.ts).

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
Claude-Session: 7f3e70b8-3e3f-48a4-964b-a5116ce82fb0
```

```bash
git add resources/js/globals.d.ts
git commit -F tmp/commit-msg.txt
rm tmp/commit-msg.txt
```

---

### Task 3: Convert `boot.js` → `boot.ts`

The simplest file — reads a DOM element and exports typed constants. Zero imports to update here.

**Files:**
- Rename: `resources/js/boot.js` → `resources/js/boot.ts`

**Step 1: Rename and add return types**

The file becomes `boot.ts` with explicit types on the exports:

```typescript
const el = document.getElementById('boot-data');
if (!el) {
  throw new Error('[boot] #boot-data element not found — check that the Blade layout emits it before this script runs');
}
const data = JSON.parse(el.textContent as string);

export const locale: string = data.locale ?? 'en';
export const htmldir: string = data.htmldir ?? 'ltr';
export const timezone: string | null = data.timezone ?? null;
export const profileDefaultView: string | null = data.profileDefaultView ?? null;
export const env: string = data.env ?? 'production';
```

(`el.textContent` is `string | null`; the `if (!el)` guard above means we've already asserted `el !== null`, but `textContent` can still be `null` on an empty element — casting to `string` is safe here because the Blade template always emits content.)

**Step 2: Update imports in `app.js` and `stripe.js`**

In `app.js`, change:
```js
import { locale, htmldir, timezone, profileDefaultView } from './boot';
```
to:
```js
import { locale, htmldir, timezone, profileDefaultView } from './boot';
```

In `stripe.js`, change:
```js
import { locale, htmldir } from './boot';
```
to:
```js
import { locale, htmldir } from './boot';
```

In `testing.js`, change:
```js
import { env } from './boot';
```
to:
```js
import { env } from './boot';
```

(These three are still `.js` files at this point — updating the import extension is fine; Vite resolves `.ts` regardless of whether the importing file is `.js` or `.ts`.)

**Step 3: Run vue-tsc**

```bash
yarn vue-tsc --noEmit
```

Expected: exits 0.

**Step 4: Verify dev build still compiles**

```bash
yarn run dev
```

Expected: build succeeds with no errors.

**Step 5: Commit**

Write to `tmp/commit-msg.txt`:
```
refactor(js): convert boot.js to TypeScript (#797)

Adds explicit types to the boot-data exports (locale, htmldir, timezone,
profileDefaultView, env). Updates the three importing files to use the .ts
extension.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
Claude-Session: 7f3e70b8-3e3f-48a4-964b-a5116ce82fb0
```

```bash
git add resources/js/boot.ts resources/js/app.js resources/js/stripe.js resources/js/testing.js
git commit -F tmp/commit-msg.txt
rm tmp/commit-msg.txt
```

---

### Task 4: Convert `pluralization.js` → `pluralization.ts`

Pure arithmetic functions with a clear type signature: `(choice: number, choicesLength: number) => number`.

**Files:**
- Rename: `resources/js/pluralization.js` → `resources/js/pluralization.ts`

**Step 1: Rename and add types**

```typescript
type PluralFn = (choice: number, choicesLength: number) => number;

function pluralA(_choice: number, _choicesLength: number): number {
  return 0;
}
function pluralB(choice: number, choicesLength: number): number {
  const number = Math.abs(choice);
  return Math.min(((number === 0) || (number === 1)) ? 0 : 1, choicesLength - 1);
}
function pluralC(choice: number, choicesLength: number): number {
  const number = Math.abs(choice);
  return Math.min((number === 1) ? 0 : (((number >= 2) && (number <= 4)) ? 1 : 2), choicesLength - 1);
}
function pluralD(choice: number, choicesLength: number): number {
  const number = Math.abs(choice);
  return Math.min(((number % 10 === 1) && (number % 100 !== 11)) ? 0 : (((number % 10 >= 2) && (number % 10 <= 4) && ((number % 100 < 10) || (number % 100 >= 20))) ? 1 : 2), choicesLength - 1);
}
function pluralE(choice: number, choicesLength: number): number {
  const number = Math.abs(choice);
  return Math.min((number === 0) ? 0 : ((number === 1) ? 1 : ((number === 2) ? 2 : (((number % 100 >= 3) && (number % 100 <= 10)) ? 3 : (((number % 100 >= 11) && (number % 100 <= 99)) ? 4 : 5)))), choicesLength - 1);
}
function pluralF(choice: number, choicesLength: number): number {
  const number = Math.abs(choice);
  return Math.min((number === 1) ? 0 : ((number === 2) ? 1 : ((number < 10 && number % 10 === 0) ? 2 : 3)), choicesLength - 1);
}

const pluralization: Record<string, PluralFn> = {
  'ar': pluralE,
  'cs': pluralC,
  'fr': pluralB,
  'he': pluralF,
  'hr': pluralD,
  'id': pluralA,
  'ja': pluralA,
  'ru': pluralD,
  'tr': pluralA,
  'uk': pluralD,
  'vi': pluralA,
  'zh': pluralA,
  'zh-TW': pluralA,
};

export default pluralization;
```

Changes from the JS original: `==` → `===` throughout (TypeScript's strict mode doesn't prohibit `==` but strict equality is more correct here since the values are already numbers), unused params named `_choice`/`_choicesLength`, intermediate `let number` rewritten to `const` with the mutation inlined.

**Step 2: Update import in `common.js`**

In `common.js`, change:
```js
import pluralization from './pluralization.js';
```
to:
```js
import pluralization from './pluralization';
```

**Step 3: Run vue-tsc**

```bash
yarn vue-tsc --noEmit
```

Expected: exits 0.

**Step 4: Commit**

Write to `tmp/commit-msg.txt`:
```
refactor(js): convert pluralization.js to TypeScript (#797)

Adds PluralFn type alias and explicit return types. Converts == to ===
and let+mutation to const throughout. No logic changes.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
Claude-Session: 7f3e70b8-3e3f-48a4-964b-a5116ce82fb0
```

```bash
git add resources/js/pluralization.ts resources/js/common.js
git commit -F tmp/commit-msg.txt
rm tmp/commit-msg.txt
```

---

### Task 5: Convert composables to TypeScript and rename spec files

Both composables are clean, pure functions with well-defined Vue types available from `vue` and `vue-final-modal`.

**Files:**
- Rename: `resources/js/composables/useModalSelfClose.js` → `useModalSelfClose.ts`
- Rename: `resources/js/composables/useModalSelfClose.spec.js` → `useModalSelfClose.spec.ts`
- Rename: `resources/js/composables/useRowModal.js` → `useRowModal.ts`
- Rename: `resources/js/composables/useRowModal.spec.js` → `useRowModal.spec.ts`

**Step 1: Convert `useModalSelfClose.ts`**

```typescript
type Emit = (event: string, ...args: unknown[]) => void;

export function useModalSelfClose(emit: Emit) {
  return {
    cancel: () => emit('update:modelValue', false),
    finish: () => {
      emit('saved');
      emit('update:modelValue', false);
    },
    sync: (v: boolean) => emit('update:modelValue', v),
  };
}
```

**Step 2: Rename `useModalSelfClose.spec.js` → `useModalSelfClose.spec.ts`**

Update the import at the top:
```typescript
import { useModalSelfClose } from './useModalSelfClose';
```

Everything else in the spec file stays identical — Vitest already handles `.ts`.

**Step 3: Run the spec to confirm it still passes**

```bash
yarn run test:js
```

Expected: all tests pass including the `useModalSelfClose` suite.

**Step 4: Convert `useRowModal.ts`**

```typescript
import { useModal } from 'vue-final-modal';
import type { Component } from 'vue';

export function useRowModal(component: Component) {
  const modal = useModal({ component, attrs: {} });
  return {
    open(attrs: Record<string, unknown> = {}) {
      for (const key of Object.keys(modal.options.attrs as Record<string, unknown>)) {
        delete (modal.options.attrs as Record<string, unknown>)[key];
      }
      modal.patchOptions({ attrs });
      modal.open();
    },
    close: () => modal.close(),
  };
}
```

Note: `modal.options.attrs` is typed as `Record<string, unknown>` in vue-final-modal 4.x. If the compiler complains about the type being more specific, cast via `as Record<string, unknown>`.

**Step 5: Rename `useRowModal.spec.js` → `useRowModal.spec.ts`**

Update the import at the top:
```typescript
import { useRowModal } from './useRowModal';
```

Everything else stays identical.

**Step 6: Run vue-tsc and tests**

```bash
yarn vue-tsc --noEmit
yarn run test:js
```

Expected: both exit 0; all tests pass.

**Step 7: Commit**

Write to `tmp/commit-msg.txt`:
```
refactor(js): convert composables to TypeScript (#797)

useModalSelfClose.ts: adds Emit type alias and explicit param/return types.
useRowModal.ts: types component as Vue Component, attrs as Record<string,unknown>.
Both .spec.js files renamed to .spec.ts; tests unchanged and still pass.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
Claude-Session: 7f3e70b8-3e3f-48a4-964b-a5116ce82fb0
```

```bash
git add resources/js/composables/
git commit -F tmp/commit-msg.txt
rm tmp/commit-msg.txt
```

---

### Task 6: Convert `testing.js` → `testing.ts`

A Vue plugin — types come straight from `vue`.

**Files:**
- Rename: `resources/js/testing.js` → `resources/js/testing.ts`

**Step 1: Rename and add types**

```typescript
import type { App, DirectiveBinding } from 'vue';
import { env } from './boot';

function makeTestingDirective(attrName: string) {
  const apply = (el: Element, binding: DirectiveBinding) => {
    if (env !== 'production') {
      el.setAttribute(attrName, String(binding.value));
    }
  };
  return {
    mounted: apply,
    updated: apply,
  };
}

export default {
  install(app: App) {
    app.directive('cy-name', makeTestingDirective('cy-name'));
    app.directive('cy-items', makeTestingDirective('cy-items'));
  },
};
```

**Step 2: Update import in `app.js`**

In `app.js`, change:
```js
import testingDirectives from './testing';
```
to:
```js
import testingDirectives from './testing';
```

**Step 3: Run vue-tsc**

```bash
yarn vue-tsc --noEmit
```

Expected: exits 0.

**Step 4: Commit**

Write to `tmp/commit-msg.txt`:
```
refactor(js): convert testing.js to TypeScript (#797)

Types the Vue directive callbacks (App, DirectiveBinding). No logic changes.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
Claude-Session: 7f3e70b8-3e3f-48a4-964b-a5116ce82fb0
```

```bash
git add resources/js/testing.ts resources/js/app.js
git commit -F tmp/commit-msg.txt
rm tmp/commit-msg.txt
```

---

### Task 7: Convert `methods.js` → `methods.ts`

This object is spread into a Vue Options-API `createApp({ methods })` call, so `this` inside each method refers to the Vue root component instance. Typing `this` precisely requires `ComponentPublicInstance` generic gymnastics — not worth it before those components are Composition-API'd. Use `this: any` per the Options API + TypeScript docs recommendation for mixed-migration codebases.

**Files:**
- Rename: `resources/js/methods.js` → `resources/js/methods.ts`

**Step 1: Rename and add types**

```typescript
import axios from 'axios';

export default {
  updateDefaultProfileView(this: any, view: string): void {
    axios.post('settings/updateDefaultProfileView', { name: view })
      .then(() => {
        this.global_profile_default_view = view;
      });
  },

  fixAvatarDisplay(_this: any, event: Event): void {
    const el = event.target as HTMLElement | null;
    if (!el) return;
    el.className = 'hidden';
    (el.nextElementSibling as HTMLElement | null)?.classList.remove('hidden');
  },
};
```

Changes vs. JS original:
- `axios` is now imported explicitly (the original relied on `window.axios` being a global; that still works at runtime but tsc doesn't see it without the import — importing directly is cleaner).
- `event.srcElement` (deprecated IE alias) replaced with `event.target` (standard).
- `el.classList = ['hidden']` (assigning an array to classList, which is a DOMTokenList) replaced with `el.className = 'hidden'` (correct DOM API).

**Step 2: Update import in `app.js`**

In `app.js`, change:
```js
import methods from './methods';
```
to:
```js
import methods from './methods';
```

**Step 3: Run vue-tsc**

```bash
yarn vue-tsc --noEmit
```

Expected: exits 0.

**Step 4: Commit**

Write to `tmp/commit-msg.txt`:
```
refactor(js): convert methods.js to TypeScript (#797)

Imports axios explicitly rather than relying on window.axios global.
Replaces deprecated event.srcElement with event.target.
Uses this:any per Vue Options-API + TypeScript migration guidance.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
Claude-Session: 7f3e70b8-3e3f-48a4-964b-a5116ce82fb0
```

```bash
git add resources/js/methods.ts resources/js/app.js
git commit -F tmp/commit-msg.txt
rm tmp/commit-msg.txt
```

---

### Task 8: Convert `common.js` → `common.ts`

The i18n + moment setup module. All dependencies (axios, vue-i18n, moment) ship bundled types.

**Files:**
- Rename: `resources/js/common.js` → `resources/js/common.ts`

**Step 1: Rename and add types**

```typescript
import axios from 'axios';
import { createI18n } from 'vue-i18n';
import type { I18n } from 'vue-i18n';
import moment from 'moment';

import 'moment/dist/locale/ar';
import 'moment/dist/locale/de';
import 'moment/dist/locale/el';
import 'moment/dist/locale/en-gb';
import 'moment/dist/locale/es';
import 'moment/dist/locale/fr';
import 'moment/dist/locale/he';
import 'moment/dist/locale/id';
import 'moment/dist/locale/it';
import 'moment/dist/locale/nl';
import 'moment/dist/locale/pt-br';
import 'moment/dist/locale/ru';
import 'moment/dist/locale/sv';
import 'moment/dist/locale/tr';
import 'moment/dist/locale/vi';
import 'moment/dist/locale/zh-cn';
import 'moment/dist/locale/zh-tw';

import { marked } from 'marked';
import DOMPurify from 'dompurify';
window.marked = marked;
window.DOMPurify = DOMPurify;

import messages from '../../public/js/langs/en.json';
import pluralization from './pluralization';

const common = {
  i18n: createI18n({
    legacy: false,
    globalInjection: false,
    locale: 'en',
    fallbackLocale: 'en',
    messages: { 'en': messages },
    pluralRules: pluralization,
  }),

  loadedLanguages: ['en'] as string[],

  _setI18nLanguage(lang: string): void {
    this.i18n.global.locale.value = lang;
    axios.defaults.headers.common['Accept-Language'] = lang;
    (document.querySelector('html') as HTMLElement).setAttribute('lang', lang);
  },

  _loadLanguageAsync(lang: string): Promise<I18n> {
    if (this.i18n.global.locale.value !== lang) {
      if (!this.loadedLanguages.includes(lang)) {
        return axios.get<Record<string, unknown>>(`js/langs/${lang}.json`).then(msgs => {
          this.i18n.global.setLocaleMessage(lang, msgs.data);
          this.loadedLanguages.push(lang);
          return this.i18n;
        });
      }
    }
    return Promise.resolve(this.i18n);
  },

  loadLanguage(lang: string, set: boolean): Promise<I18n> {
    return this._loadLanguageAsync(lang).then(i18n => {
      if (set) {
        this._setI18nLanguage(lang);
      }
      moment.locale(lang === 'zh' ? 'zh-cn' : lang);
      return i18n;
    });
  },
};

export default common;
```

**Step 2: Update import in `app.js`**

In `app.js`, change:
```js
import common from './common';
```
to:
```js
import common from './common';
```

Do the same in `stripe.js`:
```js
import common from './common';
```

**Step 3: Run vue-tsc**

```bash
yarn vue-tsc --noEmit
```

If `vue-i18n`'s `I18n` type produces an error on `this.i18n.global.locale.value` (vue-i18n uses heavy generics), add `// @ts-expect-error — vue-i18n composition-mode locale ref` above the assignment and note it as a known loose point.

Expected: exits 0 (or with any suppressed errors explained inline).

**Step 4: Commit**

Write to `tmp/commit-msg.txt`:
```
refactor(js): convert common.js to TypeScript (#797)

Adds I18n return types to loadLanguage/_loadLanguageAsync/_setI18nLanguage.
window.marked and window.DOMPurify assignments satisfy globals.d.ts.
No logic changes.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
Claude-Session: 7f3e70b8-3e3f-48a4-964b-a5116ce82fb0
```

```bash
git add resources/js/common.ts resources/js/app.js resources/js/stripe.js
git commit -F tmp/commit-msg.txt
rm tmp/commit-msg.txt
```

---

### Task 9: Convert `bootstrap.js` → `bootstrap.ts`

Sets up jQuery/axios/Popper globals. The `window.*` assignments are covered by `globals.d.ts` from Task 2.

**Files:**
- Rename: `resources/js/bootstrap.js` → `resources/js/bootstrap.ts`

**Step 1: Rename and add types**

```typescript
import _ from 'lodash';
import Popper from 'popper.js';
import jQuery from 'jquery';
import axios from 'axios';

import 'bootstrap/js/dist/util';
import 'bootstrap/js/dist/button';
import 'bootstrap/js/dist/collapse';
import 'bootstrap/js/dist/dropdown';
import 'bootstrap/js/dist/modal';
import 'bootstrap/js/dist/tab';

window._ = _;
window.Popper = Popper;
window.$ = window.jQuery = jQuery;
window.axios = axios;

window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
```

No logic changes — just drop the comments that explain what the file does (they don't add value over the imports themselves).

**Step 2: Update import in `app.js`**

In `app.js`, the import is already `import './bootstrap'` with no extension. Leave it as `'./bootstrap'` — Vite's module resolution will find `bootstrap.ts` automatically.

Do the same check in `stripe.js` — same bare import, no change needed.

**Step 3: Run vue-tsc**

```bash
yarn vue-tsc --noEmit
```

If `popper.js` v1.x types don't match the `Window.Popper` declaration, adjust `globals.d.ts` to use `typeof Popper` via `import('popper.js').default`.

Expected: exits 0.

**Step 4: Commit**

Write to `tmp/commit-msg.txt`:
```
refactor(js): convert bootstrap.js to TypeScript (#797)

Window assignments (_, Popper, $, jQuery, axios) covered by globals.d.ts.
No logic changes.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
Claude-Session: 7f3e70b8-3e3f-48a4-964b-a5116ce82fb0
```

```bash
git add resources/js/bootstrap.ts
git commit -F tmp/commit-msg.txt
rm tmp/commit-msg.txt
```

---

### Task 10: Convert `app.js` → `app.ts` and `stripe.js` → `stripe.ts`; update `vite.config.js`

The two entry points. Mostly mechanical — all imports from converted modules already have the `.ts` extension added in previous tasks; any still missing get updated here. The key non-type change is updating `vite.config.js` to reference the new entry-point filenames.

**Files:**
- Rename: `resources/js/app.js` → `resources/js/app.ts`
- Rename: `resources/js/stripe.js` → `resources/js/stripe.ts`
- Modify: `vite.config.js`

**Step 1: Rename `app.js` → `app.ts`**

The file content is 99% identical. Changes needed:
1. All `import './...'` and `import { ... } from './...'` lines that reference now-TS modules need `.ts` extensions. Run through the import list:
   - `import './bootstrap'` → leave as-is (bare import, Vite finds bootstrap.ts)
   - `import { locale, htmldir, timezone, profileDefaultView } from './boot'` — already updated in Task 3
   - `import testingDirectives from './testing'` — already updated in Task 6
   - `import common from './common'` — already updated in Task 8
   - `import methods from './methods'` — already updated in Task 7
   - All `from './components/...'` `.vue` imports — unchanged

2. The Options-API root component `data()` and the `common.loadLanguage(...).then((i18n) => { ... })` callback are untyped. Leave them as-is; TypeScript will infer `i18n` from the return type of `common.loadLanguage()`.

**Step 2: Rename `stripe.js` → `stripe.ts`**

Same process — verify import lines, no other changes needed.

**Step 3: Update `vite.config.js` entry points and PurgeCSS content**

In `vite.config.js`, find the `laravel({ input: [...] })` block and update:
```js
laravel({
  input: [
    'resources/js/app.ts',    // was app.js
    'resources/js/stripe.ts', // was stripe.js
    'resources/sass/app-ltr.scss',
    'resources/sass/app-rtl.scss',
    'resources/sass/stripe.scss',
  ],
  refresh: true,
}),
```

Also update the PurgeCSS `content` array (farther down in the same file):
```js
content: [
  './resources/views/**/*.blade.php',
  './resources/js/**/*.vue',
  './resources/js/**/*.{js,ts}',  // add ts
  './app/**/*.php',
],
```

**Step 4: Run vue-tsc**

```bash
yarn vue-tsc --noEmit
```

Expected: exits 0 across all 10 `.ts` files.

**Step 5: Run full build**

```bash
yarn run prod
```

Expected: build succeeds; `public/build/manifest.json` references the compiled entry points.

**Step 6: Run JS tests**

```bash
yarn run test:js
```

Expected: all spec tests pass.

**Step 7: Commit**

Write to `tmp/commit-msg.txt`:
```
refactor(js): convert app.js and stripe.js to TypeScript (#797)

Renames both entry points to .ts. Updates vite.config.js input array to
reference app.ts and stripe.ts. Adds *.ts to PurgeCSS content pattern.
All 10 shared JS modules are now TypeScript.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
Claude-Session: 7f3e70b8-3e3f-48a4-964b-a5116ce82fb0
```

```bash
git add resources/js/app.ts resources/js/stripe.ts vite.config.js
git commit -F tmp/commit-msg.txt
rm tmp/commit-msg.txt
```

---

### Task 11: Wire `vue-tsc --noEmit` into CI

Add a `typecheck` job to `.github/workflows/static.yml` alongside the existing `phpstan` job. It should run on push + PR (same triggers as the rest of the static workflow).

**Files:**
- Modify: `.github/workflows/static.yml`

**Step 1: Add a `typecheck` job**

Append to `.github/workflows/static.yml` after the `phpstan:` job:

```yaml
  typecheck:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout sources
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: yarn

      - name: Install yarn dependencies
        run: yarn inst

      - name: Run vue-tsc
        run: yarn vue-tsc --noEmit
```

**Step 2: Verify the YAML is valid**

```bash
python3 -c "import yaml, sys; yaml.safe_load(open('.github/workflows/static.yml'))" && echo "YAML OK"
```

Expected: `YAML OK`.

**Step 3: Commit**

Write to `tmp/commit-msg.txt`:
```
ci: add vue-tsc typecheck job to static analysis workflow (#797)

Runs vue-tsc --noEmit on every PR alongside phpstan. Uses Node 20 +
yarn inst (frozen lockfile) to match the test and browser-test jobs.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
Claude-Session: 7f3e70b8-3e3f-48a4-964b-a5116ce82fb0
```

```bash
git add .github/workflows/static.yml
git commit -F tmp/commit-msg.txt
rm tmp/commit-msg.txt
```

---

### Task 12: Full verification

Run the complete test suite and confirm all acceptance criteria are met.

**Step 1: Run PHP tests + phpstan**

```bash
yarn run test
```

Expected: all PHPUnit suites pass; phpstan exits clean.

**Step 2: Run JS unit tests**

```bash
yarn run test:js
```

Expected: all composable specs pass; no failures.

**Step 3: Verify vue-tsc across all converted files**

```bash
yarn vue-tsc --noEmit
```

Expected: exits 0.

**Step 4: Verify production build**

```bash
yarn run prod
```

Expected: exits 0; `public/build/manifest.json` updated; no asset errors.

**Step 5: Check acceptance criteria**

Walk the checklist from issue #797:

- [ ] `tsconfig.json` at repo root — **Task 1**
- [ ] `vue-tsc` in devDependencies — **Task 1**
- [ ] Vite handles `.ts` (esbuild) — already did; confirmed by Task 3 dev build
- [ ] All 9 listed source files converted — Tasks 3–10; plus `boot.ts` as an unlisted-but-required 10th
- [ ] Spec files renamed to `.spec.ts` and passing — **Task 5**
- [ ] `vue-tsc --noEmit` clean — **Task 4, 12**
- [ ] Typecheck step in CI — **Task 11**
- [ ] `yarn run dev` and `yarn run prod` green — **Task 12**
- [ ] Manual smoke test — start Docker dev env, `yarn run prod`, walk dashboard/contact/modal screens as `test@example.com` via `monica:seed-regression-demo`
