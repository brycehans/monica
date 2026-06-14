<template>
  <div>
    <div>
      <img src="/img/people/tasks.svg" :alt="t('people.tasks_title')" class="icon-section icon-tasks" />
      <h3>
        {{ t('people.section_personal_tasks') }}

        <span v-if="tasks.length !== 0" class="f6 pt2" :class="[ dirltr ? 'fr' : 'fl' ]">
          <a v-if="!editMode" v-cy-name="'task-toggle-edit-mode'" class="pointer" href="" @click.prevent="editMode = true">
            {{ t('app.edit') }}
          </a>
          <a v-else v-cy-name="'task-toggle-edit-mode'" class="pointer" href="" @click.prevent="editMode = false">
            {{ t('app.done') }}
          </a>
        </span>
      </h3>
    </div>

    <div :class="[editMode ? 'bg-washed-yellow b--yellow ba pa2' : '']">
      <!-- EMPTY STATE -->
      <div v-if="tasks.length === 0 && !addMode" v-cy-name="'task-blank-state'" class="tc bg-near-white b--moon-gray pa3">
        <p>{{ t('people.tasks_blank_title') }}</p>
        <p>
          <a v-cy-name="'add-task-button'" class="pointer" href="" @click.prevent="toggleAddMode">
            {{ t('people.tasks_add_task') }}
          </a>
        </p>
      </div>

      <!-- LIST OF IN PROGRESS TASKS -->
      <ul v-cy-name="'tasks-body'" v-cy-items="inProgress(tasks).map(t => t.id)">
        <li v-for="(task, i) in inProgress(tasks)" :key="task.id" v-cy-name="'task-item-' + task.id">
          <form-checkbox
            v-model.lazy="task.completed"
            :disabled="task.disabled"
            :name="'task'"
            :dclass="[ dirltr ? 'mr1' : 'ml1' ]"
            @change="toggleComplete(task)"
          >
            {{ task.title }}
            <span v-if="task.description" class="silver ml3" dir="auto">
              {{ task.description }}
            </span>
          </form-checkbox>

          <div v-if="editMode" class="di">
            <em class="fa fa-pencil-square-o pointer pr2 ml3 dark-blue" @click="toggleEditMode(task)"></em>
            <em v-cy-name="'task-delete-button-' + task.id" class="fa fa-trash-o pointer pr2 dark-blue" @click="trash(task)"></em>
          </div>

          <!-- EDIT BOX -->
          <form v-show="task.edit" class="bg-near-white pa2 br2 mt3 mb3">
            <div>
              <label :for="'edit-title' + i" class="db fw6 lh-copy f6">
                {{ t('people.tasks_form_title') }}
              </label>
              <input :id="'edit-title' + i" v-model="task.title" class="pa2 db w-100" type="text" @keyup.esc="editMode = false" />
            </div>
            <div class="mt3">
              <label :for="'edit-description' + i" class="db fw6 lh-copy f6">
                {{ t('people.tasks_form_description') }}
              </label>
              <textarea :id="'edit-description' + i"
                        v-model="task.description"
                        class="pa2 db w-100"
                        type="text"
                        @keyup.esc="editMode = false"
              >
              </textarea>
            </div>
            <div class="lh-copy mt3">
              <a class="btn btn-primary" href="" @click.prevent="update(task, true)">
                {{ t('app.update') }}
              </a>
              <a class="btn" href="" @click.prevent="toggleEditMode(task)">
                {{ t('app.cancel') }}
              </a>
            </div>
          </form>
        </li>
      </ul>

      <!-- ADD TASK TO ENTER ADD MODE -->
      <div v-if="!updateMode && !addMode && tasks.length !== 0" class="bg-near-white pa2 br2 mt3 mb3">
        <a class="pointer" href="" @click.prevent="toggleAddMode">
          {{ t('people.tasks_add_task') }}
        </a>
      </div>

      <!-- ADD A TASK VIEW -->
      <div v-if="addMode" v-cy-name="'task-add-view'">
        <form class="bg-near-white pa2 br2 mt3 mb3">
          <div>
            <label for="add-title" class="db fw6 lh-copy f6">
              {{ t('people.tasks_form_title') }}
            </label>
            <input id="add-title" v-model="newTask.title" v-cy-name="'task-add-title'" class="pa2 db w-100" type="text"
                   @keyup.esc="addMode = false"
            />
          </div>
          <div class="mt3">
            <label for="add-description" class="db fw6 lh-copy f6">
              {{ t('people.tasks_form_description') }}
            </label>
            <textarea id="add-description" v-model="newTask.description" class="pa2 db w-100" type="text" @keyup.esc="addMode = false"></textarea>
          </div>
          <div class="lh-copy mt3">
            <a v-cy-name="'save-task-button'" class="btn btn-primary" href="" @click.prevent="store">
              {{ t('app.add') }}
            </a>
            <a class="btn" href="" @click.prevent="addMode = false">
              {{ t('app.cancel') }}
            </a>
          </div>
        </form>
      </div>

      <!-- LIST OF COMPLETED TASKS -->
      <ul>
        <li v-for="task in completed(tasks)" :key="task.id" v-cy-name="'task-item-completed-' + task.id" class="f6">
          <form-checkbox
            v-model.lazy="task.completed"
            :disabled="task.disabled"
            :name="'checkbox'"
            :dclass="[ dirltr ? 'mr1' : 'ml1' ]"
            @change="toggleComplete(task)"
          >
            <span class="light-silver mr1">
              {{ task.completed_at }}
            </span>
            <span class="moon-gray" dir="auto">
              {{ task.title }}
            </span>
            <span v-if="task.description" class="silver ml3" dir="auto">
              {{ task.description }}
            </span>
          </form-checkbox>
          <div v-if="editMode" class="di">
            <em class="fa fa-trash-o pointer pr2 ml3 dark-blue" @click="trash(task)"></em>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import axios from 'axios';
