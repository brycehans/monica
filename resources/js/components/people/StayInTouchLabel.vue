<script>
import { h } from 'vue';
import { useI18n } from 'vue-i18n';

export default {
  props: {
    value: {
      type: Number,
      default: 0,
    },
  },

  setup() {
    const { t } = useI18n();
    return { t };
  },

  render() {
    const text = this.t('people.stay_in_touch_modal_label', {count: '[slot]'}, this.value);
    const texts = _.split(text, '[slot]');
    return h('div', [
      h('span', texts[0]),
      this.$slots.default && this.$slots.default(),
      h('span', texts[1]),
    ]);
  },
};
</script>
