<style scoped style="scss">
div >>> .avatar-small {
  height: 30px;
  width: 30px;
  font-size: 13px;
  border-radius: 0.5rem;
}
</style>

<template>
  <div>
    <div v-if="!limited" class="flex fr">
      <a class="btn btn-primary" href="" @click.prevent="openModal">{{ t('settings.me_select') }}</a>
    </div>
    <div v-if="meContact" class="dib pointer ml2 fl collapse">
      <span class="dt-row">
        <span class="dtc">
          <avatar :contact="meContact" :clickable="true" :imgclass="'avatar-small br1'" />
        </span>
        <span class="dtc">
          <a :href="'people/' + meContact.hash_id" class="avatar-small" :class="dirltr ? 'ml1' : 'mr1'">
            {{ meContact.complete_name }}
          </a>
        </span>
      </span>
    </div>
    <div v-else class="dib pointer fl">
      {{ t('settings.me_no_contact') }}<br />
      <a v-if="!limited" href="" @click.prevent="openModal">{{ t('settings.me_select_click') }}</a>
      <div v-else v-html="t('settings.personalisation_paid_upgrade_vue', {url: 'settings/subscriptions' })"></div>
    </div>
    <div class="cb"></div>

    <monica-modal v-model="showModal" :title="t('settings.me_select')">
      <form>
        <contact-select
          v-model="newContact"
          :required="true"
          :title="t('settings.me_choose')"
          :name="'me_contact_id'"
          :placeholder="t('settings.me_choose_placeholder')"
          :default-options="existingContacts"
        />
      </form>
      <template #button>
        <a class="btn fl" href="" @click.prevent="remove">
          {{ t('settings.me_remove_contact') }}
        </a>
        <a class="btn" href="" @click.prevent="closeModal">
          {{ t('app.cancel') }}
        </a>
        <a class="btn btn-primary" href="" @click.prevent="save">
          {{ t('app.save') }}
        </a>
      </template>
    </monica-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import axios from 'axios';
import { useHtmlDir } from '../../composables/useHtmlDir';

interface Contact {
  id: number;
  hash_id?: string;
  complete_name?: string;
}

const props = withDefaults(
  defineProps<{
    contact?: Contact | null;
    existingContacts?: Contact[];
    limited?: boolean;
  }>(),
  {
    contact: null,
    existingContacts: () => [],
    limited: true,
  },
);

const emit = defineEmits<{
  (e: 'change', value: Contact | null): void;
}>();

const { t } = useI18n();
const { dirltr } = useHtmlDir();

const meContact = ref<Contact | null>(null);
const newContact = ref<Contact | null>(null);
const showModal = ref(false);

watch(() => props.contact, (value) => {
  newContact.value = value;
});

onMounted(() => {
  meContact.value = props.contact;
  newContact.value = props.contact;
});

async function save() {
  if (!newContact.value) return;
  await axios.post('me/contact', { contact_id: newContact.value.id });
  emit('change', newContact.value);
  meContact.value = newContact.value;
  closeModal();
}

async function remove() {
  newContact.value = null;
  await axios.delete('me/contact');
  emit('change', null);
  meContact.value = null;
  closeModal();
}

function openModal() {
  showModal.value = true;
}

function closeModal() {
  showModal.value = false;
}
</script>
