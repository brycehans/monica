<style>
.toggle-switch {
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  user-select: none;
}

.toggle-switch__input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.toggle-switch__track {
  position: relative;
  display: inline-block;
  width: 36px;
  height: 20px;
  background: #c0c4cc;
  border-radius: 10px;
  transition: background-color 0.15s ease;
  flex: none;
}

.toggle-switch__thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  background: #ffffff;
  border-radius: 50%;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  transition: transform 0.15s ease;
}

.toggle-switch__input:checked + .toggle-switch__track {
  background: #1976d2;
}

.toggle-switch__input:checked + .toggle-switch__track .toggle-switch__thumb {
  transform: translateX(16px);
}

.toggle-switch__input:focus-visible + .toggle-switch__track {
  outline: 2px solid #1976d2;
  outline-offset: 2px;
}

.toggle-switch__label {
  margin-left: 8px;
  font-size: 14px;
}

.toggle-switch--disabled {
  cursor: not-allowed;
  opacity: 0.6;
}
</style>

<template>
  <div>
    <label
      v-if="title"
      :for="realId"
      class="mb2"
      :class="{ b: required }"
    >
      {{ title }}
    </label>
    <label class="toggle-switch" :class="[inputClass, { 'toggle-switch--disabled': disabled }]">
      <input
        :id="realId"
        type="checkbox"
        :name="id"
        :checked="modelValue"
        :disabled="disabled"
        class="toggle-switch__input"
        @change="onChange"
      />
      <span class="toggle-switch__track">
        <span class="toggle-switch__thumb"></span>
      </span>
      <span v-if="labelText" class="toggle-switch__label">{{ labelText }}</span>
    </label>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

let counter = 0;

interface ToggleLabels {
  checked: string;
  unchecked: string;
}

const props = withDefaults(
  defineProps<{
    modelValue?: boolean;
    title?: string;
    labels?: boolean | ToggleLabels;
    id?: string;
    required?: boolean;
    disabled?: boolean;
    iclass?: string;
  }>(),
  {
    modelValue: false,
    title: '',
    labels: false,
    id: '',
    required: true,
    disabled: false,
    iclass: '',
  },
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'change', value: boolean): void;
}>();

const uid = ++counter;

const realId = computed(() => props.id + '_' + uid);

const inputClass = computed(() => props.iclass);

const labelText = computed(() => {
  if (props.labels && typeof props.labels === 'object') {
    return props.modelValue ? props.labels.checked : props.labels.unchecked;
  }
  return '';
});

function onChange(event: Event) {
  const checked = (event.target as HTMLInputElement).checked;
  emit('update:modelValue', checked);
  emit('change', checked);
}
</script>
