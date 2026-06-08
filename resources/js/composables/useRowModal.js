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
//
// Merge gotcha (verified against node_modules/vue-final-modal@4.5.5
// dist/index.es.mjs, ~line 1007): vfm's `patchOptions({ attrs })` MERGES
// keys into the existing `options.attrs` object via
// `Object.entries(new).forEach(([k, v]) => { existing[k] = v })`. It never
// deletes keys. So a second `open({ row: B })` after a first
// `open({ row: A, onSaved: cbA })` would leave `onSaved: cbA` attached to
// the next mount — a stale listener that fires when the wrong row saves.
// We clear `options.attrs` between opens so each call starts from a clean
// slate; callers don't have to remember to pass every key every time.
export function useRowModal(component) {
  const modal = useModal({ component, attrs: {} });
  return {
    open(attrs = {}) {
      for (const key of Object.keys(modal.options.attrs)) {
        delete modal.options.attrs[key];
      }
      modal.patchOptions({ attrs });
      modal.open();
    },
    close: () => modal.close(),
  };
}
