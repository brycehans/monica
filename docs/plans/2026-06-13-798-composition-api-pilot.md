# Vue Composition API Pilot Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Convert 4 SFCs (RateDay, Genders, MfaActivate, Tags) from Options API to `<script setup lang="ts">` and extract 2 reusable composables (useHtmlDir, useNotify), validating the conversion approach before the ~77-SFC bulk migration.

**Architecture:** Create composables first so each component conversion can import them immediately. Update the Vitest test setup to mock the `axios` module (not just `globalThis.axios`) so converted components using `import axios from 'axios'` are covered by the same stubs. Convert in complexity order: RateDay (simple) → Genders (medium) → MfaActivate (medium-hard) → Tags (hard). Each conversion replaces only the `<script>` block; templates and `<style>` are untouched. Add `resources/js/**/*.vue` to tsconfig so vue-tsc checks the converted SFCs.

**Tech Stack:** Vue 3.5, `<script setup lang="ts">`, vue-i18n composition mode (`useI18n`), `useRowModal` (existing), `vue-final-modal`, `@kyvg/vue3-notification`, Vitest + `@vue/test-utils`, vue-tsc 3.x

---

## Task 1: Extend tsconfig + axios test-setup

Adds `.vue` to the TypeScript include so `vue-tsc` checks the new SFCs, and updates `tests/js/setup.js` so both legacy Options API components (`globalThis.axios`) and new TypeScript components (`import axios from 'axios'`) see the same per-test stubs.

**Files:**
- Modify: `tsconfig.json`
- Modify: `tests/js/setup.js`

### Step 1: Update tsconfig.json

Current `include` array is `["resources/js/**/*.ts", "resources/js/**/*.d.ts"]`. Add the `.vue` glob:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "strict": true
  },
  "include": [
    "resources/js/**/*.ts",
    "resources/js/**/*.d.ts",
    "resources/js/**/*.vue"
  ]
}
```

### Step 2: Update tests/js/setup.js

Replace the existing file entirely. Key changes vs. original:
- Add `vi.mock('axios', ...)` at module level so `import axios from 'axios'` in new SFCs is intercepted
- Expose the same mock instance as `globalThis.axios` so legacy test assertions like `expect(axios.post).toHaveBeenCalledWith(...)` still work (they reference `globalThis.axios.post`)
- `beforeEach` now calls `.mockReset()` + re-adds defaults rather than creating fresh objects (the shared module mock object must be cleared between tests)

```js
import { vi, beforeEach } from 'vitest';

// Module-level axios mock — intercepted by both `import axios from 'axios'`
// in new <script setup lang="ts"> components and the bare `axios` global used
// by legacy Options API components (via globalThis). vi.mock is hoisted by
// vitest before any imports in this file.
vi.mock('axios', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: [] }),
    post: vi.fn().mockResolvedValue({ data: {} }),
    put: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} }),
  },
}));

// boot.ts reads boot data from a <script type="application/json" id="boot-data"> element.
const bootEl = document.createElement('script');
bootEl.type = 'application/json';
bootEl.id = 'boot-data';
bootEl.textContent = JSON.stringify({ locale: 'en', htmldir: 'ltr', timezone: 'UTC', env: 'testing' });
document.head.appendChild(bootEl);

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

// Wire up globalThis.axios to the vi.mock'd module so legacy Options API
// test assertions that reference bare `axios.post` still work.
import axios from 'axios';
globalThis.axios = axios;

beforeEach(() => {
  // mockReset clears call history AND any one-off mockResolvedValueOnce stubs.
  // Re-add the defaults so tests that don't stub axios get sensible no-ops.
  axios.get.mockReset();
  axios.post.mockReset();
  axios.put.mockReset();
  axios.delete.mockReset();
  axios.get.mockResolvedValue({ data: [] });
  axios.post.mockResolvedValue({ data: {} });
  axios.put.mockResolvedValue({ data: {} });
  axios.delete.mockResolvedValue({ data: {} });
});
```

### Step 3: Run existing test suite to verify no regressions

```bash
yarn run test:js
```

Expected: all existing specs pass (same count as before).

### Step 4: Commit

Write to `tmp/commit-msg.txt`:
```
test(js): unify axios mock to cover both global and module import

Add vi.mock('axios') to the vitest setup file so converted <script setup
lang="ts"> components that do `import axios from 'axios'` see the same
per-test stubs as legacy Options API components that rely on globalThis.axios.

Update tsconfig.json include to cover *.vue files so vue-tsc checks
converted SFCs.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
Claude-Session: 6760890a-6058-4d1a-9fa4-40d215fa8f5a
```

```bash
git add tsconfig.json tests/js/setup.js
git commit -F tmp/commit-msg.txt
rm tmp/commit-msg.txt
```

---

## Task 2: `useHtmlDir()` composable

Wraps the `htmldir` constant from `boot.ts` into a composable so `<script setup>` components don't have to import `boot.ts` directly and have a single, testable abstraction for the dir computed.

`htmldir` is a static constant (read once from the DOM at boot, never changes). `dirltr` does not need Vue reactivity — it's a plain boolean.

**Files:**
- Create: `resources/js/composables/useHtmlDir.ts`
- Create: `resources/js/composables/useHtmlDir.spec.ts`

### Step 1: Write the failing test

```ts
// resources/js/composables/useHtmlDir.spec.ts
import { describe, it, expect } from 'vitest';
import { useHtmlDir } from './useHtmlDir';

