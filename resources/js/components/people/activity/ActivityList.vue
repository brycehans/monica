<style scoped>
.btn-title {
  top: -7px;
}
</style>

<template>
  <div>
    <div class="">
      <h3 class="mb2">
        🍿&#8199;{{ t('people.activity_title') }}

        <span class="fr relative btn-title">
          <a v-if="displayLogActivity === false" v-cy-name="'add-activity-button'" class="btn edit-information" @click="displayLogActivity = true">
            {{ t('people.activities_add_activity') }}
          </a>
          <a v-else class="btn edit-information" @click="displayLogActivity = false">
            {{ t('app.cancel') }}
          </a>
        </span>
      </h3>
    </div>

    <!-- BLANK STATE -->
    <div v-if="!displayLogActivity && activities.length === 0" class="w-100">
      <div v-cy-name="'activities-blank-state'" class="bg-near-white tc pa3 br2 ba b--light-gray">
        <p>{{ t('people.activities_blank_title', { name: name }) }}</p>
        <a class="pointer" href="" @click.prevent="displayLogActivity = true">
          {{ t('people.activities_blank_add_activity') }}
        </a>
      </div>
    </div>

    <!-- LOG AN ACTIVITY -->
    <template v-if="displayLogActivity">
      <create-activity
        :hash="hash"
        :contact-id="contactId"
        :name="name"
        @update="updateList($event)"
        @cancel="displayLogActivity = false"
      />
    </template>

    <!-- LIST OF ACTIVITIES -->
    <div v-cy-name="'activities-body'" v-cy-items="activities.map(c => c.id)">
      <div v-for="activity in activities" :key="activity.id" v-cy-name="'activity-body-'+activity.id" class="ba br2 b--black-10 br--top w-100 mb2">
        <template v-if="!activity.edit">
          <h2 class="pl2 pr2 pt3 f5">
            {{ activity.summary }}
          </h2>

          <div v-if="activity.description" dir="auto" class="markdown pl2 pr2 pb3" v-html="compiledMarkdown(activity.description)">
          </div>

          <!-- DETAILS -->
          <div class="pa2 cf bt b--black-10 br--bottom f7">
            <div class="w-70" :class="[ dirltr ? 'fl' : 'fr' ]">
              <ul class="list">
                <!-- HAPPENED AT -->
                <li class="di" :class="[ dirltr ? 'mr3' : 'ml3' ]">
                  {{ formatMomentLL(activity.happened_at) }}
                </li>

                <!-- PARTICIPANT LIST -->
                <li v-if="(activity.attendees.total ?? 0) > 1" class="di">
                  <ul class="di list" :class="[ dirltr ? 'mr3' : 'ml3' ]">
                    <li class="di">
                      {{ t('people.activities_list_participants', { total: (activity.attendees.total ?? 0) - 1}) }}
                    </li>
                    <li v-for="attendee in activity.attendees.contacts.filter(c => c.id !== contactId)" :key="attendee.id" class="di mr2">
                      <a :href="'people/' + attendee.hash_id">{{ attendee.complete_name }}</a>
                    </li>
                  </ul>
                </li>

                <!-- EMOTIONS LIST -->
                <li v-if="activity.emotions.length !== 0" class="di">
                  <ul class="di list" :class="[ dirltr ? 'mr3' : 'ml3' ]">
                    <li class="di">
                      {{ t('people.activities_list_emotions') }}
                    </li>
                    <li v-for="emotion in activity.emotions" :key="emotion.id" class="di">
                      {{ t('app.emotion_' + emotion.name) }}
                    </li>
                  </ul>
                </li>

                <!-- ACTIVITY TYPE -->
                <li v-if="activity.activity_type" class="di" :class="[ dirltr ? 'mr3' : 'ml3' ]">
                  {{ activity.activity_type.name }}
                </li>
              </ul>
            </div>
            <div class="w-30" :class="[ dirltr ? 'fl tr' : 'fr tl' ]">
              <!-- ACTIONS -->
              <ul class="list">
                <li class="di">
                  <a v-cy-name="'edit-activity-button-'+activity.id" href="" class="pointer" @click.prevent="activity.edit = true">{{ t('app.edit') }}</a>
                  <a v-show="destroyActivityId !== activity.id" v-cy-name="'delete-activity-button-'+activity.id" href="" class="pointer" @click.prevent="showDestroyActivity(activity)">{{ t('app.delete') }}</a>
                  <ul v-show="destroyActivityId === activity.id" class="di">
                    <li class="di">
                      <a v-cy-name="'confirm-delete-activity'" class="pointer red" @click.prevent="destroyActivity(activity)">
                        {{ t('app.delete_confirm') }}
                      </a>
                    </li>
                    <li class="di">
                      <a class="pointer mr1" @click.prevent="destroyActivityId = 0">
                        {{ t('app.cancel') }}
                      </a>
                    </li>
                  </ul>
                </li>
              </ul>
            </div>
          </div>
        </template>

        <!-- EDIT THE CURRENT ACTIVITY -->
        <create-activity v-else
                         :hash="hash"
                         :name="name"
                         :activity="activity"
                         :contact-id="contactId"
                         @update="activity.edit = false; updateList($event)"
                         @cancel="activity.edit = false; displayLogActivity = false"
        />
      </div>
      <a v-if="!isLastPage" class="pointer mr1" style="float: right" @click.prevent="getActivities">
        {{ t('app.load_more') }}
      </a>
    </div>

    <p v-if="activities.length > 0" class="tc">
      📗 <a :href="'people/' + hash + '/activities/summary'">{{ t('people.activities_view_activities_report') }}</a>
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import moment from 'moment';
import axios from 'axios';
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import CreateActivity from './CreateActivity.vue';
import { useHtmlDir } from '../../../composables/useHtmlDir';

