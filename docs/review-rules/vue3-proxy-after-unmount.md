# Vue 3 review rule — don't touch the proxy after self-unmount

> Closes #743. First exemplar: #742 (CreateGift two-microtask crash). Related: #771 → #773 (PAT modal `$refs.form` TypeError).
>
> **Status:** Flavour 1 (`$t` after unmount) is structurally resolved by #744 (vue-i18n composition-mode migration — `t` is closure-captured by `useI18n()` and survives instance teardown). Flavour 2 (`$refs.X.method()` after unmount) is the remaining live concern; the deferred sweep was done in #795 and its findings are folded into the audit table below.

When a Vue component fires a method that triggers its own unmount — typical patterns are `this.close()`, `this.$emit('cancel')`, mutating a parent-controlled state prop that flips a `v-if` off — **everything else on that instance dies on the next microtask**: `this.$refs`, `this.$emit('update', ...)`, `this.$nextTick`, and data reads via `this.someProp`. Anything past the unmount line in the same call stack is fine (still inside one microtask). Anything *after* a `then` / `await` boundary is not.

This is the predictable consequence of how Vue 3 installs per-instance state on `instance.ctx`, which Vue clears at unmount. The historical `$t` flavour (Flavour 1, below) had the same root cause via vue-i18n's legacy-mode `$t` binding on `instance.ctx` — code that worked for years on Vue 2 + vue-i18n@8 (where bindings sat on `Vue.prototype`) started crashing on the cutover (#730). Migrating to vue-i18n composition mode (#744) closed that subclass: `t` is now a setup-time closure, not a proxy property. The `$refs` flavour remains because Vue clears `instance.refs` at unmount and there is no equivalent escape hatch for components still using Options-API `this.$refs` (composition-API code can use `useTemplateRef()` to closure-capture; that's not on the ladder).

For background, the original vue-i18n issues that surfaced the proxy-clear behavior: [vue-i18n#1440](https://github.com/kazupon/vue-i18n/issues/1440), [vue-i18n#184](https://github.com/kazupon/vue-i18n/issues/184).

## The rule

> When a method calls `this.close()` / `$emit('cancel')` / anything else that triggers parent-side unmount, all subsequent work on the component instance — `$emit('update')`, `$refs`, data reads, `$nextTick` — must happen in the **same** `.then` body (single microtask). If it spans `.then` blocks or crosses an `await`, capture per-instance plugin output to locals **before** the close call. For `$refs.X.method()` reachable after sibling/slot unmount, use `$refs.X?.method()`.

Equivalent rule for `async`/`await` code: don't `await` between a self-close and any `this.$x` access.

## Two flavours, same root cause

### Flavour 1 — `$t` / vue-i18n legacy (the #742 crash) — **RESOLVED by #744**

Historical pattern; included here for reviewers reading older PRs / blame. Composition-mode `useI18n()` destructures `t` as a closure (`const { t } = useI18n()` in `setup()`), and the closure outlives the instance — so the original crash no longer reproduces:

```js
// HISTORICAL — legacy-mode vue-i18n. Crashed in #742 because vm.$t became
// undefined after the unmount flushed between the two .then blocks.
store() {
  const vm = this;
  axios.post(url, payload)
    .then(r => { vm.close(); vm.$emit('update', r.data.data); return r; })
    .then(() => { vm.$notify({ title: vm.$t('app.success') }); });
}
```

After #744, `$t` is gone from the codebase (`globalInjection: false`) and code uses `t` from a `setup()`-scoped destructure — closure-captured, survives unmount. The structural fix is in place; no rule needed for this flavour.

### Flavour 2 — `$refs` after slot unmount (the #771 crash) — **LIVE**

```js
// BROKEN — second modal's Close button fires closeModal() after the first modal's slot unmounted
closeModal() {
  this.$refs.form.reset();                            // TypeError: cannot read 'reset' of undefined
  this.v$.$reset();
  this.showModalCreateToken = false;
  this.showModalAccessToken = false;
}
```

```js
// FIXED — optional chaining; reset() runs when the form ref is live, no-ops when unmounted
closeModal() {
  this.$refs.form?.reset();
  this.v$.$reset();
  this.showModalCreateToken = false;
  this.showModalAccessToken = false;
}
```

The `$refs` flavour is one method, not two microtasks, but the root cause is the same: the `$refs.form` proxy lookup goes through `instance.refs`, which Vue clears at unmount. When the first modal's `<form ref="form">` template fragment unmounted (slot disappeared on save), `this.$refs.form` became `undefined` for any subsequent click on the second modal's Close button.

## Why a single `.then` body is safe

A single `.then` callback runs as one synchronous block on a single microtask. Vue 3's render scheduler queues reactive updates (including the unmount triggered by the parent's `v-if` flip) onto the *next* microtask. So everything inside one `.then` runs before the unmount flushes. Chain two `.then` blocks and the unmount slots in between them.

