<style scoped>
textarea {
  transition: all;
  transition-duration: 0.2s;
  border: 1px solid #c4cdd5;
}
textarea:focus {
  border: 1px solid #5c6ac4;
}
</style>

<template>
  <div>
    <label
      v-if="label"
      :for="realid"
      class="mb2"
      :class="{ b: required }"
    >
      {{ label }}
    </label>
    <textarea
      :id="realid"
      v-model="buffer"
      autofocus
      :required="required"
      :name="id"
      :placeholder="placeholder"
      :rows="rows"
      class="br2 f5 w-100 ba b--black-40 pa2 outline-0"
      :style="textareaStyle"
      @input="emitUpdate"
    ></textarea>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, getCurrentInstance } from 'vue';

const props = withDefaults(
  defineProps<{
    modelValue?: string;
    modelModifiers?: Record<string, unknown>;
    label?: string;
    id?: string;
    placeholder?: string;
    required?: boolean;
    width?: number;
    rows?: number;
  }>(),
  {
    modelValue: '',
    modelModifiers: () => ({}),
    label: '',
    id: '',
    placeholder: '',
    required: true,
    width: -1,
    rows: 0,
  },
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'input', value: string): void;
}>();

const uid = getCurrentInstance()?.uid ?? 0;

const buffer = ref(props.modelValue);

const realid = computed(() => props.id + uid);

const textareaStyle = computed(() => (props.width >= 0 ? 'width:' + props.width + 'px' : ''));

watch(() => props.modelValue, (newValue) => {
  buffer.value = newValue;
});

onMounted(() => {
  buffer.value = props.modelValue;
});

function emitUpdate() {
  emit('update:modelValue', buffer.value);
  emit('input', buffer.value);
}
</script>
