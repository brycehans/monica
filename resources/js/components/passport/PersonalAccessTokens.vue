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
    <h3 class="mb3">
      {{ t('settings.api_personal_access_tokens') }}
      <a class="btn nt2" :class="[ dirltr ? 'fr' : 'fl' ]" href="" @click.prevent="showCreateTokenForm">
        {{ t('settings.api_token_create_new') }}
      </a>
    </h3>

    <p>{{ t('settings.api_pao_description') }}</p>

    <!-- No Tokens Notice -->
    <p v-if="tokens.length === 0" class="mb0">
      {{ t('settings.api_token_not_created') }}
    </p>

    <div v-else class="dt w-75 collapse br--top br--bottom">
      <em>{{ t('settings.api_token_title') }}</em>
      <div class="dt-row">
        <div class="dtc">
          <div class="pa2 b">
            {{ t('settings.api_token_name') }}
          </div>
        </div>
        <div class="dtc" :class="[ dirltr ? 'tr' : 'tl' ]">
          <div class="pa2 b">
            {{ t('settings.personalization_contact_field_type_table_actions') }}
          </div>
        </div>
      </div>

      <div v-for="token in tokens" :key="token.id" class="dt-row bb b--light-gray">
        <!-- Client Name -->
        <div class="dtc">
          <div v-tooltip="t('settings.api_token_expire', { date: token.expires_at })" class="pa2">
            {{ token.name }}
          </div>
        </div>

        <div class="dtc" :class="[ dirltr ? 'tr' : 'tl' ]">
          <div class="pa2">
            <span class="pointer" @click="revoke(token)">{{ t('app.delete') }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Token Modal -->
    <monica-modal v-model="showModalCreateToken"
                  :title="t('settings.api_token_create')" @open="_focusInput"
    >
      <!-- Form Errors -->
      <form-errors :errors="form.errors" />

      <!-- Create Token Form -->
      <form ref="form" class="form-horizontal" role="form" @submit.prevent="store">
        <!-- Name -->
        <div class="col-md-auto">
          <form-input
            :id="'create-token-name'"
            ref="createTokenName"
            v-model="form.name"
            :name="'name'"
            :iclass="'br2 f5 w-50 ba b--black-40 pa2 outline-0'"
            :required="true"
            :title="t('settings.api_token_name')"
            :validator="v$.form.name"
          />
        </div>

        <!-- Scopes -->
        <div v-if="scopes.length > 0" class="form-group">
          <label class="col-md-4 col-form-label">
            {{ t('settings.api_token_scopes') }}
          </label>

          <div class="col-md-auto">
            <div v-for="scope in scopes" :key="scope.id">
              <div class="checkbox">
                <label>
                  <input type="checkbox"
                         :checked="scopeIsAssigned(scope.id)"
                         @click="toggleScope(scope.id)"
                  />

                  {{ scope.id }}
                </label>
              </div>
            </div>
          </div>
        </div>
      </form>
      <!-- Modal Actions -->
      <template #button>
        <a class="btn" href="" @click.prevent="closeModal">
          {{ t('app.close') }}
        </a>
        <a class="btn btn-primary" href="" @click.prevent="store">
          {{ t('app.create') }}
        </a>
      </template>
    </monica-modal>

    <!-- Access Token Modal -->
    <monica-modal v-model="showModalAccessToken" :title="t('settings.api_token_title')">
      <notifications group="passport-personal-access-token" position="middle" :duration="5000" width="400" />
      <p>{{ t('settings.api_token_help') }}</p>

      <div class="flex-auto access-key overflow-y-scroll" style="max-height: 400px;" @click.prevent="copyIntoClipboard(accessToken ?? '')">
        <pre><code>{{ accessToken }}</code></pre>
      </div>

      <!-- Modal Actions -->
      <template #button>
        <a class="btn btn-primary" :title="t('settings.dav_copy_help')" href="" @click.prevent="copyIntoClipboard(accessToken ?? '')">
          {{ t('app.copy') }}
        </a>
        <a class="btn" href="" @click.prevent="closeModal">
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
import { required } from '@vuelidate/validators';
import FormErrors from '../partials/FormErrors.vue';
import { useHtmlDir } from '../../composables/useHtmlDir';
import { useNotify } from '../../composables/useNotify';

interface PersonalAccessToken {
  id: number | string;
  name: string;
  scopes?: string[];
  expires_at?: string | null;
}

interface TokenForm {
  name: string;
  scopes: string[];
  errors: string[];
}

interface InputComponent {
  focus: () => void;
}

const { t } = useI18n();
const { dirltr } = useHtmlDir();
const { notify } = useNotify();

const accessToken = ref<string | null>(null);
const tokens = ref<PersonalAccessToken[]>([]);
interface Scope {
  id: string;
  description?: string;
}

const scopes = ref<Scope[]>([]);

const form = reactive<TokenForm>({ name: '', scopes: [], errors: [] });

const showModalCreateToken = ref(false);
const showModalAccessToken = ref(false);

const formEl = useTemplateRef<HTMLFormElement>('form');
const createTokenName = useTemplateRef<InputComponent>('createTokenName');

const rules = {
  form: { name: { required } },
};
const v$ = useVuelidate(rules, { form });

onMounted(async () => {
  await Promise.all([getTokens(), getScopes()]);
});

async function getTokens() {
  const response = await axios.get('oauth/personal-access-tokens');
  tokens.value = response.data as PersonalAccessToken[];
}

async function getScopes() {
  const response = await axios.get('oauth/scopes');
  scopes.value = response.data as Scope[];
}

function closeModal() {
  // formEl is the <form ref="form"> inside the create-modal slot.
  // After a successful create, showAccessToken() flips
  // showModalCreateToken = false, which unmounts that slot under
  // vue-final-modal — so when the access-token modal's footer Close
  // calls closeModal(), formEl is null. Without the optional
  // chain, .reset() throws and the booleans below never run, leaving
  // the modal visible. See #771 for the trace.
  formEl.value?.reset();
  v$.value.$reset();
  showModalCreateToken.value = false;
  showModalAccessToken.value = false;
}

function _focusInput() {
  setTimeout(() => createTokenName.value?.focus(), 10);
}

function showCreateTokenForm() {
  showModalCreateToken.value = true;
}

function showAccessToken(token: string) {
  showModalCreateToken.value = false;
  accessToken.value = token;
  showModalAccessToken.value = true;
}

async function store() {
  v$.value.$touch();
  if (v$.value.$invalid) return;

  accessToken.value = null;
  form.errors = [];

  try {
    const response = await axios.post('oauth/personal-access-tokens', form);
    form.name = '';
    form.scopes = [];
    form.errors = [];
    tokens.value.push(response.data.token);
    showAccessToken(response.data.accessToken);
  } catch (error: unknown) {
    const data = (error as { response?: { data?: unknown } })?.response?.data;
    if (data && typeof data === 'object') {
      form.errors = Object.values(data ?? {}).flat() as string[];
    } else {
      form.errors = [t('app.error_try_again')];
    }
  }
}

function scopeIsAssigned(scope: string) {
  return form.scopes.indexOf(scope) >= 0;
}

function toggleScope(scope: string) {
  if (scopeIsAssigned(scope)) {
    form.scopes = form.scopes.filter((s) => s !== scope);
  } else {
    form.scopes.push(scope);
  }
}

async function revoke(token: PersonalAccessToken) {
  await axios.delete('oauth/personal-access-tokens/' + token.id);
  await getTokens();
}

async function copyIntoClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    notify({
      group: 'passport-personal-access-token',
      title: t('settings.dav_clipboard_copied'),
      text: '',
      type: 'success',
    });
  } catch {
    // silent on permission denial / non-secure context
  }
}
</script>