import moment from 'moment-timezone';
import { useHtmlDir } from '../../composables/useHtmlDir';
import { useNotify } from '../../composables/useNotify';
import { timezone as bootTimezone } from '../../boot';

interface Task {
  id: number;
  contact_id: number;
  title: string;
  description?: string;
  completed: boolean;
  completed_at?: string | null;
  disabled?: boolean;
  edit?: boolean;
}

const props = withDefaults(
  defineProps<{
    hash?: string;
    contactId?: number;
  }>(),
  {
    hash: '',
    contactId: -1,
  },
);

const { t, locale } = useI18n();
const { dirltr } = useHtmlDir();
const { notify } = useNotify();

const tasks = ref<Task[]>([]);

const updateMode = ref(false);
const addMode = ref(false);
const editMode = ref(false);

const newTask = reactive<{
  contact_id: number;
  title: string;
  description: string;
  completed: number;
}>({
  contact_id: 0,
  title: '',
  description: '',
  completed: 0,
});

onMounted(() => {
  newTask.contact_id = props.contactId;
  index();
});

function reinitialize() {
  newTask.title = '';
  newTask.description = '';
}

function completed(list: Task[]) {
  return list.filter((task) => task.completed === true);
}

function inProgress(list: Task[]) {
  return list.filter((task) => task.completed === false);
}

function toggleAddMode() {
  addMode.value = true;
  reinitialize();
}

function toggleEditMode(task: Task) {
  task.edit = !task.edit;
}

async function index() {
  const response = await axios.get('people/' + props.hash + '/tasks');
  // Laravel may serialise the task collection as an object (key-by-id) or an
  // array; Object.values flattens both. Same trap as Participant.vue.
  const raw = Object.values(response.data ?? {}) as Task[];
  tasks.value = raw.map((task) => ({ ...task, disabled: false }));
}

async function store() {
  const response = await axios.post('tasks', newTask);
  addMode.value = false;
  reinitialize();
  tasks.value.push(response.data as Task);
  notify({
    group: 'main',
    title: t('app.default_save_success'),
    text: '',
    type: 'success',
  });
}

function toggleComplete(task: Task) {
  updateMode.value = true;
  task.disabled = true;
  update(task, false);
}

async function update(task: Task, toggleEdit: boolean) {
  const response = await axios.put('tasks/' + task.id, task);
  updateMode.value = false;
  task.disabled = false;
  task.completed_at = response.data.completed_at ? formatDate(response.data.completed_at) : null;
  if (toggleEdit) {
    toggleEditMode(task);
  }
  notify({
    group: 'main',
    title: t('app.default_save_success'),
    text: '',
    type: 'success',
  });
}

function formatDate(dateAsString: string): string {
  moment.locale(typeof locale.value === 'string' ? locale.value : 'en');
  moment.tz.setDefault('UTC');
  const date = moment.tz(moment(dateAsString), bootTimezone ?? 'UTC');
  return date.format('ll');
}

async function trash(task: Task) {
  await axios.delete('tasks/' + task.id);
  const idx = tasks.value.indexOf(task);
  if (idx >= 0) tasks.value.splice(idx, 1);
  if (tasks.value.length <= 1) {
    editMode.value = false;
  }
}
</script>
