<style lang="scss" >
</style>

<template>
  <div>
    <contact-autosuggest
      :title="title"
      :required="required"
      :placeholder="placeholder"
      :component-item="componentItem"
      :input-class="'header-search-input'"
      @select="select"
    />
  </div>
</template>

<script setup lang="ts">
import { markRaw } from 'vue';
import ContactAutosuggest from './partials/ContactAutosuggest.vue';
import ContactItem from './partials/ContactItem.vue';

interface SelectedContact {
  item: {
    id: number;
    route?: string;
    keyword?: string;
  };
}

const props = withDefaults(
  defineProps<{
    title?: string | null;
    required?: boolean;
    placeholder?: string;
    formNameOrder?: string;
  }>(),
  {
    title: null,
    required: true,
    placeholder: '',
    formNameOrder: 'firstname',
  },
);

const componentItem = markRaw(ContactItem);

function capitalize(s: string): string {
  return s.length ? s[0].toUpperCase() + s.slice(1).toLowerCase() : s;
}

function select(contact: SelectedContact) {
  if (contact.item.id > 0) {
    if (contact.item.route) {
      window.location.href = contact.item.route;
    }
    return;
  }
  // contact with ID = -1 is the 'add person' contact

  const keyword = (contact.item.keyword ?? '').trim();
  let names: string;
  let email: string | undefined;

  // attempt to extract name and email from 'first last <email@example.com>' format
  // https://stackoverflow.com/questions/9558608/regex-for-parsing-name-and-email-from-a-single-string
  const emailAndNameMatch = keyword.match(/(.*[^\s*<])?\s*<(.*)>/);

  if (emailAndNameMatch === null) {
    names = keyword;
  } else {
    names = emailAndNameMatch[1] ?? '';
    email = emailAndNameMatch[2];
  }

  const nameParts = names.split(' ').map(capitalize);

  let first_name: string;
  let last_name: string;
  if (props.formNameOrder === 'firstname') {
    first_name = nameParts[0];
    last_name = nameParts.slice(1).join(' ');
  } else {
    first_name = nameParts.slice(1).join(' ');
    last_name = nameParts[0];
  }

  const params = new URLSearchParams();
  if (first_name) params.set('first_name', first_name);
  if (last_name) params.set('last_name', last_name);
  if (email) params.set('email', email);
  const p = params.toString();

  window.location.href = 'people/add' + (p !== '' ? '?' + p : '');
}
</script>