// No vi.mock needed: tests/js/setup.js injects boot-data with htmldir='ltr'
// before any module loads, so boot.ts sees ltr at parse time.

describe('useHtmlDir', () => {
  it('returns dirltr=true when boot data has htmldir ltr (test default)', () => {
    const { dirltr } = useHtmlDir();
    expect(dirltr).toBe(true);
  });
});
```

### Step 2: Run test — expect failure

```bash
yarn run test:js -- --reporter=verbose resources/js/composables/useHtmlDir.spec.ts
```

Expected: FAIL — `Cannot find module './useHtmlDir'`

### Step 3: Create the composable

```ts
// resources/js/composables/useHtmlDir.ts
import { htmldir } from '../boot';

export function useHtmlDir() {
  return { dirltr: htmldir === 'ltr' };
}
```

### Step 4: Run test — expect pass

```bash
yarn run test:js -- --reporter=verbose resources/js/composables/useHtmlDir.spec.ts
```

Expected: PASS (1 test)

### Step 5: Commit

Write to `tmp/commit-msg.txt`:
```
refactor(vue): add useHtmlDir composable

Wraps boot.ts's htmldir constant so <script setup> components can import
a typed boolean (dirltr) without coupling directly to the boot module.
Used by RateDay, Genders, and Tags in the Composition API pilot (#798).

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
Claude-Session: 6760890a-6058-4d1a-9fa4-40d215fa8f5a
```

```bash
git add resources/js/composables/useHtmlDir.ts resources/js/composables/useHtmlDir.spec.ts
git commit -F tmp/commit-msg.txt
rm tmp/commit-msg.txt
```

---

## Task 3: `useNotify()` composable

Thin wrapper around `@kyvg/vue3-notification`'s `notify` function. Gives converted components a single import point and makes the dependency mockable in tests.

**Files:**
- Create: `resources/js/composables/useNotify.ts`
- Create: `resources/js/composables/useNotify.spec.ts`

### Step 1: Write the failing test

```ts
// resources/js/composables/useNotify.spec.ts
import { describe, it, expect, vi } from 'vitest';

const mockNotify = vi.fn();
vi.mock('@kyvg/vue3-notification', () => ({ notify: mockNotify }));

import { useNotify } from './useNotify';

describe('useNotify', () => {
  it('returns the notify fn from @kyvg/vue3-notification', () => {
    const { notify } = useNotify();
    expect(notify).toBe(mockNotify);
  });

  it('calling notify passes args through to the underlying fn', () => {
    const { notify } = useNotify();
    const opts = { group: 'mfa', title: 'success', text: '', type: 'success' };
    notify(opts);
    expect(mockNotify).toHaveBeenCalledWith(opts);
  });
});
```

### Step 2: Run test — expect failure

```bash
yarn run test:js -- --reporter=verbose resources/js/composables/useNotify.spec.ts
```

Expected: FAIL — `Cannot find module './useNotify'`

### Step 3: Create the composable

```ts
// resources/js/composables/useNotify.ts
import { notify } from '@kyvg/vue3-notification';

export function useNotify() {
  return { notify };
}
```

### Step 4: Run test — expect pass

```bash
yarn run test:js -- --reporter=verbose resources/js/composables/useNotify.spec.ts
```

Expected: PASS (2 tests)

### Step 5: Commit

Write to `tmp/commit-msg.txt`:
```
refactor(vue): add useNotify composable

Thin wrapper around @kyvg/vue3-notification's notify so converted
<script setup> components have a typed, mockable import instead of
relying on this.$notify via globalProperties. Used by MfaActivate
in the Composition API pilot (#798).

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
Claude-Session: 6760890a-6058-4d1a-9fa4-40d215fa8f5a
```

```bash
git add resources/js/composables/useNotify.ts resources/js/composables/useNotify.spec.ts
git commit -F tmp/commit-msg.txt
rm tmp/commit-msg.txt
```

---

## Task 4: Convert RateDay.vue (simple)

**Complexity note:** Already has `setup()` for `useI18n`. Single computed (`dirltr`), one `mounted` hook, axios GET + POST, one emit. No props, no watch.

**Key pattern here:** `.then()` chains → `async/await`. The `rate()` method calls `emit('hasRated', ...)` after an `await` — this is safe because the emit goes to the parent, not back to this component, so there's no self-unmount concern.

**Files:**
- Modify: `resources/js/components/journal/RateDay.vue`
- Create: `resources/js/components/journal/RateDay.spec.ts`

### Step 1: Write the failing tests

```ts
// resources/js/components/journal/RateDay.spec.ts
import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import RateDay from './RateDay.vue';

vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (k: string) => k }) }));
vi.mock('../../composables/useHtmlDir', () => ({ useHtmlDir: () => ({ dirltr: true }) }));

