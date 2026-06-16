<template>
  <div ref="rootRef" class="dropdown" :class="{ show: isOpen }">
    <a
      :id="triggerId || undefined"
      href=""
      class="dropdown-btn"
      :aria-expanded="isOpen ? 'true' : 'false'"
      @click.prevent="toggle"
    >
      <slot name="trigger">{{ label }}</slot>
    </a>
    <div
      class="dropdown-menu"
      :class="{ show: isOpen }"
      :aria-labelledby="triggerId || undefined"
      @click="close"
    >
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';

defineProps<{
  label?: string;
  triggerId?: string;
}>();

const isOpen = ref(false);
const rootRef = ref<HTMLElement | null>(null);

function toggle() {
  isOpen.value = !isOpen.value;
}

function close() {
  isOpen.value = false;
}

function onDocumentClick(event: MouseEvent) {
  if (!rootRef.value) return;
  if (!rootRef.value.contains(event.target as Node)) {
    isOpen.value = false;
  }
}

onMounted(() => {
  document.addEventListener('click', onDocumentClick);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocumentClick);
});
</script>
