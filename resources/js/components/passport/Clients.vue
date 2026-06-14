<style scoped>
    .access-key {
        border: 1px solid #cacaca;
        border-radius: 3px;
        padding: 10px 10px 0;
        background-color: #fafafa;
    }

    pre {
        font-size: 12px;
        word-wrap: break-word;
        white-space: pre-wrap;
    }
</style>

<template>
  <div>
    <notifications group="passport-clients" position="top middle" :duration="5000" width="400" />

    <h3 class="mb3">
      {{ t('settings.api_oauth_clients') }}
      <a class="btn nt2" :class="[ dirltr ? 'fr' : 'fl' ]" href="" @click.prevent="showCreateClientForm">
        {{ t('settings.api_oauth_create_new') }}
      </a>
    </h3>
    <p>{{ t('settings.api_oauth_clients_desc') }}</p>
    <p v-html="t('settings.api_oauth_clients_desc2', { url: 'https://laravel.com/docs/master/passport#requesting-tokens' })"></p>

    <!-- Current Clients -->
    <p v-if="clients.length === 0" class="mb0">
      {{ t('settings.api_oauth_not_created') }}
    </p>

    <div v-else class="dt w-100 collapse br--top br--bottom">
      <em>{{ t('settings.api_oauth_title') }}</em>
      <div class="dt-row">
        <div class="dtc w-20">
          <div class="pa2 b">
            {{ t('settings.api_oauth_clientid') }}
          </div>
        </div>
        <div class="dtc w-20">
          <div class="pa2 b">
            {{ t('settings.api_oauth_name') }}
          </div>
        </div>
        <div class="dtc">
          <div class="pa2 b">
            {{ t('settings.api_oauth_secret') }}
          </div>
        </div>
        <div class="dtc" :class="[ dirltr ? 'tr' : 'tl' ]">
          <div class="pa2 b">
            {{ t('settings.personalization_contact_field_type_table_actions') }}
          </div>
        </div>
      </div>

      <div v-for="client in clients" :key="client.id" class="dt-row bb b--light-gray">
        <!-- ID -->
        <div class="dtc">
          <div class="pa2">
            {{ client.id }}
          </div>
        </div>

        <!-- Name -->
        <div class="dtc">
          <div class="pa2">
            {{ client.name }}
          </div>
        </div>

        <!-- Secret -->
        <div class="dtc">
          <div class="pa2 flex flex-auto">
            <code dir="ltr">{{ client.secret }}</code>
            <em class="fa fa-clipboard pointer" :class="[ dirltr ? 'ml2' : 'mr2' ]"
                :title="t('settings.dav_copy_help')"
                @click="copyIntoClipboard(client.secret ?? '')"
            ></em>
          </div>
        </div>

        <div class="dtc" :class="[ dirltr ? 'tr' : 'tl' ]">
          <div class="pa2">
            <em class="fa fa-pencil-square-o pointer pr2" @click="edit(client)"></em>
            <em class="fa fa-trash-o pointer" @click="destroy(client)"></em>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Client Modal -->
    <monica-modal v-model="showModalClient"
                  :title="form.id ? t('settings.api_oauth_edit') : t('settings.api_oauth_create')"
                  @open="_focusInput"
    >
      <!-- Form Errors -->
      <form-errors :errors="form.errors" />

      <!-- Create Client Form -->
      <form ref="form" class="form-horizontal" role="form">
        <!-- Name -->
        <div class="form-group">
          <div class="col-md-auto">
            <form-input
              :id="'client-name'"
              ref="clientName"
              v-model="form.name"
              :iclass="'br2 f5 w-50 ba b--black-40 pa2 outline-0'"
              :required="true"
              :title="t('settings.api_oauth_name')"
              :validator="v$.form.name"
              @submit="store"
            />

            <span class="help-block">
              {{ t('settings.api_oauth_name_help') }}
            </span>
          </div>
        </div>

        <!-- Redirect URL -->
        <div class="form-group">
          <div class="col-md-auto">
            <form-input
              :id="'redirect-url'"
              v-model="form.redirect"
              :iclass="'br2 f5 w-50 ba b--black-40 pa2 outline-0'"
              :required="true"
              :title="t('settings.api_oauth_redirecturl')"
              :validator="v$.form.redirect"
              @submit="store"
            />

            <span class="help-block">
              {{ t('settings.api_oauth_redirecturl_help') }}
            </span>
          </div>
        </div>
      </form>

      <!-- Modal Actions -->
      <template #button>
        <a class="btn" href="" @click.prevent="closeModal">
          {{ t('app.close') }}
        </a>
        <a class="btn btn-primary" href="" @click.prevent="store">
          {{ form.id ? t('app.save') : t('app.create') }}
        </a>
      </template>
    </monica-modal>

    <!--
      Client Secret Modal — surfaces the plain secret once on creation.
      Passport v13 hashes oauth_clients.secret at insertion, so plain_secret
      only exists in the create response. Mirrors the PersonalAccessTokens
      access-token one-shot pattern.
    -->
    <monica-modal v-model="showModalClientSecret"
                  :title="t('settings.api_oauth_secret_title')"
    >
      <p>{{ t('settings.api_oauth_secret_help') }}</p>

      <div class="flex-auto access-key overflow-y-scroll" cy-name="client-secret-display"
           style="max-height: 400px;" @click.prevent="copyIntoClipboard(clientSecret ?? '')"
      >
        <pre><code>{{ clientSecret }}</code></pre>
      </div>

      <template #button>
        <a class="btn btn-primary" :title="t('settings.dav_copy_help')" href=""
           @click.prevent="copyIntoClipboard(clientSecret ?? '')"
        >
          {{ t('app.copy') }}
        </a>
        <a class="btn" href="" @click.prevent="closeSecretModal">
          {{ t('app.close') }}
        </a>
      </template>
    </monica-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, useTemplateRef } from 'vue';
