<template>
  <div>
    <!-- Timezone -->
    <div class="form-group">
      <form-select
        :id="'timezone'"
        v-model="updatedTimezone"
        :options="timezones"
        :title="t('settings.timezone')"
        :required="true"
        :iclass="'form-control'"
        @input="computeMessage"
      />
    </div>

    <!-- Reminders -->
    <div class="form-group">
      <form-select
        :id="'reminder_time'"
        v-model="updatedReminder"
        :options="hours"
        :title="t('settings.reminder_time_to_send')"
        :required="true"
        :iclass="'form-control'"
        @input="computeMessage"
      />
      <small class="form-text text-muted" v-html="message"></small>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import moment from 'moment-timezone';

interface SelectOption {
  id: string;
  name: string;
}

const props = withDefaults(
  defineProps<{
    timezone?: string;
    timezones?: SelectOption[];
    reminder?: string;
    hours?: SelectOption[];
  }>(),
  {
    timezone: 'UTC',
    timezones: () => [],
    reminder: '',
    hours: () => [],
  },
);

const { t, locale } = useI18n();

const message = ref('');
const updatedTimezone = ref('');
const updatedReminder = ref('');

onMounted(() => {
  updatedReminder.value = props.reminder;
  updatedTimezone.value = props.timezone;
  computeMessage();
});

function computeMessage() {
  moment.locale(typeof locale.value === 'string' ? locale.value : 'en');
  moment.tz.setDefault('UTC');

  const now = moment();
  const formatted = now.format('YYYY-MM-DD ' + updatedReminder.value + ':00');

  let date = moment.tz(formatted, updatedTimezone.value);

  if (date.isBefore(now)) {
    date = date.add(1, 'days');
  }

  message.value = t('settings.reminder_time_to_send_help', {
    dateTime: date.format('LLL'),
    dateTimeUtc: date.utc().format('YYYY-MM-DD HH:mm z'),
  });
}
</script>
