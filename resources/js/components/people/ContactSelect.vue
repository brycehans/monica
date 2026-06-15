<template>
  <div>
    <p v-if="title" class="mb2" :class="{ b: required }">
      {{ title }}
    </p>
    <input type="hidden" :name="name" :value="selected ? selected.id : ''" />
    <multiselect
      :id="id || ''"
      v-model="selected"
      :options="searchOptions"
      :placeholder="placeholder"
      :delay="wait"
      :min-chars="0"
      :resolve-on-load="true"
      :filter-results="false"
      :searchable="true"
      label="complete_name"
      value-prop="id"
      :object="true"
      :dir="htmldir"
      :aria="{ 'aria-label': title }"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import Multiselect from '@vueform/multiselect';
import '@vueform/multiselect/themes/default.css';
import axios from 'axios';
import { htmldir } from '../../boot';

interface ContactOption {
  id: number;
  complete_name?: string;
}

const props = withDefaults(
  defineProps<{
    id?: string | null;
    modelValue?: ContactOption | null;
    name?: string;
    title?: string;
    required?: boolean;
    userContactId?: number | null;
    defaultOptions?: ContactOption[];
    placeholder?: string;
    wait?: number;
  }>(),
  {
    id: null,
    modelValue: null,
    name: '',
    title: '',
    required: true,
    userContactId: null,
    defaultOptions: () => [],
    placeholder: '',
    wait: 200,
  },
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: ContactOption | null): void;
}>();

const selected = ref<ContactOption | null>(props.modelValue);

watch(() => props.modelValue, (newValue) => {
  selected.value = newValue;
});

watch(selected, (newValue) => {
  emit('update:modelValue', newValue);
});

function filterDefaults(items: ContactOption[]): ContactOption[] {
  if (props.userContactId === null || props.userContactId === undefined) {
    return items;
  }
  return items.filter((item) => item.id !== props.userContactId);
}

async function searchOptions(query: string): Promise<ContactOption[]> {
  if (!query) {
    return filterDefaults(props.defaultOptions);
  }
  const response = await axios.post('people/search', { needle: query });
  return filterDefaults(response.data.data);
}
</script>
