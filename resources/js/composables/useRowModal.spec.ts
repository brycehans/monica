import { describe, it, expect, vi, beforeEach } from 'vitest';

// Faithfully model vue-final-modal's merge-only patchOptions semantics
// (verified against node_modules/vue-final-modal@4.5.5 dist/index.es.mjs:
// `Object.entries(r).forEach(([m, f]) => { t[m] = f; })` — assigns keys,
// never deletes). A naive `vi.fn()` spy would let a regression slip past
// because it wouldn't simulate the bug we're guarding against.
const useModalSpy = vi.fn();

vi.mock('vue-final-modal', () => ({
  useModal: (...args: unknown[]) => useModalSpy(...args),
}));

import { useRowModal } from './useRowModal';

const FakeComponent = { name: 'FakeModal' };

type FakeModal = {
  options: { attrs: Record<string, unknown> };
  open: ReturnType<typeof vi.fn>;
  close: ReturnType<typeof vi.fn>;
  patchOptions: ReturnType<typeof vi.fn>;
};

function createFakeModal(): FakeModal {
  const options: { attrs: Record<string, unknown> } = { attrs: {} };
  return {
    options,
    open: vi.fn(),
    close: vi.fn(),
    patchOptions: vi.fn((patch: { attrs?: Record<string, unknown> }) => {
      if (patch?.attrs) {
        for (const [k, v] of Object.entries(patch.attrs)) {
          options.attrs[k] = v;
        }
      }
    }),
  };
}

describe('useRowModal', () => {
  let fake: FakeModal;

  beforeEach(() => {
    fake = createFakeModal();
    useModalSpy.mockReset();
    useModalSpy.mockReturnValue(fake);
  });

  it('registers the component with useModal at construction', () => {
    useRowModal(FakeComponent);
    expect(useModalSpy).toHaveBeenCalledWith({ component: FakeComponent, attrs: {} });
  });

  it('open(attrs) populates options.attrs and calls open', () => {
    const modal = useRowModal(FakeComponent);
    const onSaved = vi.fn();
    modal.open({ row: { id: 1 }, onSaved });
    expect(fake.options.attrs).toEqual({ row: { id: 1 }, onSaved });
    expect(fake.open).toHaveBeenCalledTimes(1);
    expect(fake.patchOptions.mock.invocationCallOrder[0])
      .toBeLessThan(fake.open.mock.invocationCallOrder[0]);
  });

  it('clears stale attrs from a previous open before the next set', () => {
    const modal = useRowModal(FakeComponent);
    const firstSaved = vi.fn();
    const secondSaved = vi.fn();

    modal.open({ row: { id: 1 }, onSaved: firstSaved });
    modal.open({ row: { id: 2 }, onSaved: secondSaved });

    expect(fake.options.attrs).toEqual({ row: { id: 2 }, onSaved: secondSaved });
    expect(fake.options.attrs.onSaved).toBe(secondSaved);
    expect(fake.options.attrs.onSaved).not.toBe(firstSaved);
  });

  it('does NOT leak a previous-open onSaved when the next open omits it', () => {
    // The bug we're guarding against: vfm's patchOptions merges, so a second
    // open() that drops `onSaved` would otherwise keep firing the FIRST
    // open's handler. This is the load-bearing assertion for the helper.
    const modal = useRowModal(FakeComponent);
    const leakedHandler = vi.fn();

    modal.open({ row: { id: 1 }, onSaved: leakedHandler });
    modal.open({ row: { id: 2 } });

    expect(fake.options.attrs).toEqual({ row: { id: 2 } });
    expect(fake.options.attrs.onSaved).toBeUndefined();
  });

  it('clears arbitrary previous attrs that the next open does not mention', () => {
    const modal = useRowModal(FakeComponent);

    modal.open({ a: 1, b: 2, c: 3 });
    modal.open({ a: 9 });

    expect(fake.options.attrs).toEqual({ a: 9 });
    expect(fake.options.attrs.b).toBeUndefined();
    expect(fake.options.attrs.c).toBeUndefined();
  });

  it('open() with no attrs still opens (with empty attrs)', () => {
    const modal = useRowModal(FakeComponent);
    modal.open();
    expect(fake.options.attrs).toEqual({});
    expect(fake.open).toHaveBeenCalled();
  });

  it('exposes close() that proxies to the underlying useModal close', () => {
    const modal = useRowModal(FakeComponent);
    modal.close();
    expect(fake.close).toHaveBeenCalledTimes(1);
  });
});
