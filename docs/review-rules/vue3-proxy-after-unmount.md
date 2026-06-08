# Vue 3 review rule — don't touch the proxy after self-unmount

> Closes #743. First exemplar: #742 (CreateGift two-microtask crash). Related: #771 → #773 (PAT modal `$refs.form` TypeError).

When a Vue component fires a method that triggers its own unmount — typical patterns are `this.close()`, `this.$emit('cancel')`, mutating a parent-controlled state prop that flips a `v-if` off — **everything else on that instance dies on the next microtask**: `this.$t`, `this.$refs`, `this.$emit('update', ...)`, `this.$nextTick`, and data reads via `this.someProp`. Anything past the unmount line in the same call stack is fine (still inside one microtask). Anything *after* a `then` / `await` boundary is not.

This is the predictable consequence of how Vue 3 + vue-i18n@10 (legacy mode) install per-instance plugin bindings on `instance.ctx`, which Vue clears at unmount. Vue 2 + vue-i18n@8 put those bindings on `Vue.prototype`, so prototype-chain lookup still resolved after the instance was destroyed — code that worked for years started crashing on the cutover (#730). It is not in the Vue 3 migration guide, not in vue-i18n's docs, and only surfaces through linked issues: [vue-i18n#1440](https://github.com/kazupon/vue-i18n/issues/1440), [vue-i18n#184](https://github.com/kazupon/vue-i18n/issues/184).

## The rule

> When a method calls `this.close()` / `$emit('cancel')` / anything else that triggers parent-side unmount, all subsequent work on the component instance — `$t`, `$emit('update')`, `$refs`, data reads, `$nextTick` — must happen in the **same** `.then` body (single microtask). If it spans `.then` blocks or crosses an `await`, capture i18n strings and per-instance plugin output to locals **before** the close call.

Equivalent rule for `async`/`await` code: don't `await` between a self-close and any `this.$x` access.

## Two flavours, same root cause

### Flavour 1 — `$t` / vue-i18n legacy (the #742 crash)

```js
// BROKEN — close() in .then #1, $t in .then #2 → unmount flush between them
store() {
  const vm = this;
  axios.post(url, payload)
    .then(r => {
      vm.close();                                     // parent flips v-if → unmount scheduled
      vm.$emit('update', r.data.data);                // still safe (same microtask)
      return r;
    })
    .then(() => {
      vm.$notify({ title: vm.$t('app.success') });    // CRASH: vm.$t is undefined post-unmount
    });
}
```

```js
// FIXED — capture before close, OR collapse into one .then body
store() {
  const vm = this;
  const successTitle = vm.$t('app.success');          // capture i18n strings to locals first
  axios.post(url, payload)
    .then(r => {
      vm.$emit('update', r.data.data);
      vm.close();
      vm.$notify({ title: successTitle });            // local, not vm.$t
    });
}
```

### Flavour 2 — `$refs` after slot unmount (the #771 crash)

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

## Audit done as part of #742

Greped every `vm = this` capture across `resources/js/` — 11 sites in 7 files:

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

The `$refs` flavour audit hasn't been done as a sweep — #771 was found via the #781 D.1 spec authoring. A future audit would grep `$refs\.\w+\.` (refs followed by method call) and check whether the call site could fire after a sibling unmount.

## Forcing function

This whole class of bug goes away when we migrate vue-i18n from legacy mode to the Composition API (`useI18n()`), because `t` is then a setup-time closure that survives instance teardown. The `$refs` flavour goes away with `useTemplateRef()` for the same reason — closure-captured. Both are larger ladder rungs; until then, this rule stands.

## Reviewer checklist

When reviewing a Vue SFC change, scan for:

- [ ] `.then` chain with `close()` / `$emit('cancel')` in one block and any `$t` / `$emit('update')` / `$refs.X.method()` in a later block → flag.
- [ ] `async fn() { ... ; this.close(); await ...; this.$t(...); }` → flag.
- [ ] `$refs.X.method()` call inside a handler that *might* fire after a sibling modal/slot unmount → require `$refs.X?.method()` or hoist into the live-instance path.
- [ ] `setTimeout(() => vm.$x, 10)` where `vm.$x` is `$t`/`$refs`/`$emit('update')` and the setTimeout could fire after unmount → flag (same root cause, different scheduler).

## References

- #742 — first fix using this pattern (CreateGift)
- #771 → #773 — `$refs.form?.reset()` fix (Personal Access Tokens)
- [vue-i18n#1440](https://github.com/kazupon/vue-i18n/issues/1440) — "_vueI18n is undefined" thrown when component is unmounted
- [vue-i18n#184](https://github.com/kazupon/vue-i18n/issues/184) — vue-i18n unavailable inside Promise handlers (Vue 2 era, 2017)
- [Vue 3 Migration Guide — Global API / Application Instance](https://v3-migration.vuejs.org/breaking-changes/global-api)
