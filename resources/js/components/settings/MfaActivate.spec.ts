import { describe, it, expect, vi, beforeEach } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import MfaActivate from './MfaActivate.vue';

vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (k: string) => k }) }));

const mockNotify = vi.hoisted(() => vi.fn());
vi.mock('../../composables/useNotify', () => ({ useNotify: () => ({ notify: mockNotify }) }));

describe('MfaActivate', () => {
  beforeEach(() => {
    mockNotify.mockClear();
  });

  it('selectActivated mirrors the activated prop on mount', () => {
    const w = mount(MfaActivate, { props: { activated: true } });
    expect(w.vm.selectActivated).toBe(true);
  });

  it('selectActivated updates when activated prop changes', async () => {
    const w = mount(MfaActivate, { props: { activated: false } });
    expect(w.vm.selectActivated).toBe(false);
    await w.setProps({ activated: true });
    expect(w.vm.selectActivated).toBe(true);
  });

  it('showDisableModal sets disableModalOpen to true', () => {
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
    await flushPromises();
    expect(w.vm.enableModalOpen).toBe(true);
    expect(w.vm.image).toBe('<svg/>');
    expect(w.vm.secret).toBe('ABC123');
  });
});