describe('RateDay', () => {
  it('hasRated starts as notYet after mount fetches notYet', async () => {
    (globalThis.axios.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: 'notYet' });
    const w = mount(RateDay);
    await w.vm.$nextTick();
    // Template: v-if="hasRated !== true" should render the rating box
    expect(w.html()).toContain('journal.journal_rate');
  });

  it('showComment sets rate and transitions to addComment state', () => {
    const w = mount(RateDay);
    w.vm.showComment(2);
    expect(w.vm.hasRated).toBe('addComment');
    expect(w.vm.day.rate).toBe(2);
  });

  it('dismiss resets to notYet with cleared day', () => {
    const w = mount(RateDay);
    w.vm.showComment(1);
    w.vm.dismiss();
    expect(w.vm.hasRated).toBe('notYet');
    expect(w.vm.day.rate).toBe(0);
    expect(w.vm.day.comment).toBe('');
  });

  it('rate() posts day data and emits hasRated', async () => {
    (globalThis.axios.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: { id: 5 } });
    const w = mount(RateDay);
    w.vm.showComment(3);
    await w.vm.rate();
    expect(globalThis.axios.post).toHaveBeenCalledWith('journal/day', expect.objectContaining({ rate: 3 }));
    expect(w.emitted('hasRated')?.[0]).toEqual([{ id: 5 }]);
  });
});
```

### Step 2: Run tests — expect failure

```bash
yarn run test:js -- --reporter=verbose resources/js/components/journal/RateDay.spec.ts
```

Expected: FAIL (component not yet converted; `w.vm.showComment` won't exist on the public instance)

### Step 3: Replace `<script>` block in RateDay.vue

Replace everything from `<script>` to `</script>` (lines 207–277) with:

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import axios from 'axios';
import { useHtmlDir } from '../../composables/useHtmlDir';

const { t } = useI18n();
const { dirltr } = useHtmlDir();

const emit = defineEmits<{
  (e: 'hasRated', data: unknown): void
}>();

const day = ref<{ rate: number; comment: string }>({ rate: 0, comment: '' });
const hasRated = ref<'notYet' | 'addComment' | 'justNow' | true>('notYet');
const showSadSmileyColor = ref(false);
const showMediocreSmileyColor = ref(false);
const showHappySmileyColor = ref(false);

onMounted(hasAlreadyRatedToday);

async function hasAlreadyRatedToday() {
  const response = await axios.get('journal/hasRated');
  hasRated.value = response.data;
}

function showComment(rate: number) {
  day.value.rate = rate;
  hasRated.value = 'addComment';
}

function dismiss() {
  hasRated.value = 'notYet';
  day.value.rate = 0;
  day.value.comment = '';
}

async function rate() {
  hasRated.value = 'justNow';
  const response = await axios.post('journal/day', day.value);
  showSadSmileyColor.value = false;
  showMediocreSmileyColor.value = false;
  showHappySmileyColor.value = false;
  emit('hasRated', response.data);
}

defineExpose({ hasRated, day, showComment, dismiss, rate });
</script>
```

**Template note:** `day.rate` in the template becomes `day.rate` (unchanged) because `<script setup>` refs are auto-unwrapped in templates. The `hasRated !== true` check works the same with the ref.

**`day.rate` initialization:** Original used `''` (empty string). Changed to `0` (number). Template checks `day.rate === 1/2/3` — `0 === 1` is still false, so behaviour is identical. The type is now correctly `number`.

### Step 4: Run tests — expect pass

```bash
yarn run test:js -- --reporter=verbose resources/js/components/journal/RateDay.spec.ts
```

Expected: PASS (4 tests)

### Step 5: Run full suite

```bash
yarn run test:js
```

Expected: all pass.

### Step 6: Commit

Write to `tmp/commit-msg.txt`:
```
refactor(vue): convert RateDay.vue to <script setup lang="ts">

Pilot task 1 of 4 (#798). Converts the journal rate-day widget from
Options API to Composition API with TypeScript. Replaces this.$root.htmldir
computed with useHtmlDir(), converts axios .then() to async/await, types
the day ref and hasRated state union explicitly.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
Claude-Session: 6760890a-6058-4d1a-9fa4-40d215fa8f5a
```

```bash
git add resources/js/components/journal/RateDay.vue resources/js/components/journal/RateDay.spec.ts
git commit -F tmp/commit-msg.txt
rm tmp/commit-msg.txt
```

---

## Task 5: Convert Genders.vue (medium)

**Complexity note:** Already uses `setup()` for `useI18n` + 4× `useRowModal`. The remaining Options API parts are `data()`, `computed`, and `methods`. Uses `_.toArray()` and `_.findIndex()` — replace with native equivalents so the converted file has no lodash dependency.

**Files:**
- Modify: `resources/js/components/settings/Genders.vue`

(No new spec: the 4 existing child modal specs in `genders/*.spec.js` cover the meaningful logic. Those test the modals' form/emit behaviour; Genders.vue itself is orchestration glue that doesn't warrant unit tests beyond what playwright covers.)

