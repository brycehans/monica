import { useModal } from 'vue-final-modal';

// Parent-side helper for registering a per-row modal once and opening it
// with row-specific props. Hides the patchOptions({ attrs: ... }) shape so
// callers can't accidentally hoist `onSaved` out of `attrs` (where it
// reaches the SFC) into the options root (where it silently does nothing).
//
// The contract:
//
//   const create = useRowModal(CreateModal);
//   create.open({ category, onSaved: () => this.refresh() });
//
// `attrs` flow straight through to the SFC's props + listeners. vfm's
// default `keepAlive: false` is left untouched, so each open() remounts the
// SFC with the latest attrs.
export function useRowModal(component) {
  const modal = useModal({ component, attrs: {} });
  return {
    open(attrs = {}) {
      modal.patchOptions({ attrs });
      modal.open();
    },
    close: () => modal.close(),
  };
}