import { useI18n } from 'vue-i18n';
import axios from 'axios';
import { useVuelidate } from '@vuelidate/core';
import { required, url } from '@vuelidate/validators';
import FormErrors from '../partials/FormErrors.vue';
import { useHtmlDir } from '../../composables/useHtmlDir';
import { useNotify } from '../../composables/useNotify';
import { validationErrorsFromAxios } from '../../api/errors';

interface Client {
  id: number | string;
  name: string;
  redirect: string;
  secret?: string;
}

interface ClientForm {
  id?: number | string;
  name: string;
  redirect: string;
  errors: string[];
}

interface InputComponent {
  focus: () => void;
}

const { t } = useI18n();
const { dirltr } = useHtmlDir();
const { notify } = useNotify();

const clients = ref<Client[]>([]);
const clientSecret = ref<string | null>(null);

const form = reactive<ClientForm>({ errors: [], name: '', redirect: '' });
const showModalClient = ref(false);
const showModalClientSecret = ref(false);

const formEl = useTemplateRef<HTMLFormElement>('form');
const clientName = useTemplateRef<InputComponent>('clientName');

const rules = {
  form: {
    name: { required },
    redirect: { required, url },
  },
};

const v$ = useVuelidate(rules, { form });

onMounted(getClients);

function _focusInput() {
  setTimeout(() => clientName.value?.focus(), 10);
}

async function getClients() {
  const response = await axios.get('oauth/clients');
  clients.value = response.data as Client[];
}

function resetField() {
  form.id = '';
  form.errors = [];
  form.name = '';
  form.redirect = '';
}

function closeModal() {
  resetField();
  v$.value.$reset();
  formEl.value?.reset();
  showModalClient.value = false;
}

function showCreateClientForm() {
  resetField();
  showModalClient.value = true;
}

function showClientSecret(secret: string) {
  showModalClient.value = false;
  clientSecret.value = secret;
  showModalClientSecret.value = true;
}

function closeSecretModal() {
  showModalClientSecret.value = false;
  clientSecret.value = null;
  resetField();
}

async function persistClient(method: 'post' | 'put', uri: string, f: ClientForm) {
  const isCreate = method === 'post';
  f.errors = [];
  try {
    const response = await axios[method](uri, f);
    if (isCreate) {
      clients.value.push(response.data);
      showClientSecret(response.data.secret);
    } else {
      await getClients();
      closeModal();
    }
  } catch (error: unknown) {
    f.errors = validationErrorsFromAxios(error, t('app.error_try_again'));
  }
}

function store() {
  v$.value.$touch();
  if (v$.value.$invalid) return;
  const method: 'post' | 'put' = form.id ? 'put' : 'post';
  const uri = form.id ? 'oauth/clients/' + form.id : 'oauth/clients';
  persistClient(method, uri, form);
}

function edit(client: Client) {
  Object.assign(form, { errors: [], ...client });
  showModalClient.value = true;
}

async function destroy(client: Client) {
  await axios.delete('oauth/clients/' + client.id);
  await getClients();
}

async function copyIntoClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    notify({
      group: 'passport-clients',
      title: t('settings.dav_clipboard_copied'),
      text: '',
      type: 'success',
    });
  } catch {
    // silent on permission denial / non-secure context
  }
}
</script>
