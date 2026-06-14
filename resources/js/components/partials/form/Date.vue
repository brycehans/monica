<template>
  <div :class="{ 'form-group-error': validator && validator.$error }">
    <datepicker
      ref="picker"
      v-model="selectedDate"
      :format="displayValue"
      :locale="dateFnsLocale"
      :week-start="mondayFirst ? 1 : 0"
      :input-class-name="inputClass"
      :text-input="true"
      :clearable="true"
      :enable-time-picker="false"
      :auto-apply="true"
    />
    <input :name="id" type="hidden" :value="exchange" />
    <small v-if="validator?.$error && validator.required?.$invalid" class="error">
      {{ requiredMessage }}
    </small>
    <small v-if="validator?.$error && validator.before?.$invalid" class="error">
      {{ beforeMessage }}
    </small>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, useTemplateRef } from 'vue';
import { useI18n } from 'vue-i18n';
import { VueDatePicker as Datepicker } from '@vuepic/vue-datepicker';
import moment from 'moment';
// @vuepic/vue-datepicker v13 passes :locale straight to date-fns/format,
// which expects a Locale OBJECT (not a string). Map the Laravel locale
// codes Monica ships (resources/lang/) to date-fns Locale modules; fall
// back to enUS for anything we don't have a direct match for.
import type { Locale } from 'date-fns';
import {
  ar, cs, da, de, el, enGB, enUS, es, faIR, fi, fr, he, hr, id as idLocale,
  it, ja, nb, nl, pt, ptBR, ru, sv, tr, uk, vi, zhCN, zhTW,
} from 'date-fns/locale';

const LOCALE_MAP: Record<string, Locale> = {
  ar, cs, da, de, el, es, fi, fr, he, hr, it, ja, nl, pt, ru, sv, tr, uk, vi,
  en: enUS,
  'en-GB': enGB,
  fa: faIR,
  id: idLocale,
  no: nb,
  'pt-BR': ptBR,
  zh: zhCN,
  'zh-TW': zhTW,
};

function resolveDateFnsLocale(code?: string): Locale {
  if (!code) return enUS;
  return LOCALE_MAP[code] || LOCALE_MAP[code.split('-')[0]] || enUS;
}

interface Validator {
  $error: boolean;
  $touch: () => void;
  required?: { $invalid: boolean };
  before?: { $invalid: boolean; $params?: { date?: string | Date } };
}

interface DatepickerInstance {
  openMenu?: () => void;
}

const props = withDefaults(
  defineProps<{
    id?: string;
    modelValue?: string;
    label?: string;
    defaultDate?: string;
    locale?: string;
    showCalendarOnFocus?: boolean;
    validator?: Validator | null;
  }>(),
  {
    id: '',
    modelValue: '',
    label: '',
    defaultDate: '',
    locale: '',
    showCalendarOnFocus: false,
    validator: null,
  },
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();

const { t } = useI18n();
const picker = useTemplateRef<DatepickerInstance>('picker');

const exchange = ref('');
const selectedDate = ref<Date | null>(null);
const mondayFirst = ref(false);

const exchangeFormat = 'YYYY-MM-DD';
const displayFormat = 'L';

const dateFnsLocale = computed(() => resolveDateFnsLocale(props.locale));

const inputClass = computed(() => {
  const classes = ['br2', 'f5', 'ba', 'b--black-40', 'pa2', 'outline-0'];
  if (props.validator && props.validator.$error) {
    classes.push('error');
  }
  return classes.join(' ');
});

function displayValue(date: string | Date | null | undefined): string {
  return date !== '' && date !== null && date !== undefined ? moment(date).format(displayFormat) : '';
}

function exchangeValue(date: string | Date | null | undefined): string {
  return date !== '' && date !== null && date !== undefined ? moment(date).format(exchangeFormat) : '';
}

function update(date: string | Date | null | undefined) {
  if (date === '' || date === null || date === undefined) {
    exchange.value = '';
  } else {
    let mdate = moment(date);
    if (!mdate.isValid()) {
      mdate = moment();
    }
    exchange.value = mdate.format(exchangeFormat);
  }
}

function updateExchange(date: string) {
  exchange.value = date;
  if (exchange.value !== '') {
    let mdate = moment(exchange.value, exchangeFormat);
    if (!mdate.isValid()) {
      mdate = moment();
    }
    selectedDate.value = mdate.toDate();
  } else {
    selectedDate.value = null;
  }
  update(selectedDate.value);
}

const requiredMessage = computed(() => t('validation.vue.required', { field: props.label }));

const beforeMessage = computed(() =>
  t('validation.vue.max.numeric', {
    field: props.label,
    max: displayValue(props.validator?.before?.$params?.date),
  }),
);

watch(() => props.modelValue, (newValue) => {
  updateExchange(newValue);
});

watch(selectedDate, (newValue) => {
  if (props.validator) {
    props.validator.$touch();
  }
  update(newValue);
  emit('update:modelValue', exchangeValue(newValue));
});

onMounted(() => {
  updateExchange(props.modelValue === '' ? props.defaultDate : props.modelValue);
  mondayFirst.value = moment.localeData().firstDayOfWeek() === 1;
});

function focus() {
  // SpecialDate / SpecialDeceased call this to surface the picker after
  // the user selects "exact birthday" / "known deceased date" radios.
  picker.value?.openMenu?.();
}

defineExpose({ focus });
</script>