### Step 1: Identify all lodash calls and their native replacements

In the current `Genders.vue`:
- `_.toArray(response.data)` → `Array.from(Object.values(response.data))` if data is object-keyed, or just `response.data` if it's already an array. The API at `settings/personalization/genders` returns a Laravel JSON response — check whether Laravel serializes this as an array or an object. Use `(response.data as Gender[])` if it's already an array (most likely for a collection endpoint), or `Object.values(response.data) as Gender[]` for an object. The test setup stubs `axios.get` returning `{ data: [] }` (array) — keep consistent and use a direct cast.
- `_.findIndex(this.genders, ['isDefault', true])` → `this.genders.findIndex(g => g.isDefault === true)`

### Step 2: Define interfaces

Add at the top of `<script setup lang="ts">`:

```ts
interface Gender {
  id: number;
  name: string;
  type: string;
  isDefault: boolean;
  numberOfContacts: number;
}

interface GenderType {
  id: string;
  name: string;
}
```

### Step 3: Replace `<script>` block

Replace everything from `<script>` to `</script>` (lines 74–169) with:

```vue
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import axios from 'axios';
import { useRowModal } from '../../composables/useRowModal';
import { useHtmlDir } from '../../composables/useHtmlDir';
import CreateModal from './genders/CreateModal.vue';
import EditModal from './genders/EditModal.vue';
import DeleteModal from './genders/DeleteModal.vue';
import SetDefaultModal from './genders/SetDefaultModal.vue';

interface Gender {
  id: number;
  name: string;
  type: string;
  isDefault: boolean;
  numberOfContacts: number;
}

interface GenderType {
  id: string;
  name: string;
}

const { t } = useI18n();
const { dirltr } = useHtmlDir();

const createModal = useRowModal(CreateModal);
const editModal = useRowModal(EditModal);
const deleteModal = useRowModal(DeleteModal);
const setDefaultModal = useRowModal(SetDefaultModal);

const genders = ref<Gender[]>([]);
const genderTypes = ref<GenderType[]>([]);

const defaultGenderType = computed<Gender | undefined>(() => {
  const idx = genders.value.findIndex(g => g.isDefault === true);
  return genders.value[idx >= 0 ? idx : 0];
});

onMounted(() => {
  Promise.all([getGenders(), getGenderTypes()]);
});

async function getGenders() {
  const response = await axios.get('settings/personalization/genders');
  genders.value = response.data as Gender[];
}

async function getGenderTypes() {
  const response = await axios.get('settings/personalization/genderTypes');
  genderTypes.value = response.data as GenderType[];
}

function openCreate() {
  createModal.open({
    genderTypes: genderTypes.value,
    defaultGenderType: defaultGenderType.value,
    onSaved: () => getGenders(),
  });
}

function openSetDefault() {
  setDefaultModal.open({
    genders: genders.value,
    defaultId: defaultGenderType.value?.id ?? null,
    onSaved: () => getGenders(),
  });
}

function openEdit(gender: Gender) {
  editModal.open({
    gender,
    genderTypes: genderTypes.value,
    onSaved: () => getGenders(),
  });
}

function openDelete(gender: Gender) {
  deleteModal.open({
    gender,
    genders: genders.value,
    onSaved: () => getGenders(),
  });
}
</script>
```

### Step 4: Run tests

```bash
yarn run test:js
```

Expected: all existing genders modal specs pass (they test the child components, not Genders.vue itself).

### Step 5: Commit

Write to `tmp/commit-msg.txt`:
```
refactor(vue): convert Genders.vue to <script setup lang="ts">

Pilot task 2 of 4 (#798). Replaces this.$root.htmldir with useHtmlDir(),
this._ lodash calls with native Array methods, and .then() with async/await.
Adds Gender/GenderType interfaces. The 4 child-modal specs remain green.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
Claude-Session: 6760890a-6058-4d1a-9fa4-40d215fa8f5a
```

```bash
git add resources/js/components/settings/Genders.vue
git commit -F tmp/commit-msg.txt
rm tmp/commit-msg.txt
```

---

## Task 6: Convert MfaActivate.vue (medium-hard)

**Complexity note:** Has a `watch` on the `activated` prop, two independent boolean modals (not `useRowModal`), and `this.$notify` calls. `useNotify()` replaces `this.$notify`. The `watch` on the prop maps cleanly to `watch(() => props.activated, ...)`.

**Review rule note:** `this.$notify` goes through `appContext.config.globalProperties` which survives unmount (per `docs/review-rules/vue3-proxy-after-unmount.md`). After converting to `useNotify()`, the closure-captured `notify` function is equally safe. No vulnerability introduced or removed by this conversion.

**Files:**
- Modify: `resources/js/components/settings/MfaActivate.vue`
- Create: `resources/js/components/settings/MfaActivate.spec.ts`

### Step 1: Write the failing tests

