<template>
  <div class="sidebar-box" :class="[ editMode ? 'edit' : '' ]">
    <notifications group="main" position="bottom right" />

    <div class="w-100 dt">
      <div class="sidebar-box-title">
        <h3>{{ t('people.pets_title') }}</h3>
      </div>
      <div v-if="pets.length > 0" class="dtc" :class="[ dirltr ? 'tr' : 'tl' ]">
        <a v-if="!editMode" class="pointer" href="" @click.prevent="editMode = true">
          {{ t('app.edit') }}
        </a>
        <a v-else class="pointer" href="" @click.prevent="resetState">
          {{ t('app.done') }}
        </a>
      </div>
    </div>

    <!-- Add button when box is empty -->
    <p v-if="pets.length === 0 && !addMode" class="mb0">
      <a class="pointer" href="" @click.prevent="toggleAdd">
        {{ t('app.add') }}
      </a>
    </p>

    <!-- List of pets -->
    <ul v-if="pets.length > 0">
      <li v-for="(pet, i) in pets" :key="pet.id" class="mb2">
        <div v-show="!pet.edit" class="w-100 dt">
          <div class="dtc">
            {{ t('people.pets_' + pet.category_name) }}
            <span v-if="pet.name">
              - {{ pet.name }}
            </span>
          </div>
          <div v-if="editMode" class="dtc" :class="[ dirltr ? 'tr' : 'tl' ]">
            <em class="fa fa-pencil-square-o pointer pr2" @click="toggleEdit(pet)"></em>
            <em class="fa fa-trash-o pointer" @click="trash(pet)"></em>
          </div>
        </div>

        <!-- Pet edit form -->
        <div v-show="pet.edit" class="w-100">
          <form class="measure center">
            <div class="mt3">
              <label :for="'edit-category' + i" class="db fw6 lh-copy f6">
                {{ t('people.pets_kind') }}
              </label>
              <select :id="'edit-category' + i" v-model="updateForm.pet_category_id" class="db w-100 h2">
                <option v-for="petCategory in petCategories" :key="petCategory.id" :value="petCategory.id">
                  {{ t('people.pets_' + petCategory.name) }}
                </option>
              </select>
            </div>
            <div class="mt3">
              <label :for="'edit-name' + i" class="db fw6 lh-copy f6">
                {{ t('people.pets_name') }}
              </label>
              <input :id="'edit-name' + i" v-model="updateForm.name" class="pa2 db w-100" type="text" @keyup.enter="update(pet)" />
            </div>
            <div class="lh-copy mt3">
              <a class="btn btn-primary" href="" @click.prevent="update(pet)">
                {{ t('app.save') }}
              </a>
              <a class="btn" href="" @click.prevent="toggleEdit(pet)">
                {{ t('app.cancel') }}
              </a>
            </div>
          </form>
        </div>
      </li>
      <li v-if="editMode && !addMode">
        <a class="pointer" href="" @click.prevent="toggleAdd">
          {{ t('app.add') }}
        </a>
      </li>
    </ul>

    <!-- Pet Add form -->
    <div v-if="addMode">
      <form class="measure center">
        <div class="mt3">
          <label for="add-category" class="db fw6 lh-copy f6">
            {{ t('people.pets_kind') }}
          </label>
          <select id="add-category" v-model="createForm.pet_category_id" class="db w-100 h2">
            <option v-for="petCategory in petCategories" :key="petCategory.id" :value="petCategory.id">
              {{ t('people.pets_' + petCategory.name) }}
            </option>
          </select>
        </div>
        <div class="mt3">
          <label for="add-name" class="db fw6 lh-copy f6">
            {{ t('people.pets_name') }}
          </label>
          <input id="add-name" v-model="createForm.name" class="pa2 db w-100" type="text" @keyup.enter="store"
                 @keyup.esc="resetState"
          />
        </div>
        <div class="lh-copy mt3">
          <a class="btn btn-primary" href="" @click.prevent="store">
            {{ t('app.add') }}
          </a>
          <a class="btn" href="" @click.prevent="resetState">
            {{ t('app.cancel') }}
          </a>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import axios from 'axios';
import { useHtmlDir } from '../../composables/useHtmlDir';
import { useNotify } from '../../composables/useNotify';

interface PetCategory {
  id: number;
  name: string;
}

interface Pet {
  id: number;
  pet_category_id: number;
  category_name: string;
  name?: string;
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

const petCategories = ref<PetCategory[]>([]);
const pets = ref<Pet[]>([]);

const editMode = ref(false);
const addMode = ref(false);

const createForm = reactive<{
  pet_category_id: number | string;
  name: string;
  errors: string[];
}>({ pet_category_id: '', name: '', errors: [] });

const updateForm = reactive<{
  id: number | string;
  pet_category_id: number | string;
  name: string;
  errors: string[];
}>({ id: '', pet_category_id: '', name: '', errors: [] });

onMounted(async () => {
  await Promise.all([getPetCategories(), getPets()]);
});

async function getPetCategories() {
  const response = await axios.get('petcategories');
  petCategories.value = response.data as PetCategory[];
}

async function getPets() {
  const response = await axios.get('people/' + props.hash + '/pets');
  pets.value = response.data as Pet[];
}

async function store() {
  const response = await axios.post('people/' + props.hash + '/pets', createForm);
  addMode.value = false;
  pets.value.push(response.data as Pet);
  createForm.name = '';
  notify({
    group: 'main',
    title: t('people.pets_create_success'),
    text: '',
    type: 'success',
  });
}

function resetState() {
  editMode.value = false;
  addMode.value = false;
}

function toggleAdd() {
  addMode.value = true;
  editMode.value = true;
  createForm.name = '';
  createForm.pet_category_id = '';
}

function toggleEdit(pet: Pet) {
  pet.edit = !pet.edit;
  updateForm.id = pet.id;
  updateForm.name = pet.name ?? '';
  updateForm.pet_category_id = pet.pet_category_id;
}

async function update(pet: Pet) {
  const response = await axios.put('people/' + props.hash + '/pets/' + pet.id, updateForm);
  pet.edit = !pet.edit;
  pet.name = response.data.name;
  pet.pet_category_id = response.data.pet_category_id;
  pet.category_name = response.data.category_name;
  notify({
    group: 'main',
    title: t('people.pets_update_success'),
    text: '',
    type: 'success',
  });
}

async function trash(pet: Pet) {
  await axios.delete('people/' + props.hash + '/pets/' + pet.id);
  await getPets();
  notify({
    group: 'main',
    title: t('people.pets_delete_success'),
    text: '',
    type: 'success',
  });
  if (pets.value.length <= 1) {
    resetState();
  }
}
</script>
