import { env } from './boot.ts';

/**
 * Add cy-name and cy-items directives.
 * These are only active on local or testing environment.
 */

function makeTestingDirective(attrName) {
  const apply = (el, binding) => {
    if (env != 'production') {
      el.setAttribute(attrName, String(binding.value));
    }
  };
  return {
    mounted: apply,
    updated: apply,
  };
}

export default {
  install(app) {
    app.directive('cy-name', makeTestingDirective('cy-name'));
    app.directive('cy-items', makeTestingDirective('cy-items'));
  },
};
