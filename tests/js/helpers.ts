import { mount, type MountingOptions, type VueWrapper } from '@vue/test-utils';
import { vi } from 'vitest';
import type { Component } from 'vue';

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
// Returns `VueWrapper<any>` so tests can poke at component-exposed state
// (`w.vm.form.type`, `w.vm.store()`, etc.) without re-declaring each modal's
// `defineExpose` shape at every call site.
export function mountModal(
  component: Component,
  options: MountingOptions<Record<string, unknown>> = {},
): VueWrapper<any> {
  return mount(component, {
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
      ...options.global,
    },
    ...options,
  });
}
