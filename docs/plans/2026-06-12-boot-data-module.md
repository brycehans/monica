# Boot-Data Module Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the `window.Laravel` browser global with a typed `boot.js` module so that entry points import boot data as a proper ES module instead of reading an untyped global.

**Architecture:** Both Blade layouts emit a `<script type="application/json" id="boot-data">` tag instead of assigning `window.Laravel`. A new `resources/js/boot.js` reads that tag once at module-evaluation time and re-exports each field as a named export. The three JS entry points (`app.js`, `stripe.js`, `testing.js`) replace their `window.Laravel.x` reads with named imports from `./boot`.

**Tech Stack:** Vanilla JS (no framework), Blade PHP templates, Vite 8.

---

### Task 1: Create the boot module

**Files:**
- Create: `resources/js/boot.js`

**Step 1: Create the file**

```js
const el = document.getElementById('boot-data');
const data = JSON.parse(el.textContent);

export const locale = data.locale;
export const htmldir = data.htmldir;
export const timezone = data.timezone ?? null;
export const profileDefaultView = data.profileDefaultView ?? null;
export const env = data.env ?? 'production';
```

Note: `timezone`, `profileDefaultView`, and `env` are absent on auth-layout pages (which only inject `locale` + `htmldir`), so nullable fallbacks are intentional.

**Step 2: Verify it parses**

```bash
node -e "
const src = require('fs').readFileSync('resources/js/boot.js', 'utf8');
console.log('parse ok:', src.includes('export const locale'));
"
```

Expected: `parse ok: true`

---

### Task 2: Update skeleton.blade.php

**Files:**
- Modify: `resources/views/layouts/skeleton.blade.php:32-40`

**Step 1: Replace the script block**

Replace lines 32–40:
```blade
    <script>
      window.Laravel = {!! \Safe\json_encode([
          'locale' => \App::getLocale(),
          'htmldir' => htmldir(),
          'profileDefaultView' => auth()->user()->profile_active_tab,
          'timezone' => auth()->user()->timezone,
          'env' => \App::environment(),
      ]); !!}
    </script>
```

With:
```blade
    <script type="application/json" id="boot-data">{!! \Safe\json_encode([
        'locale' => \App::getLocale(),
        'htmldir' => htmldir(),
        'profileDefaultView' => auth()->user()->profile_active_tab,
        'timezone' => auth()->user()->timezone,
        'env' => \App::environment(),
    ]) !!}</script>
```

Note: no space between `}` and `</script>` — avoids stray whitespace in `textContent`.

---

### Task 3: Update auth.blade.php

**Files:**
- Modify: `resources/views/marketing/auth.blade.php:13-18`

**Step 1: Replace the script block**

Replace lines 13–18:
```blade
    <script>
      window.Laravel = {!! \Safe\json_encode([
          'locale' => \App::getLocale(),
          'htmldir' => htmldir(),
      ]); !!}
    </script>
```

With:
```blade
    <script type="application/json" id="boot-data">{!! \Safe\json_encode([
        'locale' => \App::getLocale(),
        'htmldir' => htmldir(),
    ]) !!}</script>
```

---

### Task 4: Update app.js

**Files:**
- Modify: `resources/js/app.js`

**Step 1: Add boot import at the top (after the `import './bootstrap'` line)**

```js
import { locale, htmldir, timezone, profileDefaultView } from './boot';
```

**Step 2: Replace `window.Laravel` reads**

Line 102: `common.loadLanguage(window.Laravel.locale, true)` → `common.loadLanguage(locale, true)`

Line 106: `htmldir: window.Laravel.htmldir,` → `htmldir: htmldir,`

Line 107: `timezone: window.Laravel.timezone,` → `timezone: timezone,`

Line 113: `global_profile_default_view: window.Laravel.profileDefaultView,` → `global_profile_default_view: profileDefaultView,`

---

### Task 5: Update stripe.js

**Files:**
- Modify: `resources/js/stripe.js`

**Step 1: Add boot import at the top (after the `import './bootstrap'` line)**

```js
import { locale, htmldir } from './boot';
```

**Step 2: Replace `window.Laravel` reads**

Line 23: `common.loadLanguage(window.Laravel.locale, true)` → `common.loadLanguage(locale, true)`

Line 27: `htmldir: window.Laravel.htmldir,` → `htmldir: htmldir,`

---

### Task 6: Update testing.js

**Files:**
- Modify: `resources/js/testing.js`

**Step 1: Add boot import at the top of the file**

```js
import { env } from './boot';
```

**Step 2: Replace `window.Laravel` read**

Line 8: `if (window.Laravel.env != 'production') {` → `if (env != 'production') {`

---

### Task 7: Verify and commit

**Step 1: Confirm no remaining window.Laravel references in JS/Vue**

```bash
grep -r "window\.Laravel" resources/js/ resources/views/
```

Expected: no output.

**Step 2: Build**

```bash
yarn run prod
```

Expected: exits 0, no errors.

**Step 3: Run JS tests**

```bash
yarn run test:js
```

Expected: all pass (composable specs are unaffected but confirm no breakage).

**Step 4: Commit**

Write commit message to `tmp/commit-msg.txt`:

```
refactor(js): replace window.Laravel global with a boot-data module

Blade layouts now emit a <script type="application/json" id="boot-data">
tag instead of assigning window.Laravel. A new boot.js module reads the
tag once at module-evaluation time and re-exports locale, htmldir,
timezone, profileDefaultView, and env as named exports.

app.js, stripe.js, and testing.js import from ./boot instead of reading
the window global. No user-facing behaviour change.

Closes #799. Unblocks #797.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
Claude-Session: ac07e788-d0fe-430d-a410-183dcd8d0d71
```

Then:
```bash
git add resources/js/boot.js resources/js/app.js resources/js/stripe.js resources/js/testing.js resources/views/layouts/skeleton.blade.php resources/views/marketing/auth.blade.php
git commit -F tmp/commit-msg.txt
rm tmp/commit-msg.txt
```
