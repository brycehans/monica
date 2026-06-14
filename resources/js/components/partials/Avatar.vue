<template>
  <div class="avatars">
    <a v-if="clickable === true" :href="'people/' + id">
      <avatarimg :contact="contact" :imgclass="imgclass" />
    </a>
    <avatarimg v-else :contact="contact" :imgclass="imgclass" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import Avatarimg from './Avatar.img.vue';

interface Contact {
  id?: number | string;
  hash_id?: string;
  initials?: string;
  complete_name?: string;
  avatar_url?: string;
  default_avatar_color?: string;
  information?: unknown;
}

const props = withDefaults(
  defineProps<{
    contact?: Contact | null;
    clickable?: boolean;
    imgclass?: string;
  }>(),
  {
    contact: null,
    clickable: true,
    imgclass: '',
  },
);

const id = computed(() => (props.contact?.hash_id ? props.contact.hash_id : props.contact?.id));
</script>
