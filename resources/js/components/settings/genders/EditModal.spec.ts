import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { modalMountOptions } from '../../../../../tests/js/helpers';
import EditModal from './EditModal.vue';

const genderTypes = [{ id: 'M', name: 'Male', type: 'M' }, { id: 'F', name: 'Female', type: 'F' }];
const aliceGender = { id: 7, name: 'Alice', type: 'F', isDefault: false };
const bobGender = { id: 11, name: 'Bob', type: 'M', isDefault: true };

describe('genders/EditModal', () => {
  it('initializes form from the gender prop (different rows → different state)', () => {
    const a = mount(EditModal, { ...modalMountOptions, props: { modelValue: true, gender: aliceGender, genderTypes } });
    expect(a.vm.form.id).toBe('7');
    expect(a.vm.form.name).toBe('Alice');
    expect(a.vm.form.type).toBe('F');
    expect(a.vm.form.isDefault).toBe(false);

    const b = mount(EditModal, { ...modalMountOptions, props: { modelValue: true, gender: bobGender, genderTypes } });
    expect(b.vm.form.id).toBe('11');
    expect(b.vm.form.name).toBe('Bob');
    expect(b.vm.form.type).toBe('M');
    expect(b.vm.form.isDefault).toBe(true);
  });

  it('update() PUTs to settings/personalization/genders/{id}, emits saved + update:modelValue=false', async () => {
    const w = mount(EditModal, { ...modalMountOptions, props: { modelValue: true, gender: aliceGender, genderTypes } });
    w.vm.form.name = 'Alice II';
    await w.vm.update();
    expect(axios.put).toHaveBeenCalledWith(
      'settings/personalization/genders/7',
      expect.objectContaining({ name: 'Alice II', type: 'F', isDefault: false }),
    );
    expect(w.emitted('saved')).toBeTruthy();
    expect(w.emitted('update:modelValue')?.flat()).toContain(false);
  });

  it('cancel() emits update:modelValue=false and does not emit saved', () => {
    const w = mount(EditModal, { ...modalMountOptions, props: { modelValue: true, gender: aliceGender, genderTypes } });
    w.vm.cancel();
    expect(w.emitted('update:modelValue')?.flat()).toContain(false);
    expect(w.emitted('saved')).toBeFalsy();
  });
});
