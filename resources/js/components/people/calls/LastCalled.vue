<template>
  <span v-cy-name="'last-talked-to'">{{ lastCalledMessage }}</span>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import axios from 'axios';

const props = withDefaults(
  defineProps<{
    hash?: string;
    initialValue?: string;
  }>(),
  {
    hash: '',
    initialValue: '',
  },
);

const { t } = useI18n();

const lastCalled = ref('');

const lastCalledMessage = computed(() => {
  if (!props.initialValue && !lastCalled.value) {
    return t('people.last_called_empty');
  }
  if (!lastCalled.value) {
    return t('people.last_talked_to', { date: props.initialValue });
  }
  return t('people.last_talked_to', { date: lastCalled.value });
});

async function getLastCalled() {
  const response = await axios.get('people/' + props.hash + '/calls/last');
  lastCalled.value = response.data.last_talked_to;
}

defineExpose({ getLastCalled, lastCalled });
</script>
