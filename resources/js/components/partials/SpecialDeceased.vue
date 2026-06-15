<style scoped>

</style>

<template>
  <div class="pa4-ns ph3 pv2 bb b--gray-monica">
    <div class="mb3 mb0-ns">
      <form-checkbox
        v-model.lazy="deceased"
        :name="'is_deceased'"
        :value="true"
        :dclass="'flex mb2'"
      >
        <template #label>
          {{ t('people.deceased_mark_person_deceased') }}
        </template>
      </form-checkbox>
      <div v-show="deceased" :class="[ dirltr ? 'ml4' : 'mr4' ]">
        <form-checkbox
          v-model.lazy="dateKnown"
          :name="'is_deceased_date_known'"
          :value="true"
          :dclass="'flex mb1'"
          @change="_focusDate()"
        >
          <template #label>
            {{ t('people.deceased_know_date') }}
          </template>
        </form-checkbox>
        <div v-show="dateKnown" :class="[ dirltr ? 'ml4' : 'mr4' ]">
          <form-date
            :id="'deceased_date'"
            ref="deaceasedday"
            v-model="selectedDate"
            :label="t('people.deceased_date_label')"
            :show-calendar-on-focus="true"
            :locale="locale"
            :validator="v$.selectedDate"
          />
          <div v-show="selectedDate !== ''" class="mt2">
            <form-checkbox
              :name="'add_reminder_deceased'"
              :value="true"
              :model="reminder"
            >
              {{ t('people.deceased_add_reminder') }}
            </form-checkbox>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, useTemplateRef } from 'vue';
import { useI18n } from 'vue-i18n';
import moment from 'moment';
import { useVuelidate } from '@vuelidate/core';
import { required, helpers } from '@vuelidate/validators';
import { locale as bootLocale } from '../../boot';
import { useHtmlDir } from '../../composables/useHtmlDir';

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
    value?: boolean;
    date?: string;
    reminder?: boolean;
  }>(),
  {
    value: false,
    date: '',
    reminder: false,
  },
);

const { t } = useI18n();
const { dirltr } = useHtmlDir();
const locale = bootLocale;

const deceased = ref(false);
const dateKnown = ref(false);
const selectedDate = ref<string | null>(null);

const deaceasedday = useTemplateRef<FocusableComponent>('deaceasedday');

const rules = {
  selectedDate: { required, before: before(moment()) },
};

const v$ = useVuelidate(rules, { selectedDate });

watch(() => props.value, (val) => {
  deceased.value = val;
});

watch(() => props.date, (val) => {
  selectedDate.value = val;
});

onMounted(() => {
  deceased.value = props.value;
  dateKnown.value = props.date !== '';
  selectedDate.value = props.date;
});

function _focusDate() {
  setTimeout(() => deaceasedday.value?.focus(), 100);
}
</script>
