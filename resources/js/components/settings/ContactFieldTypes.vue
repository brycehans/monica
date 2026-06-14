<template>
  <div>
    <notifications group="main" position="bottom right" />

    <h3 class="with-actions">
      {{ t('settings.personalization_contact_field_type_title') }}
      <a class="btn nt2" :class="[ dirltr ? 'fr' : 'fl' ]" href="" @click.prevent="add">
        {{ t('settings.personalization_contact_field_type_add') }}
      </a>
    </h3>
    <p>{{ t('settings.personalization_contact_field_type_description') }}</p>

    <div v-if="submitted" class="pa2 ba b--yellow mb3 mt3 br2 bg-washed-yellow">
      {{ t('settings.personalization_contact_field_type_add_success') }}
    </div>

    <div v-if="edited" class="pa2 ba b--yellow mb3 mt3 br2 bg-washed-yellow">
      {{ t('settings.personalization_contact_field_type_edit_success') }}
    </div>

    <div v-if="deleted" class="pa2 ba b--yellow mb3 mt3 br2 bg-washed-yellow">
      {{ t('settings.personalization_contact_field_type_delete_success') }}
    </div>

    <div class="dt dt--fixed w-100 collapse br--top br--bottom">
      <div class="dt-row">
        <div class="dtc">
          <div class="pa2 b">
            {{ t('settings.personalization_contact_field_type_table_name') }}
          </div>
        </div>
        <div class="dtc">
          <div class="pa2 b">
            {{ t('settings.personalization_contact_field_type_table_protocol') }}
          </div>
        </div>
        <div class="dtc" :class="[ dirltr ? 'tr' : 'tl' ]">
          <div class="pa2 b">
            {{ t('settings.personalization_contact_field_type_table_actions') }}
          </div>
        </div>
      </div>

      <div v-for="contactFieldType in contactFieldTypes" :key="contactFieldType.id" class="dt-row hover bb b--light-gray">
        <div class="dtc">
          <div class="pa2">
            <em v-if="contactFieldType.fontawesome_icon" :class="contactFieldType.fontawesome_icon" class="pr2"></em>
            <em v-else class="pr2 fa fa-address-card-o"></em>
            {{ contactFieldType.name }}
          </div>
        </div>
        <div class="dtc">
          <code class="f7">
            {{ contactFieldType.protocol }}
          </code>
        </div>
        <div class="dtc" :class="[ dirltr ? 'tr' : 'tl' ]">
          <div class="pa2">
            <em class="fa fa-pencil-square-o pointer pr2" @click="edit(contactFieldType)"></em>
            <em v-if="contactFieldType.delible" class="fa fa-trash-o pointer" @click="showDelete(contactFieldType)"></em>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Contact field type -->
    <monica-modal v-model="showModalCreateContactFieldType"
                  :title="t('settings.personalization_contact_field_type_modal_title')"
                  @open="_focusCreateInput"
    >
      <!-- Form Errors -->
      <form-errors :errors="createForm.errors" />

      <form class="form-horizontal" role="form" @submit.prevent="store">
        <div class="form-group">
          <div class="col-md-auto">
            <form-input
              :id="'name'"
              ref="createName"
              v-model="createForm.name"
              :required="true"
              :title="t('settings.personalization_contact_field_type_modal_name')"
              @submit="store"
            />
          </div>
        </div>

        <div class="form-group">
          <div class="col-md-auto">
            <form-input
              :id="'protocol'"
              v-model="createForm.protocol"
              :placeholder="'mailto:'"
              :required="true"
              :title="t('settings.personalization_contact_field_type_modal_protocol')"
              @submit="store"
            />

            <small class="form-text text-muted">
              {{ t('settings.personalization_contact_field_type_modal_protocol_help') }}
            </small>
          </div>
        </div>

        <div class="form-group">
          <div class="col-md-auto">
            <form-input
              :id="'icon'"
              v-model="createForm.icon"
              :placeholder="'fa fa-address-book-o'"
              :required="true"
              :title="t('settings.personalization_contact_field_type_modal_icon')"
              @submit="store"
            />

            <small class="form-text text-muted">
              {{ t('settings.personalization_contact_field_type_modal_icon_help') }}
            </small>
          </div>
        </div>
      </form>
      <template #button>
        <a class="btn" href="" @click.prevent="closeModal">
          {{ t('app.cancel') }}
        </a>
        <a class="btn btn-primary" href="" @click.prevent="store">
          {{ t('app.save') }}
        </a>
      </template>
    </monica-modal>

    <!-- Edit Contact field type -->
    <monica-modal v-model="showModalEditContactFieldType"
                  :title="t('settings.personalization_contact_field_type_modal_edit_title')"
                  @open="_focusEditInput"
    >
      <!-- Form Errors -->
      <form-errors :errors="editForm.errors" />

      <form class="form-horizontal" role="form" @submit.prevent="update">
        <div class="form-group">
          <div class="col-md-auto">
            <form-input
              :id="'name'"
              ref="editName"
              v-model="editForm.name"
              :required="true"
              :title="t('settings.personalization_contact_field_type_modal_name')"
              @submit="update"
            />
          </div>
        </div>

        <div class="form-group">
          <div class="col-md-auto">
            <form-input
              :id="'protocol'"
              v-model="editForm.protocol"
              :placeholder="'mailto:'"
              :required="true"
              :title="t('settings.personalization_contact_field_type_modal_protocol')"
              @submit="update"
            />

            <small class="form-text text-muted">
              {{ t('settings.personalization_contact_field_type_modal_protocol_help') }}
            </small>
          </div>
        </div>

        <div class="form-group">
          <div class="col-md-auto">
            <form-input
              :id="'icon'"
              v-model="editForm.icon"
              :placeholder="'fa fa-address-book-o'"
              :required="true"
              :title="t('settings.personalization_contact_field_type_modal_icon')"
              @submit="update"
            />

            <small class="form-text text-muted">
              {{ t('settings.personalization_contact_field_type_modal_icon_help') }}
            </small>
          </div>
        </div>
      </form>
      <template #button>
        <a class="btn" href="" @click.prevent="closeModal">
          {{ t('app.cancel') }}
        </a>
        <a class="btn btn-primary" href="" @click.prevent="update">
          {{ t('app.edit') }}
        </a>
      </template>
    </monica-modal>

    <!-- Delete Contact field type -->
    <monica-modal v-model="showModalDeleteContactFieldType"
                  :title="t('settings.personalization_contact_field_type_modal_delete_title')"
    >
      <p>
        {{ t('settings.personalization_contact_field_type_modal_delete_description') }}
      </p>
      <template #button>
        <a class="btn" href="" @click.prevent="closeModal">
          {{ t('app.cancel') }}
        </a>
        <a class="btn btn-primary" href="" @click.prevent="trash">
          {{ t('app.delete') }}
        </a>
      </template>
    </monica-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, useTemplateRef } from 'vue';
