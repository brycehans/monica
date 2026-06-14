<style scoped>
  .me {
    width: 0;
    height: 0;
    border-top: 10px solid transparent;
    border-bottom: 10px solid transparent;
    border-left: 10px solid #fff;
    top: 120px;
    right: -10px;
  }

  .other {
    width: 0;
    height: 0;
    border-top: 10px solid transparent;
    border-bottom: 10px solid transparent;
    border-right:10px solid #fff;
    top: 120px;
    left: -10px;
  }

  .conversation-block {
    background-color: #D8E2E7;
  }
</style>

<template>
  <div class="pa4-ns ph3 pv2 mb3 mb0-ns bb b--gray-monica">
    <p class="mb2 b">
      {{ t('people.conversation_add_what_was_said') }}
    </p>
    <div class="pa3 ba b--gray-monica br3 conversation-block">
      <div v-for="message in messages" :key="message.uid" class="relative">
        <div :class="message.author + ' absolute'"></div>
        <message
          v-model="message.content"
          :class="{ 'mb3 ml5': message.author === 'me', 'mb3 mr5': message.author === 'other' }"
          :author="message.author"
          :uid="message.uid"
          :participant-name="participantName"
          :display-trash="displayTrash"
          @updateAuthor="updateAuthor($event, message)"
          @deleteMessage="deleteMessage($event)"
        />
      </div>
      <p class="tc mb0">
        <a class="btn btn-secondary pointer" href="" @click.prevent="addMessage">
          {{ t('people.conversation_add_another') }}
        </a>
      </p>
      <input type="hidden" name="messages" :value="messages.map(a => a.uid)" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';

interface Message {
  uid: number;
  content: string;
  author: 'me' | 'other';
}

const props = withDefaults(
  defineProps<{
    participantName?: string;
    existingMessages?: Message[];
  }>(),
  {
    participantName: '',
    existingMessages: () => [],
  },
);

const { t } = useI18n();

const messages = ref<Message[]>([]);
const uid = ref(1);
const displayTrash = ref(false);

onMounted(() => {
  if (props.existingMessages.length > 0) {
    messages.value = props.existingMessages;
    uid.value = messages.value[messages.value.length - 1].uid + 1;
  } else {
    setTimeout(addMessage, 10);
  }
});

function addMessage() {
  messages.value.push({ uid: uid.value++, content: '', author: 'me' });
  if (messages.value.length > 1) {
    displayTrash.value = true;
  }
}

function updateAuthor(updatedAuthor: 'me' | 'other', message: Message) {
  message.author = updatedAuthor;
}

function deleteMessage(targetUid: number) {
  const idx = messages.value.findIndex((item) => item.uid === targetUid);
  if (idx >= 0) messages.value.splice(idx, 1);
  if (messages.value.length <= 1) {
    displayTrash.value = false;
  }
}
</script>
