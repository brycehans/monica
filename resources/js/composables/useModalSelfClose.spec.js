import { describe, it, expect, vi } from 'vitest';
import { useModalSelfClose } from './useModalSelfClose.js';

describe('useModalSelfClose', () => {
  it('cancel() emits update:modelValue=false', () => {
    const emit = vi.fn();
    const { cancel } = useModalSelfClose(emit);
    cancel();
    expect(emit).toHaveBeenCalledTimes(1);
    expect(emit).toHaveBeenCalledWith('update:modelValue', false);
  });

  it('finish() emits saved then update:modelValue=false', () => {
    const emit = vi.fn();
    const { finish } = useModalSelfClose(emit);
    finish();
    expect(emit).toHaveBeenNthCalledWith(1, 'saved');
    expect(emit).toHaveBeenNthCalledWith(2, 'update:modelValue', false);
  });

  it('sync(v) forwards the value to update:modelValue', () => {
    const emit = vi.fn();
    const { sync } = useModalSelfClose(emit);
    sync(false);
    expect(emit).toHaveBeenLastCalledWith('update:modelValue', false);
    sync(true);
    expect(emit).toHaveBeenLastCalledWith('update:modelValue', true);
  });

  it('cancel ignores any incoming arg (e.g. a MouseEvent from @click)', () => {
    const emit = vi.fn();
    const { cancel } = useModalSelfClose(emit);
    cancel({ type: 'click', preventDefault: vi.fn() });
    expect(emit).toHaveBeenCalledWith('update:modelValue', false);
  });
});
