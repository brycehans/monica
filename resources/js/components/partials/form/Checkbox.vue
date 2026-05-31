<script>
import input from './PInput';

// Spread PInput's defined options so undefined keys (e.g. mounted, data) don't
// land in this component's option object. Vue 3 explicit `mounted: undefined`
// in a child component, combined with a mixin contributing a real mounted
// (vue-i18n's global mixin does), produces `[undefined, fn]` in the merged
// hook array — which crashes Vue at `.bind` time. The spread avoids the
// undefined keys entirely.
export default {
  ...input,
  name: 'Checkbox',
  input_type: 'checkbox',
  input_iclass: 'p-curve p-thick',
};
</script>
