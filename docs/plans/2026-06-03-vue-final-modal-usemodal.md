# vue-final-modal `useModal()` adoption — Phase 1 (foundation + Genders pilot)

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Establish the `useModal()` pattern in this codebase by porting one consumer file (`settings/Genders.vue`, 4 modals — the widest variety of modal shapes in the repo) end-to-end, and stand up the shared infrastructure (`<ModalsContainer />` mount, modal-SFC conventions, smoke-test compatibility) that every subsequent phase will reuse.

**Architecture:**
- Each modal becomes its own SFC, co-located in a subfolder beside its parent (e.g. `resources/js/components/settings/genders/CreateModal.vue`). The modal SFC renders `<VueFinalModal>` through the existing `MonicaModal.vue` shell — kept as-is, no rename — which preserves the `.monica-modal__*` CSS classes the playwright smoke suite asserts against. Per-modal SFCs use `<monica-modal>` internally as their visual leaf.
- Parents call `useModal({ component, attrs: {} })` once in `setup()` (empty attrs — they're filled in per click). Each click handler calls `patchOptions({ attrs: { ...everything } })` then `open()`. **Verified from `node_modules/vue-final-modal/dist/index.es.mjs`: `patchOptions` merges attrs (does not replace), and auto-cleanup is wired via `tryOnUnmounted` so the modal options entry is removed when the parent unmounts.**
- Callbacks (`onSaved`, `onCancelled`) are passed as attrs in the patch — they close the captured `xxxModal` and trigger refresh.
- `<ModalsContainer />` mounts once near the top of the Vue app root (`#app` in `skeleton.blade.php`) via a globally-registered component.

**Tech Stack:** Vue 3.5, vue-final-modal ^4.5, Vite 8, Playwright (smoke).

**Out of scope for this phase (deferred to phase 2+):**
- Remaining 16 consumer files / 28 modals — phase shape decided after this lands.
- `Confirm.vue` migration. It is used from Blade templates (`resources/views/settings/tags.blade.php` and ~7 others) as `<confirm>`, so it must stay registered as a component. Its internal modal will be ported in a later phase using `useModal()` *behind* the same template API — the Blade callers don't change.
- Final removal of `MonicaModal`. Phase 1 keeps it as-is. Whether the last phase removes it (by inlining `<vue-final-modal>` into each SFC) or keeps it (as a shared visual shell) is a phase-N decision.

---

### Task 0: Stand up JS component-test infrastructure (vitest + @vue/test-utils + happy-dom)

The fork has no JS component-test infrastructure today — `yarn run test` is PHPUnit + PHPStan, and the only frontend test surface is playwright e2e. This task introduces vitest as the convention for testing Vue SFCs in isolation. Once in, every future Vue change benefits, and the remaining 28 modals across phases 2+ inherit the convention cheaply (~30 min of test per SFC vs. heavier playwright spec maintenance).

**Files:**
- Modify: `package.json` (devDependencies + scripts)
- Create: `vitest.config.js`
- Create: `tests/js/setup.js` (Laravel + axios globals, i18n stub)
- Create: `tests/js/helpers.js` (mount helper, common stubs)

**Step 1: Add dev deps**

Run: `yarn add --dev vitest @vue/test-utils@^2 happy-dom`
Expected: completes; `package.json` + `yarn.lock` updated. `@vue/test-utils@^2` is the Vue 3 line — the project is on Vue 3.5 (verified via `grep "\"vue\":" package.json`).

**Step 2: Add `vitest.config.js`**

```js
import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import path from 'node:path';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './resources/js'),
    },
  },
  test: {
    environment: 'happy-dom',
    setupFiles: ['./tests/js/setup.js'],
    globals: true,
    include: ['resources/js/**/*.{spec,test}.{js,ts}'],
  },
});
```

happy-dom over jsdom: faster, and the modal SFCs don't touch jsdom-specific APIs.

**Step 3: Add `tests/js/setup.js`**

```js
import { vi, beforeEach } from 'vitest';

// Components read window.Laravel at mount time (timezone, locale, htmldir).
window.Laravel = { locale: 'en', htmldir: 'ltr', timezone: 'UTC' };

// lodash is a global via bootstrap.js — provide the bits the modals use.
globalThis._ = {
  toArray: (x) => Array.isArray(x) ? x : Object.values(x ?? {}),
  findIndex: (arr, pred) => {
    if (typeof pred === 'object') {
      return (arr ?? []).findIndex((it) => Object.entries(pred).every(([k, v]) => it[k] === v));
    }
    return (arr ?? []).findIndex(pred);
  },
};

// axios is also global via bootstrap.js. Fresh mock per test.
beforeEach(() => {
  globalThis.axios = {
    get: vi.fn().mockResolvedValue({ data: [] }),
    post: vi.fn().mockResolvedValue({ data: {} }),
    put: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} }),
  };
});
```

**Step 4: Add `tests/js/helpers.js`**

```js
import { mount } from '@vue/test-utils';

// Default mount config for modal SFCs:
//   - monica-modal is stubbed to a passthrough so tests assert our SFC's
//     own logic (form, axios, emits) rather than vue-final-modal internals.
//     That's playwright's job.
//   - form atom stubs avoid mounting their full templates.
//   - useI18n's t() is stubbed to identity so assertions against keys work.
export function mountModal(component, options = {}) {
  return mount(component, {
    global: {
      stubs: {
        'monica-modal': {
          template: '<div class="stub-monica-modal" :data-shown="modelValue"><slot /><slot name="button" /></div>',
          props: ['modelValue', 'title', 'blocking'],
          emits: ['update:modelValue'],
        },
        'form-input': true,
        'form-select': true,
        'form-toggle': true,
      },
      mocks: {
        $t: (k) => k,
      },
      ...options.global,
    },
    ...options,
  });
}

// vue-i18n's useI18n() is called inside setup(). Stub it module-wide
// in tests that don't need real translations.
import { vi } from 'vitest';
vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (k) => k, tc: (k) => k }),
}));
```

**Step 5: Add npm scripts to `package.json`**

```json
"test:js": "vitest run",
"test:js:watch": "vitest"
```

**Step 6: Verify setup works end-to-end**

Create `tests/js/smoke.spec.js`:

```js
import { describe, it, expect } from 'vitest';
import { mountModal } from './helpers.js';
import { defineComponent } from 'vue';

const TinyComponent = defineComponent({
  template: '<monica-modal :model-value="true" title="hi"><p>body</p></monica-modal>',
});

describe('vitest + helpers smoke', () => {
  it('mounts a component with the monica-modal stub', () => {
    const w = mountModal(TinyComponent);
    expect(w.find('.stub-monica-modal').exists()).toBe(true);
    expect(w.text()).toContain('body');
  });

  it('axios global is mocked fresh per test', () => {
    expect(typeof axios.post).toBe('function');
  });
});
```

Run: `yarn run test:js`
Expected: PASS, 2 tests.

Delete `tests/js/smoke.spec.js` once green.

**Step 7: Commit**

Write commit body to `tmp/commit-msg.txt`. Run: `git add package.json yarn.lock vitest.config.js tests/js/` then `git commit -F tmp/commit-msg.txt` then `rm tmp/commit-msg.txt`.

Commit message:

```
build(test): introduce vitest + @vue/test-utils (phase 1 of #724)

Adds the first JS component-test surface to the fork. Phase 1 modal SFCs
get per-SFC tests; future Vue changes inherit the convention. Stubs at
tests/js/setup.js cover the Laravel + axios + lodash globals these
components read at mount time.

Claude-Session: <session_id>
```

---

### Task 1: Add `<ModalsContainer />` infrastructure

**Files:**
- Modify: `resources/js/app.js`
- Modify: `resources/views/layouts/skeleton.blade.php:44`
- Modify: `resources/views/marketing/auth.blade.php:23`

Note: there are three blade layouts in the project but only two mount Vue. `marketing/skeleton.blade.php` is pure server-rendered HTML (no `#app` div, doesn't load `app.js`) — the OAuth authorize page using it has no Vue components, so `<modals-container />` there would be dead HTML.

**Step 1: Register `ModalsContainer` globally in `app.js`**

After the existing `createVfm()` import line, add `ModalsContainer` to the same import:

```js
import { createVfm, ModalsContainer } from 'vue-final-modal';
```

Then in the component registration block (just after `app.component('MonicaModal', MonicaModal);` near line 138):

```js
app.component('ModalsContainer', ModalsContainer);
```

**Step 2: Mount `<modals-container />` inside `#app` on both Vue-bearing layouts**

In `resources/views/layouts/skeleton.blade.php`, edit the `<div id="app">` block to render `<modals-container />` as the first child so portaled modals live inside the Vue app tree:

```blade
<div id="app" class="flex-grow-1">
  <modals-container />
  @if (Route::currentRouteName() != 'settings.subscriptions.confirm')
    @include('partials.header')
    @include('partials.subscription')
  @endif
  @yield('content')
</div>
```

In `resources/views/marketing/auth.blade.php`, same edit:

```blade
<div id="app">
  <modals-container />
  @yield('content')
</div>
```

(No phase-1 consumer renders on this layout, but `<confirm>` is used from many blade templates whose `@extends` lineage hasn't been exhaustively audited — defense-in-depth costs one line.)

**Step 3: Rebuild assets**

Run: `yarn run dev`
Expected: completes without error; manifest regenerated.

**Step 4: Smoke-verify no regressions**

Run: `yarn run e2e -- --grep "gender personalization modal"`
Expected: PASS. (The existing modal still works via the `MonicaModal` component path; this task only *adds* a container.)

**Step 5: Commit**

Write commit message to `tmp/commit-msg.txt`:

```
refactor(modals): mount <ModalsContainer /> at vue app root (phase 1 of #724)

Register ModalsContainer globally and place it inside #app so useModal()
spawns will portal into the vue tree. No call sites change yet.

Claude-Session: <session_id>
```

Run: `git add resources/js/app.js resources/views/layouts/skeleton.blade.php resources/views/marketing/auth.blade.php`
Run: `git commit -F tmp/commit-msg.txt`
Run: `rm tmp/commit-msg.txt`

---

### Task 2: Extract `genders/CreateModal.vue` (TDD)

**Files:**
- Create: `resources/js/components/settings/genders/CreateModal.spec.js`
- Create: `resources/js/components/settings/genders/CreateModal.vue`

The Create modal is the simplest of the four — no per-row data, just open-form-submit. We build it first to lock in the SFC shape AND establish the per-SFC test pattern.

**Step 1: Write the failing test**

`resources/js/components/settings/genders/CreateModal.spec.js`:

```js
import { describe, it, expect, vi } from 'vitest';
import { mountModal } from '../../../../tests/js/helpers.js';
import CreateModal from './CreateModal.vue';

const genderTypes = [{ id: 'M', name: 'Male', type: 'M' }, { id: 'F', name: 'Female', type: 'F' }];
const defaultGenderType = { id: 'M', name: 'Male', type: 'M' };

describe('genders/CreateModal', () => {
  it('mounts open by default', () => {
    const w = mountModal(CreateModal, { props: { genderTypes, defaultGenderType } });
    expect(w.vm.show).toBe(true);
  });

  it('initializes form.type from defaultGenderType', () => {
    const w = mountModal(CreateModal, { props: { genderTypes, defaultGenderType } });
    expect(w.vm.form.type).toBe('M');
  });

  it('POSTs to settings/personalization/genders and emits saved on success', async () => {
    const w = mountModal(CreateModal, { props: { genderTypes, defaultGenderType } });
    w.vm.form.name = 'Test gender';
    w.vm.form.type = 'F';
    w.vm.form.isDefault = true;
    await w.vm.store();
    expect(axios.post).toHaveBeenCalledWith(
      'settings/personalization/genders',
      expect.objectContaining({ name: 'Test gender', type: 'F', isDefault: true }),
    );
    expect(w.emitted('saved')).toBeTruthy();
    expect(w.vm.show).toBe(false);
  });

  it('emits cancelled when model-value flips false', async () => {
    const w = mountModal(CreateModal, { props: { genderTypes, defaultGenderType } });
    w.vm.onUpdateModelValue(false);
    expect(w.emitted('cancelled')).toBeTruthy();
  });

  it('cancel button sets show=false (does not emit saved)', async () => {
    const w = mountModal(CreateModal, { props: { genderTypes, defaultGenderType } });
    w.vm.cancel();
    expect(w.vm.show).toBe(false);
    expect(w.emitted('saved')).toBeFalsy();
  });
});
```

**Step 2: Run, see it fail**

Run: `yarn run test:js -- CreateModal`
Expected: FAIL — "Cannot find module './CreateModal.vue'".

**Step 3: Create the SFC

```vue
<template>
  <monica-modal
    :model-value="show"
    :title="t('settings.personalization_genders_modal_add')"
    @update:model-value="onUpdateModelValue"
  >
    <form @submit.prevent="store">
      <div class="form-group">
        <div class="form-group">
          <form-input
            :id="''"
            v-model="form.name"
            :input-type="'text'"
            :required="true"
            :title="t('settings.personalization_genders_modal_name')"
          />
          <small class="form-text text-muted">
            {{ t('settings.personalization_genders_modal_name_help') }}
          </small>
        </div>
        <div class="form-group">
          <form-select
            :id="''"
            v-model="form.type"
            :options="genderTypes"
            :required="true"
            :title="t('settings.personalization_genders_modal_sex')"
          />
          <small class="form-text text-muted">
            {{ t('settings.personalization_genders_modal_sex_help') }}
          </small>
        </div>
        <div class="form-group">
          <form-toggle
            :id="''"
            v-model="form.isDefault"
            :labels="toggleOptions"
            :required="true"
            :title="t('settings.personalization_genders_modal_default')"
          />
        </div>
      </div>
    </form>
    <template #button>
      <a class="btn" href="" @click.prevent="cancel">
        {{ t('app.cancel') }}
      </a>
      <a class="btn btn-primary" href="" @click.prevent="store">
        {{ t('app.save') }}
      </a>
    </template>
  </monica-modal>
</template>

<script>
import { useI18n } from 'vue-i18n';

export default {
  props: {
    genderTypes: { type: Array, default: () => [] },
    defaultGenderType: { type: Object, default: null },
  },

  emits: ['saved', 'cancelled'],

  setup() {
    const { t } = useI18n();
    return { t };
  },

  data() {
    return {
      show: true,
      form: {
        name: '',
        type: this.defaultGenderType?.type ?? '',
        isDefault: false,
        errors: [],
      },
    };
  },

  computed: {
    toggleOptions() {
      return {
        checked: this.t('app.yes'),
        unchecked: this.t('app.no'),
      };
    },
  },

  methods: {
    onUpdateModelValue(v) {
      this.show = v;
      if (!v) this.$emit('cancelled');
    },
    cancel() {
      this.show = false;
    },
    store() {
      axios.post('settings/personalization/genders', this.form)
        .then(() => {
          this.$emit('saved');
          this.show = false;
        });
    },
  },
};
</script>
```

Note: `show` defaults to `true` because the parent will set `defaultModelValue: true` via `useModal`, *or* call `open()` immediately. Either way the SFC mounts already-open. The `onUpdateModelValue` handler lets click-outside / escape close it.

**Step 4: Run the tests, see them pass**

Run: `yarn run test:js -- CreateModal`
Expected: PASS, 5 tests.

If they fail:
- "Cannot find module 'vue-i18n'": the helpers.js `vi.mock('vue-i18n', ...)` may not have fired before import. Move the `vi.mock` to the top of `CreateModal.spec.js` itself.
- `t is not a function`: the SFC uses `setup()` which calls real `useI18n()`. The mock in helpers.js handles this, but only if it's hoisted — vitest auto-hoists `vi.mock` calls; if you renamed it, restore the literal call form.
- `axios.post` not called: the SFC may have an early return; inspect `w.vm.form` to confirm state.

**Step 5: Commit**

Write `tmp/commit-msg.txt`. Run: `git add resources/js/components/settings/genders/` then `git commit -F tmp/commit-msg.txt` then `rm tmp/commit-msg.txt`.

Commit message:

```
refactor(modals): extract genders/CreateModal SFC (phase 1 of #724)

First per-modal SFC. Owns form state, axios call, emits saved/cancelled.
Component test covers initial state, store(), and cancel paths.
Not wired into Genders.vue yet — that happens in the next commit.

Claude-Session: <session_id>
```

---

### Task 3: Wire `CreateModal` into `Genders.vue` via `useModal()`

**Files:**
- Modify: `resources/js/components/settings/Genders.vue`

**Step 1: Remove the Create modal's inline template block (lines 72-119 of `Genders.vue`)**

Delete the `<!-- Create Gender type -->` comment and the entire `<monica-modal v-model="createModalOpen" ...>...</monica-modal>` block.

**Step 2: Replace the script section's create-related state**

In `data()`, remove `createForm` (lines 272-277), `createModalOpen` (line 296). The form state now lives in the modal SFC.

In `methods`, remove `closeModal` (lines 352-354), `showCreateModal` (lines 368-370), `store` (lines 377-385), and `setDefaultGenderType` (lines 333-335).

Remove the `setDefaultGenderType` call inside `getGenders` (line 341) — the modal computes its own default from the `defaultGenderType` prop.

**Step 3: Add `useModal` import and modal wiring**

At the top of `<script>`, add:

```js
import { useModal } from 'vue-final-modal';
import CreateModal from './genders/CreateModal.vue';
```

In `setup()`, replace the body with:

```js
setup() {
  const { t } = useI18n();
  const createModal = useModal({ component: CreateModal, attrs: {} });
  return { t, createModal };
},
```

(Empty `attrs: {}` is intentional — `patchOptions` merges, so we set everything at click time in `openCreate()` and there's nothing useful to put here.)

**Step 4: Replace `showCreateModal` template binding**

At line 7 of the template, the existing anchor binds `@click.prevent="showCreateModal"`. Change it to:

```html
<a class="btn nt2" :class="[ dirltr ? 'fr' : 'fl' ]" href="" @click.prevent="openCreate">
```

Add the new method:

```js
openCreate() {
  this.createModal.patchOptions({
    attrs: {
      genderTypes: this.genderTypes,
      defaultGenderType: this.defaultGenderType,
      onSaved: () => {
        this.createModal.close();
        this.getGenders();
      },
      onCancelled: () => this.createModal.close(),
    },
  });
  this.createModal.open();
},
```

**Step 5: Verify**

Run: `yarn run dev`
Run: `yarn run e2e -- --grep "gender personalization modal"`

Expected: PASS. The smoke test (specs:347) opens the create modal, fills the name + dropdown, clicks "Add new gender type", waits for the modal to close and the row to appear in the list. It selects via `.monica-modal__panel` which `MonicaModal` still emits, and via accessible-name lookups which we preserved.

If the smoke fails:
- Open the playwright HTML report (`yarn run e2e --reporter=html`) and inspect the trace.
- Common gotcha: `useModal` not finding `<ModalsContainer />` — verify task 1 actually rendered. View source on `/settings/personalization` and grep for `modals-container`.
- Form-state gotcha: if `form.type` is empty after open, the `defaultGenderType` prop wasn't populated — confirm `getGenders()` ran before the user could click Create.

**Step 6: Commit**

```
refactor(modals): port genders create modal to useModal() (phase 1 of #724)

First call site to drop a showXxxModal data prop in favour of useModal()
with a self-owned modal SFC.

Claude-Session: <session_id>
```

---

### Task 4: Extract `genders/EditModal.vue` (per-row data via `patchOptions`) — TDD

**Files:**
- Create: `resources/js/components/settings/genders/EditModal.spec.js`
- Create: `resources/js/components/settings/genders/EditModal.vue`
- Modify: `resources/js/components/settings/Genders.vue`

This task demonstrates the per-row pattern: parent calls `patchOptions({ attrs: { gender } })` then `open()` to feed the row being edited.

**Step 1: Write the failing test**

`EditModal.spec.js` — follow `CreateModal.spec.js` as template. Cases to cover:
- Mounts with `show=true`.
- `form` initializes from the `gender` prop (id, name, type, isDefault) at mount — verify by passing two different `gender` props in two `mountModal` calls.
- `update()` PUTs to `settings/personalization/genders/{id}` with the form payload, emits `saved`, sets `show=false`.
- `cancel()` sets `show=false` without emitting `saved`.
- `onUpdateModelValue(false)` emits `cancelled`.

Run: `yarn run test:js -- EditModal`. Expected: FAIL (module not found).

**Step 2: Create the SFC**

Mirror `CreateModal.vue` with these differences:
- Props: `gender` (Object, required), `genderTypes` (Array). No `defaultGenderType`.
- `data()` initializes `form` from `this.gender` (id, name, type, isDefault).
- `update()` PUTs to `settings/personalization/genders/{id}` and emits `saved`.
- Title uses `t('settings.personalization_genders_modal_edit')`.

Crucially, the SFC is re-mounted on each open (since `keepAlive` defaults to `false`), so `data()` reading from props at mount time is sufficient — no `watch` needed.

Run: `yarn run test:js -- EditModal`. Expected: PASS, 5 tests.

**Step 3: Wire into `Genders.vue`**

Remove the inline `<monica-modal v-model="showUpdateModal" ...>` block (lines 121-168).

Remove `updateForm` from `data()` (lines 279-285), `updatedGender` (lines 263-268), `showUpdateModal` (line 297). Remove `closeUpdateModal`, `update`, and the body of `showEdit` (we replace with `openEdit`).

In `setup()`, add a second `useModal` call for the edit modal:

```js
const editModal = useModal({ component: EditModal, attrs: {} });
return { t, createModal, editModal };
```

Add `openEdit(gender)` method:

```js
openEdit(gender) {
  this.editModal.patchOptions({
    attrs: {
      gender,
      genderTypes: this.genderTypes,
      onSaved: () => {
        this.editModal.close();
        this.getGenders();
      },
      onCancelled: () => this.editModal.close(),
    },
  });
  this.editModal.open();
},
```

Update the template trigger (line 62):

```html
<em class="fa fa-pencil-square-o pointer pr2" @click="openEdit(gender)"></em>
```

**Step 4: Verify in browser**

Run: `yarn run dev`

Component tests cover the SFC's behavior; this step proves the integration (vfm container, useModal patchOptions, refresh-on-saved).
1. `php artisan setup:test` then log in as admin@admin.com / admin0.
2. Visit `/settings/personalization`.
3. Click the pencil on any gender row. Modal opens with the row's data populated.
4. Change the name. Click Update. Modal closes, list shows new name.
5. Click pencil on a different row. Confirm it shows that row's data (not stale data from step 4) — this is the patchOptions-merge fact in action.

**Step 5: Commit**

```
refactor(modals): port genders edit modal to useModal() (phase 1 of #724)

Demonstrates the per-row patchOptions pattern for modals that need
row data fed in at open time. Component test covers form-from-prop
initialization and the PUT path.

Claude-Session: <session_id>
```

---

### Task 5: Extract `genders/DeleteModal.vue` (form-state-with-error-display) — TDD

**Files:**
- Create: `resources/js/components/settings/genders/DeleteModal.spec.js`
- Create: `resources/js/components/settings/genders/DeleteModal.vue`
- Modify: `resources/js/components/settings/Genders.vue`

The Delete modal carries the most complex local state: it conditionally shows a replacement-id selector when the gender being deleted has contacts or is default, *and* it displays a server-side error message inline. Both pieces of state must move into the SFC — the test coverage here is the most valuable of the four because the branches multiply.

**Step 1: Write the failing test**

`DeleteModal.spec.js`. Cases to cover (this is the densest set in phase 1):
- Mounts with `show=true`, `errorMessage=''`.
- `trash()` (no-contacts, non-default path): DELETEs to `settings/personalization/genders/{id}`, emits `saved`, sets `show=false`.
- `trashAndReplace()` (has-contacts OR default path): DELETEs to `settings/personalization/genders/{id}/replaceby/{newId}`, emits `saved` on success.
- `trashAndReplace()` axios error with structured response: `axios.delete.mockRejectedValueOnce({ response: { data: { message: 'cannot delete' } } })` → `errorMessage` becomes `'cannot delete'`, no emit.
- `trashAndReplace()` axios error with non-object response: `mockRejectedValueOnce({ response: { data: 'oops' } })` → `errorMessage` falls back to `app.error_try_again`.
- `cancel()` sets `show=false`, no emit.

Run: `yarn run test:js -- DeleteModal`. Expected: FAIL.

**Step 2: Create the SFC**

Props: `gender` (Object — must include `id`, `name`, `isDefault`, `numberOfContacts`), `genders` (Array — for the replacement dropdown).

Data: `form` (id, name, isDefault, numberOfContacts, newId), `errorMessage` (string).

Two action methods, gated in the template by `numberOfContacts === 0 && !isDefault`:
- `trash()` — DELETE `settings/personalization/genders/{id}`. On success: `$emit('saved')`, close.
- `trashAndReplace()` — DELETE `settings/personalization/genders/{id}/replaceby/{newId}`. On axios error, set `errorMessage` from `error.response.data.message` or `t('app.error_try_again')`.

Mirror lines 171-216 of the existing `Genders.vue` template for markup, swapping `deleteForm.*` for `form.*` and using the prop's data for initial values.

Run: `yarn run test:js -- DeleteModal`. Expected: PASS, 6 tests.

**Step 3: Wire into `Genders.vue`**

Remove the inline delete `<monica-modal>` block (lines 170-217).

Remove `deleteForm`, `errorMessage`, `showDeleteModal` from `data()`. Remove `closeDeleteModal`, `trash`, `trashAndReplace`, and the body of `showDelete`.

In `setup()`, add the third `useModal`:

```js
const deleteModal = useModal({ component: DeleteModal, attrs: {} });
```

Add `openDelete(gender)`:

```js
openDelete(gender) {
  this.deleteModal.patchOptions({
    attrs: {
      gender,
      genders: this.genders,
      onSaved: () => {
        this.deleteModal.close();
        this.getGenders();
      },
      onCancelled: () => this.deleteModal.close(),
    },
  });
  this.deleteModal.open();
},
```

Update template trigger (line 63):

```html
<em v-if="genders.length > 1" class="fa fa-trash-o pointer" @click="openDelete(gender)"></em>
```

**Step 4: Verify integration in browser**

Component tests cover the SFC's branching logic; this step proves the integration.
1. Create three genders via the UI.
2. Delete one with no contacts. Confirm DELETE-without-replacement path.
3. Create a contact, assign it gender X, then try to delete gender X. Confirm the replacement-id selector appears, pick another gender, click Delete. Confirm trash-and-replace flow + contact reassigned.

The error-display branch is covered by the component tests — no need to break a controller manually.

**Step 5: Commit** — `refactor(modals): port genders delete modal to useModal() (phase 1 of #724)`.

---

### Task 6: Extract `genders/SetDefaultModal.vue` — TDD

**Files:**
- Create: `resources/js/components/settings/genders/SetDefaultModal.spec.js`
- Create: `resources/js/components/settings/genders/SetDefaultModal.vue`
- Modify: `resources/js/components/settings/Genders.vue`

The "change default" modal is the simplest of the four: one select, one Save, one Cancel.

**Step 1: Write the failing test**

Cases:
- Mounts with `show=true`, `selectedId` initialized from `defaultId` prop.
- `save()` PUTs to `settings/personalization/genders/default/{selectedId}`, emits `saved`, sets `show=false`.
- `cancel()` sets `show=false`, no emit.

Run: `yarn run test:js -- SetDefaultModal`. Expected: FAIL.

**Step 2: Create the SFC**

Props: `genders` (Array), `defaultId` (Number — initial value).

Data: `selectedId` (initialized from `defaultId`).

`save()` → PUT `settings/personalization/genders/default/{selectedId}`. Emit `saved` on success, close.

Run: `yarn run test:js -- SetDefaultModal`. Expected: PASS, 3 tests.

**Step 3: Wire into `Genders.vue`**

Remove the inline block (lines 219-242).
Remove `defaultGenderId`, `defaultGenderModalOpen` from `data()`. Remove `closeDefaultGenderModal`, `showDefaultGenderModal`, `updateDefaultGender`.

Add the fourth `useModal` in `setup()`. Add `openSetDefault()`:

```js
openSetDefault() {
  this.setDefaultModal.patchOptions({
    attrs: {
      genders: this.genders,
      defaultId: this.defaultGenderType.id,
      onSaved: () => {
        this.setDefaultModal.close();
        this.getGenders();
      },
      onCancelled: () => this.setDefaultModal.close(),
    },
  });
  this.setDefaultModal.open();
},
```

Update template (line 69):

```html
<a class="pointer" href="" @click.prevent="openSetDefault">{{ t('settings.personalization_genders_make_default') }}</a>
```

**Step 4: Verify in browser**

Run: `yarn run dev`

With 2+ genders configured, click "Make default", select a non-default gender, Save. Confirm the list refreshes with the new default flag.

**Step 5: Commit** — `refactor(modals): port genders set-default modal to useModal() (phase 1 of #724)`.

---

### Task 7: Audit `Genders.vue` for leftover modal scaffolding

**Files:**
- Modify: `resources/js/components/settings/Genders.vue`

**Step 1: Grep + read for stragglers**

Run: `grep -n "showCreateModal\|showUpdateModal\|showDeleteModal\|defaultGenderModalOpen\|createModalOpen\|monica-modal\|createForm\|updateForm\|deleteForm" resources/js/components/settings/Genders.vue`
Expected: no matches.

Run: `grep -n "closeModal\|closeUpdateModal\|closeDeleteModal\|closeDefaultGenderModal" resources/js/components/settings/Genders.vue`
Expected: no matches.

If any are found, remove them.

**Step 2: Run linter**

Run: `yarn run lint resources/js/components/settings/Genders.vue resources/js/components/settings/genders/`
Expected: clean.

**Step 3: Full smoke pass**

Run: `yarn run e2e -- --grep "gender|settings/personalization"`
Expected: PASS. (Includes the gender create modal test from specs:347 plus the mount-coverage test at specs:732.)

**Step 4: Commit if anything changed; otherwise skip.**

---

### Task 8: Add a phase-1 smoke guard

**Files:**
- Modify: `tests/playwright/specs/dependency-upgrade-smoke.spec.ts`

The existing test at specs:347 covers Create. We should add a thin assertion that the modal portal lives under `<ModalsContainer />` (proving the new mount, not the back-compat MonicaModal alias, is doing the work).

**Step 1: Add the assertion**

Inside the existing `gender personalization modal: create persists into list` test, after the modal opens and before fill, assert:

```ts
// Confirm the modal is rendered via vue-final-modal's <ModalsContainer />,
// not the back-compat path. This guards the phase-1 #724 cutover —
// if useModal() falls back to inline rendering, this fails.
const containers = page.locator('div').filter({ has: page.locator('.vfm') });
await expect(containers.first()).toBeVisible();
```

(Note: vue-final-modal renders modals with a `.vfm` root class. Verify the actual class by inspecting a live render before relying on it — adjust if needed.)

**Step 2: Run**

Run: `yarn run e2e -- --grep "gender personalization modal"`
Expected: PASS.

**Step 3: Commit** — `test(playwright): guard ModalsContainer mount for useModal cutover (phase 1 of #724)`.

---

### Task 9: Document phase-1 decisions for downstream phases

**Files:**
- Modify: `docs/plans/2026-06-03-vue-final-modal-usemodal.md` (this file — append a "Decisions locked in phase 1" section)

**Step 1: Append at end of this plan file:**

```markdown
---

## Decisions locked in phase 1 (for phases 2+)

- **Per-row data**: `patchOptions({ attrs: { row } })` immediately before `open()`. The modal SFC reads from props in `data()`, which re-runs each mount (since `keepAlive: false` is the default).
- **Callbacks**: `onSaved` / `onCancelled` attrs. Parent decides whether to close + refresh on save.
- **SFC location**: co-located subfolder `<parent>/<aggregate>/<Name>Modal.vue` (e.g. `settings/genders/CreateModal.vue`). One subfolder per parent.
- **Visual shell**: `MonicaModal.vue` stays as-is. Every per-modal SFC uses `<monica-modal>` internally — preserves `.monica-modal__panel` etc. CSS selectors that playwright smoke depends on. Whether to inline `<vue-final-modal>` and drop the shared shell entirely is deferred to the last phase.
- **Form state**: lives in the modal SFC's `data()`. No more `xxxForm` blocks in parents.
- **Tests**: every per-modal SFC ships with a vitest `*.spec.js` co-located beside it. Coverage = initial state + each public method (axios call shape, emit, branches). Run via `yarn run test:js`. No playwright-only coverage for new modal behavior.
- **`Confirm.vue`**: stays a component (Blade callers exist). Its internal modal gets ported separately, behind the same template API.
```

**Step 2: Commit** — `docs(plans): record phase-1 decisions for #724 follow-up phases`.

---

## Verification gate before declaring phase 1 done

Before opening the PR:

1. Run: `yarn run test:js` — all component tests pass (4 SFCs + setup smoke).
2. Run: `yarn run e2e` — full playwright suite must pass.
3. Run: `yarn run lint` — clean.
4. Run: `vendor/bin/phpunit` — clean (defensive; PHP shouldn't be affected).
5. Manual browser walk: `php artisan setup:test`, log in, visit `/settings/personalization`, exercise all four gender modals (create, edit, delete-simple, delete-with-replacement, change-default).
6. Confirm in DevTools that the four modal SFCs are dynamically imported (or at least bundled separately if eager) — check the network tab on `/settings/personalization` for the new chunk names.

## Delivery shape

Two PRs from two issues, both on feature branches (no worktrees):

**PR 1 — fork-infrastructure (sibling issue, NOT part of #724).** Task 0 ships standalone:
- Branch: `feat/vitest-component-tests` off `4.x`.
- Title: `build(test): introduce vitest + @vue/test-utils`
- Body: motivates the new test layer (per-SFC tests for the #724 phase 1 modal refactor and beyond), summarises the choices (vitest, @vue/test-utils v2, happy-dom).
- Open a new issue first: "introduce vitest + @vue/test-utils for vue component tests". Reference it from #724 as a prerequisite.

**PR 2 — phase 1 of #724.** Tasks 1-9 ship together:
- Branch: `refactor/modals-usemodal-genders` off `4.x` (rebased after PR 1 merges).
- Title: `refactor(modals): adopt useModal() for genders (phase 1 of #724)`
- Body: links #724, summarises the pattern decisions, lists which modals remain.

Why this split: the test-infra choice deserves its own focused review separate from the modal refactor's judgement calls. It's also useful infrastructure for #744 (i18n migration) and every future Vue change — landing it under its own issue makes the dependency obvious and lets phase 2+ inherit it cleanly.

## Execution handoff

This plan is ready to execute in a fresh session. Open Claude Code on `4.x`, then:

1. `git checkout -b feat/vitest-component-tests` (or `refactor/modals-usemodal-genders` if starting with PR 2).
2. Invoke `superpowers:executing-plans` and point at this file.
3. Execute Task 0 → open PR 1 → wait for merge → branch + execute Tasks 1-9 → open PR 2.

The first session that picks this up should also: open the sibling issue for the test infra (referencing #724 as the motivating consumer) before opening PR 1, so the PR has an issue to close.

---

## Decisions locked in phase 1 (for phases 2+)

- **SFC v-model contract.** Each per-modal SFC accepts `modelValue: Boolean` as a prop and emits `update:modelValue` on cancel and post-save. The MonicaModal shell forwards both. This is **load-bearing** — without it, ModalsContainer's `onUpdate:modelValue → r.modelValue = false` binding never fires, the entry stays `modelValue: true` in `dynamicModals`, `keepAlive: false` never destroys the instance, and the next `open()` reuses the same instance with stale `data()`. The original plan used a local `show` data prop and would have failed under cancel-then-reopen (the Create flow happened to work only because the parent explicitly called `createModal.close()` on save). Phase 2+ SFCs must follow the modelValue pattern from the start.
- **Per-row data.** `patchOptions({ attrs: { row } })` immediately before `open()`. The modal SFC reads from props in `data()`, which re-runs each mount because the v-model contract above triggers a real destroy+remount. Verified in browser: open row A → cancel → open row B shows row B's data (not row A).
- **Parent callbacks.** `onSaved` only. Parent uses it to trigger a refresh (`getGenders()` etc.). The SFC handles its own close via `update:modelValue=false`; the parent does **not** call `.close()` and does **not** need an `onCancelled` callback. This is a deviation from the plan's "callbacks close the modal + trigger refresh" — the SFC owns close.
- **SFC location.** Co-located subfolder `<parent>/<aggregate>/<Name>Modal.vue` (e.g. `settings/genders/CreateModal.vue`). One subfolder per parent.
- **Visual shell.** `MonicaModal.vue` stays as-is. Every per-modal SFC uses `<monica-modal>` internally — preserves `.monica-modal__panel` etc. CSS selectors that playwright smoke depends on. Whether to inline `<vue-final-modal>` and drop the shared shell entirely is deferred to the last phase.
- **Form state.** Lives in the modal SFC's `data()`. No more `xxxForm` blocks in parents.
- **Tests.** Every per-modal SFC ships with a vitest `*.spec.js` co-located beside it. Coverage = initial state + each public method (axios call shape, emit, branches). Spec imports from `../../../../../tests/js/helpers.js` (five levels up for `resources/js/components/<parent>/<aggregate>/`). Run via `yarn run test:js`. No playwright-only coverage for new modal behavior.
- **`<modals-container></modals-container>` is non-negotiable in Blade.** Self-closing custom elements are silent no-ops in DOM templates — the browser HTML parser swallows everything following `/>`. `tests/js/blade-no-self-closing-custom-elements.spec.js` guards against regressions.
- **OpCache trap.** Blade edits don't reach the dev container until either `docker restart monica-app-1` or a forced view recompile *plus* worker restart. `php artisan view:clear` alone is not sufficient. Documented in `CLAUDE.md`; reconfirmed during phase 1.
- **Playwright smoke guard.** `dependency-upgrade-smoke.spec.ts:347` reads `vfm.dynamicModals.length` directly to assert the useModal() path is actually doing the work. Visual surface alone (`.monica-modal__panel` visible) can't distinguish useModal() from the back-compat v-model path.
- **`Confirm.vue`.** Stays a component (Blade callers exist). Its internal modal gets ported separately, behind the same template API.
