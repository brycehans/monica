import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { modalMountOptions } from '../../../../../tests/js/helpers';
import DeleteModal from './DeleteModal.vue';

const aType = { id: 9, name: 'Anniversary' };

describe('life-event-types/DeleteModal', () => {
  it('initializes form.id from the type prop and starts with empty errorMessage', () => {
    const w = mount(DeleteModal, { ...modalMountOptions, props: { modelValue: true, type: aType } });
    expect(w.vm.form.id).toBe(9);
    expect(w.vm.errorMessage).toBe('');
  });

  it('destroy() DELETEs to settings/personalization/lifeeventtypes/{id}, emits saved + update:modelValue=false', async () => {
    const w = mount(DeleteModal, { ...modalMountOptions, props: { modelValue: true, type: aType } });
    await w.vm.destroy();
    expect(axios.delete).toHaveBeenCalledWith('settings/personalization/lifeeventtypes/9');
    expect(w.emitted('saved')).toBeTruthy();
    expect(w.emitted('update:modelValue')?.flat()).toContain(false);
  });

  it('destroy() with structured error sets errorMessage from response.data.message and does not emit saved', async () => {
    (axios.delete as ReturnType<typeof vi.fn>).mockRejectedValueOnce({ response: { data: { message: 'cannot delete' } } });
    const w = mount(DeleteModal, { ...modalMountOptions, props: { modelValue: true, type: aType } });
    await w.vm.destroy();
    expect(w.vm.errorMessage).toBe('cannot delete');
    expect(w.emitted('saved')).toBeFalsy();
  });

  it('cancel() emits update:modelValue=false and does not emit saved or touch errorMessage', () => {
    const w = mount(DeleteModal, { ...modalMountOptions, props: { modelValue: true, type: aType } });
    w.vm.cancel();
    expect(w.emitted('update:modelValue')?.flat()).toContain(false);
    expect(w.emitted('saved')).toBeFalsy();
    expect(w.vm.errorMessage).toBe('');
  });
});
