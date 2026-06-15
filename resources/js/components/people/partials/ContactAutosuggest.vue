<style scoped>
.contact-autosuggest {
  position: relative;
  width: 100%;
}

.contact-autosuggest__input {
  width: 100%;
}

.contact-autosuggest__results {
  position: absolute;
  left: 0;
  right: 0;
  z-index: 100;
  margin: 0;
  padding: 0;
  list-style: none;
  background: #ffffff;
  border: 1px solid #d0d0d0;
  border-top: none;
  max-height: 360px;
  overflow-y: auto;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.contact-autosuggest__result {
  background: #ffffff;
  cursor: pointer;
}

.contact-autosuggest__result:hover {
  background: #f5f5f5;
}

.contact-autosuggest--overflow .contact-autosuggest__results {
  max-height: 361px;
  overflow-y: scroll;
}
</style>

<template>
  <div class="contact-autosuggest" :class="{ 'contact-autosuggest--overflow': overflow }">
    <label
      v-if="title"
      class="mb2"
      :class="{ b: required }"
      :for="realid"
    >
      {{ title }}
    </label>
    <input
      :id="realid"
      v-model="query"
      type="text"
      autocomplete="off"
      class="form-control contact-autosuggest__input"
      :class="inputClass"
      :placeholder="placeholder"
      @input="onInput"
      @focus="onFocus"
      @blur="onBlur"
    />
    <ul v-if="open && items.length > 0" class="contact-autosuggest__results">
      <li
        v-for="item in items"
        :key="item.id"
        class="contact-autosuggest__result"
        @mousedown.prevent="onSelect(item)"
      >
        <component :is="componentItem" :item="item" />
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, type Component } from 'vue';
import axios from 'axios';

interface ContactItem {
  id: number;
  name?: string;
  complete_name?: string;
  keyword?: string;
}

const props = withDefaults(
  defineProps<{
    id?: string | null;
    title?: string | null;
    required?: boolean;
    addNoResult?: boolean;
    placeholder?: string;
    componentItem?: Component | null;
    wait?: number;
    minLen?: number;
    overflow?: boolean;
    inputClass?: string;
    filter?: (item: ContactItem) => boolean;
  }>(),
  {
    id: null,
    title: null,
    required: true,
    addNoResult: true,
    placeholder: '',
    componentItem: null,
    wait: 200,
    minLen: 1,
    overflow: false,
    inputClass: '',
    filter: () => true,
  },
);

const emit = defineEmits<{
  (e: 'select', payload: { item: ContactItem }): void;
  (e: 'blur'): void;
}>();

const query = ref('');
const items = ref<ContactItem[]>([]);
const open = ref(false);
const cache = ref<Record<string, ContactItem[]>>({});

const realid = computed(() => (props.id ? props.id : 'autosuggest__input'));

// Minimal debounce — replaces lodash's _.debounce for the search-as-you-type
// input. Carries a .cancel() to drop a queued fetch when a cached result hits.
interface Debounced {
  (text: string): void;
  cancel: () => void;
}

function makeDebounced(fn: (text: string) => void, wait: number): Debounced {
  let handle: ReturnType<typeof setTimeout> | null = null;
  const debounced = ((text: string) => {
    if (handle !== null) clearTimeout(handle);
    handle = setTimeout(() => fn(text), wait);
  }) as Debounced;
  debounced.cancel = () => {
    if (handle !== null) {
      clearTimeout(handle);
      handle = null;
    }
  };
  return debounced;
}

let debounced: Debounced = makeDebounced(() => undefined, 0);

onMounted(() => {
  debounced = makeDebounced((text: string) => fetchMatches(text), props.wait);
});

function addNewSentinel(keyword: string): ContactItem {
  return {
    id: -1,
    name: 'add_new_contact',
    complete_name: 'add_new_contact',
    keyword,
  };
}

function onInput() {
  const text = query.value;
  if (text === '' || text.length < props.minLen) {
    items.value = props.addNoResult && text !== '' ? [addNewSentinel(text)] : [];
    open.value = items.value.length > 0;
    return;
  }
  if (cache.value[text] !== undefined) {
    debounced.cancel();
    items.value = cache.value[text];
    open.value = items.value.length > 0;
  } else {
    debounced(text);
  }
}

async function fetchMatches(text: string) {
  try {
    const response = await axios.post('people/search', { needle: text });
    const data: ContactItem[] = response.data?.data ?? [];
    const matches: ContactItem[] = data
      .map((contact) => ({ ...contact, keyword: text }))
      .filter(props.filter);
    if (props.addNoResult) {
      matches.push(addNewSentinel(text));
    }
    cache.value[text] = matches;
    if (text === query.value) {
      items.value = matches;
      open.value = matches.length > 0;
    }
  } catch {
    // network failure — leave the dropdown empty rather than throw.
  }
}

function onFocus() {
  if (items.value.length > 0) {
    open.value = true;
  }
}

function onBlur() {
  // Defer to let the click handler fire first (mousedown beats blur via
  // .prevent, but click after mouseup can still race).
  setTimeout(() => {
    open.value = false;
    emit('blur');
  }, 150);
}

function onSelect(item: ContactItem) {
  open.value = false;
  emit('select', { item });
  query.value = '';
  items.value = [];
}

function clearCache() {
  cache.value = {};
  items.value = [];
}

defineExpose({ clearCache });
</script>
