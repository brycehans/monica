<style scoped>
.time {
    color: gray;
}
</style>

<template>
  <div class="form-group">
    <notifications group="webauthn" position="top middle" :duration="5000" width="400" />

    <div v-if="method === 'register-modal'">
      <h3>{{ t('settings.webauthn_title') }}</h3>

      <div v-if="currentkeys !== null">
        <ul class="table">
          <li v-for="key in currentkeys"
              :key="key.id"
              class="table-row"
          >
            <div class="table-cell w-30">
              <strong>{{ key.name }}</strong>
            </div>
            <div class="table-cell time w-50">
              <template v-if="(key.counter ?? 0) > 0 && key.updated_at">
                {{ t('settings.webauthn_last_use', {timestamp: formatTime(key.updated_at)}) }}
              </template>
            </div>
            <div class="table-cell actions">
              <a class="pointer" href="" @click.prevent="showDeleteModal(key.id)">
                {{ t('app.delete') }}
              </a>
            </div>
          </li>
        </ul>
      </div>

      <slot></slot>

      <a v-if="isSupported" class="btn btn-primary" href="" @click.prevent="showRegisterModal">
        {{ t('settings.webauthn_enable_description') }}
      </a>
      <small v-else>
        {{ notSupportedMessage() }}
      </small>


      <monica-modal v-model="registerModalOpen"
                    :title="t('settings.webauthn_title')"
      >
        <div v-if="registerTab === '1'">
          <p>
            {{ t('settings.webauthn_key_name_help') }}
          </p>
          <form-input
            :id="'keyName'"
            v-model="keyName"
            :title="t('settings.webauthn_key_name')"
            :value="keyName"
            :input-type="'text'"
            :width="150"
            :required="true"
            @keyup.enter="showRegisterModalTab('2');startRegister();"
          />
        </div>
        <div v-if="registerTab === '2'">
          <div v-if="errorMessage !== ''" class="form-error-message mb3">
            <div class="pa2">
              <p class="mb0">
                {{ errorMessage }}
              </p>
              <p>
                <a href="" @click.prevent="startRegister()">
                  {{ t('app.retry') }}
                </a>
              </p>
            </div>
          </div>
          <div v-if="infoMessage !== ''" class="form-information-message mb3">
            <div class="pa2">
              <p class="mb0">
                {{ infoMessage }}
              </p>
            </div>
          </div>

          <div v-if="errorMessage === ''" class="tc">
            <img src="https://ssl.gstatic.com/accounts/strongauth/Challenge_2SV-Gnubby_graphic.png"
                 :alt="t('settings.webauthn_insertKey')"
            />
          </div>

          <div v-if="errorMessage === ''" class="pa2">
            <p>
              {{ t('settings.webauthn_insertKey') }}
            </p>
            <p>
              {{ t('settings.webauthn_buttonAdvise') }}
              <br />
              {{ t('settings.webauthn_noButtonAdvise') }}
            </p>
          </div>
        </div>
        <template #button>
          <a v-if="registerTab === '1'" class="btn" href="" @click.prevent="showRegisterModalTab('2');startRegister();">
            {{ t('pagination.next') }}
          </a>
          <a v-else class="btn" href="" @click.prevent="showRegisterModalTab('1')">
            {{ t('pagination.previous') }}
          </a>
          <a class="btn" href="" @click.prevent="closeRegisterModal()">
            {{ t('app.cancel') }}
          </a>
        </template>
      </monica-modal>
    </div>
    <div v-else>
      <div v-if="errorMessage !== ''" class="form-error-message mb3">
        <div class="pa2">
          <p class="mb0">
            {{ errorMessage }}
          </p>
          <p>
            <a href="" @click.prevent="start()">
              {{ t('app.retry') }}
            </a>
          </p>
        </div>
      </div>
      <div v-if="infoMessage !== ''" class="form-information-message mb3">
        <div class="pa2">
          <p class="mb0">
            {{ infoMessage }}
          </p>
        </div>
      </div>

      <div class="tc">
        <img src="https://ssl.gstatic.com/accounts/strongauth/Challenge_2SV-Gnubby_graphic.png"
             :alt="t('settings.webauthn_insertKey')"
        />
      </div>

      <div class="pa2">
        <p>
          {{ t('settings.webauthn_insertKey') }}
        </p>
        <p>
          {{ t('settings.webauthn_buttonAdvise') }}
          <br />
          {{ t('settings.webauthn_noButtonAdvise') }}
        </p>
      </div>
    </div>

    <monica-modal v-model="showDelete" title="Remove a key">
      <form>
        <div class="mb4">
          {{ t('settings.webauthn_delete_confirmation') }}
        </div>
      </form>
      <template #button>
        <a class="btn" href="" @click.prevent="closeDeleteModal()">
          {{ t('app.cancel') }}
        </a>
        <a class="btn" href="" @click.prevent="webauthnRemove(keyToTrash)">
          {{ t('app.delete') }}
        </a>
      </template>
    </monica-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import axios from 'axios';
import moment from 'moment-timezone';
import { startRegistration, startAuthentication, browserSupportsWebAuthn } from '@simplewebauthn/browser';
import { useNotify } from '../../composables/useNotify';

interface WebauthnKey {
  id: number | string;
  name: string;
  counter?: number;
  updated_at?: string;
}

const props = withDefaults(
  defineProps<{
    keys?: WebauthnKey[];
    // eslint-disable-next-line vue/require-default-prop
    publicKey?: unknown;
    method?: string;
    timezone?: string;
    script?: string;
  }>(),
  {
    keys: () => [],
    method: '',
    timezone: '',
    script: '',
  },
);

