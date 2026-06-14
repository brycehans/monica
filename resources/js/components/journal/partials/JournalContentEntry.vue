<template>
  <div>
    <!-- Left columns: showing calendar -->
    <journal-calendar :journal-entry="journalEntry" />

    <!-- Right column: showing logs -->
    <div :class="[ dirltr ? 'fl' : 'fr' ]" class="journal-calendar-content">
      <div v-tooltip.top="t('journal.journal_created_at', { date: entry.created_at })"
           class="br3 ba b--gray-monica bg-white pr3 pb3 pt3 mb3 journal-line"
      >
        <div class="flex">
          <!-- Day -->
          <div class="flex-none w-10 tc">
            <h3 class="mb0 normal">
              {{ entry.day }}
            </h3>
            <p class="mb0">
              {{ entry.day_name }}
            </p>
          </div>

          <!-- Log content -->
          <div class="flex-auto">
            <p class="mb1">
              <span class="pr2 f6 avenir">
                {{ t('journal.journal_entry_type_journal') }}
              </span>
            </p>
            <h3 class="mb1">
              {{ entry.title }}
            </h3>

            <span dir="auto" class="markdown" v-html="compiledMarkdown(entry.post)"></span>

            <ul class="f7">
              <li class="di">
                <a v-cy-name="'entry-edit-button-' + entry.id" class="pointer" :href="'journal/entries/' + entry.id + '/edit'">
                  {{ t('app.edit') }}
                </a>
              </li>
              <li class="di">
                <confirm v-cy-name="'entry-delete-button-' + entry.id" :message="t('journal.delete_confirmation')" @confirm="trash()">
                  {{ t('app.delete') }}
                </confirm>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import axios from 'axios';
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import Confirm from '../../partials/Confirm.vue';
import JournalCalendar from './JournalCalendar.vue';
import { useHtmlDir } from '../../../composables/useHtmlDir';

interface EntryObject {
  id: number;
  day?: number | string;
  day_name?: string;
  created_at?: string;
  title?: string;
  post?: string;
}

interface JournalEntry {
  id: number;
  object: EntryObject;
}

const props = withDefaults(
  defineProps<{
    journalEntry?: JournalEntry | null;
  }>(),
  {
    journalEntry: null,
  },
);

const emit = defineEmits<{
  (e: 'deleteJournalEntry', id: number): void;
}>();

const { t } = useI18n();
const { dirltr } = useHtmlDir();

const entry = ref<EntryObject>({ id: 0 });

onMounted(() => {
  if (props.journalEntry) {
    entry.value = props.journalEntry.object;
  }
});

async function trash() {
  if (!props.journalEntry) return;
  await axios.delete('journal/' + entry.value.id);
  emit('deleteJournalEntry', props.journalEntry.id);
}

function compiledMarkdown(text: string | null | undefined): string {
  return text !== undefined && text !== null ? DOMPurify.sanitize(marked.parse(text) as string) : '';
}
</script>
