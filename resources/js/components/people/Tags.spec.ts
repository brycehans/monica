import { describe, it, expect, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import Tags from './Tags.vue';

vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (k: string) => k }) }));
vi.mock('../../composables/useHtmlDir', () => ({ useHtmlDir: () => ({ dirltr: true }) }));
vi.mock('moment', () => ({
  default: () => ({ format: () => 'mock-timestamp' }),
}));

describe('Tags', () => {
  it('fetches tags and contact tags on mount', async () => {
    (globalThis.axios.get as ReturnType<typeof vi.fn>)
      .mockResolvedValue({ data: { data: [] } });
    const w = mount(Tags, { props: { hash: 'abc123' } });
    await flushPromises();
    expect(globalThis.axios.get).toHaveBeenCalledWith('tags');
    expect(globalThis.axios.get).toHaveBeenCalledWith('people/abc123/tags');
  });

  it('removeTag splices the tag and calls store', async () => {
    const tag = { id: 1, name: 'friend' };
    (globalThis.axios.get as ReturnType<typeof vi.fn>)
      .mockResolvedValue({ data: { data: [tag] } });
    const w = mount(Tags, { props: { hash: 'abc123' } });
    await flushPromises();
    await w.vm.removeTag(tag);
    expect(w.vm.contactTags).not.toContain(tag);
    expect(globalThis.axios.post).toHaveBeenCalledWith(
      'people/abc123/tags/update',
      expect.any(Array),
    );
  });

  it('filterResults excludes tags already in contactTags and is case-insensitive', async () => {
    (globalThis.axios.get as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ data: { data: [{ id: 1, name: 'Friend' }, { id: 2, name: 'Family' }] } })
      .mockResolvedValueOnce({ data: { data: [{ id: 1, name: 'Friend' }] } });
    const w = mount(Tags, { props: { hash: 'abc123' } });
    await flushPromises();
    // Drive search via the onChange pathway to avoid clobbering reactive refs.
    await w.find('input[type="text"]').setValue('f');
    w.vm.onChange();
    expect(w.vm.results).toHaveLength(1);
    expect(w.vm.results[0].name).toBe('Family');
  });

  it('onEscape resets arrowCounter, closes dropdown, clears search', async () => {
    (globalThis.axios.get as ReturnType<typeof vi.fn>)
      .mockResolvedValue({ data: { data: [] } });
    const w = mount(Tags, { props: { hash: 'abc123' } });
    await flushPromises();
    // Enter edit mode so the input is rendered, then type to open the dropdown.
    await w.vm.enterEditMode();
    await w.find('input[type="text"]').setValue('foo');
    w.vm.onChange();
    expect(w.vm.isOpen).toBe(true);
    w.vm.onEscape();
    expect(w.vm.arrowCounter).toBe(-1);
    expect(w.vm.isOpen).toBe(false);
    expect(w.vm.search).toBe('');
  });

  it('onEnter pushes a new tag with the search text and clears state', async () => {
    (globalThis.axios.get as ReturnType<typeof vi.fn>)
      .mockResolvedValue({ data: { data: [] } });
    const w = mount(Tags, { props: { hash: 'abc123' } });
    await flushPromises();
    w.vm.search = 'newtag';
    w.vm.onEnter();
    expect(w.vm.contactTags).toEqual([
      expect.objectContaining({ name: 'newtag', id: 'mock-timestamp' }),
    ]);
    expect(w.vm.search).toBe('');
    expect(w.vm.isOpen).toBe(false);
    expect(w.vm.arrowCounter).toBe(-1);
  });

  it('onEnter does nothing when search is empty', async () => {
    (globalThis.axios.get as ReturnType<typeof vi.fn>)
      .mockResolvedValue({ data: { data: [] } });
    const w = mount(Tags, { props: { hash: 'abc123' } });
    await flushPromises();
    w.vm.search = '';
    w.vm.onEnter();
    expect(w.vm.contactTags).toEqual([]);
  });

  it('setResult pushes the result tag and clears search', async () => {
    (globalThis.axios.get as ReturnType<typeof vi.fn>)
      .mockResolvedValue({ data: { data: [] } });
    const w = mount(Tags, { props: { hash: 'abc123' } });
    await flushPromises();
    const result = { id: 42, name: 'Family' };
    w.vm.setResult(result);
    expect(w.vm.contactTags).toContainEqual(result);
    expect(w.vm.search).toBe('');
    expect(w.vm.isOpen).toBe(false);
  });
});