import { useI18n } from 'vue-i18n';
import axios from 'axios';
import FormErrors from '../partials/FormErrors.vue';
import { useHtmlDir } from '../../composables/useHtmlDir';
import { useNotify } from '../../composables/useNotify';

interface ContactFieldType {
  id: number | string;
  name: string;
  protocol: string;
  fontawesome_icon?: string;
  delible?: boolean;
}

interface InputComponent {
  focus: () => void;
}

const { t } = useI18n();
const { dirltr } = useHtmlDir();
const { notify } = useNotify();

const contactFieldTypes = ref<ContactFieldType[]>([]);

const submitted = ref(false);
const edited = ref(false);
const deleted = ref(false);

const createForm = reactive<{
  name: string;
  protocol: string;
  icon: string;
  errors: string[] | Record<string, string[]>;
}>({ name: '', protocol: '', icon: '', errors: [] });

const editForm = reactive<{
  id: number | string;
  name: string;
  protocol: string;
  icon: string;
  errors: string[] | Record<string, string[]>;
}>({ id: '', name: '', protocol: '', icon: '', errors: [] });

const showModalCreateContactFieldType = ref(false);
const showModalEditContactFieldType = ref(false);
const showModalDeleteContactFieldType = ref(false);

const createName = useTemplateRef<InputComponent>('createName');
const editName = useTemplateRef<InputComponent>('editName');

onMounted(getContactFieldTypes);

async function getContactFieldTypes() {
  const response = await axios.get('settings/personalization/contactfieldtypes');
  contactFieldTypes.value = response.data as ContactFieldType[];
}

function add() {
  showModalCreateContactFieldType.value = true;
}

function closeModal() {
  showModalCreateContactFieldType.value = false;
  showModalEditContactFieldType.value = false;
  showModalDeleteContactFieldType.value = false;
}

type FormBag = typeof createForm | typeof editForm;

async function persistClient(method: 'post' | 'put' | 'delete', uri: string, form: FormBag, flag: 'submitted' | 'edited' | 'deleted') {
  form.errors = [];

  try {
    await axios[method](uri, form);
    await getContactFieldTypes();

    if ('id' in form) (form as typeof editForm).id = '';
    form.name = '';
    form.protocol = '';
    form.icon = '';
    form.errors = [];

    closeModal();

    if (flag === 'submitted') submitted.value = true;
    else if (flag === 'edited') edited.value = true;
    else deleted.value = true;
  } catch (error: unknown) {
    const data = (error as { response?: { data?: unknown } })?.response?.data;
    if (data && typeof data === 'object') {
      form.errors = Object.values(data ?? {}).flat() as string[];
    } else {
      form.errors = [t('app.error_try_again')];
    }
  }
}

function store() {
  persistClient('post', 'settings/personalization/contactfieldtypes', createForm, 'submitted');
  notify({
    group: 'main',
    title: t('settings.personalization_contact_field_type_add_success'),
    text: '',
    type: 'success',
  });
}

function edit(contactFieldType: ContactFieldType) {
  editForm.id = contactFieldType.id;
  editForm.name = contactFieldType.name;
  editForm.protocol = contactFieldType.protocol;
  editForm.icon = contactFieldType.fontawesome_icon ?? '';
  showModalEditContactFieldType.value = true;
}

function update() {
  persistClient(
    'put',
    'settings/personalization/contactfieldtypes/' + editForm.id,
    editForm,
    'edited',
  );
  notify({
    group: 'main',
    title: t('settings.personalization_contact_field_type_edit_success'),
    text: '',
    type: 'success',
  });
}

function showDelete(contactFieldType: ContactFieldType) {
  editForm.id = contactFieldType.id;
  showModalDeleteContactFieldType.value = true;
}

function trash() {
  persistClient(
    'delete',
    'settings/personalization/contactfieldtypes/' + editForm.id,
    editForm,
    'deleted',
  );
  notify({
    group: 'main',
    title: t('settings.personalization_contact_field_type_delete_success'),
    text: '',
    type: 'success',
  });
}

function _focusCreateInput() {
  setTimeout(() => {
    createName.value?.focus();
  }, 10);
}

function _focusEditInput() {
  setTimeout(() => {
    editName.value?.focus();
  }, 10);
}
</script>
