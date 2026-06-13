import { notify } from '@kyvg/vue3-notification';

export function useNotify(): { notify: typeof notify } {
  return { notify };
}
