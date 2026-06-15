<style scoped>

</style>

<template>
  <div>
    <div class="pa4-ns ph3 pv2 bb b--gray-monica">
      <div class="mb3 mb0-ns">
        <form-radio
          v-model.lazy="selectedOption"
          :name="'birthdate'"
          :value="'unknown'"
          :dclass="'flex mb3'"
          :iclass="[ dirltr ? 'mr2' : 'ml2' ]"
          @change="() => { _saveOption(); }"
        >
          <template #label>
            {{ t('people.information_edit_unknown') }}
          </template>
        </form-radio>
        <form-radio
          v-model.lazy="selectedOption"
          :name="'birthdate'"
          :value="'approximate'"
          :dclass="'flex mb3'"
          :iclass="[ dirltr ? 'mr2' : 'ml2' ]"
          @change="() => { if (selectedOptionSave !== 'approximate') {_focusAge();} _saveOption(); }"
        >
          <template #label>
            {{ t('people.information_edit_probably') }}
          </template>
          <template v-if="selectedOption === 'approximate'" #extra>
            <form-input
              :id="'age'"
              ref="age"
              v-model="selectedAge"
              :input-type="'number'"
              :width="50"
              :required="true"
              :validator="v$.selectedAge"
            />
          </template>
        </form-radio>
        <form-radio
          v-model.lazy="selectedOption"
          :name="'birthdate'"
          :value="'almost'"
          :dclass="'flex mb3'"
          :iclass="[ dirltr ? 'mr2' : 'ml2' ]"
          @change="() => { if (selectedOptionSave !== 'almost') {_focusMonth();} _saveOption(); }"
        >
          <template #label>
            {{ t('people.information_edit_not_year') }}
          </template>
          <template v-if="selectedOption === 'almost'" #extra>
            <div class="mt2 flex">
              <form-select
                :id="'month'"
                ref="month"
                v-model="selectedMonth"
                :options="months"
                :title="''"
                :class="[ dirltr ? 'mr3' : '' ]"
              />
              <form-select
                :id="'day'"
                v-model="selectedDay"
                :options="days"
                :title="''"
                :class="[ dirltr ? '' : 'mr3' ]"
              />
            </div>
          </template>
        </form-radio>
        <form-radio
          v-model.lazy="selectedOption"
          :name="'birthdate'"
          :value="'exact'"
          :dclass="'flex mb3'"
          :iclass="[ dirltr ? 'mr2' : 'ml2' ]"
          @change="() => { if (selectedOptionSave !== 'exact') {_focusBirthday();} _saveOption(); }"
        >
          <template #label>
            {{ t('people.information_edit_exact') }}
          </template>
          <template v-if="selectedOption === 'exact'" #extra>
            <form-date
              :id="'birthdayDate'"
              ref="birthday"
              v-model="selectedDate"
              :show-calendar-on-focus="true"
              :locale="locale"
              :label="t('people.information_edit_birthdate_label')"
              :class="[ dirltr ? 'fl' : 'fr', 'mt2' ]"
              :validator="v$.selectedDate"
            />
          </template>
        </form-radio>
      </div>
    </div>

    <div v-if="selectedOption === 'exact' || selectedOption === 'almost'" class="pa4-ns ph3 pv2 bb b--gray-monica">
      <div class="mb2 mb0-ns">
        <form-checkbox
          v-model.lazy="hasBirthdayReminder"
          :name="'addReminder'"
          :value="'addReminder'"
          :dclass="[ 'flex', dirltr ? 'mr2' : 'ml2' ]"
        >
          <template #label>
            {{ t('people.people_add_reminder_for_birthday') }}
          </template>
        </form-checkbox>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, useTemplateRef } from 'vue';
import { useI18n } from 'vue-i18n';
import moment from 'moment';
import { useVuelidate } from '@vuelidate/core';
import { required, numeric, helpers } from '@vuelidate/validators';
import { locale as bootLocale } from '../../boot';
import { useHtmlDir } from '../../composables/useHtmlDir';

interface SelectOption {
  id: string | number;
  name: string;
}

interface FocusableComponent {
  focus: () => void;
}

const before = (param: moment.Moment) =>
  helpers.withParams(
    { type: 'before', date: param },
    (value: unknown) => !helpers.req(value) || moment(value as string | Date).isBefore(param),
  );

const props = withDefaults(
  defineProps<{
    value?: string;
    days?: SelectOption[];
    months?: SelectOption[];
    day?: number;
    month?: number;
    birthdate?: string;
    age?: number;
    reminder?: boolean;
  }>(),
  {
    value: '',
    days: () => [],
    months: () => [],
    day: 0,
    month: 0,
    birthdate: '',
    age: 0,
    reminder: false,
  },
);

const { t } = useI18n();
const { dirltr } = useHtmlDir();
const locale = bootLocale;

const selectedDate = ref<string | null>(null);
const selectedOption = ref<string | null>(null);
const selectedOptionSave = ref<string | null>(null);
const selectedAge = ref(0);
const selectedMonth = ref(0);
const selectedDay = ref(0);
const hasBirthdayReminder = ref(false);

const ageRef = useTemplateRef<FocusableComponent>('age');
const monthRef = useTemplateRef<FocusableComponent>('month');
const birthdayRef = useTemplateRef<FocusableComponent>('birthday');

const rules = computed(() => {
  switch (selectedOption.value) {
  case 'approximate':
    return { selectedAge: { required, numeric } };
  case 'exact':
    return { selectedDate: { required, before: before(moment()) } };
  default:
    return {};
  }
});

const v$ = useVuelidate(rules, { selectedAge, selectedDate });

watch(() => props.birthdate, (val) => {
  selectedDate.value = val;
});

watch(() => props.value, (val) => {
  selectedOption.value = val;
});

watch(() => props.age, (val) => {
  selectedAge.value = val;
});

onMounted(() => {
  selectedDate.value = props.birthdate;
  selectedOption.value = props.value !== '' ? props.value : 'unknown';
  selectedOptionSave.value = selectedOption.value;
  selectedAge.value = props.age;
  selectedMonth.value = props.month;
  selectedDay.value = props.day;
  hasBirthdayReminder.value = props.reminder;
});

function _focusAge() {
  setTimeout(() => ageRef.value?.focus(), 100);
}

function _focusMonth() {
  setTimeout(() => monthRef.value?.focus(), 100);
}

function _focusBirthday() {
  setTimeout(() => birthdayRef.value?.focus(), 100);
}

function _saveOption() {
  selectedOptionSave.value = selectedOption.value;
}
</script>
