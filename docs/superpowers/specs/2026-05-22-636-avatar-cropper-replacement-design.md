# Replace vuejs-clipper with vue-cropperjs to retire the rxjs peer-dep mismatch

- Issue: [#636](https://github.com/brycehans/monica/issues/636)
- Date: 2026-05-22
- Status: design accepted

## Problem

PR-D (#635) pinned `rxjs@^7.8.1` explicitly because dropping the mocha cohort exposed an accidental transitive coupling: `vue-rx@6.2.0` (peer-dep `rxjs@^6.0.0`) and `vuejs-clipper@4.1.0` (peer-dep `rxjs@^6.5.2`) were silently relying on the v7 mocha pulled in via webpack root-resolution. The pin works in practice — the v7 surface area used by those packages (`Observable`, `Subject`, `from()`, `pipe`) is compatible — but it's on the wrong major versus the declared peer-dep ranges.

The mismatch has been latent since at least PR-B. PR-D made it explicit but didn't fix it.

## Goal

Eliminate the `rxjs/vue-rx/vuejs-clipper` peer-dep mismatch by replacing the only consumer (`SetAvatar.vue`'s avatar cropper) with a maintained `cropperjs`-based equivalent, behind a regression-test safety net landed *first*.

## Decisions

1. **Fix path: replace, not fork-and-patch.** Forking `vuejs-clipper` to widen its peer-dep keeps an unmaintained dep + vue-rx + rxjs in the graph. Replacing eliminates the entire rxjs subgraph with a single dep swap and a small template edit.
2. **Replacement: `vue-cropperjs` + `cropperjs`.** Cropperjs has been the canonical browser cropper since 2015 with a boring-stable API. The Vue 2 wrapper is a thin ~150-line file. Prop names map 1:1 to what `SetAvatar.vue` currently uses.
3. **Test coverage shape: Cypress E2E + Cypress component testing.** No Jest stack exists in the repo; adding one would be a second test pillar for a single component. Cypress 15 is already a maintained test pillar in the fork (#640, #642) and ships component testing via `@cypress/vue2`.
4. **Sequencing: two PRs.** PR1 lands the regression safety net green against the current vuejs-clipper. PR2 does the dep swap and must keep the same tests green. This matches the verification-before-completion pattern used on #642.
5. **Test boundary: stub the cropper in component tests; accept default crop in E2E.** Drag/resize interactions are inherently flaky across cropper libraries; the *wiring* around the cropper (modal state, DataTransfer round-trip, watch on `avatar` prop) is what's actually at risk in a library swap.

## Out of scope

- Pixel-level visual regression of the cropped image
- Touch-gesture automation
- Bundle-size optimization (reported in PR body, not gated)
- Vue 3 migration (hard constraint)

## Current surface area

`vuejs-clipper` is used in exactly one place: `resources/js/components/people/SetAvatar.vue`.

```html
<clipper-basic ref="clipper" :src="uploadedImgUrl" :ratio="1" :init-width="100" :init-height="100" />
```

```js
import { clipperBasic } from 'vuejs-clipper';
// ...
const canvas = this.$refs.clipper.clip();
```

`vue-rx` is registered globally in `resources/js/app.js:33` only because `vuejs-clipper` requires it. No other consumers exist.

`rxjs` has no other consumers in `resources/js`.

## PR1 — `test(js): regression coverage for SetAvatar avatar cropper`

### Additions

```
tests/cypress/
  component/
    SetAvatar.cy.js              ← new (8 specs)
  e2e/contacts/
    avatar.cy.js                 ← new (3 specs)
  fixtures/
    avatar-test.jpg              ← new (~5 KB, 200×200)
  support/
    component.js                 ← new — mount helper
    component-index.html         ← new — component runner entry
cypress.config.js                ← + component: block
package.json                     ← + @cypress/vue2
```

### Component infra strategy

The `component:` block points at Laravel Mix's webpack config (via `@cypress/webpack-dev-server` with `webpackConfig: require('./node_modules/laravel-mix/setup/webpack.config.js')`). Keeps the component-test build aligned with the production bundle. If that's gnarly, fall back to a minimal Vue 2 + babel webpack config at `tests/cypress/support/component.webpack.js`.

### Cropper stub strategy

`tests/cypress/component/SetAvatar.cy.js` registers a stub component named `clipper-basic` before mounting `SetAvatar`. The stub exposes a `clip()` method returning a real `HTMLCanvasElement` populated via `document.createElement('canvas').getContext('2d').fillRect(...)`. This exercises real browser APIs (`canvas.toBlob`, `DataTransfer`, `URL.createObjectURL`) while bypassing the cropper library entirely.

In PR2 the stub name changes to `vue-cropper` and the method to `getCroppedCanvas`. The 8 assertions don't move.

### Component specs (8)

1. `avatar` prop change updates `selectedAvatar` (watcher)
2. Initial `selectedAvatar` mirrors `avatar` on mount
3. `uploadImg` opens the crop modal when a file is chosen
4. `uploadImg` revokes prior object URL on overwrite
5. `setCroppedImg`: cropper canvas → `toBlob` → `File` → `input.files` round-trip
6. `setCroppedImg` updates `croppedImgUrl` preview
7. `cancelCrop` clears `croppedImgUrl` + `input.files` and closes modal
8. `hasReachedAccountStorageLimit` disables the upload radio

### E2E specs (3)

`tests/cypress/e2e/contacts/avatar.cy.js`:

1. **Happy path** — login → seed contact → set-avatar page → `cy.get('input[type=file]').selectFile('cypress/fixtures/avatar-test.jpg')` → wait for `sweet-modal` → click `app.done` button (default crop = full image at 1:1) → submit parent form → reload → assert avatar `<img src>` matches the new photo URL pattern.
2. **Cancel from crop modal** returns to clean upload state (no `croppedImgUrl`, file input empty).
3. **Storage-limit-reached** — disables the upload radio (verifies server → client wiring).

### Acceptance

All 8 component specs + 3 E2E specs green on `4.x` against the current vuejs-clipper. PR1 body includes a verification matrix proving each spec exercises real code (no shortcut paths).

## PR2 — `deps: replace vuejs-clipper with vue-cropperjs, drop vue-rx + rxjs`

### `package.json` diff

```diff
-    "rxjs": "^7.8.1",
-    "vue-rx": "^6.2",
-    "vuejs-clipper": "^4.1",
+    "vue-cropperjs": "^4.2.0",
+    "cropperjs": "^1.6.2",
```

`cropperjs` is `vue-cropperjs`'s only runtime dep; declared explicitly so version drift is visible.

### `resources/js/app.js` diff

```diff
-import VueRx from 'vue-rx';
-Vue.use(VueRx);  // Dependency of vuejs-clipper
```

Removed entirely.

### `resources/js/components/people/SetAvatar.vue` diff

Template:

```diff
-<clipper-basic ref="clipper" :src="uploadedImgUrl" :ratio="1" :init-width="100" :init-height="100" />
+<vue-cropper ref="clipper" :src="uploadedImgUrl" :aspect-ratio="1" :auto-crop-area="1" :view-mode="1" />
```

Script:

```diff
-import { clipperBasic } from 'vuejs-clipper';
+import VueCropper from 'vue-cropperjs';
+import 'cropperjs/dist/cropper.css';
 ...
-  components: { clipperBasic, SweetModal },
+  components: { VueCropper, SweetModal },
 ...
-  const canvas = this.$refs.clipper.clip();
+  const canvas = this.$refs.clipper.getCroppedCanvas();
```

`ref="clipper"` stays the same, so `setCroppedImg` and `cancelCrop` call sites don't churn.

### Option-parity table

| vuejs-clipper | vue-cropperjs | Why |
|---|---|---|
| `:ratio="1"` | `:aspect-ratio="1"` | square lock |
| `:init-width="100" :init-height="100"` (% of image) | `:auto-crop-area="1"` (fraction of image) | initial selection = full image |
| (no prop) | `:view-mode="1"` | restricts crop box to canvas — sane default |
| `clip()` | `getCroppedCanvas()` | returns `<canvas>` for `.toBlob` |

### Test changes

The only test change is the stub-target rename in `SetAvatar.cy.js`: `clipper-basic` → `vue-cropper`, `clip` → `getCroppedCanvas`. Assertions unchanged.

### Verification matrix (in PR2 body)

| Check | Pre-PR2 | Post-PR2 |
|---|---|---|
| Lockfile lists rxjs/vue-rx/vuejs-clipper | yes | no |
| `yarn install` peer-dep warnings | rxjs mismatch noisy | clean |
| PR1's 8 component specs | green | green |
| PR1's 3 E2E specs | green | green |
| `yarn run prod` bundle builds | yes | yes (verify) |
| Manual: upload→crop→save on dev rig | works | works |

## Risks & mitigations

**Bundle/build risk.** Laravel Mix 6 + webpack 5 must compile `vue-cropperjs` + `cropperjs`. Both ship CJS+ESM and should work, but verified via `yarn run prod` in PR2. `cropperjs/dist/cropper.css` imported inside `SetAvatar.vue` `<script>` block — vue-loader handles CSS imports via webpack's CSS pipeline; fall back to `resources/sass/app.scss` if that fails.

**Visual chrome differs.** Cropperjs's handles, gridlines, and dark overlay are visually distinct from vuejs-clipper's. The modal sizing should adapt because cropperjs fills its container the same way. Eyeball check on dev rig is enough; this is not a regression under "behavioral parity" since the issue body explicitly authorizes replacement.

**`auto-crop-area: 1` vs `init-width=100`.** Cropperjs may inset 1–2px from edges due to internal padding. Functionally identical for avatar use.

**Touch-drag parity.** Cropperjs has a more mature touch implementation, so this should be a net improvement. Not asserted in tests.

**Cypress component infra integration with Laravel Mix.** `@cypress/vue2`'s webpack-dev-server integration assumes a standard webpack config. Decide during PR1: use Mix-derived config or co-locate a minimal one.

**Rollback.** PR2 is squash-merged. Revert = `git revert <sha>` + `yarn install`. PR1's safety net stays merged regardless.

## Implementation order

1. PR1 branch off `4.x`
2. Add `@cypress/vue2`, scaffold `cypress.config.js` `component:` block, mount helper, component runner entry
3. Write `SetAvatar.cy.js` with cropper stub — 8 specs green locally
4. Write `avatar.cy.js` E2E with fixture — 3 specs green locally
5. CI green, PR1 merged
6. PR2 branch off `4.x`
7. `package.json` swap + lockfile regen
8. `SetAvatar.vue` edit + `app.js` edit
9. Stub target update in `SetAvatar.cy.js`
10. All 11 specs green locally, `yarn run prod` clean, manual dev-rig check
11. CI green, PR2 merged, #636 closed
