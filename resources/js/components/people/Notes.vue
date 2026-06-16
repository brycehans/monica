<style scoped>
  .note:hover {
      background-color: #f6fbff;
  }
</style>

<template>
  <div>
    <notifications group="main" position="bottom right" />

    <div>
      <div>
        <form class="bg-near-white pa2 br2 mb3">
          <textarea v-model="newNote.body" v-cy-name="'add-note-textarea'" class="w-100 br2 pa2 b--light-gray" :placeholder="t('people.notes_add_cta')" @focus="addMode = true"
                    @keyup.esc="addMode = false"
          ></textarea>
          <a v-if="addMode" v-cy-name="'add-note-button'" class="pointer btn btn-primary" href="" @click.prevent="store">
            {{ t('app.add') }}
          </a>
          <a v-if="addMode" v-cy-name="'cancel-note-button'" class="pointer btn" href="" @click.prevent="addMode = false">
            {{ t('app.cancel') }}
          </a>
        </form>
      </div>

      <!-- LIST OF NORMAL NOTES -->
      <ul v-cy-name="'notes-body'" v-cy-items="notes.map(n => n.id)">
        <li v-for="note in notes" :key="note.id" class="note">
          <div v-show="!note.edit" v-cy-name="'note-body-' + note.id" class="ba br2 b--black-10 br--top w-100 mb2">
            <div class="pa2 markdown">
              <span dir="auto" v-html="compiledMarkdown(note.body)"></span>
            </div>
            <div class="pa2 cf bt b--black-10 br--bottom f7 lh-copy">
              <div class="fl w-50">
                <div class="f5 di mr1">
                  <em v-tooltip.top="t('people.notes_favorite')" class="pointer" :class="[note.is_favorited ? 'fa fa-star' : 'fa fa-star-o']" @click="toggleFavorite(note)"></em>
                </div>
                {{ note.created_at_short }}
              </div>
              <div class="fl w-50 tr">
                <a v-cy-name="'edit-note-button-' + note.id" class="pointer" href="" @click.prevent="toggleEditMode(note)">
                  {{ t('app.edit') }}
                </a>
                |
                <a v-cy-name="'delete-note-button-' + note.id" class="pointer" href="" @click.prevent="showDelete(note)">
                  {{ t('app.delete') }}
                </a>
              </div>
            </div>
          </div>

          <!-- EDIT MODE -->
          <form v-show="note.edit" class="bg-near-white pa2 br2 mt3 mb3">
            <textarea v-model="note.body" v-cy-name="'edit-note-body-' + note.id" class="w-100 br2 pa2 b--light-gray" @keyup.esc="note.edit = false"></textarea>
            <a v-cy-name="'edit-mode-note-button-' + note.id" class="pointer btn btn-primary" href="" @click.prevent="update(note)">
              {{ t('app.update') }}
            </a>
          </form>
        </li>
      </ul>
    </div>

    <!-- Delete Note modal -->
    <monica-modal v-model="showDeleteNoteModal" v-cy-name="'modal-delete-note'"
                  :title="t('people.notes_delete_title')"
    >
      <p>
        {{ t('people.notes_delete_confirmation') }}
      </p>
      <template #button>
        <a class="btn" href="" @click.prevent="closeModal">
          {{ t('app.cancel') }}
        </a>
        <a v-cy-name="'delete-mode-note-button-' + deleteNote.id" class="btn btn-primary" href=""
           @click.prevent="trash(deleteNote)"
        >
          {{ t('app.delete') }}
        </a>
      </template>
    </monica-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import axios from 'axios';
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import { useHtmlDir } from '../../composables/useHtmlDir';
import { useNotify } from '../../composables/useNotify';

interface Note {
  id: number;
  body: string;
  is_favorited: boolean;
  created_at_short?: string;
  edit?: boolean;
}

const props = withDefaults(
  defineProps<{
    hash?: string;
  }>(),
  {
    hash: '',
  },
);

const { t } = useI18n();
const { dirltr } = useHtmlDir();
const { notify } = useNotify();

const notes = ref<Note[]>([]);
const addMode = ref(false);

const newNote = reactive<{ id: number; body: string; is_favorited: number }>({
  id: 0,
  body: '',
  is_favorited: 0,
});

const deleteNote = reactive<{ id: number }>({ id: 0 });

const showDeleteNoteModal = ref(false);

onMounted(getNotes);

function toggleEditMode(note: Note) {
  note.edit = !note.edit;
}

async function getNotes() {
  const response = await axios.get('people/' + props.hash + '/notes');
  notes.value = response.data as Note[];
}

async function store() {
  await axios.post('people/' + props.hash + '/notes', newNote);
  newNote.body = '';
  await getNotes();
  addMode.value = false;
  notify({
    group: 'main',
    title: t('people.notes_create_success'),
    text: '',
    type: 'success',
  });
}

async function toggleFavorite(note: Note) {
  await axios.post('people/' + props.hash + '/notes/' + note.id + '/toggle');
  await getNotes();
}

async function update(note: Note) {
  await axios.put('people/' + props.hash + '/notes/' + note.id, note);
  note.edit = false;
  notify({
    group: 'main',
    title: t('people.notes_update_success'),
    text: '',
    type: 'success',
  });
}

function showDelete(note: Note) {
  deleteNote.id = note.id;
  showDeleteNoteModal.value = true;
}

function closeModal() {
  showDeleteNoteModal.value = false;
}

async function trash(note: { id: number }) {
  await axios.delete('people/' + props.hash + '/notes/' + note.id);
  await getNotes();
  closeModal();
  notify({
    group: 'main',
    title: t('people.notes_delete_success'),
    text: '',
    type: 'success',
  });
}

function compiledMarkdown(text: string | null | undefined): string {
  return text !== undefined && text !== null ? DOMPurify.sanitize(marked.parse(text) as string) : '';
}
</script>
