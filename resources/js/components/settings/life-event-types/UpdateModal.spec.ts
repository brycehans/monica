import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { modalMountOptions } from '../../../../../tests/js/helpers';
import UpdateModal from './UpdateModal.vue';

const customType = { id: 12, name: 'Anniversary', default_life_event_type_key: 'birthday' };
const builtinType = { id: 5, name: '', default_life_event_type_key: 'birthday' };

describe('life-event-types/UpdateModal', () => {
  it('initializes form from the type and categoryId props (custom name)', () => {
    const w = mount(UpdateModal, { ...modalMountOptions, props: { modelValue: true, type: customType, categoryId: 3 } });
    expect(w.vm.form.id).toBe(12);
    expect(w.vm.form.name).toBe('Anniversary');
    expect(w.vm.form.life_event_category_id).toBe(3);
  });

  it('falls back to the i18n sentence key when type.name is empty', () => {
    const w = mount(UpdateModal, { ...modalMountOptions, props: { modelValue: true, type: builtinType, categoryId: 3 } });
    expect(w.vm.form.name).toBe('people.life_event_sentence_birthday');
  });

  it('update() PUTs to settings/personalization/lifeeventtypes/{id}, emits saved + update:modelValue=false', async () => {
    const w = mount(UpdateModal, { ...modalMountOptions, props: { modelValue: true, type: customType, categoryId: 3 } });
    w.vm.form.name = 'Anniversary II';
    await w.vm.update();
    expect(axios.put).toHaveBeenCalledWith(
      'settings/personalization/lifeeventtypes/12',
      expect.objectContaining({ id: 12, name: 'Anniversary II', life_event_category_id: 3 }),
    );
    expect(w.emitted('saved')).toBeTruthy();
    expect(w.emitted('update:modelValue')?.flat()).toContain(false);
  });

  it('cancel() emits update:modelValue=false and does not emit saved', () => {
    const w = mount(UpdateModal, { ...modalMountOptions, props: { modelValue: true, type: customType, categoryId: 3 } });
    w.vm.cancel();
    expect(w.emitted('update:modelValue')?.flat()).toContain(false);
    expect(w.emitted('saved')).toBeFalsy();
  });
});