const { t, locale } = useI18n();
const { notify } = useNotify();

const isSupported = ref(true);
const errorMessage = ref('');
const infoMessage = ref('');
const success = ref(false);
const currentkeys = ref<WebauthnKey[]>([]);
const keyToTrash = ref<number | string>('');
const keyName = ref('');
const registerTab = ref('');
const registerModalOpen = ref(false);
const showDelete = ref(false);

onMounted(() => {
  currentkeys.value = props.keys;
  isSupported.value = browserSupportsWebAuthn();
  start();
});

function notifyMessage(text: string, ok: boolean) {
  notify({
    group: 'webauthn',
    title: text,
    text: '',
    type: ok ? 'success' : 'error',
  });
}

function _errorMessage(name: string | undefined, message: string): string {
  switch (name) {
  case 'InvalidStateError':
    return t('settings.webauthn_error_already_used');
  case 'NotAllowedError':
    return t('settings.webauthn_error_not_allowed');
  default:
    return message;
  }
}

function notSupportedMessage(): string {
  if (
    !window.isSecureContext &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1'
  ) {
    return t('settings.webauthn_not_secured');
  }
  return t('settings.webauthn_not_supported');
}

function start() {
  errorMessage.value = '';

  if (!browserSupportsWebAuthn()) {
    isSupported.value = false;
    errorMessage.value = notSupportedMessage();
    return;
  }

  switch (props.method) {
  case 'register':
    setTimeout(() => doRegister(props.publicKey, true), 10);
    break;
  case 'login':
    doLogin(props.publicKey);
    break;
  }
}

function showRegisterModal() {
  errorMessage.value = '';
  infoMessage.value = '';
  keyName.value = '';
  success.value = false;
  showRegisterModalTab('1');
  registerModalOpen.value = true;
}

function showRegisterModalTab(tab: string) {
  registerTab.value = tab;
}

async function startRegister() {
  errorMessage.value = '';
  try {
    const response = await axios.post('webauthn/keys/options');
    if (registerTab.value === '2') {
      setTimeout(() => doRegister(response.data.publicKey, false), 10);
    }
  } catch (error: unknown) {
    const e = error as { response?: { data?: { message?: string } }; message?: string };
    notifyMessage(e?.response?.data?.message ?? e?.message ?? '', false);
  }
}

function closeRegisterModal() {
  registerModalOpen.value = false;
  showRegisterModalTab('');
}

// startRegistration's options type is internal to @simplewebauthn; we accept
// the publicKey blob the server hands back verbatim.
async function doRegister(publicKey: unknown, redirect: boolean) {
  let attResp;
  try {
    attResp = await startRegistration({ optionsJSON: publicKey as Parameters<typeof startRegistration>[0]['optionsJSON'] });
  } catch (error: unknown) {
    const e = error as { name?: string; message?: string };
    errorMessage.value = _errorMessage(e.name, e.message ?? '');
    return;
  }
  try {
    const response = await axios.post('webauthn/keys', { ...attResp, name: keyName.value });
    success.value = true;
    notifyMessage(t('settings.webauthn_success'), true);
    currentkeys.value.push({
      id: response.data.result.id,
      name: response.data.result.name,
    });
    if (redirect) {
      setTimeout(() => {
        window.location.href = response.data.callback;
      }, 100);
    } else {
      closeRegisterModal();
    }
  } catch (error: unknown) {
    const e = error as { message?: string; response?: { data?: { message?: string } } };
    errorMessage.value = e.message ?? e.response?.data?.message ?? '';
  }
}

async function doLogin(publicKey: unknown) {
  let assertionResp;
  try {
    assertionResp = await startAuthentication({ optionsJSON: publicKey as Parameters<typeof startAuthentication>[0]['optionsJSON'] });
  } catch (error: unknown) {
    const e = error as { name?: string; message?: string };
    errorMessage.value = _errorMessage(e.name, e.message ?? '');
    return;
  }
  try {
    const response = await axios.post('webauthn/auth', { ...assertionResp });
    success.value = true;
    notifyMessage(t('settings.webauthn_success'), true);
    window.location.href = response.data.callback;
  } catch (error: unknown) {
    const e = error as { message?: string; response?: { data?: { message?: string } } };
    errorMessage.value = e.message ?? e.response?.data?.message ?? '';
  }
}

async function webauthnRemove(id: number | string) {
  try {
    // asbiin/laravel-webauthn returns 204 No Content, so response.data is
    // empty. Match on the id we sent in the URL rather than fishing for
    // it in the (absent) body. The Options-API original spliced the last
    // item by accident via splice(indexOf(undefined), 1) → splice(-1, 1).
    await axios.delete('webauthn/keys/' + id);
    const idx = currentkeys.value.findIndex((item) => item.id === id);
    if (idx >= 0) {
      currentkeys.value.splice(idx, 1);
    }
    success.value = true;
    notifyMessage(t('settings.webauthn_delete_success'), true);
    closeDeleteModal();
  } catch (error: unknown) {
    const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? '';
    errorMessage.value = msg;
  }
}

function showDeleteModal(id: number | string) {
  keyToTrash.value = id;
  showDelete.value = true;
}

function closeDeleteModal() {
  showDelete.value = false;
}

function formatTime(value: string): string {
  moment.locale(typeof locale.value === 'string' ? locale.value : 'en');
  moment.tz.setDefault('UTC');
  const m = moment(value);
  const date = moment.tz(m, props.timezone);
  return date.format('LLLL');
}
</script>
