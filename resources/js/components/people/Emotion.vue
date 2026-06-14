<style scoped>
.emotion-action-menu {
    border-radius: 3px;
    box-shadow: 1px 0px 1px rgba(43, 45, 80, 0.16), -1px 1px 1px rgba(43, 45, 80, 0.16), 0px 1px 4px rgba(43, 45, 80, 0.18);
    top: 34px;
    left: 0px;
    width: 150px;
}

.emotion-action-menu li:last-child {
    border-bottom: 0;
}

.emotion {
    background: #E5F3F9;
    border-radius: 7px;
}

.emotion span {
    border-left-color: #A6C8D6;
}

.emotion-add-arrow {
    right: 10px;
    top: 12px;
}

.emotion-list-line:hover {
    background-color: #f1f5fd;
}
</style>

<template>
  <div>
    <div class="relative">
      <!-- CHOSEN EMOTIONS -->
      <ul v-show="chosenEmotions.length !== 0" class="mr2 di">
        <li v-for="chosenEmotion in chosenEmotions" :key="chosenEmotion.id" class="dib emotion br5 mr2">
          <span class="ph2 pv1 dib">
            {{ t('app.emotion_' + chosenEmotion.name) }}
          </span>
          <span class="bl ph2 pv1 f6 pointer" @click.prevent="removeEmotion(chosenEmotion)">
            ❌
          </span>
        </li>
      </ul>

      <div class="relative dib">
        <a class="pointer small-btn pa2" @click.prevent="menu = true">
          😐 {{ t('people.emotion_this_made_me_feel') }}
        </a>

        <!-- MENU OF EMOTIONS -->
        <ul v-show="menu" class="absolute emotion-action-menu bg-white z-max pv1">
          <!-- PRIMARY -->
          <li v-for="primaryEmotion in primaryEmotions" v-show="emotionsMenu === 'primary'" :key="'primary' + primaryEmotion.id" class="pa2 pointer relative emotion-list-line" @click.prevent="showSecondary(primaryEmotion)">
            {{ t('app.emotion_primary_' + primaryEmotion.name) }}

            <svg class="absolute emotion-add-arrow" width="10" height="13" viewBox="0 0 10 13" fill="none"
                 xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M8.75071 5.66783C9.34483 6.06361 9.34483 6.93653 8.75072 7.33231L1.80442 11.9598C1.13984 12.4025 0.25 11.9261 0.25 11.1275L0.25 1.87263C0.25 1.07409 1.13984 0.59767 1.80442 1.04039L8.75071 5.66783Z" fill="#C4C4C4" />
            </svg>
          </li>

          <!-- SECONDARY -->
          <li v-show="emotionsMenu === 'secondary'" class="pa2 pointer bb b--gray-monica">
            <a class="no-underline" @click.prevent="emotionsMenu = 'primary'">
              ← {{ t('app.back') }}
            </a>
          </li>
          <li v-for="secondaryEmotion in secondaryEmotions" v-show="emotionsMenu === 'secondary'" :key="'secondary' + secondaryEmotion.id" class="pa2 pointer relative emotion-list-line" @click.prevent="showEmotion(secondaryEmotion)">
            {{ t('app.emotion_secondary_' + secondaryEmotion.name) }}

            <svg class="absolute emotion-add-arrow" width="10" height="13" viewBox="0 0 10 13" fill="none"
                 xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M8.75071 5.66783C9.34483 6.06361 9.34483 6.93653 8.75072 7.33231L1.80442 11.9598C1.13984 12.4025 0.25 11.9261 0.25 11.1275L0.25 1.87263C0.25 1.07409 1.13984 0.59767 1.80442 1.04039L8.75071 5.66783Z" fill="#C4C4C4" />
            </svg>
          </li>

          <!-- EMOTION -->
          <li v-show="emotionsMenu === 'emotions'" class="pa2 pointer bb b--gray-monica">
            <a class="no-underline" @click.prevent="emotionsMenu = 'secondary'">
              ← {{ t('app.back') }}
            </a>
          </li>
          <li v-for="emotion in emotions" v-show="emotionsMenu === 'emotions'" :key="emotion.id" class="pa2 pointer emotion-list-line" @click.prevent="addEmotion(emotion)">
            {{ t('app.emotion_' + emotion.name) }}
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, getCurrentInstance } from 'vue';
import { useI18n } from 'vue-i18n';
import axios from 'axios';

interface Emotion {
  id: number;
  name: string;
}

const props = withDefaults(
  defineProps<{
    initialEmotions?: Emotion[];
  }>(),
  {
    initialEmotions: () => [],
  },
);

const emit = defineEmits<{
  (e: 'update', value: Emotion[]): void;
}>();

const { t } = useI18n();
const instance = getCurrentInstance();

const emotions = ref<Emotion[]>([]);
const primaryEmotions = ref<Emotion[]>([]);
const secondaryEmotions = ref<Emotion[]>([]);
const selectedPrimaryEmotionId = ref(0);
const selectedSecondaryEmotionId = ref(0);
const chosenEmotions = ref<Emotion[]>([]);
const menu = ref(false);
const emotionsMenu = ref<'primary' | 'secondary' | 'emotions'>('primary');

onMounted(async () => {
  await getPrimaryEmotions();
  chosenEmotions.value = props.initialEmotions;
  window.addEventListener('click', close);
});

onBeforeUnmount(() => {
  window.removeEventListener('click', close);
});

function close(e: MouseEvent) {
  const rootEl = instance?.vnode.el as HTMLElement | undefined;
  if (rootEl && !rootEl.contains(e.target as Node)) {
    menu.value = false;
  }
}

async function getPrimaryEmotions() {
  const response = await axios.get('emotions');
  primaryEmotions.value = response.data.data;
}

async function getSecondaryEmotions() {
  const response = await axios.get('emotions/primaries/' + selectedPrimaryEmotionId.value + '/secondaries');
  secondaryEmotions.value = response.data.data;
}

async function getEmotions() {
  const response = await axios.get(
    'emotions/primaries/' + selectedPrimaryEmotionId.value + '/secondaries/' + selectedSecondaryEmotionId.value + '/emotions',
  );
  emotions.value = response.data.data;
}

async function showSecondary(primaryEmotion: Emotion) {
  selectedPrimaryEmotionId.value = primaryEmotion.id;
  await getSecondaryEmotions();
  emotionsMenu.value = 'secondary';
}

async function showEmotion(secondaryEmotion: Emotion) {
  selectedSecondaryEmotionId.value = secondaryEmotion.id;
  await getEmotions();
  emotionsMenu.value = 'emotions';
}

function addEmotion(emotion: Emotion) {
  menu.value = false;
  chosenEmotions.value.push(emotion);
  emotionsMenu.value = 'primary';
  emit('update', chosenEmotions.value);
}

function removeEmotion(emotion: Emotion) {
  const idx = chosenEmotions.value.indexOf(emotion);
  if (idx >= 0) chosenEmotions.value.splice(idx, 1);
  emit('update', chosenEmotions.value);
}
</script>