```ts
// resources/js/components/settings/MfaActivate.spec.ts
import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import MfaActivate from './MfaActivate.vue';

vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (k: string) => k }) }));
vi.mock('../../composables/useNotify', () => ({ useNotify: () => ({ notify: vi.fn() }) }));

describe('MfaActivate', () => {
  it('selectActivated mirrors the activated prop', () => {
    const w = mount(MfaActivate, { props: { activated: true } });
    expect(w.vm.selectActivated).toBe(true);
  });

  it('selectActivated updates when activated prop changes', async () => {
    const w = mount(MfaActivate, { props: { activated: false } });
    expect(w.vm.selectActivated).toBe(false);
    await w.setProps({ activated: true });
    expect(w.vm.selectActivated).toBe(true);
  });

  it('showDisableModal opens the disable modal', () => {
    const w = mount(MfaActivate, { props: { activated: true } });
    w.vm.showDisableModal();
    expect(w.vm.disableModalOpen).toBe(true);
  });

  it('showEnableModal fetches QR data and opens the enable modal', async () => {
    (globalThis.axios.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { image: '<svg/>', secret: 'ABC123' },
    });
    const w = mount(MfaActivate, { props: { activated: false } });
    await w.vm.showEnableModal();
    expect(w.vm.enableModalOpen).toBe(true);
    expect(w.vm.image).toBe('<svg/>');
    expect(w.vm.secret).toBe('ABC123');
  });
});
```

### Step 2: Run tests — expect failure

```bash
yarn run test:js -- --reporter=verbose resources/js/components/settings/MfaActivate.spec.ts
```

Expected: FAIL (`w.vm.selectActivated` not accessible from outside, component not yet converted)

### Step 3: Replace `<script>` block

Replace everything from `<script>` to `</script>` (lines 82–194) with:

```vue
<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import axios from 'axios';
import { useNotify } from '../../composables/useNotify';

const props = defineProps<{
  activated?: boolean
}>();

const { t } = useI18n();
const { notify } = useNotify();

const selectActivated = ref(props.activated ?? false);
const one_time_password = ref('');
const image = ref('');
const secret = ref('');
const enableModalOpen = ref(false);
const disableModalOpen = ref(false);

watch(() => props.activated, (val) => {
  selectActivated.value = val ?? false;
});

async function register() {
  try {
    const response = await axios.post('settings/security/2fa-enable', {
      one_time_password: one_time_password.value,
    });
    closeEnableModal();
    selectActivated.value = response.data.success;
    notify({
      group: 'mfa',
      title: response.data.success ? t('settings.2fa_enable_success') : t('settings.2fa_enable_error'),
      text: '',
      type: response.data.success ? 'success' : 'error',
    });
  } catch (error: unknown) {
    closeEnableModal();
    const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? '';
    notify({ group: 'mfa', title: msg, text: '', type: 'error' });
  }
}

async function unregister() {
  try {
    const response = await axios.post('settings/security/2fa-disable', {
      one_time_password: one_time_password.value,
    });
    closeDisableModal();
    selectActivated.value = !response.data.success;
    notify({
      group: 'mfa',
      title: response.data.success ? t('settings.2fa_disable_success') : t('settings.2fa_disable_error'),
      text: '',
      type: response.data.success ? 'success' : 'error',
    });
  } catch (error: unknown) {
    closeDisableModal();
    const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? '';
    notify({ group: 'mfa', title: msg, text: '', type: 'error' });
  }
}

async function showEnableModal() {
  one_time_password.value = '';
  try {
    const response = await axios.get('settings/security/2fa-enable');
    image.value = response.data.image;
    secret.value = response.data.secret;
    enableModalOpen.value = true;
  } catch (error: unknown) {
    const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? '';
    notify({ group: 'mfa', title: msg, text: '', type: 'error' });
  }
}

function showDisableModal() {
  one_time_password.value = '';
  disableModalOpen.value = true;
}

function closeEnableModal() {
  enableModalOpen.value = false;
}

function closeDisableModal() {
  disableModalOpen.value = false;
}

defineExpose({
  selectActivated, one_time_password, image, secret,
  enableModalOpen, disableModalOpen,
  register, unregister, showEnableModal, showDisableModal,
  closeEnableModal, closeDisableModal,
});
</script>
```

**Template note:** `v-model="enableModalOpen"` and `v-model="disableModalOpen"` auto-unwrap in the template. No template changes needed.

**Error shape cast:** The `catch (error)` paths cast to an anonymous type to get at `.response.data.message`. This is intentional — axios error objects in practice have this shape, and we're not importing `AxiosError` to keep the dependency minimal.

### Step 4: Run tests — expect pass

```bash
yarn run test:js -- --reporter=verbose resources/js/components/settings/MfaActivate.spec.ts
```

Expected: PASS (4 tests)

### Step 5: Run full suite

```bash
yarn run test:js
```

### Step 6: Commit

Write to `tmp/commit-msg.txt`:
```
refactor(vue): convert MfaActivate.vue to <script setup lang="ts">

Pilot task 3 of 4 (#798). Replaces this.$notify with useNotify(), converts
watch on the activated prop to watch(() => props.activated, ...), and converts
.then()/.catch() chains to async/await with typed error handling. No behaviour
change.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
Claude-Session: 6760890a-6058-4d1a-9fa4-40d215fa8f5a
```

