// SFC-side helper for the vue-final-modal useModal() contract.
//
// Each per-row modal SFC accepts modelValue: Boolean and is expected to
// emit `update:modelValue` on cancel and post-save so vfm's `keepAlive: false`
// destroys the instance — the next open() then re-mounts with fresh props.
// Forgetting either emit leaves a stale instance in dynamicModals and the
// next open shows the previous row's data. This helper makes the contract
// a single call site so it's harder to miss.
//
// Usage from a modal SFC:
//
//   setup(_, { emit }) {
//     const { cancel, finish, sync } = useModalSelfClose(emit);
//     return { cancel, finish, sync };
//   },
//
// Template wires `@update:model-value="sync"` on <monica-modal>, the cancel
// button uses `@click.prevent="cancel"`, and the success path calls
// `axios.post(...).then(this.finish)`.
export function useModalSelfClose(emit) {
  return {
    cancel: () => emit('update:modelValue', false),
    finish: () => {
      emit('saved');
      emit('update:modelValue', false);
    },
    sync: (v) => emit('update:modelValue', v),
  };
}
