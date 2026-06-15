<template>
  <div>
    <span>{{ texts[0] }}</span>
    <slot ></slot>
    <span>{{ texts[1] }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const props = withDefaults(
  defineProps<{
    value?: number;
  }>(),
  {
    value: 0,
  },
);

const { t } = useI18n();

const texts = computed(() => {
  const text = t('people.stay_in_touch_modal_label', { count: '[slot]' }, props.value);
  return text.split('[slot]');
});
</script>