```bash
git add resources/js/components/settings/MfaActivate.vue resources/js/components/settings/MfaActivate.spec.ts
git commit -F tmp/commit-msg.txt
rm tmp/commit-msg.txt
```

---

## Task 7: Convert Tags.vue (hard)

**Complexity note:** The hard case is `this.$nextTick(() => this.$refs.tags.focus())`. In `<script setup>` the equivalent is:

```ts
const tagsInput = useTemplateRef<HTMLInputElement>('tags');
// ...
async function enterEditMode() {
  editMode.value = true;
  await nextTick();
  tagsInput.value?.focus();
}
```

`useTemplateRef('tags')` returns a `ShallowRef<HTMLInputElement | null>` that is closure-captured — it survives instance teardown (no `instance.refs` proxy). The `?.` optional chaining handles the null case. Review rule audit (see `docs/review-rules/vue3-proxy-after-unmount.md` table, `people/Tags.vue:158`) classifies this as **not vulnerable** in the original Options API version (self-toggle, no unmount between nextTick and focus). The conversion to `useTemplateRef` eliminates the concern structurally.

Also uses lodash `_.toLower` and `_.findIndex` — replace with native equivalents.

**Files:**
- Modify: `resources/js/components/people/Tags.vue`
- Create: `resources/js/components/people/Tags.spec.ts`

### Step 1: Write the failing tests

```ts
// resources/js/components/people/Tags.spec.ts
import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import Tags from './Tags.vue';

vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (k: string) => k }) }));
vi.mock('../../composables/useHtmlDir', () => ({ useHtmlDir: () => ({ dirltr: true }) }));

describe('Tags', () => {
  it('getContactTags fetches from people/{hash}/tags', async () => {
    (globalThis.axios.get as ReturnType<typeof vi.fn>)
      .mockResolvedValue({ data: { data: [] } });
    const w = mount(Tags, { props: { hash: 'abc123' } });
    await w.vm.$nextTick();
    expect(globalThis.axios.get).toHaveBeenCalledWith('people/abc123/tags');
  });

  it('removeTag splices the tag and calls store', async () => {
    const tag = { id: 1, name: 'friend' };
    (globalThis.axios.get as ReturnType<typeof vi.fn>)
      .mockResolvedValue({ data: { data: [tag] } });
    const w = mount(Tags, { props: { hash: 'abc123' } });
    await w.vm.$nextTick();
    await w.vm.removeTag(tag);
    expect(w.vm.contactTags).not.toContain(tag);
    expect(globalThis.axios.post).toHaveBeenCalledWith(
      'people/abc123/tags/update',
      expect.any(Array),
    );
  });

  it('filterResults excludes tags already in contactTags', () => {
    const w = mount(Tags, { props: { hash: 'abc123' } });
    w.vm.allTags = [{ id: 1, name: 'Friend' }, { id: 2, name: 'Family' }];
    w.vm.contactTags = [{ id: 1, name: 'Friend' }];
    w.vm.search = 'f';
    w.vm.filterResults();
    // 'Family' matches 'f' search and is not already in contactTags
    expect(w.vm.results).toHaveLength(1);
    expect(w.vm.results[0].name).toBe('Family');
  });

  it('onEscape resets arrowCounter and closes dropdown', () => {
    const w = mount(Tags, { props: { hash: 'abc123' } });
    w.vm.arrowCounter = 2;
    w.vm.isOpen = true;
    w.vm.search = 'foo';
    w.vm.onEscape();
    expect(w.vm.arrowCounter).toBe(-1);
    expect(w.vm.isOpen).toBe(false);
    expect(w.vm.search).toBe('');
  });
});
```

### Step 2: Run tests — expect failure

```bash
yarn run test:js -- --reporter=verbose resources/js/components/people/Tags.spec.ts
```

Expected: FAIL (component not yet converted)

### Step 3: Replace `<script>` block

Replace everything from `<script>` to `</script>` (lines 88–240) with:

