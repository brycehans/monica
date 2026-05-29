<template>
  <div :class="{ 'form-group-error': validator && validator.$error }">
    <datepicker
      v-model="selectedDate"
      :format="displayValue"
      :locale="locale"
      :week-start="mondayFirst ? 1 : 0"
      :input-class-name="inputClass"
      :text-input="true"
      :clearable="true"
      :enable-time-picker="false"
      :auto-apply="true"
    />
    <input :name="id" type="hidden" :value="exchange" />
    <small v-if="validator && (validator.$error && validator.required !== undefined && !validator.required)" class="error">
      {{ requiredMessage }}
    </small>
    <small v-if="validator && (validator.$error && validator.before !== undefined && !validator.before)" class="error">
      {{ beforeMessage }}
    </small>
  </div>
</template>

<script>
import { VueDatePicker as Datepicker } from '@vuepic/vue-datepicker';
import moment from 'moment';

export default {

  components: {
    Datepicker,
  },

  props: {
    id: { type: String, default: '' },
    modelValue: { type: String, default: '' },
    label: { type: String, default: '' },
    defaultDate: { type: String, default: '' },
    locale: { type: String, default: '' },
    showCalendarOnFocus: { type: Boolean, default: false },
    validator: { type: Object, default: null },
  },

  emits: ['update:modelValue'],

  data() {
    return {
      exchange: '',
      selectedDate: null,
      mondayFirst: false,
    };
  },

  computed: {
    exchangeFormat() {
      return 'YYYY-MM-DD';
    },

    displayFormat() {
      return 'L';
    },

    inputClass() {
      const classes = ['br2', 'f5', 'ba', 'b--black-40', 'pa2', 'outline-0'];
      if (this.validator && this.validator.$error) {
        classes.push('error');
      }
      return classes.join(' ');
    },

    requiredMessage() {
      return this.$t('validation.vue.required', { field: this.label });
    },

    beforeMessage() {
      return this.$t('validation.vue.max.numeric', {
        field: this.label,
        max: this.displayValue(this.validator.$params.before.date),
      });
    },
  },

  watch: {
    modelValue(newValue) {
      this.updateExchange(newValue);
    },

    selectedDate(newValue) {
      if (this.validator) {
        this.validator.$touch();
      }
      this.update(newValue);
      this.$emit('update:modelValue', this.exchangeValue(newValue));
    },
  },

  mounted() {
    this.updateExchange(this.modelValue === '' ? this.defaultDate : this.modelValue);
    this.mondayFirst = moment.localeData().firstDayOfWeek() === 1;
  },

  methods: {
    displayValue(date) {
      return date !== '' && date !== null ? moment(date).format(this.displayFormat) : '';
    },

    exchangeValue(date) {
      return date !== '' && date !== null ? moment(date).format(this.exchangeFormat) : '';
    },

    update(date) {
      if (date === '' || date === null) {
        this.exchange = '';
      } else {
        let mdate = moment(date);
        if (!mdate.isValid()) {
          mdate = moment();
        }
        this.exchange = mdate.format(this.exchangeFormat);
      }
    },

    updateExchange(date) {
      this.exchange = date;
      if (this.exchange !== '') {
        let mdate = moment(this.exchange, this.exchangeFormat);
        if (!mdate.isValid()) {
          mdate = moment();
        }
        this.selectedDate = mdate.toDate();
      } else {
        this.selectedDate = null;
      }
      this.update(this.selectedDate);
    },

    focus() {
      // @vuepic/vue-datepicker opens its menu on input focus by default;
      // callers that previously did `$refs.dateField.focus()` to surface
      // the picker should continue to work because focus on the visible
      // <input> triggers the menu open.
    },
  },
};
</script>
