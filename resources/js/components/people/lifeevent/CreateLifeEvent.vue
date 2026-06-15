<template>
  <section class="ph3 ph0-ns life-event">
    <notifications group="main" position="top middle" width="400" />

    <div class="mt4 mw7 center mb3">
      <!-- Breadcrumb -->
      <ul v-if="view === 'types' || view === 'add'" class="ba b--gray-monica pa2 mb2">
        <li class="di">
          <a class="pointer" href="" @click.prevent="view = 'categories'">
            {{ t('people.life_event_create_category') }}
          </a>
        </li>
        <li v-if="view === 'types'" class="di">
          > {{ t('people.life_event_category_' + activeCategory?.default_life_event_category_key) }}
        </li>
        <template v-else-if="view === 'add'">
          <li class="di">
            &gt; <a class="pointer" href="" @click.prevent="view = 'types'">
              {{ t('people.life_event_category_' + activeCategory?.default_life_event_category_key) }}
            </a>
          </li>
          <li class="di">
            &gt; {{ t('people.life_event_create_life_event') }}
          </li>
        </template>
      </ul>

      <!-- List of events -->
      <ul v-if="view !== 'add'" class="ba b--gray-monica br2">
        <template v-if="view === 'categories'">
          <!-- CATEGORIES -->
          <li v-for="category in categories" :key="category.id" class="relative pointer bb b--gray-monica b--gray-monica pa2 life-event-add-row" @click="getType(category)">
            <div class="dib mr2">
              <img :src="'img/people/life-events/categories/' + category.default_life_event_category_key + '.svg'" :alt="category.default_life_event_category_key" style="min-width: 12px;" />
            </div>
            {{ t('people.life_event_category_' + category.default_life_event_category_key) }}

            <svg class="absolute life-event-add-arrow" width="10" height="13" viewBox="0 0 10 13" fill="none"
                 xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M8.75071 5.66783C9.34483 6.06361 9.34483 6.93653 8.75072 7.33231L1.80442 11.9598C1.13984 12.4025 0.25 11.9261 0.25 11.1275L0.25 1.87263C0.25 1.07409 1.13984 0.59767 1.80442 1.04039L8.75071 5.66783Z" fill="#C4C4C4" />
            </svg>
          </li>
        </template>

        <template v-else-if="view === 'types'">
          <!-- TYPES -->
          <li v-for="type in types" :key="type.id" class="relative pointer bb b--gray-monica b--gray-monica pa2 life-event-add-row" @click="displayAddScreen(type)">
            <div class="dib mr2">
              <img :src="'img/people/life-events/types/' + type.default_life_event_type_key + '.svg'" :alt="type.default_life_event_type_key" style="min-width: 12px;" />
            </div>
            <template v-if="type.name">
              {{ type.name }}
            </template>
            <template v-else>
              {{ t('people.life_event_sentence_' + type.default_life_event_type_key) }}
            </template>

            <svg class="absolute life-event-add-arrow" width="10" height="13" viewBox="0 0 10 13" fill="none"
                 xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M8.75071 5.66783C9.34483 6.06361 9.34483 6.93653 8.75072 7.33231L1.80442 11.9598C1.13984 12.4025 0.25 11.9261 0.25 11.1275L0.25 1.87263C0.25 1.07409 1.13984 0.59767 1.80442 1.04039L8.75071 5.66783Z" fill="#C4C4C4" />
            </svg>
          </li>
        </template>
      </ul>

      <!-- ADD SCREEN -->
      <div v-else class="ba b--gray-monica br2 pt4">
        <div class="life-event-add-icon tc center">
          <img :src="'img/people/life-events/types/' + activeType?.default_life_event_type_key + '.svg'" :alt="activeType?.default_life_event_type_key" style="min-width: 17px;" />
        </div>

        <h3 class="pt3 ph4 f3 fw5 tc">
          <template v-if="activeType?.name">
            {{ activeType.name }}
          </template>
          <template v-else>
            {{ t('people.life_event_sentence_' + activeType?.default_life_event_type_key) }}
          </template>
        </h3>

        <!-- This field will be the same for every life event type no matter what, as the date is the only required field -->
        <div class="ph4 pv3 mb3 mb0-ns bb b--gray-monica">
          <label for="year" class="mr2">
            {{ t('people.life_event_date_it_happened') }}
          </label>
          <div class="flex mb3">
            <div class="mr2">
              <form-select
                :id="'year'"
                v-model="selectedYear"
                :options="years"
                :title="''"
                :class="[ dirltr ? 'mr2' : '' ]" @input="updateDate"
              />
            </div>
            <div class="mr2">
              <form-select
                :id="'month'"
                v-model="selectedMonth"
                :options="months"
                :title="''"
                :class="[ dirltr ? 'mr2' : '' ]" @input="updateDate"
              />
            </div>
            <div>
              <form-select
                :id="'day'"
                v-model="selectedDay"
                :options="days"
                :title="''"
                :class="[ dirltr ? '' : 'mr2' ]" @input="updateDate"
              />
            </div>
          </div>
          <p class="f6">
            {{ t('people.life_event_create_date') }}
          </p>
        </div>

        <create-default-life-event @contentChange="updateLifeEventContent($event)" />

        <!-- YEARLY REMINDER -->
        <div class="ph4 pv3 mb3 mb0-ns bb b--gray-monica">
          <form-checkbox
            v-model.lazy="newLifeEvent.has_reminder"
            :name="'addReminder'"
            :dclass="[ dirltr ? 'mr3' : 'ml3' ]"
          >
            {{ t('people.life_event_create_add_yearly_reminder') }}
          </form-checkbox>
        </div>

        <!-- FORM ACTIONS -->
        <div class="ph4-ns ph3 pv3 bb b--gray-monica">
          <div class="flex-ns justify-between">
            <div>
              <a class="btn btn-secondary tc w-auto-ns w-100 mb2 pb0-ns" href="" @click.prevent="$emit('dismissModal')">
                {{ t('app.cancel') }}
              </a>
            </div>
            <div>
              <button class="btn btn-primary w-auto-ns w-100 mb2 pb0-ns" @click="store()">
                {{ t('app.add') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import axios from 'axios';
import moment from 'moment';
import CreateDefaultLifeEvent from './content/CreateDefaultLifeEvent.vue';
import { useHtmlDir } from '../../../composables/useHtmlDir';
import { useNotify } from '../../../composables/useNotify';

interface SelectOption {
  id: string | number;
  name: string;
}

interface Category {
  id: number;
  default_life_event_category_key: string;
}

interface LifeEventTypeRecord {
  id: number;
  name?: string;
  default_life_event_type_key: string;
}

interface LifeEventContent {
  name: string;
  note: string;
  specific_information?: string;
}

const props = withDefaults(
  defineProps<{
    hash?: string;
    years?: SelectOption[];
    months?: SelectOption[];
    days?: SelectOption[];
  }>(),
  {
    hash: '',
    years: () => [],
    months: () => [],
    days: () => [],
  },
);

const emit = defineEmits<{
  (e: 'updateLifeEventTimeline', value: unknown): void;
  (e: 'dismissModal'): void;
}>();

const { t } = useI18n();
const { dirltr } = useHtmlDir();
const { notify } = useNotify();

const selectedDay = ref<number | string>(0);
const selectedMonth = ref<number | string>(0);
const selectedYear = ref<number | string>(0);

const newLifeEvent = reactive<{
  name: string;
  note: string;
  happened_at: string;
  life_event_type_id: number;
  happened_at_month_unknown: boolean;
  happened_at_day_unknown: boolean;
  specific_information: string;
  has_reminder: boolean;
}>({
  name: '',
  note: '',
  happened_at: '',
  life_event_type_id: 0,
  happened_at_month_unknown: false,
  happened_at_day_unknown: false,
  specific_information: '',
  has_reminder: false,
});

const categories = ref<Category[]>([]);
const activeCategory = ref<Category | null>(null);
const activeType = ref<LifeEventTypeRecord | null>(null);
const types = ref<LifeEventTypeRecord[]>([]);
const view = ref<'categories' | 'types' | 'add'>('categories');

onMounted(async () => {
  await getCategories();
  newLifeEvent.happened_at = moment().format('YYYY-MM-DD');
  selectedYear.value = moment().year();
  selectedMonth.value = moment().month() + 1;
  selectedDay.value = moment().date();
});

function displayAddScreen(type: LifeEventTypeRecord) {
  view.value = 'add';
  activeType.value = type;
  newLifeEvent.life_event_type_id = type.id;
}

async function getCategories() {
  const response = await axios.get('lifeevents/categories');
  categories.value = response.data.data as Category[];
}

async function getType(category: Category) {
  const response = await axios.get('lifeevents/categories/' + category.id + '/types');
  types.value = response.data.data as LifeEventTypeRecord[];
  view.value = 'types';
  activeCategory.value = category;
}

function updateLifeEventContent(lifeEvent: LifeEventContent) {
  newLifeEvent.note = lifeEvent.note;
  newLifeEvent.name = lifeEvent.name;
  newLifeEvent.specific_information = lifeEvent.specific_information ?? '';
}

function updateDate() {
  if (selectedDay.value === 0 || selectedDay.value === '0') {
    newLifeEvent.happened_at_day_unknown = true;
    newLifeEvent.happened_at = selectedYear.value + '-' + selectedMonth.value + '-01';
  } else if (selectedMonth.value === 0 || selectedMonth.value === '0') {
    newLifeEvent.happened_at_month_unknown = true;
    newLifeEvent.happened_at_day_unknown = true;
    newLifeEvent.happened_at = selectedYear.value + '-01-01';
    selectedDay.value = 0;
  } else {
    newLifeEvent.happened_at = selectedYear.value + '-' + selectedMonth.value + '-' + selectedDay.value;
    newLifeEvent.happened_at_month_unknown = false;
    newLifeEvent.happened_at_day_unknown = false;
  }
}

async function store() {
  const response = await axios.post('people/' + props.hash + '/lifeevents', newLifeEvent);
  emit('updateLifeEventTimeline', response.data);
  notify({
    group: 'main',
    title: t('people.life_event_create_success'),
    text: '',
    type: 'success',
  });
}
</script>
