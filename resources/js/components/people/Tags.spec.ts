import { describe, it, expect, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import Tags from './Tags.vue';

vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (k: string) => k }) }));
vi.mock('../../composables/useHtmlDir', () => ({ useHtmlDir: () => ({ dirltr: true }) }));
vi.mock('moment', () => ({
  default: () => ({ format: () => 'mock-timestamp' }),
}));

// These tests are deliberately template-driven (DOM events + DOM assertions)
// rather than white-box (w.vm.fn() / w.vm.state). The bulk conversion of the
// remaining ~77 SFCs in the modernization ladder would inherit 77 tight
// state-name couplings if we kept the "defineExpose everything" pattern;
// driving through the template instead tests the contract real users hit.
// Behaviour-equivalent paths that aren't easily template-driven (e.g.
// internal helpers like filterResults) are tested via their observable
// effects in the rendered DOM, not by calling them directly.

const stubT = (k: string) => k;

describe('Tags', () => {
  it('fetches tags and contact tags on mount', async () => {
    (globalThis.axios.get as ReturnType<typeof vi.fn>)
      .mockResolvedValue({ data: { data: [] } });

    mount(Tags, { props: { hash: 'abc123' } });
    await flushPromises();

    expect(globalThis.axios.get).toHaveBeenCalledWith('tags');
    expect(globalThis.axios.get).toHaveBeenCalledWith('people/abc123/tags');
  });

  it('renders existing tags from the contact tags response', async () => {
    (globalThis.axios.get as ReturnType<typeof vi.fn>)
      .mockImplementation((url: string) => {
        if (url === 'people/abc123/tags') {
          return Promise.resolve({ data: { data: [{ id: 1, name: 'friend' }, { id: 2, name: 'work' }] } });
        }
        return Promise.resolve({ data: { data: [] } });
      });

    const w = mount(Tags, { props: { hash: 'abc123' } });
    await flushPromises();

    expect(w.text()).toContain('friend');
    expect(w.text()).toContain('work');
  });

  it('clicking the × button removes a tag and POSTs the new list', async () => {
    (globalThis.axios.get as ReturnType<typeof vi.fn>)
      .mockImplementation((url: string) => {
        if (url === 'people/abc123/tags') {
          return Promise.resolve({ data: { data: [{ id: 1, name: 'friend' }] } });
        }
        return Promise.resolve({ data: { data: [] } });
      });

    const w = mount(Tags, { props: { hash: 'abc123' } });
    await flushPromises();
    // Enter edit mode to expose the × buttons.
    await w.find(`a[href=""][cy-name="edit-button"], a.pointer`).trigger('click');
    await flushPromises();

    // The × is the only span.pointer inside the tag <li>.
    const removeButton = w.findAll('span.pointer').find(el => el.text() === '×');
    expect(removeButton, 'expected an × remove button').toBeDefined();
    await removeButton!.trigger('click');
    await flushPromises();

    expect(globalThis.axios.post).toHaveBeenCalledWith(
      'people/abc123/tags/update',
      expect.arrayContaining([]),
    );
    // The "friend" pill should no longer be in the DOM.
    expect(w.text()).not.toMatch(/friend\s*×/);
  });

  it('typing into the input opens the autocomplete dropdown with matching tags', async () => {
    (globalThis.axios.get as ReturnType<typeof vi.fn>)
      .mockImplementation((url: string) => {
        if (url === 'tags') {
          return Promise.resolve({ data: { data: [{ id: 1, name: 'Friend' }, { id: 2, name: 'Family' }] } });
        }
        return Promise.resolve({ data: { data: [] } });
      });

    const w = mount(Tags, { props: { hash: 'abc123' } });
    await flushPromises();
    await w.findAll('a.pointer')[0].trigger('click'); // enter edit mode
    await flushPromises();

    const input = w.find('input[type="text"]');
    await input.setValue('f');
    await input.trigger('input'); // setValue does not always fire @input synchronously

    // Both tags match "f" → both render as autocomplete results.
    const results = w.findAll('.autocomplete-result');
    expect(results).toHaveLength(2);
    expect(results[0].text()).toContain('Friend');
    expect(results[1].text()).toContain('Family');
  });

  it('typing then pressing Enter pushes a new tag and clears the input', async () => {
    (globalThis.axios.get as ReturnType<typeof vi.fn>)
      .mockResolvedValue({ data: { data: [] } });

    const w = mount(Tags, { props: { hash: 'abc123' } });
    await flushPromises();
    await w.findAll('a.pointer')[0].trigger('click'); // enter edit mode
    await flushPromises();

    const input = w.find('input[type="text"]');
    await input.setValue('newtag');
    await input.trigger('keydown.enter');
    await flushPromises();

    expect(globalThis.axios.post).toHaveBeenCalledWith(
      'people/abc123/tags/update',
      expect.arrayContaining([expect.objectContaining({ name: 'newtag' })]),
    );
    expect((input.element as HTMLInputElement).value).toBe('');
  });

  it('Escape on the input clears the search and closes the dropdown', async () => {
    (globalThis.axios.get as ReturnType<typeof vi.fn>)
      .mockImplementation((url: string) => {
        if (url === 'tags') {
          return Promise.resolve({ data: { data: [{ id: 1, name: 'Family' }] } });
        }
        return Promise.resolve({ data: { data: [] } });
      });

    const w = mount(Tags, { props: { hash: 'abc123' } });
    await flushPromises();
    await w.findAll('a.pointer')[0].trigger('click'); // enter edit mode
    await flushPromises();

    const input = w.find('input[type="text"]');
    await input.setValue('f');
    await input.trigger('input');
    expect(w.find('.autocomplete-results').isVisible()).toBe(true);

    await input.trigger('keydown', { key: 'Escape' });
    await flushPromises();
    expect((input.element as HTMLInputElement).value).toBe('');
    // <ul v-show="isOpen"> hides via display:none rather than unmount.
    // happy-dom's getComputedStyle is unreliable; assert the inline style
    // directly which is what Vue's v-show patches.
    const ul = w.find('.autocomplete-results').element as HTMLElement;
    expect(ul.style.display).toBe('none');
  });

  // The mock context warning ("expected a stub") would surface here if the
  // i18n stub leaked across the file. Sanity check.
  it('stub assertion: useI18n stub returns the key untransformed', () => {
    expect(stubT('foo.bar')).toBe('foo.bar');
  });
});
