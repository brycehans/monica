<style scoped>
.input {
  transition: all;
  transition-duration: 0.2s;
  border: 1px solid #c4cdd5;
}

.input:focus {
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
    <input
      :id="realid"
      ref="input"
      :type="inputType"
      autofocus
      :required="required"
      :name="id"
      :placeholder="placeholder"
      :class="inputClass"
      :style="inputStyle"
      :value="modelValue"
      :maxlength="maxlength ?? undefined"
      :step="step"
      @input="onInput($event)"
      @blur="onBlur($event)"
      @change="onChange($event)"
      @keyup.enter="onSubmit($event)"
    />
    <small v-if="validator?.$error && validator.required?.$invalid" class="error">
      {{ requiredMessage }}
    </small>
    <small v-if="validator?.$error && validator.maxLength?.$invalid" class="error">
      {{ maxLengthMessage }}
    </small>
    <small v-if="validator?.$error && validator.url?.$invalid" class="error">
      {{ urlMessage }}
    </small>
  </div>
</template>

<script setup lang="ts">
import { computed, getCurrentInstance, useTemplateRef } from 'vue';
import { useI18n } from 'vue-i18n';

interface Validator {
  $error: boolean;
  $reset: () => void;
  $touch: () => void;
  required?: { $invalid: boolean };
  url?: { $invalid: boolean };
  maxLength?: { $invalid: boolean; $params?: { max?: number } };
}

const props = withDefaults(
  defineProps<{
    modelValue?: string | number;
    modelModifiers?: Record<string, unknown>;
    title?: string;
    label?: string | null;
    id?: string;
    placeholder?: string;
    required?: boolean;
    inputType?: string;
    step?: string;
    width?: number;
    iclass?: string | string[];
    maxlength?: number | null;
    validator?: Validator | null;
  }>(),
  {
    modelValue: '',
    modelModifiers: () => ({}),
    title: '',
    label: null,
    id: '',
    placeholder: '',
    required: true,
    inputType: '',
    step: '',
    width: -1,
    iclass: '',
    maxlength: null,
    validator: null,
  },
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'input', value: string): void;
  (e: 'submit', value: string): void;
  (e: 'blur', value: string): void;
  (e: 'change', value: string): void;
}>();

const { t } = useI18n();
const uid = getCurrentInstance()?.uid ?? 0;
const inputEl = useTemplateRef<HTMLInputElement>('input');

const realid = computed(() => props.id + uid);

const inputClass = computed(() => {
  const c: Array<string | string[] | Record<string, boolean>> = [
    props.iclass !== '' ? props.iclass : 'br2 f5 w-100 ba b--black-40 pa2 outline-0',
  ];
  if (props.validator) {
    c.push({ error: props.validator.$error });
  }
  c.push('input');
  return c;
});

const inputStyle = computed(() => (props.width >= 0 ? 'width:' + props.width + 'px' : ''));

const field = computed(() => (props.label && props.label.length > 0 ? props.label : props.title));

const requiredMessage = computed(() => t('validation.vue.required', { field: field.value }));

const urlMessage = computed(() => t('validation.vue.url', { field: field.value }));

const maxLengthMessage = computed(() => {
  const type = props.inputType === 'number' ? 'numeric' : 'string';
  return t(`validation.vue.max.${type}`, {
    field: field.value,
    max: props.validator?.maxLength?.$params?.max ?? '',
  });
});

function focus() {
  inputEl.value?.focus();
}

function emitUpdate(val: string) {
  emit('update:modelValue', val);
  emit('input', val);
}

function onInput(event: Event) {
  const e = event as InputEvent;
  if (props.validator && e.data !== undefined) {
    props.validator.$reset();
  }
  emitUpdate((event.target as HTMLInputElement).value);
}

function onSubmit(event: Event) {
  if (props.validator) {
    props.validator.$touch();
  }
  emit('submit', (event.target as HTMLInputElement).value);
}

function onBlur(event: Event) {
  const value = (event.target as HTMLInputElement).value;
  if (props.validator && value !== '') {
    props.validator.$touch();
  }
  emit('blur', value);
}

function onChange(event: Event) {
  if (props.validator) {
    props.validator.$touch();
  }
  emit('change', (event.target as HTMLInputElement).value);
}

defineExpose({ focus });
</script>
