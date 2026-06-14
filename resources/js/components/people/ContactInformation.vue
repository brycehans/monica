<template>
  <div class="sidebar-box" :class="[ editMode ? 'edit' : '' ]">
    <div class="w-100 dt">
      <div class="sidebar-box-title">
        <h3>
          {{ t('people.contact_info_title') }}
        </h3>
      </div>
      <div v-if="contactInformationData.length > 0" class="dtc" :class="[ dirltr ? 'tr' : 'tl' ]">
        <a v-if="!editMode" class="pointer" href="" @click.prevent="editMode = true">
          {{ t('app.edit') }}
        </a>
        <a v-else class="pointer" href="" @click.prevent="resetState">
          {{ t('app.done') }}
        </a>
      </div>
    </div>

    <p v-if="contactInformationData.length === 0 && !addMode" class="mb0">
      <a class="pointer" href="" @click.prevent="toggleAdd">
        {{ t('app.add') }}
      </a>
    </p>

    <ul v-if="contactInformationData.length > 0">
      <li v-for="contactInformation in contactInformationData" :key="contactInformation.id" class="mb2">
        <div v-show="!contactInformation.edit" class="w-100 dt">
          <div class="dtc">
            <em v-if="contactInformation.fontawesome_icon" :class="contactInformation.fontawesome_icon" class="pr2 f6 light-silver"></em>
            <em v-else class="pr2 fa fa-address-card-o f6 gray"></em>

            <a v-if="contactInformation.protocol" :href="contactInformation.protocol + contactInformation.data">
              {{ contactInformation.shortenName }}
            </a>
            <a v-else-if="contactInformation.data.indexOf('://') !== -1" :href="contactInformation.data">
              {{ contactInformation.shortenName }}
            </a>
            <span v-else>
              {{ contactInformation.shortenName }}
            </span>
          </div>
          <div v-if="editMode" class="dtc" :class="[ dirltr ? 'tr' : 'tl' ]">
            <em class="fa fa-pencil-square-o pointer pr2" @click="toggleEdit(contactInformation)"></em>
            <em class="fa fa-trash-o pointer" @click="trash(contactInformation)"></em>
          </div>
        </div>

        <div v-show="contactInformation.edit" class="w-100">
          <form class="measure center" @submit.prevent="update(contactInformation)">
            <div class="mt3">
              <form-input
                id="contact-content"
                v-model="updateForm.data"
                :title="t('people.contact_info_form_content')"
                iclass="pa2 db w-100"
                :input-type="'text'"
              />
            </div>
            <div class="lh-copy mt3">
              <a class="btn btn-primary" href="" @click.prevent="update(contactInformation)">
                {{ t('app.save') }}
              </a>
              <a class="btn" href="" @click.prevent="toggleEdit(contactInformation)">
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

    <div v-if="addMode">
      <form class="measure center" @submit.prevent="store">
        <div class="mt3">
          <label for="add-contact-type" class="db fw6 lh-copy f6">
            {{ t('people.contact_info_form_contact_type') }} <a class="fr normal" href="settings/personalization" target="_blank">
              {{ t('people.contact_info_form_personalize') }}
            </a>
          </label>
          <select id="add-contact-type" v-model="createForm.contact_field_type_id" class="db w-100 h2">
            <option v-for="contactFieldType in contactFieldTypes" :key="contactFieldType.id" :value="contactFieldType.id">
              {{ contactFieldType.name }}
            </option>
          </select>
        </div>
        <div class="mt3">
          <label class="db fw6 lh-copy f6">
            {{ t('people.contact_info_form_content') }}
          </label>
          <input v-model="createForm.data" class="pa2 db w-100" type="text" />
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
import { validationErrorsFromAxios } from '../../api/errors';

interface ContactFieldType {
  id: number | string;
  name: string;
}

interface ContactField {
  id: number;
  contact_field_type_id: number | string;
  data: string;
  shortenName?: string;
  protocol?: string;
  fontawesome_icon?: string;
  edit?: boolean;
}

interface FormBag {
  id?: number | string;
  contact_field_type_id: number | string;
  data: string;
  errors: string[];
}

const props = withDefaults(
  defineProps<{
    hash?: string;
    contactId?: number;
    sizeLimit?: number;
  }>(),
  {
    hash: '',
    contactId: -1,
    sizeLimit: 26,
  },
);

const { t } = useI18n();
const { dirltr } = useHtmlDir();

const contactInformationData = ref<ContactField[]>([]);
const contactFieldTypes = ref<ContactFieldType[]>([]);
const editMode = ref(false);
const addMode = ref(false);

const createForm = reactive<FormBag>({ contact_field_type_id: '', data: '', errors: [] });
const updateForm = reactive<FormBag>({ id: '', contact_field_type_id: '', data: '', errors: [] });

onMounted(async () => {
  await Promise.all([getContactInformationData(), getContactFieldTypes()]);
});

function formatResponse(data: ContactField[]): ContactField[] {
  data.forEach((value) => {
    let shortenName = value.data;
    if (shortenName.length > props.sizeLimit + 1) {
      shortenName = t('format.short_text', { text: shortenName.substr(0, props.sizeLimit) });
    }
    value.shortenName = shortenName;
  });
  return data;
}

async function getContactInformationData() {
  const response = await axios.get('people/' + props.hash + '/contactfield');
  contactInformationData.value = formatResponse(response.data as ContactField[]);
}

async function getContactFieldTypes() {
  const response = await axios.get('people/' + props.hash + '/contactfieldtypes');
  contactFieldTypes.value = response.data as ContactFieldType[];
}

async function persistClient(method: 'post' | 'put' | 'delete', uri: string, form: FormBag) {
  form.errors = [];
  try {
    if (method === 'delete') {
      await axios.delete(uri);
    } else {
      await axios[method](uri, form);
    }
    await getContactInformationData();
  } catch (error: unknown) {
    form.errors = validationErrorsFromAxios(error, t('app.error_try_again'));
  }
}

function store() {
  persistClient('post', 'people/' + props.hash + '/contactfield', createForm);
  addMode.value = false;
}

function resetState() {
  editMode.value = false;
  addMode.value = false;
}

function toggleAdd() {
  addMode.value = true;
  editMode.value = true;
  createForm.data = '';
  createForm.contact_field_type_id = '';
}

function toggleEdit(contactField: ContactField) {
  contactField.edit = !contactField.edit;
  updateForm.id = contactField.id;
  updateForm.data = contactField.data;
  updateForm.contact_field_type_id = contactField.contact_field_type_id;
}

function update(contactField: ContactField) {
  persistClient('put', 'people/' + props.hash + '/contactfield/' + contactField.id, updateForm);
}

function trash(contactField: ContactField) {
  updateForm.id = contactField.id;
  persistClient('delete', 'people/' + props.hash + '/contactfield/' + contactField.id, updateForm);
  if (contactInformationData.value.length <= 1) {
    editMode.value = false;
  }
}
</script>
