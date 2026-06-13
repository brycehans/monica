import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockNotify = vi.hoisted(() => vi.fn());
vi.mock('@kyvg/vue3-notification', () => ({ notify: mockNotify }));

import { useNotify } from './useNotify';

describe('useNotify', () => {
  beforeEach(() => {
    mockNotify.mockClear();
  });

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
