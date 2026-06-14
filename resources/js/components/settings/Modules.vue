<template>
  <div class="reminder-rules">
    <notifications group="main" position="bottom right" />

    <h3 class="mb3">
      {{ t('settings.personalization_module_title') }}
    </h3>
    <p>
      {{ t('settings.personalization_module_desc') }}
    </p>

    <div v-if="limited" class="mt3 mb3 form-information-message br2">
      <div class="pa3 flex">
        <div class="mr3">
          <svg viewBox="0 0 20 20">
            <g fill-rule="evenodd">
              <circle cx="10" cy="10" r="9" fill="currentColor" /><path d="M10 0C4.486 0 0 4.486 0 10s4.486 10 10 10 10-4.486 10-10S15.514 0 10 0m0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8m1-5v-3a1 1 0 0 0-1-1H9a1 1 0 1 0 0 2v3a1 1 0 0 0 1 1h1a1 1 0 1 0 0-2m-1-5.9a1.1 1.1 0 1 0 0-2.2 1.1 1.1 0 0 0 0 2.2" />
            </g>
          </svg>
        </div>
        <div v-html="t('settings.personalisation_paid_upgrade_vue', {url: 'settings/subscriptions' })"></div>
      </div>
    </div>

    <div class="dt dt--fixed w-100 collapse br--top br--bottom">
      <div class="dt-row">
        <div class="dtc">
          <div class="pa2 b">
            {{ t('settings.personalization_contact_field_type_table_name') }}
          </div>
        </div>
        <div class="dtc" :class="[ dirltr ? 'tr' : 'tl' ]">
          <div class="pa2 b">
            {{ t('settings.personalization_contact_field_type_table_actions') }}
          </div>
        </div>
      </div>

      <div v-for="module in modules" :key="module.id" class="dt-row hover bb b--light-gray">
        <div class="dtc">
          <div class="pa2">
            {{ module.name }}
          </div>
        </div>
        <div class="dtc" :class="[ dirltr ? 'tr' : 'tl' ]">
          <div class="pa2">
            <form-toggle
              v-model="module.active"
              :iclass="'module-'"
              :disabled="limited"
              :labels="true"
              @change="toggle(module)"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import axios from 'axios';
import { useHtmlDir } from '../../composables/useHtmlDir';
import { useNotify } from '../../composables/useNotify';

interface Module {
  id: number;
  name: string;
  active: boolean;
}

withDefaults(
  defineProps<{
    limited?: boolean;
  }>(),
  {
    limited: false,
  },
);

const { t } = useI18n();
const { dirltr } = useHtmlDir();
const { notify } = useNotify();

const modules = ref<Module[]>([]);

onMounted(getModules);

async function getModules() {
  const response = await axios.get('settings/personalization/modules');
  modules.value = response.data as Module[];
}

async function toggle(mod: Module) {
  const response = await axios.post('settings/personalization/modules/' + mod.id);
  notify({
    group: 'main',
    title: t('settings.personalization_module_save'),
    text: '',
    type: 'success',
  });
  mod.active = response.data.data.active;
}
</script>
