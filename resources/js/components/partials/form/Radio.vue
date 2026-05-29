<script>
import input from './PInput';

// See the comment in Checkbox.vue for why we spread instead of selectively
// re-binding each option key.
export default {
  ...input,
  name: 'Radio',
  input_type: 'radio',
  input_iclass: 'p-round p-thick',
};
</script>
