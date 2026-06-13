<template>
  <div>
    <notifications group="main" position="bottom right" />

    <h3 class="mb3">
      {{ t('settings.personalization_genders_title') }}
      <a class="btn nt2" :class="[ dirltr ? 'fr' : 'fl' ]" href="" @click.prevent="openCreate">
        {{ t('settings.personalization_genders_add') }}
      </a>
    </h3>
    <p>{{ t('settings.personalization_genders_desc') }}</p>

    <div class="dt dt--fixed w-100 collapse br--top br--bottom">
      <div class="dt-row">
        <div class="dtc">
          <div class="pa2 b">
            {{ t('settings.personalization_genders_table_name') }}
          </div>
        </div>
        <div class="dtc">
          <div class="pa2 b">
            {{ t('settings.personalization_genders_table_sex') }}
          </div>
        </div>
        <div class="dtc">
          <div class="pa2 b">
            {{ t('settings.personalization_genders_table_default') }}
          </div>
        </div>
        <div class="dtc" :class="[ dirltr ? 'tr' : 'tl' ]">
          <div class="pa2 b">
            {{ t('settings.personalization_contact_field_type_table_actions') }}
          </div>
        </div>
      </div>

      <div v-for="gender in genders" :key="gender.id"
           class="dt-row bb b--light-gray"
      >
        <div class="dtc">
          <div class="pa2">
            {{ gender.name }}
            <span class="i">
              {{ t('settings.personalization_genders_list_contact_number', { count: gender.numberOfContacts }, gender.numberOfContacts) }}
            </span>
          </div>
        </div>
        <div class="dtc">
          <div class="pa2">
            {{ t('settings.personalization_genders_' + gender.type.toLowerCase()) }}
          </div>
        </div>
        <div class="dtc">
          <div class="pa2">
            <template v-if="gender.isDefault">
              {{ t('settings.personalization_genders_default') }}
            </template>
          </div>
        </div>
        <div class="dtc" :class="[ dirltr ? 'tr' : 'tl' ]">
          <div class="pa2">
            <em class="fa fa-pencil-square-o pointer pr2" @click="openEdit(gender)"></em>
            <em v-if="genders.length > 1" class="fa fa-trash-o pointer" @click="openDelete(gender)"></em>
          </div>
        </div>
      </div>
    </div>
    <div class="mt2" :class="[ dirltr ? 'tr' : 'tl' ]">
      <a class="pointer" href="" @click.prevent="openSetDefault">{{ t('settings.personalization_genders_make_default') }}</a>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import axios from 'axios';
import { useRowModal } from '../../composables/useRowModal';
import { useHtmlDir } from '../../composables/useHtmlDir';
import CreateModal from './genders/CreateModal.vue';
import EditModal from './genders/EditModal.vue';
import DeleteModal from './genders/DeleteModal.vue';
import SetDefaultModal from './genders/SetDefaultModal.vue';

interface Gender {
  id: number;
  name: string;
  type: string;
  isDefault: boolean;
  numberOfContacts: number;
}

interface GenderType {
  id: string;
  name: string;
}

const { t } = useI18n();
const { dirltr } = useHtmlDir();

const createModal = useRowModal(CreateModal);
const editModal = useRowModal(EditModal);
const deleteModal = useRowModal(DeleteModal);
const setDefaultModal = useRowModal(SetDefaultModal);

const genders = ref<Gender[]>([]);
const genderTypes = ref<GenderType[]>([]);

const defaultGenderType = computed<Gender | undefined>(() => {
  const idx = genders.value.findIndex(g => g.isDefault === true);
  return genders.value[idx >= 0 ? idx : 0];
});

onMounted(() => {
  Promise.all([getGenders(), getGenderTypes()]);
});

async function getGenders() {
  const response = await axios.get<Gender[]>('settings/personalization/genders');
  genders.value = response.data;
}

async function getGenderTypes() {
  const response = await axios.get<GenderType[]>('settings/personalization/genderTypes');
  genderTypes.value = response.data;
}

function openCreate() {
  createModal.open({
    genderTypes: genderTypes.value,
    defaultGenderType: defaultGenderType.value,
    onSaved: () => getGenders(),
  });
}

function openSetDefault() {
  setDefaultModal.open({
    genders: genders.value,
    defaultId: defaultGenderType.value?.id ?? null,
    onSaved: () => getGenders(),
  });
}

function openEdit(gender: Gender) {
  editModal.open({
    gender,
    genderTypes: genderTypes.value,
    onSaved: () => getGenders(),
  });
}

function openDelete(gender: Gender) {
  deleteModal.open({
    gender,
    genders: genders.value,
    onSaved: () => getGenders(),
  });
}
</script>
