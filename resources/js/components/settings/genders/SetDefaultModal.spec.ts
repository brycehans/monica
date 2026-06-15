import { describe, it, expect } from 'vitest';
import { mountModal } from '../../../../../tests/js/helpers';
import SetDefaultModal from './SetDefaultModal.vue';

const genders = [
  { id: 1, name: 'Man', isDefault: false },
  { id: 2, name: 'Woman', isDefault: true },
];

describe('genders/SetDefaultModal', () => {
  it('initializes selectedId from the defaultId prop', () => {
    const w = mountModal(SetDefaultModal, { props: { modelValue: true, genders, defaultId: 2 } });
    expect(w.vm.selectedId).toBe(2);
  });

  it('save() PUTs to settings/personalization/genders/default/{id}, emits saved + close', async () => {
    const w = mountModal(SetDefaultModal, { props: { modelValue: true, genders, defaultId: 2 } });
    w.vm.selectedId = 1;
    await w.vm.save();
    expect(axios.put).toHaveBeenCalledWith('settings/personalization/genders/default/1');
    expect(w.emitted('saved')).toBeTruthy();
    expect(w.emitted('update:modelValue')?.flat()).toContain(false);
  });

  it('cancel() emits update:modelValue=false and does not emit saved', () => {
    const w = mountModal(SetDefaultModal, { props: { modelValue: true, genders, defaultId: 2 } });
    w.vm.cancel();
    expect(w.emitted('update:modelValue')?.flat()).toContain(false);
    expect(w.emitted('saved')).toBeFalsy();
  });
});
