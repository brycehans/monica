import axios from 'axios';

export default {
  /**
   * Update the default tab view.
   *
   * @param {string} view
   */
  updateDefaultProfileView(this: any, view: string): void {
    axios.post('settings/updateDefaultProfileView', { name: view })
      .then(() => {
        this.global_profile_default_view = view;
      });
  },

  /**
   * Fix avatar in case img is on error.
   *
   * @param {Event} event
   */
  fixAvatarDisplay(event: Event): void {
    const el = event.target as HTMLElement | null;
    if (!el) return;
    el.className = 'hidden';
    (el.nextElementSibling as HTMLElement | null)?.classList.remove('hidden');
  },
};
