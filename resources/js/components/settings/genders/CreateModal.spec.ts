import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { modalMountOptions } from '../../../../../tests/js/helpers';
import CreateModal from './CreateModal.vue';

const genderTypes = [{ id: 'M', name: 'Male', type: 'M' }, { id: 'F', name: 'Female', type: 'F' }];
const defaultGenderType = { id: 'M', name: 'Male', type: 'M', isDefault: false };

describe('genders/CreateModal', () => {
  it('initializes form.type from the defaultGenderType prop', () => {
    const w = mount(CreateModal, { ...modalMountOptions, props: { modelValue: true, genderTypes, defaultGenderType } });
    expect(w.vm.form.type).toBe('M');
  });

  it('store() POSTs to settings/personalization/genders, emits saved + update:modelValue=false', async () => {
    const w = mount(CreateModal, { ...modalMountOptions, props: { modelValue: true, genderTypes, defaultGenderType } });
    w.vm.form.name = 'Test gender';
    w.vm.form.type = 'F';
    w.vm.form.isDefault = true;
    await w.vm.store();
    expect(axios.post).toHaveBeenCalledWith(
      'settings/personalization/genders',
      expect.objectContaining({ name: 'Test gender', type: 'F', isDefault: true }),
    );
    expect(w.emitted('saved')).toBeTruthy();
    expect(w.emitted('update:modelValue')?.flat()).toContain(false);
  });

  it('cancel() emits update:modelValue=false and does not emit saved', () => {
    const w = mount(CreateModal, { ...modalMountOptions, props: { modelValue: true, genderTypes, defaultGenderType } });
    w.vm.cancel();
    expect(w.emitted('update:modelValue')?.flat()).toContain(false);
    expect(w.emitted('saved')).toBeFalsy();
  });
});
