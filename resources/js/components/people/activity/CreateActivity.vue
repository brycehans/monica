<template>
  <div>
    <!-- LOG AN ACTIVITY -->
    <!-- Legacy Vue 2 idiom: <transition> wraps an always-rendered child so the
         transition CSS never fires. Cleanup would alter UI behaviour (suddenly
         animate on mount) — out of scope for the fork's "no UI changes" rule. -->
    <transition name="fade">
      <!-- eslint-disable-next-line vue/require-toggle-inside-transition -->
      <div class="ba br3 mb3 pa3 b--black-40">
        <div class="dt dt--fixed pb3 mb3 mb0-ns bb b--gray-monica">
          <!-- SUMMARY -->
          <div class="dtc pr2">
            <form-input
              :id="'summary'"
              v-model="newActivity.summary"
              :input-type="'text'"
              :title="t('people.activities_add_title', { name: name })"
              :required="true"
            />
          </div>

          <!-- WHEN -->
          <div class="dtc">
            <p class="mb2 b">
              {{ t('people.activities_add_date_occured') }}
            </p>
            <div class="di">
              <div class="dib">
                <form-date
                  ref="date"
                  v-model="newActivity.happened_at"
                  :show-calendar-on-focus="true"
                  :default-date="todayDate"
                  :locale="locale"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- ADDITIONAL FIELDS -->
        <div v-show="!displayDescription || !displayEmotions || !displayCategory || !displayParticipants" class="bb b--gray-monica pv3 mb3">
          <ul class="list">
            <li v-show="!displayDescription" class="di pointer mr3 nowrap-link">
              <a href="" @click.prevent="displayDescription = true">{{ t('people.activities_add_more_details') }}</a>
            </li>
            <li v-show="!displayEmotions" class="di pointer mr3 nowrap-link">
              <a href="" @click.prevent="displayEmotions = true">{{ t('people.activities_add_emotions') }}</a>
            </li>
            <li v-show="!displayCategory" class="di pointer mr3 nowrap-link">
              <a v-cy-name="'activities_add_category'" href="" @click.prevent="displayCategory = true">{{ t('people.activities_add_category') }}</a>
            </li>
            <li v-show="!displayParticipants" class="di pointer nowrap-link">
              <a href="" @click.prevent="displayParticipants = true">{{ t('people.activities_add_participants_cta') }}</a>
            </li>
          </ul>
        </div>

        <!-- DESCRIPTION -->
        <div v-if="displayDescription" class="bb b--gray-monica pv3 mb3">
          <form-textarea
            v-model="newActivity.description"
            :required="true"
            :no-label="true"
            :rows="4"
            :title="t('people.activities_summary')"
            :placeholder="t('people.conversation_add_content')"
            @content-change="updateDescription($event)"
          />
          <p class="f6">
            {{ t('app.markdown_description') }} <a href="https://guides.github.com/features/mastering-markdown/" rel="noopener noreferrer" target="_blank">
              {{ t('app.markdown_link') }}
            </a>
          </p>
        </div>

        <!-- EMOTIONS -->
        <div v-if="displayEmotions" class="bb b--gray-monica pb3 mb3">
          <label>
            {{ t('people.activities_add_emotions_title') }}
          </label>
          <emotion
            class="pv2"
            :initial-emotions="initialEmotions"
            @update="updateEmotionsList"
          />
        </div>

        <!-- ACTIVITY CATEGORIES -->
        <div v-if="displayCategory" class="bb b--gray-monica pb3 mb3">
          <activity-type-list
            v-model="newActivity.activity_type_id"
            :title="t('people.activities_add_pick_activity')"
          />
        </div>

        <!-- PARTICPANTS -->
        <div v-if="displayParticipants" class="bb b--gray-monica pb3 mb3">
          <label>
            {{ t('people.activities_add_participants', {name: name}) }}
          </label>
          <participant
            :hash="hash"
            :initial-participants="participants"
            @update="updateParticipant($event)"
          />
        </div>

        <form-errors :errors="errors" />

        <!-- ACTIONS -->
        <div class="pt3">
          <div class="flex-ns justify-between">
            <div class="">
              <a class="btn btn-secondary tc w-auto-ns w-100 mb2 pb0-ns" @click.prevent="close()">
                {{ t('app.cancel') }}
              </a>
            </div>
            <div class="">
              <button v-cy-name="'save-activity-button'" class="btn btn-primary w-auto-ns w-100 mb2 pb0-ns" @click.prevent="store()">
                {{ activity ? t('app.save') : t('app.add') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import axios from 'axios';
import moment from 'moment';
import ActivityTypeList from './ActivityTypeList.vue';
import Emotion from '../Emotion.vue';
import FormErrors from '../../partials/FormErrors.vue';
import Participant from '../Participant.vue';
import { useHtmlDir } from '../../../composables/useHtmlDir';
import { useNotify } from '../../../composables/useNotify';
import { withFormErrors, type FormErrorList } from '../../../api/errors';
import type { Emotion as EmotionRecord } from '../types';
import { locale as bootLocale } from '../../../boot';

interface Attendee {
  id: number;
  hash_id: string;
  complete_name: string;
}

interface ActivityRecord {
  id: number;
  summary: string;
  description?: string;
  happened_at: string;
  emotions: EmotionRecord[];
  activity_type?: { id: number; name?: string };
  attendees: { total?: number; contacts: Attendee[] };
  edit?: boolean;
}

interface ParticipantRecord {
  id: number;
  name: string;
}

const props = withDefaults(
  defineProps<{
    hash?: string;
    contactId?: number;
    name?: string;
    activity?: ActivityRecord | null;
  }>(),
  {
    hash: '',
    contactId: 0,
    name: '',
    activity: null,
  },
);

const emit = defineEmits<{
  (e: 'update', value: ActivityRecord): void;
  (e: 'cancel'): void;
}>();

const { t } = useI18n();
const { dirltr } = useHtmlDir();
const { notify } = useNotify();
const locale = bootLocale;

const displayDescription = ref(false);
const displayEmotions = ref(false);
const displayCategory = ref(false);
const displayParticipants = ref(false);

const newActivity = reactive<{
  summary: string;
  description: string;
  happened_at: string;
  emotions: number[];
  activity_type_id: number | null;
  contacts: number[];
}>({
  summary: '',
  description: '',
  happened_at: '',
  emotions: [],
  activity_type_id: null,
  contacts: [],
});

const todayDate = ref('');
const initialEmotions = ref<EmotionRecord[]>([]);
const participants = ref<ParticipantRecord[]>([]);
const errors = ref<FormErrorList>([]);

watch(participants, (value) => {
  newActivity.contacts = value.map((p) => p.id);
});

onMounted(() => {
  todayDate.value = moment().format('YYYY-MM-DD');
  resetFields();
});

function updateDescription(updatedDescription: string) {
  newActivity.description = updatedDescription;
}

function updateEmotionsList(emotions: EmotionRecord[]) {
  newActivity.emotions = emotions.map((emotion) => emotion.id);
}

function resetFields() {
  if (props.activity) {
    initialEmotions.value = JSON.parse(JSON.stringify(props.activity.emotions));
    newActivity.summary = props.activity.summary;
    newActivity.description = props.activity.description ?? '';
    newActivity.happened_at = props.activity.happened_at;
    updateEmotionsList(props.activity.emotions);
    newActivity.activity_type_id = props.activity.activity_type ? props.activity.activity_type.id : null;
    participants.value = props.activity.attendees.contacts.map((attendee) => ({
      id: attendee.id,
      name: attendee.complete_name,
    }));
  } else {
    initialEmotions.value = [];
    newActivity.summary = '';
    newActivity.description = '';
    newActivity.happened_at = todayDate.value;
    newActivity.emotions = [];
    newActivity.activity_type_id = null;
    participants.value = [];
  }
  displayDescription.value = newActivity.description ? newActivity.description !== '' : false;
  displayEmotions.value = newActivity.emotions && newActivity.emotions.length > 0;
  displayCategory.value = newActivity.activity_type_id !== null;
  displayParticipants.value = participants.value.length > 0;
  errors.value = [];
}

function close() {
  resetFields();
  emit('cancel');
}

async function store() {
  const method: 'put' | 'post' = props.activity ? 'put' : 'post';
  const url = props.activity ? 'activities/' + props.activity.id : 'activities';

  if (!newActivity.contacts.includes(props.contactId)) {
    newActivity.contacts.push(props.contactId);
  }

  const response = await withFormErrors(
    errors,
    () => axios[method](url, newActivity),
    (e) => [t('app.error_try_again'), (e as { message?: string }).message ?? ''],
  );
  if (!response) return;
  resetFields();
  emit('update', response.data.data);
  notify({
    group: 'main',
    title: t('people.activities_add_success'),
    text: '',
    type: 'success',
  });
}

function updateParticipant(value: ParticipantRecord[]) {
  participants.value = value;
}
</script>