`globalProperties`-installed plugins survive the unmount because they're resolved via the proxy's fall-through to `appContext.config.globalProperties` — that map is app-scoped, not instance-scoped. Plugins that survive: `$notify` (from `@kyvg/vue3-notification`), most third-party plugins installed via `app.config.globalProperties.$x = ...`. Plugins that die: vue-i18n legacy `$t`, vuelidate-style instance state, anything installed via `Vue.mixin('beforeCreate', function() { this.$x = ... })` that writes to `this.$x`. **`$refs` always dies** at unmount.

## Flavour-1 audit (done as part of #742) — historical

Greped every `vm = this` capture across `resources/js/` at the time of #742 — 11 sites in 7 files:

| File | Pattern | Vulnerable? |
|------|---------|-------------|
| `people/gifts/CreateGift.vue` × 2 | close()-then-microtask-then-$t() | **Yes (fixed in #742)** |
| `people/activity/CreateActivity.vue` | `$emit + $notify + $t` in one `.then` body | No (single microtask) |
| `settings/ContactFieldTypes.vue` × 2 | `setTimeout(() => vm.$refs.X.focus(), 10)` | No (no unmount in path) |
| `passport/PersonalAccessTokens.vue` | same setTimeout focus idiom | No |
| `passport/Clients.vue` | same setTimeout focus idiom | No |
| `people/Addresses.vue` × 3 | `.then(r => vm.contactAddresses.push/...)` — data mutation only | No (no `$t`/`$emit` after) |
| `people/ContactInformation.vue` | `_.each(data, fn)` with `vm.$t` inside (synchronous) | No |
| `people/gifts/Gifts.vue` | computed property filter using `vm.activeTab` | No |

Made moot by #744 — `$t` no longer exists in components.

## Flavour-2 audit (deferred from #771, completed in #795)

Greped `$refs\.\w+\.` across `resources/js/components/` — 28 method-call sites in 17 files. Classification:

| File:line | Pattern | Vulnerable? | Action |
|-----------|---------|-------------|--------|
| `passport/PersonalAccessTokens.vue:234` | `$refs.form?.reset()` in `closeModal()` after sibling unmount | **Yes** | Already fixed (#771 → #773) |
| `passport/Clients.vue:364` | `$refs.form.reset()` in `closeModal()` | No | Looks like the #771 shape, but the secret modal binds Close to a separate `closeSecretModal()` that never touches `$refs.form` — so the create-modal `closeModal` only fires while the create modal (and its form) is mounted. Documented in `tests/playwright/specs/oauth-client-crud.spec.ts:23-27`. |
| `people/calls/PhoneCallList.vue:381` | `$parent.$refs.lastCalledAttribute.getLastCalled()` after axios `.then` | **Yes** | Add `?.` chain through parent/refs (this PR) |
| `people/gifts/CreateGift.vue:426` | `$refs.upload.forceFileUpload()` in store() axios `.then` chain | **Yes** | Guard via local + early return (this PR) |
| `people/gifts/CreateGift.vue:453` | `$refs.upload.showUploadZone()` in deletePhoto axios `.then` | **Yes** | Add `?.` (this PR) |
| `partials/form/Date.vue:177` | `$refs.picker?.openMenu?.()` | (defensive) | Already defensive |
| `people/photo/PhotoUpload.vue:146` | `this.$refs.file !== undefined ? this.$refs.file.files[0] : undefined` | (defensive) | Already defensive via undefined check |
| `settings/Subscription.vue:260` | `$refs.form.submit()` in `setTimeout(…, 10)` | No | Page-level component, no unmount path between schedule and fire |
| `settings/ContactFieldTypes.vue:384,394` | `setTimeout(() => vm.$refs.X.focus(), 10)` | No | Settings page, no unmount path |
| `passport/PersonalAccessTokens.vue:246` | same setTimeout focus idiom | No | Same reasoning |
| `passport/Clients.vue:253` | same setTimeout focus idiom | No | Same reasoning |
| `people/Tags.vue:158` | `$nextTick(() => $refs.tags.focus())` after `editMode = true` | No | Self-toggle, same component |
| `people/SetAvatar.vue:188,191,205` | `getCroppedCanvas()`, `uploadedImg.files` | No | Synchronous, within same click handler, clipper mounted while modal open |
| `people/document/DocumentList.vue:297` | `$refs.file.files[0]` in change handler | No | Live during the input's own change event |
| `people/gifts/CreateGift.vue:82,147` | inline template handlers, refs always-mounted via `v-show` or same `v-if` parent | No | Refs always live at the click moment |
| `people/photo/PhotoList.vue:14,19` | inline handlers; `photo-upload ref="upload"` is unconditional | No | Always mounted |
| `partials/SpecialDate.vue:241,246,251` | `$refs.X.focus()` in input handlers | No | Same-component native refs |
| `partials/SpecialDeceased.vue:134` | `$refs.deaceasedday.focus()` | No | Same-component |
| `partials/form/PInput.vue:123,124,127` | `$refs.input.checked` toggle | No | Self-instance native input ref |
| `partials/form/Input.vue:162` | `$refs.input.focus()` | No | Self-instance |
| `partials/form/Select.vue:167` | `$refs.select.focus()` | No | Self-instance |

Five sites required fixes (one already done in #771, four in this PR). The rest are documented above as audited-safe so reviewers don't have to redo the analysis.

## Forcing function

The `$refs` flavour goes away when components migrate to `useTemplateRef()` in `setup()` — closure-captured, survives instance teardown. That requires either `<script setup>` or composition-API rewrites, both explicitly out of scope per #702. Until then, this rule stands.

The `$t` flavour is already gone — see Flavour 1 status note above.

## Reviewer checklist

When reviewing a Vue SFC change, scan for:

- [ ] `$refs.X.method()` call inside a handler that *might* fire after a sibling modal/slot unmount → require `$refs.X?.method()` or hoist into the live-instance path.
- [ ] `$refs.X.method()` inside an axios `.then` / `await` whose component can be unmounted before the promise resolves → require `?.` or capture a local guard before the boundary.
- [ ] `setTimeout(() => vm.$refs.X, ...)` where the timeout could fire after unmount → flag (same root cause, different scheduler).
- [ ] `$parent.$refs.X.method()` — also chain through with `?.`; parents unmount too.

## References

- #742 — first fix using this pattern (CreateGift)
- #771 → #773 — `$refs.form?.reset()` fix (Personal Access Tokens)
- [vue-i18n#1440](https://github.com/kazupon/vue-i18n/issues/1440) — "_vueI18n is undefined" thrown when component is unmounted
- [vue-i18n#184](https://github.com/kazupon/vue-i18n/issues/184) — vue-i18n unavailable inside Promise handlers (Vue 2 era, 2017)
- [Vue 3 Migration Guide — Global API / Application Instance](https://v3-migration.vuejs.org/breaking-changes/global-api)
