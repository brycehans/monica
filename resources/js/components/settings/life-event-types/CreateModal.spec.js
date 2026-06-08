import { describe, it, expect } from 'vitest';
import { mountModal } from '../../../../../tests/js/helpers.js';
import CreateModal from './CreateModal.vue';

const familyCategory = { id: 4, default_life_event_category_key: 'family' };
const workCategory = { id: 7, default_life_event_category_key: 'work_education' };

describe('life-event-types/CreateModal', () => {
  it('initializes form.life_event_category_id from the category prop (different categories → different state)', () => {
    const a = mountModal(CreateModal, { props: { modelValue: true, category: familyCategory } });
    expect(a.vm.form.life_event_category_id).toBe(4);
    expect(a.vm.form.name).toBe('');

    const b = mountModal(CreateModal, { props: { modelValue: true, category: workCategory } });
    expect(b.vm.form.life_event_category_id).toBe(7);
  });

  it('store() POSTs to settings/personalization/lifeeventtypes, emits saved + update:modelValue=false', async () => {
    const w = mountModal(CreateModal, { props: { modelValue: true, category: familyCategory } });
    w.vm.form.name = 'New milestone';
    await w.vm.store();
    expect(axios.post).toHaveBeenCalledWith(
      'settings/personalization/lifeeventtypes',
      expect.objectContaining({ name: 'New milestone', life_event_category_id: 4 }),
    );
    expect(w.emitted('saved')).toBeTruthy();
    expect(w.emitted('update:modelValue')?.flat()).toContain(false);
  });

  it('cancel() emits update:modelValue=false and does not emit saved', () => {
    const w = mountModal(CreateModal, { props: { modelValue: true, category: familyCategory } });
    w.vm.cancel();
    expect(w.emitted('update:modelValue')?.flat()).toContain(false);
    expect(w.emitted('saved')).toBeFalsy();
  });
});
