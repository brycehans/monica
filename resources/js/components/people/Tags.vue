<style scoped>
.autocomplete-results {
    width: 150px;
}

.autocomplete-result.is-active,
  .autocomplete-result:hover {
    background-color: #4AAE9B;
    color: white;
  }

.tag-link,
.tag-link:hover{
    text-decoration: none;
}
</style>

<template>
  <div ref="root" class="tc">
    <!-- list of existing tags -->
    <ul>
      <li v-for="tag in contactTags" :key="tag.id" class="di mr2">
        <a v-if="!editMode" :href="`people?tags[]=${encodeURIComponent(tag.name)}`" class="tag-link bg-white ph2 pb1 pt0 dib br3 b--light-gray ba mb2">
          {{ tag.name }}
        </a>
        <span v-else class="bg-white ph2 pb1 pt0 dib br3 b--light-gray ba mb2">
          <span>
            {{ tag.name }}
          </span>
          <span class="pointer" @click="removeTag(tag)">
            ×
          </span>
        </span>
      </li>

      <!-- edit button -->
      <li v-show="contactTags.length > 0" class="di">
        <a v-show="!editMode" class="pointer" href="" @click.prevent="enterEditMode">
          {{ t('app.edit') }}
        </a>
      </li>

      <!-- add a new tag -->
      <li v-show="editMode" class="di mb3">
        <div class="relative di mr2">
          <input ref="tags"
                 v-model="search"
                 type="text"
                 class="di br2 f5 ba b--black-40 pa2 outline-0"
                 :placeholder="t('people.tag_add_search')"
                 @keydown.down="onArrowDown"
                 @keydown.up="onArrowUp"
                 @keydown.enter="onEnter"
                 @keydown.esc="onEscape"
                 @input="onChange"
          />

          <ul v-show="isOpen" v-if="results.length > 0" class="autocomplete-results ba b--gray-monica absolute bg-white left-0 z-9999">
            <li v-for="(result, i) in results"
                :key="i"
                class="autocomplete-result"
                :class="{ 'is-active': i === arrowCounter }"
                @click="setResult(result)"
            >
              {{ result.name }}
            </li>
          </ul>
        </div>

        <a class="pointer" href="" @click.prevent="search = ''; editMode = false; isOpen = false;">
          {{ t('app.close') }}
        </a>
      </li>

      <!-- case of no tags -->
      <li v-show="contactTags.length === 0 && !editMode" class="di">
        <span class="i mr2">
          {{ t('people.tag_no_tags') }}
        </span>
        <a v-show="!editMode" class="pointer" href="" @click.prevent="enterEditMode">
          {{ t('people.tag_add') }}
        </a>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, useTemplateRef } from 'vue';
import { useI18n } from 'vue-i18n';
import axios from 'axios';
import moment from 'moment';
import { useHtmlDir } from '../../composables/useHtmlDir';

interface Tag {
  id: string | number;
  name: string;
}

const props = defineProps<{
  hash?: string;
}>();

const { t } = useI18n();
const { dirltr } = useHtmlDir();

const tagsInput = useTemplateRef<HTMLInputElement>('tags');
const rootEl = useTemplateRef<HTMLElement>('root');

const allTags = ref<Tag[]>([]);
const contactTags = ref<Tag[]>([]);
const editMode = ref(false);
const search = ref('');
const results = ref<Tag[]>([]);
const isOpen = ref(false);
const arrowCounter = ref(0);

onMounted(() => {
  getExistingTags();
  getContactTags();
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});

async function getExistingTags() {
  const response = await axios.get<{ data: Tag[] }>('tags');
  allTags.value = response.data.data;
}

async function getContactTags() {
  const response = await axios.get<{ data: Tag[] }>('people/' + props.hash + '/tags');
  contactTags.value = response.data.data;
}

async function enterEditMode() {
  editMode.value = true;
  await nextTick();
  tagsInput.value?.focus();
}

function removeTag(tag: Tag) {
  contactTags.value.splice(contactTags.value.indexOf(tag), 1);
  store();
}

function onChange() {
  isOpen.value = true;
  filterResults();
}

function onEnter() {
  if (search.value !== '') {
    contactTags.value.push({
      id: moment().format(),
      name: search.value,
    });
    arrowCounter.value = -1;
    isOpen.value = false;
    search.value = '';
    store();
  }
}

function onArrowDown() {
  if (arrowCounter.value < results.value.length) {
    arrowCounter.value = arrowCounter.value + 1;
    search.value = results.value[arrowCounter.value].name;
  }
}

function onArrowUp() {
  if (arrowCounter.value > 0) {
    arrowCounter.value = arrowCounter.value - 1;
    search.value = results.value[arrowCounter.value].name;
  }
}

function onEscape() {
  arrowCounter.value = -1;
  isOpen.value = false;
  search.value = '';
}

function setResult(result: Tag) {
  search.value = '';
  isOpen.value = false;
  contactTags.value.push(result);
  store();
}

function filterResults() {
  const lowerSearch = search.value.toLowerCase();
  results.value = allTags.value.filter(
    item =>
      item.name.toLowerCase().includes(lowerSearch) &&
      contactTags.value.findIndex(t => t.name === item.name) < 0,
  );
}

async function store() {
  await axios.post('people/' + props.hash + '/tags/update', contactTags.value);
  getExistingTags();
}

function handleClickOutside(evt: MouseEvent) {
  if (rootEl.value && !rootEl.value.contains(evt.target as Node)) {
    isOpen.value = false;
    arrowCounter.value = -1;
  }
}

// Exposed for white-box testing only — not part of the component's public contract.
defineExpose({
  allTags, contactTags, editMode, search, results, isOpen, arrowCounter,
  enterEditMode, removeTag, onChange, onEnter, onArrowDown, onArrowUp,
  onEscape, setResult, filterResults, store,
});
</script>