interface Attendee {
  id: number;
  hash_id: string;
  complete_name: string;
}

interface Emotion {
  id: number;
  name: string;
}

interface ActivityType {
  id: number;
  name?: string;
}

interface Activity {
  id: number;
  summary: string;
  description?: string;
  happened_at: string;
  attendees: { total?: number; contacts: Attendee[] };
  emotions: Emotion[];
  activity_type?: ActivityType;
  edit?: boolean;
}

const props = withDefaults(
  defineProps<{
    hash?: string;
    name?: string;
    contactId?: number;
  }>(),
  {
    hash: '',
    name: '',
    contactId: 0,
  },
);

const { t } = useI18n();
const { dirltr } = useHtmlDir();

const displayLogActivity = ref(false);
const activities = ref<Activity[]>([]);
const destroyActivityId = ref(0);
const currentPage = ref(0);
const lastPage = ref<number | null>(null);

const isLastPage = computed(() => lastPage.value === currentPage.value);

onMounted(getActivities);

function formatMomentLL(date: string): string {
  return moment.utc(date).format('LL');
}

function compiledMarkdown(text: string | null | undefined): string {
  return text !== undefined && text !== null ? DOMPurify.sanitize(marked.parse(text) as string) : '';
}

async function getActivities() {
  currentPage.value++;
  const response = await axios.get(
    'api/contacts/' + props.contactId + '/activities?page=' + currentPage.value,
  );
  activities.value.push(...response.data.data);
  currentPage.value = response.data.meta.current_page;
  lastPage.value = response.data.meta.last_page;
}

function updateList(activity: Activity) {
  displayLogActivity.value = false;
  const index = activities.value.findIndex((item) => item.id === activity.id);
  if (index >= 0) {
    activities.value[index] = activity;
  } else {
    activities.value.push(activity);
  }
}

function showDestroyActivity(activity: Activity) {
  destroyActivityId.value = activity.id;
}

async function destroyActivity(activity: Activity) {
  await axios.delete(`activities/${activity.id}`);
  const idx = activities.value.indexOf(activity);
  if (idx >= 0) activities.value.splice(idx, 1);
}
</script>
