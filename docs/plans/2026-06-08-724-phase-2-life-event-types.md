# vue-final-modal `useModal()` adoption — Phase 2 (LifeEventTypes)

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Port `resources/js/components/settings/LifeEventTypes.vue` (3 modals, ~307 lines) from the v-model boolean pattern to `useModal()`, applying the recipe locked in by phase 1 (`docs/plans/2026-06-03-vue-final-modal-usemodal.md`).

This is the second consumer file in the 16-file / 28-modal sweep tracked under #724. Phase 1 (#761, genders) established the SFC convention, vitest test surface, and `<ModalsContainer />` mount. Phase 2 reuses all of it.

**Tech Stack:** Vue 3.5, vue-final-modal ^4.5, vitest, Vite ~7, Playwright.

**Regression net:** PR #778 (`tests/playwright/specs/personalization-life-event-types-crud.spec.ts`) drives create + update + delete end-to-end. Phase 2's smoke guard is this spec — if the refactor breaks any of the three flows, #778 fails loudly.

## Phase 1 decisions to follow verbatim

From `docs/plans/2026-06-03-vue-final-modal-usemodal.md` § "Decisions locked in phase 1":

- **SFC v-model contract.** Each per-modal SFC accepts `modelValue: Boolean` as a prop and emits `update:modelValue` on cancel and post-save. Load-bearing for cancel-then-reopen — the original `local show` pattern fails because vfm's `keepAlive: false` only destroys the instance when `dynamicModals[i].modelValue` is `false`.
- **Per-row data.** `patchOptions({ attrs: { row } })` immediately before `open()`. Modal SFC reads from props in `data()`, which re-runs each mount.
- **Parent callbacks.** `onSaved` only. Parent uses it for refresh (`getLifeEventCategories()`). The SFC handles its own close via `update:modelValue=false`. No `onCancelled` callback.
- **SFC location.** `resources/js/components/settings/life-event-types/<Name>Modal.vue`.
- **Visual shell.** `<monica-modal>` inside each SFC. Preserves `.monica-modal__panel` CSS for any spec still anchored on it.
- **Form state.** Lives in the SFC's `data()`. No more `xxxForm` blocks in the parent.
- **Tests.** Per-modal vitest specs co-located. Coverage = initial state + each public method (axios shape, emit, branches). Spec imports from `../../../../../tests/js/helpers.js` (five levels up).
- **Blade `<modals-container></modals-container>`** — not self-closing. Already done in phase 1.
- **Smoke guard.** Already added at `dependency-upgrade-smoke.spec.ts:347` for genders — that test reads `vfm.dynamicModals.length` directly. Phase 2 does NOT need a new smoke guard; #778's existence is the per-feature net.

## Source file anatomy

`resources/js/components/settings/LifeEventTypes.vue` exposes three modals:

