import { describe, it, expect, vi, beforeEach } from 'vitest';

const useModalSpy = vi.fn();

vi.mock('vue-final-modal', () => ({
  useModal: (...args) => useModalSpy(...args),
}));

import { useRowModal } from './useRowModal.js';

const FakeComponent = { name: 'FakeModal' };

describe('useRowModal', () => {
  let patchOptions, open, close;

  beforeEach(() => {
    patchOptions = vi.fn();
    open = vi.fn();
    close = vi.fn();
    useModalSpy.mockReset();
    useModalSpy.mockReturnValue({ patchOptions, open, close });
  });

  it('registers the component with useModal at construction', () => {
    useRowModal(FakeComponent);
    expect(useModalSpy).toHaveBeenCalledWith({ component: FakeComponent, attrs: {} });
  });

  it('open(attrs) patches attrs and opens', () => {
    const modal = useRowModal(FakeComponent);
    const onSaved = vi.fn();
    modal.open({ row: { id: 1 }, onSaved });
    expect(patchOptions).toHaveBeenCalledWith({ attrs: { row: { id: 1 }, onSaved } });
    expect(open).toHaveBeenCalledTimes(1);
    expect(patchOptions.mock.invocationCallOrder[0]).toBeLessThan(open.mock.invocationCallOrder[0]);
  });

  it('open() with no attrs still opens (patches empty attrs)', () => {
    const modal = useRowModal(FakeComponent);
    modal.open();
    expect(patchOptions).toHaveBeenCalledWith({ attrs: {} });
    expect(open).toHaveBeenCalled();
  });

  it('exposes close() that proxies to the underlying useModal close', () => {
    const modal = useRowModal(FakeComponent);
    modal.close();
    expect(close).toHaveBeenCalledTimes(1);
  });
});
