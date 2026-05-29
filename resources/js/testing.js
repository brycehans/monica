/**
 * Add cy-name and cy-items directives.
 * These are only active on local or testing environment.
 */

function makeTestingDirective(attrName) {
  return function(el, binding) {
    if (window.Laravel.env != 'production') {
      el.setAttribute(attrName, String(binding.value));
    }
  };
}

export default {
  install(app) {
    app.directive('cy-name', makeTestingDirective('cy-name'));
    app.directive('cy-items', makeTestingDirective('cy-items'));
  },
};
