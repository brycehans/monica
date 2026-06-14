<template>
  <div :class="dclass">
    <div :class="wrapperClass">
      <input
        ref="inputEl"
        :type="inputType"
        :name="name"
        :value="value"
        :checked="shouldBeChecked"
        :disabled="disabled"
        :required="required"
        @change="onChange"
      />
      <div :class="stateClass">
        <slot name="inputextra"></slot>
        <label>
          <slot></slot>
        </label>
      </div>
    </div>
    <div class="pointer" @click="select()">
      <label v-if="hasSlot('label')" class="pointer">
        <slot name="label"></slot>
      </label>
      <slot name="extra"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, useTemplateRef, useSlots } from 'vue';

const props = withDefaults(
  defineProps<{
    inputType: 'checkbox' | 'radio' | 'input';
    inputIclass?: string;
    name?: string;
    value?: string | boolean;
    modelValue?: string | boolean;
    modelModifiers?: Record<string, unknown>;
    iclass?: string | string[];
    fullClass?: string | string[];
    dclass?: string | string[];
    color?: string | string[];
    disabled?: boolean;
    required?: boolean;
  }>(),
  {
    inputIclass: '',
    name: '',
    value: '',
    modelValue: '',
    modelModifiers: () => ({}),
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

const inputEl = useTemplateRef<HTMLInputElement>('inputEl');
const slots = useSlots();

const inputClass = computed(() =>
  props.fullClass !== '' ? props.fullClass : [props.iclass, 'p-default', props.inputIclass],
);

const inputColor = computed(() => (props.color !== '' ? props.color : 'primary-o'));

const wrapperClass = computed(() => ['pretty', inputClass.value]);

const stateClass = computed(() => ['state', `p-${inputColor.value}`]);

const shouldBeChecked = computed(() => {
  if (props.inputType === 'radio') {
    return props.modelValue === props.value;
  }
  return typeof props.modelValue === 'string' ? props.modelValue !== '' : !!props.modelValue;
});

function emitChange(val: string | boolean) {
  emit('update:modelValue', val);
  emit('change', val);
}

function onChange(event: Event) {
  if (props.inputType === 'radio') {
    emitChange(props.value);
    return;
  }
  emitChange((event.target as HTMLInputElement).checked);
}

function select() {
  if (props.disabled) {
    return;
  }
  const el = inputEl.value;
  if (!el) return;
  switch (props.inputType) {
  case 'checkbox':
    el.checked = !el.checked;
    emitChange(el.checked);
    break;
  case 'radio':
    el.checked = true;
    emitChange(props.value);
    break;
  case 'input':
    // intentional no-op
    break;
  }
}

function hasSlot(name = 'default') {
  return !!slots[name];
}
</script>
