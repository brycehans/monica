import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { modalMountOptions } from '../../../../../tests/js/helpers';
import DeleteModal from './DeleteModal.vue';

const allGenders = [
  { id: 1, name: 'Man', type: 'M', isDefault: false, numberOfContacts: 5 },
  { id: 2, name: 'Woman', type: 'F', isDefault: true, numberOfContacts: 0 },
  { id: 3, name: 'Other', type: 'O', isDefault: false, numberOfContacts: 0 },
];

const simpleDeletable = { id: 3, name: 'Other', isDefault: false, numberOfContacts: 0 };
const hasContacts = { id: 1, name: 'Man', isDefault: false, numberOfContacts: 5 };
const isDefault = { id: 2, name: 'Woman', isDefault: true, numberOfContacts: 0 };

describe('genders/DeleteModal', () => {
  it('initializes form from the gender prop and starts with empty errorMessage', () => {
    const w = mount(DeleteModal, { ...modalMountOptions, props: { modelValue: true, gender: hasContacts, genders: allGenders } });
    expect(w.vm.form.id).toBe('1');
    expect(w.vm.form.name).toBe('Man');
    expect(w.vm.form.isDefault).toBe(false);
    expect(w.vm.form.numberOfContacts).toBe(5);
    expect(w.vm.errorMessage).toBe('');
  });

  it('trash() (no contacts, not default) DELETEs and emits saved + close', async () => {
    const w = mount(DeleteModal, { ...modalMountOptions, props: { modelValue: true, gender: simpleDeletable, genders: allGenders } });
    await w.vm.trash();
    expect(axios.delete).toHaveBeenCalledWith('settings/personalization/genders/3');
    expect(w.emitted('saved')).toBeTruthy();
    expect(w.emitted('update:modelValue')?.flat()).toContain(false);
  });

  it('trashAndReplace() DELETEs with replaceby and emits saved + close', async () => {
    const w = mount(DeleteModal, { ...modalMountOptions, props: { modelValue: true, gender: hasContacts, genders: allGenders } });
    w.vm.form.newId = 2;
    await w.vm.trashAndReplace();
    expect(axios.delete).toHaveBeenCalledWith('settings/personalization/genders/1/replaceby/2');
    expect(w.emitted('saved')).toBeTruthy();
    expect(w.emitted('update:modelValue')?.flat()).toContain(false);
  });

  it('trashAndReplace() with structured error sets errorMessage from response.data.message', async () => {
    (axios.delete as ReturnType<typeof vi.fn>).mockRejectedValueOnce({ response: { data: { message: 'cannot delete' } } });
    const w = mount(DeleteModal, { ...modalMountOptions, props: { modelValue: true, gender: hasContacts, genders: allGenders } });
    w.vm.form.newId = 2;
    await w.vm.trashAndReplace();
    expect(w.vm.errorMessage).toBe('cannot delete');
    expect(w.emitted('saved')).toBeFalsy();
  });

  it('trashAndReplace() with non-object error falls back to app.error_try_again', async () => {
    (axios.delete as ReturnType<typeof vi.fn>).mockRejectedValueOnce({ response: { data: 'oops' } });
    const w = mount(DeleteModal, { ...modalMountOptions, props: { modelValue: true, gender: isDefault, genders: allGenders } });
    w.vm.form.newId = 3;
    await w.vm.trashAndReplace();
    expect(w.vm.errorMessage).toBe('app.error_try_again');
    expect(w.emitted('saved')).toBeFalsy();
  });

  it('cancel() emits update:modelValue=false (no saved)', () => {
    const w = mount(DeleteModal, { ...modalMountOptions, props: { modelValue: true, gender: simpleDeletable, genders: allGenders } });
    w.vm.cancel();
    expect(w.emitted('update:modelValue')?.flat()).toContain(false);
    expect(w.emitted('saved')).toBeFalsy();
  });
});
