<style scoped>
.avatar-padding {
  padding-top: 19%
}
</style>

<template>
  <span>
    <img v-if="check"
         v-tooltip.bottom="contact?.complete_name"
         :class="['br4 h3 w3 dib tc', imgclass]"
         :alt="contact?.initials"
         :src="avatar_url"
         @error="check=false"
    />
    <span v-else
          v-tooltip.bottom="contact?.complete_name"
          :class="['br4 h3 w3 dib tc', 'white f3 avatar-padding', imgclass]"
          :style="'background-color: '+ default_avatar_color"
    >
      {{ contact?.initials }}
    </span>
  </span>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

interface AvatarInfo {
  url?: string;
  default_avatar_color?: string;
}

interface ContactInfo {
  avatar?: AvatarInfo;
}

interface Contact {
  initials?: string;
  complete_name?: string;
  avatar_url?: string;
  default_avatar_color?: string;
  information?: ContactInfo | unknown;
}

const props = withDefaults(
  defineProps<{
    contact?: Contact | null;
    imgclass?: string;
  }>(),
  {
    contact: null,
    imgclass: '',
  },
);

const check = ref(true);

function isContactInfo(value: unknown): value is ContactInfo {
  return typeof value === 'object' && value !== null;
}

const avatar_url = computed(() => {
  if (isContactInfo(props.contact?.information)) {
    return props.contact?.information.avatar?.url;
  }
  return props.contact?.avatar_url;
});

const default_avatar_color = computed(() => {
  if (isContactInfo(props.contact?.information)) {
    return props.contact?.information.avatar?.default_avatar_color;
  }
  return props.contact?.default_avatar_color;
});
</script>
