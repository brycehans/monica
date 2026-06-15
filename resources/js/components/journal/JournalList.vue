<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity .4s
}
</style>

<template>
  <div class="mw9 center">
    <!-- Left sidebar -->
    <div :class="[dirltr ? 'fl' : 'fr']" class="w-70-ns w-100 pa2">
      <!-- Filters -->
      <div class="filter mb-4">
        <div class="d-flex pb-2">
          <div class="dt">
            <label for="start-date">{{ t('journal.start_date') }}:</label>
            <input id="start-date" v-model="startDate" type="date" class="form-control" />
          </div>
          <div class="dt pl-2">
            <label for="end-date py-2">{{ t('journal.end_date') }}:</label>
            <input id="end-date" v-model="endDate" type="date" class="form-control" />
          </div>
          <div class="dt pl-2">
            <label for="per-page">{{ t('journal.per_page') }}:</label>
            <input id="per-page" v-model="perPage" type="number" class="form-control" />
          </div>
          <div class="dt pl-2">
            <label for="sort-order">{{ t('journal.sort_order') }} :</label>
            <select id="sort-order" v-model="sortOrder" class="form-control">
              <option value="asc">
                {{ t('journal.ascending') }}
              </option>
              <option value="desc">
                {{ t('journal.descending') }}
              </option>
            </select>
          </div>
        </div>
        <button class="btn btn-primary" @click="getEntries">
          {{ t('journal.apply_filter') }}
        </button>
      </div>


      <!-- How was your day -->
      <journal-rate-day @has-rated="hasRated" />

      <!-- Logs -->
      <div v-if="journalEntries.data" v-cy-name="'journal-entries-body'" v-cy-items="journalEntries.data.map(j => j.id)"
           :cy-object-items="journalEntries.data.map(j => j.object.id)"
      >
        <div v-for="journalEntry in journalEntries.data" :key="journalEntry.id"
             v-cy-name="'entry-body-' + journalEntry.id" class="cf"
        >
          <journal-content-rate v-if="journalEntry.journalable_type === 'App\\Models\\Journal\\Day'"
                                :journal-entry="journalEntry" @delete-journal-entry="deleteJournalEntry"
          />

          <journal-content-activity v-else-if="journalEntry.journalable_type === 'App\\Models\\Account\\Activity'"
                                    :journal-entry="journalEntry"
          />

          <journal-content-entry v-else-if="journalEntry.journalable_type === 'App\\Models\\Journal\\Entry'"
                                 :journal-entry="journalEntry" @delete-journal-entry="deleteJournalEntry"
          />
        </div>
      </div>

      <div v-if="((journalEntries.per_page ?? 0) * (journalEntries.current_page ?? 0)) <= (journalEntries.total ?? 0)"
           class="br3 ba b--gray-monica bg-white pr3 pb3 pt3 mb3 tc"
      >
        <p class="mb0 pointer" @click="loadMore()">
          <span v-if="!loadingMore">
            {{ t('app.load_more') }}
          </span>
          <span v-else class="black-50">
            {{ t('app.loading') }}
          </span>
        </p>
      </div>

      <div v-if="journalEntries.total === 0" v-cy-name="'journal-blank-state'"
           class="br3 ba b--gray-monica bg-white pr3 pb3 pt3 mb3 tc"
      >
        <div class="tc mb4">
          <img src="/img/journal/blank.svg" :alt="t('journal.journal_empty')" />
        </div>
        <h3>
          {{ t('journal.journal_blank_cta') }}
        </h3>
        <p>{{ t('journal.journal_blank_description') }}</p>
      </div>
    </div>

    <!-- Right sidebar -->
    <div :class="[dirltr ? 'fl' : 'fr']" class="w-30-ns w-100 pa2">
      <a v-cy-name="'add-entry-button'" href="journal/add" class="btn btn-primary w-100 mb4">
        {{ t('journal.journal_add') }}
      </a>
      <p>{{ t('journal.journal_description') }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import axios from 'axios';
import { useHtmlDir } from '../../composables/useHtmlDir';

interface JournalEntry {
  id: number;
  journalable_type: string;
  object: { id: number };
}

interface JournalEntriesPage {
  data?: JournalEntry[];
  current_page?: number;
  next_page_url?: string | null;
  per_page?: number;
  prev_page_url?: string | null;
  total?: number;
}

const { t } = useI18n();
const { dirltr } = useHtmlDir();

const journalEntries = reactive<JournalEntriesPage>({});
const loadingMore = ref(false);
const startDate = ref('');
const endDate = ref('');
const sortBy = ref('created_at');
const sortOrder = ref<'asc' | 'desc'>('desc');
const perPage = ref(30);

onMounted(getEntries);

async function getEntries() {
  const response = await axios.get('journal/entries', {
    params: {
      start_date: startDate.value,
      end_date: endDate.value,
      per_page: perPage.value,
      sort_order: sortOrder.value,
      sort_by: sortBy.value,
    },
  });
  Object.assign(journalEntries, response.data);
}

function deleteJournalEntry(journalEntryId: number) {
  if (!journalEntries.data) return;
  journalEntries.data = journalEntries.data.filter((element) => element.id !== journalEntryId);
}

function hasRated(journalObject: JournalEntry) {
  if (!journalEntries.data) journalEntries.data = [];
  journalEntries.data.unshift(journalObject);
}

async function loadMore() {
  loadingMore.value = true;
  const response = await axios.get('journal/entries?page=' + ((journalEntries.current_page ?? 0) + 1), {
    params: {
      start_date: startDate.value,
      end_date: endDate.value,
      per_page: perPage.value,
      sort_order: sortOrder.value,
      sort_by: sortBy.value,
    },
  });
  journalEntries.current_page = response.data.current_page;
  journalEntries.next_page_url = response.data.next_page_url;
  journalEntries.per_page = response.data.per_page;
  journalEntries.prev_page_url = response.data.prev_page_url;
  journalEntries.total = response.data.total;
  if (!journalEntries.data) journalEntries.data = [];
  for (const j of response.data.data) {
    journalEntries.data.push(j);
  }
  loadingMore.value = false;
}
</script>
