<template>
  <div>
    <!-- Timezone -->
    <div class="form-group">
      <form-select
        :id="'timezone'"
        v-model="updatedTimezone"
        :options="timezones"
        :title="$t('settings.timezone')"
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
        :title="$t('settings.reminder_time_to_send')"
        :required="true"
        :iclass="'form-control'"
        @input="computeMessage"
      />
      <small class="form-text text-muted" v-html="message"></small>
    </div>
  </div>
</template>

<script>
import { useI18n } from 'vue-i18n';
import moment from 'moment-timezone';

export default {

  props: {
    timezone: {
      type: String,
      default: 'UTC',
    },
    timezones: {
      type: Array,
      default: function () {
        return [];
      }
    },
    reminder: {
      type: String,
      default: '',
    },
    hours: {
      type: Array,
      default: function () {
        return [];
      }
    }
  },

  setup() {
    const { t, locale } = useI18n();
    return { t, locale };
  },

  data() {
    return {
      message: '',
      updatedTimezone: '',
      updatedReminder: ''
    };
  },

  mounted() {
    this.prepareComponent();
  },

  methods: {
    prepareComponent() {
      this.updatedReminder = this.reminder;
      this.updatedTimezone = this.timezone;
      this.computeMessage();
    },

    computeMessage() {
      moment.locale(this.locale);
      moment.tz.setDefault('UTC');

      var now = moment();
      var t = now.format('YYYY-MM-DD ' + this.updatedReminder + ':00');

      var date = moment.tz(t, this.updatedTimezone);

      if (date.isBefore(now)) {
        date = date.add(1, 'days');
      }

      this.message = this.t('settings.reminder_time_to_send_help', {
        dateTime: date.format('LLL'),
        dateTimeUtc: date.utc().format('YYYY-MM-DD HH:mm z')
      });
    }
  }
};
</script>
