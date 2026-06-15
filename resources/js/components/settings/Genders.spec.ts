import { describe, it, expect, vi, beforeEach } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import Genders from './Genders.vue';

// vue3-notification's <notifications> is a globally-registered component in
// the real app. Stub it here so Vue Test Utils doesn't warn on every mount.
const mountWithStubs = (component: typeof Genders) =>
  mount(component, { global: { stubs: { notifications: true } } });

vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (k: string) => k }) }));
vi.mock('../../composables/useHtmlDir', () => ({ useHtmlDir: () => ({ dirltr: true }) }));

// Stub the row-modal composable so we can observe open() calls without
// pulling vue-final-modal into the test.
const openSpies = vi.hoisted(() => ({
  create: vi.fn(),
  edit: vi.fn(),
  delete: vi.fn(),
  setDefault: vi.fn(),
}));
vi.mock('../../composables/useRowModal', () => ({
  useRowModal: (component: { name?: string } | undefined) => {
    const name = component?.name ?? '';
    const spy =
      name === 'CreateModal' ? openSpies.create :
        name === 'EditModal' ? openSpies.edit :
          name === 'DeleteModal' ? openSpies.delete :
            openSpies.setDefault;
    return { open: spy, close: vi.fn() };
  },
}));

vi.mock('./genders/CreateModal.vue', () => ({ default: { name: 'CreateModal', render: () => null } }));
vi.mock('./genders/EditModal.vue', () => ({ default: { name: 'EditModal', render: () => null } }));
vi.mock('./genders/DeleteModal.vue', () => ({ default: { name: 'DeleteModal', render: () => null } }));
vi.mock('./genders/SetDefaultModal.vue', () => ({ default: { name: 'SetDefaultModal', render: () => null } }));

const objectKeyedGenders = {
  '2': { id: 3, name: 'Other', type: 'O', isDefault: false, numberOfContacts: 0 },
  '0': { id: 1, name: 'Man', type: 'M', isDefault: false, numberOfContacts: 0 },
  '1': { id: 2, name: 'Woman', type: 'F', isDefault: false, numberOfContacts: 0 },
};

describe('Genders', () => {
  beforeEach(() => {
    openSpies.create.mockClear();
    openSpies.edit.mockClear();
    openSpies.delete.mockClear();
    openSpies.setDefault.mockClear();
  });

  it('renders an object-keyed gender map as a list (regression: post-Collator::asort shape)', async () => {
    // The endpoint sorts via PHP Collator::asort which leaves non-sequential
    // integer keys, so Laravel JSON-serialises the response as an object.
    // The component must restore an array via Object.values, otherwise the
    // .find() in defaultGenderType throws and any modal click crashes.
    (globalThis.axios.get as ReturnType<typeof vi.fn>)
      .mockImplementation((url: string) => {
        if (url === 'settings/personalization/genders') {
          return Promise.resolve({ data: objectKeyedGenders });
        }
        if (url === 'settings/personalization/genderTypes') {
          return Promise.resolve({ data: { '0': { id: 'M', name: 'Male' } } });
        }
        return Promise.resolve({ data: [] });
      });

    const w = mountWithStubs(Genders);
    await flushPromises();

    expect(w.text()).toContain('Man');
    expect(w.text()).toContain('Woman');
    expect(w.text()).toContain('Other');
  });

  it('opens the create modal without throwing when no gender has isDefault=true', async () => {
    // Pre-fix bug: defaultGenderType was computed as .find() on the raw
    // (still-object) response, which threw "p.value.find is not a function"
    // the moment any handler that touched it ran.
    (globalThis.axios.get as ReturnType<typeof vi.fn>)
      .mockImplementation((url: string) => {
        if (url === 'settings/personalization/genders') {
          return Promise.resolve({ data: objectKeyedGenders });
        }
        return Promise.resolve({ data: {} });
      });

    const w = mountWithStubs(Genders);
    await flushPromises();

    // Trigger via the "Add new gender type" link in the template
    await w.find('a.btn').trigger('click');

    expect(openSpies.create).toHaveBeenCalledTimes(1);
    // No gender has isDefault=true → fall back to genders[0] so the create
    // modal can preselect a `type`. Without this, the server's validation
    // rejects the form (covered by tests/playwright/specs/dependency-upgrade-smoke
    // gender create flow).
    const defaultPassed = openSpies.create.mock.calls[0][0].defaultGenderType;
    expect(defaultPassed).toBeDefined();
    // Object.values on integer-like string keys iterates in numeric ASC order
    // (not insertion order), so genders[0] = id 1 ("Man").
    expect(defaultPassed.id).toBe(1);
  });

  it('prefers an explicitly-marked default over genders[0] when present', async () => {
    const withExplicitDefault = {
      '0': { id: 1, name: 'Man', type: 'M', isDefault: false, numberOfContacts: 0 },
      '1': { id: 2, name: 'Woman', type: 'F', isDefault: true, numberOfContacts: 0 },
    };
    (globalThis.axios.get as ReturnType<typeof vi.fn>)
      .mockImplementation((url: string) => {
        if (url === 'settings/personalization/genders') {
          return Promise.resolve({ data: withExplicitDefault });
        }
        return Promise.resolve({ data: {} });
      });

    const w = mountWithStubs(Genders);
    await flushPromises();
    await w.find('a.btn').trigger('click');

    expect(openSpies.create.mock.calls[0][0].defaultGenderType.id).toBe(2);
  });

  it('survives a null response body (Object.values(null) would otherwise throw)', async () => {
    // Degraded-fetch hardening. Object.values(null) throws TypeError, which
    // would surface as an uncaught render crash. The ?? {} fallback keeps the
    // component mountable so the empty-state UI shows instead.
    (globalThis.axios.get as ReturnType<typeof vi.fn>)
      .mockResolvedValue({ data: null });

    const w = mountWithStubs(Genders);
    await flushPromises();

    expect(w.exists()).toBe(true);
    // The i18n stub returns the key, so we look for the title key rather
    // than its translation. What matters is the component mounted and didn't
    // explode on null response data.
    expect(w.text()).toContain('settings.personalization_genders_title');
  });
});