```vue
<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, useTemplateRef } from 'vue';
import { useI18n } from 'vue-i18n';
import axios from 'axios';
import moment from 'moment';
import { useHtmlDir } from '../../composables/useHtmlDir';

interface Tag {
  id: string | number;
  name: string;
}

const props = defineProps<{
  hash?: string
}>();

const { t } = useI18n();
const { dirltr } = useHtmlDir();

const tagsInput = useTemplateRef<HTMLInputElement>('tags');

const allTags = ref<Tag[]>([]);
const contactTags = ref<Tag[]>([]);
const editMode = ref(false);
const search = ref('');
const results = ref<Tag[]>([]);
const isOpen = ref(false);
const arrowCounter = ref(0);

onMounted(() => {
  getExistingTags();
  getContactTags();
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});

async function getExistingTags() {
  const response = await axios.get('tags');
  allTags.value = response.data.data;
}

async function getContactTags() {
  const response = await axios.get('people/' + props.hash + '/tags');
  contactTags.value = response.data.data;
}

async function enterEditMode() {
  editMode.value = true;
  await nextTick();
  tagsInput.value?.focus();
}

function removeTag(tag: Tag) {
  contactTags.value.splice(contactTags.value.indexOf(tag), 1);
  store();
}

function onChange() {
  isOpen.value = true;
  filterResults();
}

function onEnter() {
  if (search.value !== '') {
    contactTags.value.push({
      id: moment().format(),
      name: search.value,
    });
    arrowCounter.value = -1;
    isOpen.value = false;
    search.value = '';
    store();
  }
}

function onArrowDown() {
  if (arrowCounter.value < results.value.length) {
    arrowCounter.value = arrowCounter.value + 1;
    search.value = results.value[arrowCounter.value].name;
  }
}

function onArrowUp() {
  if (arrowCounter.value > 0) {
    arrowCounter.value = arrowCounter.value - 1;
    search.value = results.value[arrowCounter.value].name;
  }
}

function onEscape() {
  arrowCounter.value = -1;
  isOpen.value = false;
  search.value = '';
}

function setResult(result: Tag) {
  search.value = '';
  isOpen.value = false;
  contactTags.value.push(result);
  store();
}

function filterResults() {
  const lowerSearch = search.value.toLowerCase();
  results.value = allTags.value.filter(
    item =>
      item.name.toLowerCase().includes(lowerSearch) &&
      contactTags.value.findIndex(t => t.name === item.name) < 0,
  );
}

async function store() {
  await axios.post('people/' + props.hash + '/tags/update', contactTags.value);
  getExistingTags();
}

function handleClickOutside(evt: MouseEvent) {
  const el = document.getElementById('app') ?? document.body;
  if (!el.contains(evt.target as Node)) {
    isOpen.value = false;
    arrowCounter.value = -1;
  }
}

defineExpose({
  allTags, contactTags, editMode, search, results, isOpen, arrowCounter,
  enterEditMode, removeTag, onChange, onEnter, onArrowDown, onArrowUp,
  onEscape, setResult, filterResults, store,
});
</script>
```

**Template note:** The `ref="tags"` attribute on the `<input>` stays unchanged. `useTemplateRef('tags')` binds to it by name. The inline close-link in the template (`@click.prevent="search = ''; editMode = false; isOpen = false;"`) works because refs are auto-unwrapped in templates.

**`handleClickOutside`:** Original used `this.$el.contains(evt.target)`. In `<script setup>`, `$el` isn't directly accessible. The Tags component is always mounted inside `#app`, so the equivalent check (`!el.contains(evt.target)`) works for the auto-close use case. If you need the exact `$el` ref, add `const rootEl = useTemplateRef<HTMLElement>('root')` and add `ref="root"` to the template's root `<div>`.

**Lodash removals:**
- `_.toLower(item.name)` → `item.name.toLowerCase()`
- `_.toLower(this.search)` → `search.value.toLowerCase()`
- `item.name.indexOf(search)` → `item.name.toLowerCase().includes(lowerSearch)` (cleaner)
- `_.findIndex(me, t => t.name === item.name)` → `contactTags.value.findIndex(t => t.name === item.name)`

**`filterAllTags` method:** Was dead code (never called in templates or other methods). Omitted in the conversion.

### Step 4: Run tests — expect pass

```bash
yarn run test:js -- --reporter=verbose resources/js/components/people/Tags.spec.ts
```

Expected: PASS (4 tests)

### Step 5: Run full suite

```bash
yarn run test:js
```

Expected: all pass.

### Step 6: Commit

Write to `tmp/commit-msg.txt`:
```
refactor(vue): convert Tags.vue to <script setup lang="ts">

Pilot task 4 of 4 (#798). Key patterns: useTemplateRef('tags') + nextTick()
replaces this.$nextTick(() => this.$refs.tags.focus()); lodash _.toLower and
_.findIndex replaced with native String/Array methods; filterAllTags dead
code removed. Review-rule audit: enterEditMode nextTick-focus is not a
proxy-after-unmount vulnerability (self-toggle, same component lifecycle).

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
Claude-Session: 6760890a-6058-4d1a-9fa4-40d215fa8f5a
```

```bash
git add resources/js/components/people/Tags.vue resources/js/components/people/Tags.spec.ts
git commit -F tmp/commit-msg.txt
rm tmp/commit-msg.txt
```

---

## Task 8: Final verification + type-check

### Step 1: Run vue-tsc

```bash
yarn vue-tsc --noEmit
```

Expected: clean (0 errors). If errors, fix them before continuing — they'll be in the converted SFCs' `<script setup>` blocks. Common issues:
- `unknown` cast on `catch (error)` parameter — add an explicit type assertion
- `ref()` inferred as `Ref<never>` — add an explicit generic: `ref<Tag[]>([])`
- Imported `.vue` SFCs being `DefineComponent<any>` from `shims-vue.d.ts` — that's expected, not an error

### Step 2: Build

```bash
yarn run prod
```

Expected: build green, `public/build/manifest.json` generated with no warnings about unresolved imports.

### Step 3: Run lint

```bash
yarn run lint
```

