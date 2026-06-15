import { type MountingOptions } from '@vue/test-utils';
import { vi } from 'vitest';

// vue-i18n's useI18n() is called inside setup(). Stub it module-wide
// in tests that don't need real translations.
vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (k: string) => k, tc: (k: string) => k }),
}));

// Default mount config for modal SFCs:
//   - monica-modal is stubbed to a passthrough so tests assert our SFC's
//     own logic (form, axios, emits) rather than vue-final-modal internals.
//     That's playwright's job.
//   - form atom stubs avoid mounting their full templates.
//   - useI18n's t() is stubbed to identity so assertions against keys work.
//
// Exported as a plain options object — spread it into `mount(Component, ...)`
// at the call site rather than calling a wrapper helper. That preserves
// vue-test-utils' overload resolution, so `wrapper.vm` carries the SFC's
// `defineExpose` types. A rename inside a modal's `defineExpose` then breaks
// the spec at typecheck time instead of silently passing on `any`.
//
// If a spec needs to add to `global` (extra stubs, custom mocks), it must
// either spread inside the global key or override the whole thing — there's
// no deep-merge here, only object spread.
export const modalMountOptions = {
  global: {
    stubs: {
      'monica-modal': {
        template: '<div class="stub-monica-modal" :data-shown="modelValue"><slot /><slot name="button" /></div>',
        props: ['modelValue', 'title', 'blocking'],
        emits: ['update:modelValue'],
      },
      'form-input': true,
      'form-select': true,
      'form-toggle': true,
    },
    mocks: {
      $t: (k: string) => k,
    },
  },
} satisfies MountingOptions<Record<string, unknown>>;
