<style scoped>
.select {
  height: 34px;
  transition: all;
  transition-duration: 0.2s;
  border: 1px solid #c4cdd5;
}
.select:focus {
  border: 1px solid #5c6ac4;
}
</style>

<template>
  <div :class="{ 'form-group-error': validator && validator.$error }">
    <label
      v-if="title"
      :for="realid"
      class="mb2"
      :class="{ b: required, error: validator && validator.$error }"
    >
      {{ title }}
    </label>
    <select
      :id="realid"
      ref="select"
      :value="selectedOption"
      :name="id"
      :required="required"
      :class="selectClass"
      @input="onInput"
    >
      <template v-if="Array.isArray(options)">
        <option
          v-for="option in filterExclude(options)"
          :key="option.id"
          :value="option.id"
        >
          {{ option.name }}
        </option>
      </template>
      <template v-else>
        <optgroup
          v-for="(optgroup,index) in options"
          :key="index"
          :label="optgroup.name"
        >
          <option
            v-for="option in filterExclude(optgroup.options)"
            :key="option.id"
            :value="option.id"
          >
            {{ option.name }}
          </option>
        </optgroup>
      </template>
    </select>
    <small v-if="validator?.$error && validator.required?.$invalid" class="error">
      {{ requiredMessage }}
    </small>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, getCurrentInstance, useTemplateRef } from 'vue';
import { useI18n } from 'vue-i18n';

interface Validator {
  $error: boolean;
  $touch: () => void;
  required?: { $invalid: boolean };
}

interface Option {
  id: string | number;
  name: string;
}

interface OptGroup {
  name: string;
  options: Option[];
}

const props = withDefaults(
  defineProps<{
    modelValue?: string | number;
    modelModifiers?: Record<string, unknown>;
    options?: Option[] | Record<string, OptGroup>;
    title?: string;
    label?: string | null;
    id?: string;
    excludedId?: number;
    required?: boolean;
    iclass?: string;
    validator?: Validator | null;
  }>(),
  {
    modelValue: '',
    modelModifiers: () => ({}),
    options: () => [],
    title: '',
    label: null,
    id: '',
    excludedId: -1,
    required: true,
    iclass: '',
    validator: null,
  },
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'input', value: string): void;
}>();

const { t } = useI18n();
const uid = getCurrentInstance()?.uid ?? 0;
const selectEl = useTemplateRef<HTMLSelectElement>('select');

const selectedOption = ref<string | number | null>(null);

const realid = computed(() => props.id + uid);

const selectClass = computed(() => {
  const c: Array<string | Record<string, boolean>> = [
    props.iclass !== '' ? props.iclass : 'br2 f5 w-100 ba b--black-40 pa2 outline-0',
  ];
  if (props.validator) {
    c.push({ error: props.validator.$error });
  }
  c.push('select');
  return c;
});

const field = computed(() => (props.label && props.label.length > 0 ? props.label : props.title));

const requiredMessage = computed(() => t('validation.vue.required', { field: field.value }));

watch(() => props.modelValue, (newValue) => {
  selectedOption.value = newValue;
});

onMounted(() => {
  selectedOption.value = props.modelValue;
});

function filterExclude<T extends { id: string | number }>(options: T[]): T[] {
  return options.filter((option) => option.id !== props.excludedId);
}

function focus() {
  selectEl.value?.focus();
}

function onInput(event: Event) {
  if (props.validator) {
    props.validator.$touch();
  }
  const value = (event.target as HTMLSelectElement).value;
  emit('update:modelValue', value);
  emit('input', value);
}

defineExpose({ focus });
</script>