| Modal | Trigger | Inputs | API | Notes |
|---|---|---|---|---|
| Create | per-category "Add" link (`showCreateType(category)`) | `life_event_category_id` (from category click), `name` | `POST settings/personalization/lifeeventtypes` | category id flows through patchOptions |
| Update | pencil icon (`showEditType(type, categoryId)`) | `id`, `name` (pre-filled), `life_event_category_id` | `PUT settings/personalization/lifeeventtypes/{id}` | `name` pre-fills from `type.name` or `t('people.life_event_sentence_<key>')` |
| Delete | trash icon (`showDeleteType(type)`) | `id`, conditional `errorMessage` from server | `DELETE settings/personalization/lifeeventtypes/{id}` | catch branch sets `errorMessage` (vs genders' explicit delete-with-replacement) |

After each successful action, the parent does `getLifeEventCategories()` + a `notify()` toast. Phase 2 splits these: SFC emits `saved`, parent's `onSaved` does the refresh + toast.

**Notify gotcha** (relates to the new `docs/review-rules/vue3-proxy-after-unmount.md`): the current parent calls `this.notify(this.t('app.default_save_success'), true)` after `this.showXxx = false` in the same `.then`. That's safe (one microtask). When the SFC owns close via emit, the parent's `onSaved` callback fires synchronously from inside the SFC's `.then`, so it's still one microtask — but if you decide to split close + toast across two `.then` blocks, capture the i18n string to a local first.

---

### Task 1: Extract `CreateModal.vue` (TDD)

**Files:**
- Create: `resources/js/components/settings/life-event-types/CreateModal.spec.js`
- Create: `resources/js/components/settings/life-event-types/CreateModal.vue`

**Step 1: Write the failing test.** Mirror `settings/genders/CreateModal.spec.js`. Cases:
- Mounts with `modelValue=true` (default).
- Initial `form.life_event_category_id` reads from the `category` prop.
- `store()` POSTs to `settings/personalization/lifeeventtypes` with `{ name, life_event_category_id, errors }`, emits `saved`, emits `update:modelValue=false`.
- `cancel()` emits `update:modelValue=false`, doesn't emit `saved`.

Run: `yarn run test:js -- life-event-types/CreateModal`. Expect FAIL — module not found.

**Step 2: Create the SFC.** Use phase 1's `genders/CreateModal.vue` as the template. Replace `defaultGenderType` with `category` (Object). Drop the `genderTypes` select + the `isDefault` toggle. Keep only the name input. Title `t('settings.personalization_life_event_type_modal_add')`.

Run: `yarn run test:js -- life-event-types/CreateModal`. Expect PASS.

**Step 3: Commit.** `refactor(modals): extract life-event-types/CreateModal SFC (phase 2 of #724)`.

---

### Task 2: Extract `UpdateModal.vue` (TDD)

**Files:**
- Create: `resources/js/components/settings/life-event-types/UpdateModal.spec.js`
- Create: `resources/js/components/settings/life-event-types/UpdateModal.vue`

**Step 1: Write the failing test.** Cases:
- Mounts with `modelValue=true`.
- `form.name` initialises from the `type.name` prop, OR from `t('people.life_event_sentence_<key>')` fallback when `type.name` is empty.
- `form.id` and `form.life_event_category_id` initialise from the props.
- `update()` PUTs to `settings/personalization/lifeeventtypes/{id}` with the form, emits `saved`, emits `update:modelValue=false`.
- `cancel()` emits `update:modelValue=false`, doesn't emit `saved`.

Run: expect FAIL.

**Step 2: Create the SFC.** Props: `type` (Object, required), `categoryId` (Number, required). Mirror `genders/EditModal.vue` shape. The pre-fill logic is the one quirk — fallback to `t('people.life_event_sentence_' + type.default_life_event_type_key)` when `type.name` is empty (parent's `showEditType` does this; move the fallback into the SFC). Title `t('settings.personalization_life_event_type_modal_edit')`.

Run: expect PASS.

**Step 3: Commit.** `refactor(modals): extract life-event-types/UpdateModal SFC (phase 2 of #724)`.

---

### Task 3: Extract `DeleteModal.vue` (TDD)

**Files:**
- Create: `resources/js/components/settings/life-event-types/DeleteModal.spec.js`
- Create: `resources/js/components/settings/life-event-types/DeleteModal.vue`

**Step 1: Write the failing test.** Cases:
- Mounts with `modelValue=true`, `errorMessage=''`.
- `destroy()` DELETEs to `settings/personalization/lifeeventtypes/{id}`, emits `saved`, emits `update:modelValue=false`.
- axios.delete error with structured response: `mockRejectedValueOnce({ response: { data: { message: 'cannot delete' } } })` → `errorMessage` becomes `'cannot delete'`, no emit.
- `cancel()` emits `update:modelValue=false`, no emit, no error change.

Run: expect FAIL.

**Step 2: Create the SFC.** Props: `type` (Object — must have `id`). Local state: `errorMessage` (string, default ''). Mirror `genders/DeleteModal.vue` but without the replacement-id selector (life event types don't have a default-flag wrinkle). Title `t('settings.personalization_life_event_type_modal_delete')`. Body copy `t('settings.personalization_life_event_type_modal_delete_desc')`.

Run: expect PASS.

**Step 3: Commit.** `refactor(modals): extract life-event-types/DeleteModal SFC (phase 2 of #724)`.

---

### Task 4: Wire all three into `LifeEventTypes.vue`

**Files:**
- Modify: `resources/js/components/settings/LifeEventTypes.vue`

**Step 1: Strip the inline modal blocks** (lines 84-156) and the now-unused state:
- Remove `createTypeForm`, `updateTypeForm`, `destroyTypeForm`, `errorMessage` from `data()`.
- Remove `showCreateTypeModal`, `showUpdateTypeModal`, `showDeleteTypeModal` from `data()`.
- Remove `closeCreateTypeModal`, `closeUpdateTypeModal`, `closeDeleteTypeModal`, `storeType`, `updateType`, `destroyType` methods.
- Remove the body of `showCreateType`, `showEditType`, `showDeleteType` (replace with the new `openXxx` calls).

**Step 2: Import + register the three SFCs via `useModal`.**

```js
import { useModal } from 'vue-final-modal';
import CreateModal from './life-event-types/CreateModal.vue';
import UpdateModal from './life-event-types/UpdateModal.vue';
import DeleteModal from './life-event-types/DeleteModal.vue';

// inside setup():
const { t } = useI18n();
const createModal = useModal({ component: CreateModal, attrs: {} });
const updateModal = useModal({ component: UpdateModal, attrs: {} });
const deleteModal = useModal({ component: DeleteModal, attrs: {} });
return { t, createModal, updateModal, deleteModal };
```

**Step 3: Add the three `openXxx` methods.**

```js
showCreateType(category) {
  this.createModal.patchOptions({
    attrs: {
      category,
      onSaved: () => {
        this.getLifeEventCategories();
        this.notify(this.t('app.default_save_success'), true);
      },
    },
  });
  this.createModal.open();
},

showEditType(type, categoryId) {
  this.updateModal.patchOptions({
    attrs: {
      type,
      categoryId,
      onSaved: () => {
        this.getLifeEventCategories();
        this.notify(this.t('app.default_save_success'), true);
      },
    },
  });
  this.updateModal.open();
},

showDeleteType(type) {
  this.deleteModal.patchOptions({
    attrs: {
      type,
      onSaved: () => {
        this.getLifeEventCategories();
        this.notify(this.t('app.default_save_success'), true);
      },
    },
  });
  this.deleteModal.open();
},
```

Keep the template's `@click="showCreateType(category)"` etc. as-is — the method names are unchanged.

**Step 4: Smoke verify.**

```
yarn run dev
yarn run e2e personalization-life-event-types-crud
```

Expect PASS — the spec at `tests/playwright/specs/personalization-life-event-types-crud.spec.ts` (PR #778) drives all three flows.

If smoke fails:
- Open the playwright HTML report and inspect the trace.
- Common gotcha: `useModal` not finding `<ModalsContainer />` — verify phase 1's mount via `view-source:/settings/personalization` + grep `modals-container`.
- Refresh-not-firing: confirm `onSaved` is in `patchOptions({ attrs: ... })` (not at the top level of the options object).

**Step 5: Commit.** `refactor(modals): port life-event-types modals to useModal() (phase 2 of #724)`.

---

### Task 5: Audit for leftover scaffolding

**Files:**
- Modify: `resources/js/components/settings/LifeEventTypes.vue` (if anything turns up)

**Step 1: Grep.**

```
grep -n "showCreateTypeModal\|showUpdateTypeModal\|showDeleteTypeModal\|createTypeForm\|updateTypeForm\|destroyTypeForm\|errorMessage\|closeCreateTypeModal\|closeUpdateTypeModal\|closeDeleteTypeModal" resources/js/components/settings/LifeEventTypes.vue
```

Expect: no matches. If any remain, remove them.

**Step 2: Lint.**

```
yarn run lint resources/js/components/settings/LifeEventTypes.vue resources/js/components/settings/life-event-types/
```

Expect clean.

**Step 3: Full suite.**

```
yarn run test:js
yarn run e2e
```

Expect PASS — vitest covers the new SFCs, the e2e suite includes the regression net.

**Step 4: Commit** if anything changed; otherwise skip.

---

## Verification gate

Before opening the PR:

1. `yarn run test:js` — all component tests pass (3 new SFC specs).
2. `yarn run e2e personalization-life-event-types-crud` — PASS.
3. `yarn run e2e` — full suite still green.
4. `yarn run lint` — clean.
5. Manual browser walk: `php artisan setup:test`, log in, visit `/settings/personalization` → exercise per-category Add → fill name → save → row appears. Click pencil on a custom row → edit name → save → row reflects. Click trash → confirm Delete → row gone.

## Delivery shape

One PR off `4.x` on branch `refactor/724-phase-2-life-event-types` (already created in the session preparing this plan).

- Title: `refactor(modals): adopt useModal() for life-event-types (phase 2 of #724)`
- Body: links #724, summarises the three SFCs + the parent slim-down, references #778 as the regression net.

## Execution handoff

This plan is ready to execute in a fresh session. From this checkout:

1. `git checkout refactor/724-phase-2-life-event-types`
2. Invoke `superpowers:executing-plans` and point at this file.
3. Execute Task 1 → 5 in order → open PR.

The phase-1 plan + decisions doc (`docs/plans/2026-06-03-vue-final-modal-usemodal.md`) is the source of truth for the SFC contract and test convention. Don't redrive those decisions; they're locked.

If the smoke test fails after Task 4, the highest-probability cause is the `modelValue` contract — re-read `docs/plans/2026-06-03-vue-final-modal-usemodal.md` § "Decisions locked in phase 1" first decision. Second-highest cause is the `onSaved` callback being placed at the wrong nesting level in `patchOptions`.
