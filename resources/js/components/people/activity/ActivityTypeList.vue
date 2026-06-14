<template>
  <form-select
    :id="'activity-type-list'"
    v-model="choosenCategory"
    :title="title"
    :options="activityCategories"
    :iclass="'br2 f5 w-100 ba b--black-40 pa2 outline-0'"
    @input="$emit('input', $event)"
  />
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import axios from 'axios';

interface ActivityType {
  id: string | number;
  name: string;
}

interface ApiCategory {
  name: string;
  types: ActivityType[];
}

interface OptGroup {
  name: string;
  options: ActivityType[];
}

const props = withDefaults(
  defineProps<{
    value?: string | number;
    title?: string;
  }>(),
  {
    value: '',
    title: '',
  },
);

defineEmits<{
  (e: 'input', value: string): void;
}>();

const choosenCategory = ref<string | number>('');
const activityCategories = ref<Record<string, OptGroup> | null>(null);

watch(() => props.value, (val) => {
  choosenCategory.value = val;
});

onMounted(async () => {
  await getActivities();
  choosenCategory.value = props.value;
});

async function getActivities() {
  const response = await axios.get('activityCategories');
  // response.data may be object-keyed (Collation::asort style) or an array;
  // Object.values handles both. The downstream Object.assign({}, list)
  // reproduces the original lodash behaviour of producing an int-keyed
  // object for the form-select grouped options.
  const apiCategories = Object.values(response.data ?? {}) as ApiCategory[];
  const list: OptGroup[] = apiCategories.map((a) => ({
    name: a.name,
    options: a.types,
  }));
  activityCategories.value = Object.assign({}, list) as unknown as Record<string, OptGroup>;
}
</script>
