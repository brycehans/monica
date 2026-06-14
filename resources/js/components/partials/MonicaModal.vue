<style>
.monica-modal__overlay {
  background: rgba(0, 0, 0, 0.5);
}

.monica-modal__content {
  display: flex;
  justify-content: center;
  align-items: center;
}

.monica-modal__panel {
  position: relative;
  max-width: 500px;
  max-height: 80vh;
  margin: 0 auto;
  padding: 20px 30px;
  overflow-y: auto;
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 8px #999;
  font-family: Helvetica, Arial, sans-serif;
}

.monica-modal__title {
  margin: 0 0 16px;
  font-size: 20px;
  font-weight: 500;
}

.monica-modal__close {
  position: absolute;
  top: 8px;
  right: 16px;
  font-size: 28px;
  color: #999;
  text-decoration: none;
}

.monica-modal__footer {
  margin-top: 20px;
}
</style>

<template>
  <vue-final-modal
    :model-value="modelValue"
    class="monica-modal"
    content-class="monica-modal__content"
    overlay-class="monica-modal__overlay"
    :click-to-close="!blocking"
    :esc-to-close="!blocking"
    @update:model-value="(v) => $emit('update:modelValue', v)"
    @opened="$emit('open')"
    @closed="$emit('close')"
  >
    <div class="monica-modal__panel" role="dialog" :aria-label="title || undefined">
      <h3 v-if="title" class="monica-modal__title">
        {{ title }}
      </h3>
      <a v-if="!blocking" class="monica-modal__close pointer" href="" :aria-label="t('app.close')" @click.prevent="$emit('update:modelValue', false)">&times;</a>
      <div class="monica-modal__body">
        <slot ></slot>
      </div>
      <div v-if="$slots.button" class="monica-modal__footer">
        <slot name="button" ></slot>
      </div>
    </div>
  </vue-final-modal>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { VueFinalModal } from 'vue-final-modal';

// When `blocking` is true, the X close link is suppressed and esc /
// click-outside do nothing. Use for modals where the only valid exits are
// explicit Cancel / Done buttons that run cleanup (see SetAvatar: closing
// via X would bypass cancelCrop and leave the uncropped upload in the file
// input).
withDefaults(
  defineProps<{
    modelValue?: boolean;
    title?: string;
    blocking?: boolean;
  }>(),
  {
    modelValue: false,
    title: '',
    blocking: false,
  },
);

defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'open'): void;
  (e: 'close'): void;
}>();

const { t } = useI18n();
</script>
