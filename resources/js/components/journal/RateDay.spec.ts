import { describe, it, expect, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import RateDay from './RateDay.vue';

vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (k: string) => k }) }));
vi.mock('../../composables/useHtmlDir', () => ({ useHtmlDir: () => ({ dirltr: true }) }));

describe('RateDay', () => {
  it('fetches journal/hasRated on mount', async () => {
    (globalThis.axios.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: 'notYet' });
    const w = mount(RateDay);
    await flushPromises();
    expect(globalThis.axios.get).toHaveBeenCalledWith('journal/hasRated');
    expect(w.html()).toContain('journal.journal_rate');
  });

  it('showComment sets rate and transitions to addComment state', () => {
    (globalThis.axios.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: 'notYet' });
    const w = mount(RateDay);
    w.vm.showComment(2);
    expect(w.vm.hasRated).toBe('addComment');
    expect(w.vm.day.rate).toBe(2);
  });

  it('dismiss resets to notYet with cleared day', () => {
    (globalThis.axios.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: 'notYet' });
    const w = mount(RateDay);
    w.vm.showComment(1);
    w.vm.dismiss();
    expect(w.vm.hasRated).toBe('notYet');
    expect(w.vm.day.rate).toBe(0);
    expect(w.vm.day.comment).toBe('');
  });

  it('rate() posts day data and emits hasRated', async () => {
    (globalThis.axios.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: { id: 5 } });
    const w = mount(RateDay);
    w.vm.showComment(3);
    await w.vm.rate();
    expect(globalThis.axios.post).toHaveBeenCalledWith('journal/day', expect.objectContaining({ rate: 3 }));
    expect(w.emitted('hasRated')?.[0]).toEqual([{ id: 5 }]);
  });
});
