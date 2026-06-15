<template>
  <p-input
    input-type="radio"
    input-iclass="p-round p-thick"
    :name="name"
    :value="value"
    :model-value="modelValue"
    :iclass="iclass"
    :full-class="fullClass"
    :dclass="dclass"
    :color="color"
    :disabled="disabled"
    :required="required"
    @update:model-value="(v) => emit('update:modelValue', v)"
    @change="(v) => emit('change', v)"
  >
    <template v-if="$slots.inputextra" #inputextra>
      <slot name="inputextra" ></slot>
    </template>
    <template v-if="$slots.default" #default>
      <slot ></slot>
    </template>
    <template v-if="$slots.label" #label>
      <slot name="label" ></slot>
    </template>
    <template v-if="$slots.extra" #extra>
      <slot name="extra" ></slot>
    </template>
  </p-input>
</template>

<script setup lang="ts">
import PInput from './PInput.vue';

withDefaults(
  defineProps<{
    name?: string;
    value?: string | boolean;
    modelValue?: string | boolean;
    iclass?: string | string[];
    fullClass?: string | string[];
    dclass?: string | string[];
    color?: string | string[];
    disabled?: boolean;
    required?: boolean;
  }>(),
  {
    name: '',
    value: '',
    modelValue: '',
    iclass: '',
    fullClass: '',
    dclass: '',
    color: '',
    disabled: false,
    required: false,
  },
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | boolean): void;
  (e: 'change', value: string | boolean): void;
}>();
</script>
