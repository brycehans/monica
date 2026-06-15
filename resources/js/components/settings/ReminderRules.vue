<template>
  <div class="reminder-rules">
    <notifications group="main" position="bottom right" />

    <h3 class="mb3">
      {{ t('settings.personalization_reminder_rule_title') }}
    </h3>
    <p>
      {{ t('settings.personalization_reminder_rule_desc') }}
    </p>

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

      <div v-for="reminderRule in reminderRules" :key="reminderRule.id" class="dt-row bb b--light-gray">
        <div class="dtc">
          <div class="pa2">
            {{ t('settings.personalization_reminder_rule_line', {count: reminderRule.number_of_days_before}, reminderRule.number_of_days_before) }}
          </div>
        </div>
        <div class="dtc" :class="[ dirltr ? 'tr' : 'tl' ]">
          <div class="pa2">
            <form-toggle
              v-model="reminderRule.active"
              :iclass="'reminder-rule-' + reminderRule.number_of_days_before"
              :labels="true"
              @change="toggle(reminderRule)"
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

interface ReminderRule {
  id: number;
  number_of_days_before: number;
  active: boolean;
}

const { t } = useI18n();
const { dirltr } = useHtmlDir();
const { notify } = useNotify();

const reminderRules = ref<ReminderRule[]>([]);

onMounted(getReminderRules);

async function getReminderRules() {
  const response = await axios.get('settings/personalization/reminderrules');
  reminderRules.value = response.data as ReminderRule[];
}

async function toggle(reminderRule: ReminderRule) {
  const response = await axios.post('settings/personalization/reminderrules/' + reminderRule.id);
  notify({
    group: 'main',
    title: t('settings.personalization_reminder_rule_save'),
    text: '',
    type: 'success',
  });
  reminderRule.active = response.data.data.active;
}
</script>
