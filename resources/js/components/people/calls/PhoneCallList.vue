<template>
  <div>
    <div class="">
      <h3 class="mb2">
        ☎️&#8199;{{ t('people.call_title') }}

        <span class="fr relative" style="top: -7px;">
          <a v-if="displayLogCall === false" v-cy-name="'add-call-button'" class="btn edit-information" href="" @click.prevent="displayLogCall = true">
            {{ t('people.call_button') }}
          </a>
          <a v-if="displayLogCall" class="btn edit-information" href="" @click.prevent="displayLogCall = false">
            {{ t('app.cancel') }}
          </a>
        </span>
      </h3>
    </div>

    <!-- BLANK STATE -->
    <div v-if="!displayLogCall && calls.length === 0" v-cy-name="'calls-blank-state'" class="w-100">
      <div class="bg-near-white tc pa3 br2 ba b--light-gray">
        <p>{{ t('people.call_blank_title', { name: name }) }}</p>
        <a class="pointer" href="" @click.prevent="displayLogCall = true">
          {{ t('people.call_button') }}
        </a>
      </div>
    </div>

    <!-- LOG A CALL -->
    <transition name="fade">
      <div v-if="displayLogCall" v-cy-name="'log-call-form'" class="ba br3 mb3 pa3 b--black-40">
        <div class="dt dt--fixed pb3 mb3 mb0-ns">
          <!-- WHEN -->
          <div class="dtc pr2">
            <p class="mb2 b">
              {{ t('people.modal_call_exact_date') }}
            </p>
            <div class="di mr3">
              <div class="dib">
                <form-date
                  v-model="newCall.called_at"
                  :default-date="todayDate"
                  :locale="locale"
                />
              </div>
            </div>
          </div>

          <!-- WHO CALLED -->
          <div class="dtc">
            <p class="mb2 b">
              {{ t('people.modal_call_who_called') }}
            </p>
            <div class="dt">
              <div class="dt-row">
                <form-radio
                  v-model="newCall.contact_called"
                  :name="'contact_called'"
                  :value="false"
                  :iclass="'mr1'"
                  :dclass="'dtc mr3'"
                >
                  {{ t('people.call_you_called') }}
                </form-radio>
                <form-radio
                  v-model="newCall.contact_called"
                  :name="'contact_called'"
                  :value="true"
                  :iclass="'mr1'"
                  :dclass="'dtc mr3'"
                >
                  {{ t('people.call_he_called', { name : name }) }}
                </form-radio>
              </div>
            </div>
          </div>
        </div>

        <!-- CONTENT -->
        <div>
          <form-textarea
            v-model="newCall.content"
            :required="true"
            :label="t('people.modal_call_comment')"
            :rows="4"
            :placeholder="t('people.conversation_add_content')"
          />
          <p class="f6">
            {{ t('app.markdown_description') }} <a href="https://guides.github.com/features/mastering-markdown/" target="_blank" rel="noopener noreferrer">
              {{ t('app.markdown_link') }}
            </a>
          </p>
        </div>

        <!-- EMOTIONS -->
        <div class="bb b--gray-monica pb3">
          <label class="b">
            {{ t('people.modal_call_emotion') }}
          </label>
          <emotion class="pv2" @update="updateEmotionsList" />
        </div>

        <!-- ACTIONS -->
        <div class="pt3">
          <div class="flex-ns justify-between">
            <div class="">
              <a class="btn tc w-auto-ns w-100 mb2 pb0-ns" href="" @click.prevent="displayLogCall = false; resetFields()">
                {{ t('app.cancel') }}
              </a>
            </div>
            <div class="">
              <button v-cy-name="'save-call-button'" class="btn btn-primary w-auto-ns w-100 mb2 pb0-ns" @click.prevent="store()">
                {{ t('app.add') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- LIST OF CALLS -->
    <div v-cy-name="'calls-body'" v-cy-items="calls.map(c => c.id)">
      <div v-for="call in calls" :key="call.id" v-cy-name="'call-body-'+call.id" class="ba br2 b--black-10 br--top w-100 mb2">
        <div v-show="editCallId !== call.id" class="pa2">
          <span v-if="!call.content">
            {{ t('people.call_blank_desc', { name: call.contact?.first_name ?? '' }) }}
          </span>
          <span v-if="call.content" dir="auto" class="markdown" v-html="compiledMarkdown(call.content)"></span>
        </div>

        <!-- INLINE UPDATE DIV -->
        <div v-show="editCallId === call.id" class="pa2">
          <div>
            <form-textarea
              v-model="editCall.content"
              :label="t('people.modal_call_comment')"
              :rows="4"
              iclass="br2 f5 w-100 ba b--black-40 pa2 outline-0"
              @content-change="updateEditCallContent($event)"
            />
            <p class="f6">
              {{ t('app.markdown_description') }}
            </p>
          </div>

          <!-- WHO CALLED -->
          <div class="pb3 mb3 mb0-ns">
            <p class="mb2">
              {{ t('people.modal_call_who_called') }}
            </p>
            <div class="di mr3">
              <input :id="'you' + call.id" v-model="editCall.contact_called" type="radio" class="mr1" :name="'contact_called' + call.id"
                     :value="false"
              />
              <p class="f6">
                {{ t('app.markdown_description') }}
              </p>
            </div>

            <!-- WHO CALLED -->
            <div class="pb3 mb3 mb0-ns">
              <p class="mb2">
                {{ t('people.modal_call_who_called') }}
              </p>
              <div class="di mr3">
                <input :id="'you' + call.id" v-model="editCall.contact_called" type="radio" class="mr1" :name="'contact_called' + call.id"
                       :value="false"
                />
                <label :for="'you' + call.id" class="pointer">
                  {{ t('people.call_you_called') }}
                </label>
              </div>
              <div class="di mr3">
                <input :id="'contact' + call.id" v-model="editCall.contact_called" type="radio" class="mr1" :name="'contact_called' + call.id"
                       :value="true"
                />
                <label :for="'contact' + call.id" class="pointer">
                  {{ t('people.call_he_called', { name : name }) }}
                </label>
              </div>
            </div>

            <!-- EMOTIONS -->
            <div class="bb b--gray-monica pb3 mb3">
              <label class="b">
                {{ t('people.modal_call_emotion') }}
              </label>
              <emotion class="pv2" :initial-emotions="call.emotions" @update="updateEmotionsList" />
            </div>

            <!-- ACTIONS -->
            <div class="">
              <div class="flex-ns justify-between">
                <div class="">
                  <a class="btn tc w-auto-ns w-100 mb2 pb0-ns" href="" @click.prevent="editCallId = 0">
                    {{ t('app.cancel') }}
                  </a>
                </div>
                <div class="">
                  <button class="btn btn-primary w-auto-ns w-100 mb2 pb0-ns" @click.prevent="update()">
                    {{ t('app.update') }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ADDITIONAL INFORMATION -->
        <div class="pa2 cf bt b--black-10 br--bottom f7 lh-copy">
          <div class="w-70" :class="[ dirltr ? 'fl' : 'fr' ]">
            <span :class="[ dirltr ? 'mr3' : 'ml3' ]">
              {{ formatMomentLL(call.called_at) }}
            </span>
            <span :class="[ dirltr ? 'mr3' : 'ml3' ]">
              {{ call.contact_called ? t('people.call_he_called', { name : name }) : t('people.call_you_called') }}
            </span>

            <!-- EMOTION LIST -->
            <span v-if="call.emotions.length !== 0">
              <span :class="[ dirltr ? 'mr2' : 'ml2' ]">
                {{ t('people.call_emotions') }}
              </span>
              <ul class="di">
                <li v-for="emotion in call.emotions" :key="emotion.id" class="di">
                  {{ t('app.emotion_' + emotion.name) }}
                </li>
              </ul>
            </span>
          </div>

          <div :class="[ dirltr ? 'fl tr' : 'fr tl' ]" class="w-30">
            <a :class="[ dirltr ? 'mr2' : 'ml2' ]" class="pointer " href="" @click.prevent="showEditBox(call)">
              {{ t('app.update') }}
            </a>
            <a v-show="destroyCallId !== call.id" v-cy-name="'delete-call-button-'+call.id" class="pointer" href="" @click.prevent="showDestroyCall(call)">
              {{ t('app.delete') }}
            </a>
            <ul v-show="destroyCallId === call.id" class="di">
              <li class="di">
                <a class="pointer mr1" href="" @click.prevent="destroyCallId = 0">
                  {{ t('app.cancel') }}
                </a>
              </li>
              <li class="di">
                <a v-cy-name="'delete-call-confirm-button-'+call.id" class="pointer red" href="" @click.prevent="destroyCall(call)">
                  {{ t('app.delete_confirm') }}
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, getCurrentInstance } from 'vue';
import { useI18n } from 'vue-i18n';
import axios from 'axios';
import moment from 'moment';
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import Emotion from '../Emotion.vue';
import { useHtmlDir } from '../../../composables/useHtmlDir';
import { useNotify } from '../../../composables/useNotify';
import { locale as bootLocale } from '../../../boot';
import type { Emotion as EmotionRecord } from '../types';

interface Call {
  id: number;
  content: string;
  called_at: string;
  contact_called: boolean;
  emotions: EmotionRecord[];
  contact?: { first_name?: string };
}

interface LastCalledInstance {
  getLastCalled: () => void;
}

const props = withDefaults(
  defineProps<{
    hash?: string;
    name?: string;
  }>(),
  {
    hash: '',
    name: '',
  },
);

const { t } = useI18n();
const { dirltr } = useHtmlDir();
const { notify } = useNotify();
const locale = bootLocale;
const instance = getCurrentInstance();

const calls = ref<Call[]>([]);
const displayLogCall = ref(false);
const todayDate = ref('');
const editCallId = ref(0);
const destroyCallId = ref(0);
const chosenEmotions = ref<EmotionRecord[]>([]);

const newCall = reactive<{
  content: string;
  called_at: string;
  contact_called: boolean;
  emotions: number[];
}>({
  content: '',
  called_at: '',
  contact_called: false,
  emotions: [],
});

const editCall = reactive<{
  content: string;
  called_at?: string;
  contact_called: boolean;
  emotions: number[];
}>({
  content: '',
  contact_called: false,
  emotions: [],
});

onMounted(async () => {
  await getCalls();
  todayDate.value = moment().format('YYYY-MM-DD');
  newCall.called_at = todayDate.value;
});

function formatMomentLL(date: string): string {
  return moment.utc(date).format('LL');
}

function compiledMarkdown(text: string | null | undefined): string {
  return text !== undefined && text !== null ? DOMPurify.sanitize(marked.parse(text) as string) : '';
}

function resetFields() {
  newCall.content = '';
  newCall.called_at = todayDate.value;
}

async function getCalls() {
  const response = await axios.get('people/' + props.hash + '/calls');
  calls.value = response.data.data as Call[];
}

async function store() {
  await axios.post('people/' + props.hash + '/calls', newCall);
  await getCalls();
  resetFields();
  displayLogCall.value = false;
  chosenEmotions.value = [];
  updateLastCalled();
  notify({
    group: 'main',
    title: t('people.calls_add_success'),
    text: '',
    type: 'success',
  });
}

async function update() {
  await axios.put('people/' + props.hash + '/calls/' + editCallId.value, editCall);
  await getCalls();
  editCallId.value = 0;
  chosenEmotions.value = [];
  updateLastCalled();
  notify({
    group: 'main',
    title: t('app.default_save_success'),
    text: '',
    type: 'success',
  });
}

function updateLastCalled() {
  // Called from axios await chains — if the parent (contact page) has
  // unmounted between request and response, the parent ref is gone.
  // Same root cause as #743.
  const parent = instance?.parent;
  const refs = parent?.refs as Record<string, LastCalledInstance | undefined> | undefined;
  refs?.lastCalledAttribute?.getLastCalled();
}

function showEditBox(call: Call) {
  editCallId.value = call.id;
  editCall.content = call.content;
  editCall.contact_called = call.contact_called;
  editCall.called_at = moment.utc(call.called_at).format('YYYY-MM-DD');
}

function updateDate(updatedContent: string) {
  newCall.called_at = updatedContent;
}

function showDestroyCall(call: Call) {
  destroyCallId.value = call.id;
}

async function destroyCall(call: Call) {
  await axios.delete('people/' + props.hash + '/calls/' + destroyCallId.value);
  const idx = calls.value.indexOf(call);
  if (idx >= 0) calls.value.splice(idx, 1);
  updateLastCalled();
}

function updateEditCallContent(content: string) {
  editCall.content = content;
}

function updateEmotionsList(emotions: EmotionRecord[]) {
  chosenEmotions.value = emotions;
  newCall.emotions = [];
  editCall.emotions = [];
  for (let i = 0; i < chosenEmotions.value.length; i++) {
    newCall.emotions.push(chosenEmotions.value[i].id);
    editCall.emotions.push(chosenEmotions.value[i].id);
  }
}
</script>
