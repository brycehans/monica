<template>
  <div>
    <notifications group="lifeEventTypes" position="bottom right" />

    <h3 class="with-actions">
      {{ t('settings.personalization_life_event_category_title') }}
    </h3>
    <p>{{ t('settings.personalization_life_event_category_description') }}</p>

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
            {{ t('settings.personalization_live_event_category_table_name') }}
          </div>
        </div>
        <div class="dtc" :class="[ dirltr ? 'tr' : 'tl' ]">
          <div class="pa2 b">
            {{ t('settings.personalization_live_event_category_table_actions') }}
          </div>
        </div>
      </div>
    </div>

    <div>
      <ul>
        <li v-for="lifeEventCategory in lifeEventCategories" :key="lifeEventCategory.id" class="dt dt--fixed w-100 collapse br--top br--bottom mt3">
          <!-- LIFE EVENT CATEGORY -->
          <div class="dt-row hover bb b--light-gray">
            <div class="dtc">
              <div class="pa2 b">
                <strong>{{ t('people.life_event_category_' + lifeEventCategory.default_life_event_category_key) }}</strong>
              </div>
            </div>
            <div class="dtc">
            </div>
          </div>
          <div v-for="lifeEventType in lifeEventCategory.lifeEventTypes" :key="lifeEventType.id" class="dt-row hover bb b--light-gray">
            <div class="dtc">
              <div class="pa2 pl4">
                <template v-if="lifeEventType.name">
                  {{ lifeEventType.name }}
                </template>
                <template v-else>
                  {{ t('people.life_event_sentence_' + lifeEventType.default_life_event_type_key) }}
                </template>
              </div>
            </div>
            <div class="dtc" :class="[ dirltr ? 'tr' : 'tl' ]">
              <div class="pa2">
                <em v-if="!limited" class="fa fa-pencil-square-o pointer pr2" @click="showEditType(lifeEventType, lifeEventCategory.id)"></em>
                <em v-if="!limited" class="fa fa-trash-o pointer" @click="showDeleteType(lifeEventType)"></em>
              </div>
            </div>
          </div>
          <div v-if="!limited" class="dt-row">
            <div class="dtc">
              <div class="pa2 pl4">
                <a class="pointer" href=""
                   @click.prevent="showCreateType(lifeEventCategory)"
                >
                  {{ t('settings.personalization_life_event_type_add_button') }}
                </a>
              </div>
            </div>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import axios from 'axios';
import { useRowModal } from '../../composables/useRowModal';
import { useHtmlDir } from '../../composables/useHtmlDir';
import { useNotify } from '../../composables/useNotify';
import CreateModal from './life-event-types/CreateModal.vue';
import UpdateModal from './life-event-types/UpdateModal.vue';
import DeleteModal from './life-event-types/DeleteModal.vue';

interface LifeEventType {
  id: number;
  name: string;
  default_life_event_type_key?: string;
}

interface LifeEventCategory {
  id: number;
  default_life_event_category_key: string;
  lifeEventTypes: LifeEventType[];
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

const createModal = useRowModal(CreateModal);
const updateModal = useRowModal(UpdateModal);
const deleteModal = useRowModal(DeleteModal);

const lifeEventCategories = ref<LifeEventCategory[]>([]);

onMounted(getLifeEventCategories);

async function getLifeEventCategories() {
  const response = await axios.get('settings/personalization/lifeeventcategories');
  lifeEventCategories.value = response.data as LifeEventCategory[];
}

function notifySaved() {
  notify({
    group: 'lifeEventTypes',
    title: t('app.default_save_success'),
    text: '',
    type: 'success',
  });
}

function showCreateType(category: LifeEventCategory) {
  createModal.open({
    category,
    onSaved: () => {
      getLifeEventCategories();
      notifySaved();
    },
  });
}

function showEditType(type: LifeEventType, categoryId: number) {
  updateModal.open({
    type,
    categoryId,
    onSaved: () => {
      getLifeEventCategories();
      notifySaved();
    },
  });
}

function showDeleteType(type: LifeEventType) {
  deleteModal.open({
    type,
    onSaved: () => {
      getLifeEventCategories();
      notifySaved();
    },
  });
}
</script>