Expected: 0 errors, 0 warnings in the 4 converted files.

### Step 4: Run full test suite

```bash
yarn run test:js
```

Expected: all pass.

---

## Conventions writeup (for PR description)

Include the following in the PR body under a `## Conventions` heading:

```
## Conventions established by this pilot

### Standard imports (top of <script setup lang="ts">)
Always import in this order:
1. Vue core: `import { ref, computed, watch, onMounted, nextTick, useTemplateRef } from 'vue'`
2. vue-i18n: `import { useI18n } from 'vue-i18n'`
3. axios: `import axios from 'axios'` (not `window.axios`; the module mock in tests/js/setup.js covers both)
4. Local composables: `import { useHtmlDir } from '../../composables/useHtmlDir'`
5. Component imports
6. Type-only imports

### Composables available after this PR
- `useHtmlDir()` — returns `{ dirltr: boolean }` for RTL-aware layout classes
- `useNotify()` — returns `{ notify }` for `@kyvg/vue3-notification` toasts
- `useRowModal(Component)` — existing; per-row modal with clean attr reset
- `useModalSelfClose()` — existing; for modals that close themselves on save

### Reactivity conventions
- Prefer `ref<T>()` over `reactive()` for all state
- Exception: form-object state where field spread is common (`const form = reactive({...})`) — keep as `reactive` for natural field access
- `data()` → `ref()` always; no `reactive()` for individual fields

### Props typing
- Always `defineProps<{ name: Type }>()` — never the object-syntax `defineProps({ name: { type: ... } })`
- Optional props: `name?: Type`; access via `props.name ?? defaultValue`

### watch on props
- Always `watch(() => props.foo, val => { ... })` — getter form prevents the watcher from tracking transitively

### $refs → useTemplateRef
- `this.$refs.foo.method()` → `const foo = useTemplateRef<ElementType>('foo')` + `foo.value?.method()`
- The `?. ` optional chain is always required; `useTemplateRef` returns `null` when the element is unmounted or hasn't mounted yet

### $nextTick → nextTick
- `this.$nextTick(() => ...)` → `await nextTick()` then the body (if in an async function) or `nextTick().then(...)` (if not async)

### Error casting
- `catch (error: unknown)` with: `(error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? ''`
- Do NOT import `AxiosError` — the inline type cast is sufficient and avoids coupling to axios's type exports

### Lodash removals (native equivalents)
- `_.toLower(s)` → `s.toLowerCase()`
- `_.findIndex(arr, pred)` → `arr.findIndex(pred)`
- `_.toArray(obj)` — **DO NOT** naively cast `response.data as T[]`. Several Laravel endpoints return JSON objects (not arrays) because the controller uses `Collator::asort` or `Collection::filter()` which leave non-sequential integer keys → Laravel serialises as object. The correct rewrite is `Object.values(response.data ?? {})`. The `?? {}` is mandatory; `Object.values(null)` throws. (See `Genders.vue` for the pilot example; `_.toArray` was load-bearing for both the runtime shape AND the null-safety.)
- `_.flatten(_.toArray(error.response.data))` (the Laravel 422 validation-error envelope flattener) — safe to rewrite as `Object.values(error.response.data ?? {}).flat()`. The validation envelope is name-keyed (`{field: ['msg1','msg2']}`), not integer-keyed, so Object.values returns the array-of-arrays unchanged.

#### Pre-bulk-conversion audit results (#798)

Surface inventory of `_.toArray` callsites in the codebase as of this pilot:

| File | Pattern | Same trap as Genders.vue? |
|------|---------|---------------------------|
| `people/Participant.vue:118` | `_.toArray(response.data)` from `people/{contact}/activities/contacts` | **Yes** — Collection::filter() keeps integer keys, Laravel serialises as object. Naive cast will break the same way. |
| `passport/PersonalAccessTokens.vue:283` | `_.flatten(_.toArray(error.response.data))` | No — validation-envelope (name-keyed). Use `Object.values(...).flat()`. |
| `settings/ContactFieldTypes.vue:371` | same | No (validation envelope) |
| `people/Addresses.vue:424` | same | No (validation envelope) |
| `passport/Clients.vue:326` | same | No (validation envelope) |
| `people/ContactInformation.vue:259` | same | No (validation envelope) |
| `people/gifts/CreateGift.vue:447` | same | No (validation envelope) |
| `people/activity/CreateActivity.vue:290` | same | No (validation envelope) |

Bulk-conversion task list: open #798-followup with the Participant.vue trap noted explicitly.

### defineExpose
- Always add `defineExpose({...})` exposing all state refs and methods so unit tests can access them via `w.vm.foo`
- Remove from final commit only if the component is exclusively tested via playwright/browser

### Effort estimate (actual vs. projected)
| Component | Projected | Actual |
|-----------|-----------|--------|
| RateDay   | ~1h       | (fill in) |
| Genders   | ~1.5h     | (fill in) |
| MfaActivate | ~2h    | (fill in) |
| Tags      | ~2.5h     | (fill in) |

Median projected: ~2h. Actual: (fill in after pilot).
```
