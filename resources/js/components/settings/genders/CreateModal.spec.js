import { describe, it, expect } from 'vitest';
import { mountModal } from '../../../../../tests/js/helpers.js';
import CreateModal from './CreateModal.vue';

const genderTypes = [{ id: 'M', name: 'Male', type: 'M' }, { id: 'F', name: 'Female', type: 'F' }];
const defaultGenderType = { id: 'M', name: 'Male', type: 'M' };

describe('genders/CreateModal', () => {
  it('mounts open by default', () => {
    const w = mountModal(CreateModal, { props: { genderTypes, defaultGenderType } });
    expect(w.vm.show).toBe(true);
  });

  it('initializes form.type from defaultGenderType', () => {
    const w = mountModal(CreateModal, { props: { genderTypes, defaultGenderType } });
    expect(w.vm.form.type).toBe('M');
  });

  it('POSTs to settings/personalization/genders and emits saved on success', async () => {
    const w = mountModal(CreateModal, { props: { genderTypes, defaultGenderType } });
    w.vm.form.name = 'Test gender';
    w.vm.form.type = 'F';
    w.vm.form.isDefault = true;
    await w.vm.store();
    expect(axios.post).toHaveBeenCalledWith(
      'settings/personalization/genders',
      expect.objectContaining({ name: 'Test gender', type: 'F', isDefault: true }),
    );
    expect(w.emitted('saved')).toBeTruthy();
    expect(w.vm.show).toBe(false);
  });

  it('emits cancelled when model-value flips false', async () => {
    const w = mountModal(CreateModal, { props: { genderTypes, defaultGenderType } });
    w.vm.onUpdateModelValue(false);
    expect(w.emitted('cancelled')).toBeTruthy();
  });

  it('cancel button sets show=false (does not emit saved)', async () => {
    const w = mountModal(CreateModal, { props: { genderTypes, defaultGenderType } });
    w.vm.cancel();
    expect(w.vm.show).toBe(false);
    expect(w.emitted('saved')).toBeFalsy();
  });
});
