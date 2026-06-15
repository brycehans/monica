<style lang="scss" >
</style>

<template>
  <div>
    <contact-autosuggest
      :id="id"
      ref="contactauto"
      :title="title"
      :required="required"
      :placeholder="placeholder"
      :component-item="componentItem"
      :filter="filter"
      :add-no-result="false"
      :input-class="'user-input-search-input'"
      :overflow="true"
      @select="select"
    />
    <ul class="contacts mt2">
      <ul class="contacts-list table">
        <li v-for="contact in items" :key="contact.id" class="table-row">
          <div class="table-cell w-80">
            <strong>{{ contact.complete_name }}</strong>
          </div>
          <div class="table-cell actions">
            <a class="pointer" href="" @click.prevent="remove(contact)">
              {{ t('app.delete') }}
            </a>
          </div>

          <input type="hidden" name="contacts[]" :value="contact.id" />
        </li>
      </ul>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, markRaw } from 'vue';
import { useI18n } from 'vue-i18n';
import ContactAutosuggest from './partials/ContactAutosuggest.vue';
import ContactMultiItem from './partials/ContactMultiItem.vue';

interface Contact {
  id: number;
  complete_name?: string;
}

const props = withDefaults(
  defineProps<{
    id?: string | null;
    title?: string | null;
    required?: boolean;
    placeholder?: string;
    userContactId?: number;
    contacts?: Contact[];
  }>(),
  {
    id: null,
    title: null,
    required: true,
    placeholder: '',
    userContactId: 0,
    contacts: () => [],
  },
);

const { t } = useI18n();

const items = ref<Contact[]>([]);
const componentItem = markRaw(ContactMultiItem);

onMounted(() => {
  items.value = props.contacts;
});

function filter(item: Contact) {
  return items.value.findIndex((i) => i.id === item.id) < 0;
}

function select(contact: { item?: Contact }) {
  if (contact.item && contact.item.id > 0 && filter(contact.item)) {
    items.value.push(contact.item);
  }
}

function remove(contact: Contact) {
  items.value.splice(items.value.indexOf(contact), 1);
}
</script>
