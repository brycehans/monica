import type { App, DirectiveBinding } from 'vue';
import { env } from './boot';

/**
 * Add cy-name and cy-items directives.
 * These are only active on local or testing environment.
 */

function makeTestingDirective(attrName: string) {
  const apply = (el: Element, binding: DirectiveBinding) => {
    if (env !== 'production') {
      el.setAttribute(attrName, String(binding.value));
    }
  };
  return {
    mounted: apply,
    updated: apply,
  };
}

export default {
  install(app: App) {
    app.directive('cy-name', makeTestingDirective('cy-name'));
    app.directive('cy-items', makeTestingDirective('cy-items'));
  },
};
