<style scoped>
.fa {
    top: 1px;
    color: #b1b1b1;
}
</style>

<template>
  <div>
    <notifications group="archive" position="bottom right" :duration="5000" width="400" />

    <a class="pointer" :title="t('people.contact_archive_help')" href="" @click.prevent="toggle">
      {{ isActive ? t('people.contact_archive') : t('people.contact_unarchive') }}
    </a>

    <span v-tooltip.top="t('people.contact_archive_help')">
      <em class="fa fa-info-circle relative pointer"></em>
    </span>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import axios from 'axios';
import { useNotify } from '../../composables/useNotify';

const props = withDefaults(
  defineProps<{
    hash?: string;
    active?: boolean;
  }>(),
  {
    hash: '',
    active: true,
  },
);

const { t } = useI18n();
const { notify } = useNotify();

const isActive = ref(false);

onMounted(() => {
  isActive.value = props.active;
});

async function toggle() {
  const response = await axios.put('people/' + props.hash + '/archive');
  isActive.value = response.data.is_active;
  notify({
    group: 'archive',
    title: t('app.default_save_success'),
    text: '',
    type: 'success',
  });
}
</script>
