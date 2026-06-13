<template>
  <div>
    <notifications group="mfa" position="bottom right" :duration="5000" width="400" />

    <h3>{{ t('settings.2fa_otp_title') }}</h3>

    <div class="form-group">
      <a v-if="selectActivated" class="btn btn-warning" href="" @click.prevent="showDisableModal">
        {{ t('settings.2fa_disable_title') }}
      </a>
      <a v-else class="btn btn-primary" href="" @click.prevent="showEnableModal">
        {{ t('settings.2fa_enable_title') }}
      </a>
    </div>

    <monica-modal v-model="enableModalOpen" :title="t('settings.2fa_otp_title')">
      <form @submit.prevent="register()">
        <p>{{ t('settings.2fa_enable_description') }}</p>

        <div class="panel-body">
          {{ t('settings.2fa_enable_otp') }}
          <div v-html="image"></div>
          <p>
            {{ t('settings.2fa_enable_otp_help') }}
            <code id="secretkey">
              {{ secret }}
            </code>
          </p>
        </div>

        <div class="form-group">
          <p>
            {{ t('settings.2fa_enable_otp_validate') }}
          </p>
          <form-input
            :id="'one_time_password1'"
            v-model="one_time_password"
            :title="t('auth.2fa_one_time_password')"
            :input-type="'number'"
            :width="100"
            :required="true"
          />
        </div>
      </form>
      <template #button>
        <a id="verify1" class="btn btn-primary" href="" @click.prevent="register()">
          {{ t('app.verify') }}
        </a>
        <a class="btn" href="" @click.prevent="closeEnableModal()">
          {{ t('app.cancel') }}
        </a>
      </template>
    </monica-modal>

    <monica-modal v-model="disableModalOpen" :title="t('settings.2fa_otp_title')">
      <form @submit.prevent="register()">
        <p>{{ t('settings.2fa_disable_description') }}</p>

        <div class="form-group">
          <form-input
            :id="'one_time_password2'"
            v-model="one_time_password"
            :title="t('auth.2fa_one_time_or_recuperation')"
            :input-type="'text'"
            :width="100"
            :required="true"
          />
        </div>
      </form>
      <template #button>
        <a id="verify2" class="btn btn-primary" href="" @click.prevent="unregister()">
          {{ t('app.verify') }}
        </a>
        <a class="btn" href="" @click.prevent="closeDisableModal()">
          {{ t('app.cancel') }}
        </a>
      </template>
    </monica-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import axios from 'axios';
import { useNotify } from '../../composables/useNotify';

const props = defineProps<{
  activated?: boolean
}>();

const { t } = useI18n();
const { notify } = useNotify();

const selectActivated = ref(props.activated ?? false);
const one_time_password = ref('');
const image = ref('');
const secret = ref('');
const enableModalOpen = ref(false);
const disableModalOpen = ref(false);

watch(() => props.activated, (val) => {
  selectActivated.value = val ?? false;
});

async function register() {
  try {
    const response = await axios.post<{ success: boolean }>('settings/security/2fa-enable', {
      one_time_password: one_time_password.value,
    });
    closeEnableModal();
    selectActivated.value = response.data.success;
    notify({
      group: 'mfa',
      title: response.data.success ? t('settings.2fa_enable_success') : t('settings.2fa_enable_error'),
      text: '',
      type: response.data.success ? 'success' : 'error',
    });
  } catch (error: unknown) {
    closeEnableModal();
    const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? '';
    notify({ group: 'mfa', title: msg, text: '', type: 'error' });
  }
}

async function unregister() {
  try {
    const response = await axios.post<{ success: boolean }>('settings/security/2fa-disable', {
      one_time_password: one_time_password.value,
    });
    closeDisableModal();
    selectActivated.value = !response.data.success;
    notify({
      group: 'mfa',
      title: response.data.success ? t('settings.2fa_disable_success') : t('settings.2fa_disable_error'),
      text: '',
      type: response.data.success ? 'success' : 'error',
    });
  } catch (error: unknown) {
    closeDisableModal();
    const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? '';
    notify({ group: 'mfa', title: msg, text: '', type: 'error' });
  }
}

interface EnableResponse {
  image: string;
  secret: string;
}

async function showEnableModal() {
  one_time_password.value = '';
  try {
    const response = await axios.get<EnableResponse>('settings/security/2fa-enable');
    image.value = response.data.image;
    secret.value = response.data.secret;
    enableModalOpen.value = true;
  } catch (error: unknown) {
    const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? '';
    notify({ group: 'mfa', title: msg, text: '', type: 'error' });
  }
}

function showDisableModal() {
  one_time_password.value = '';
  disableModalOpen.value = true;
}

function closeEnableModal() {
  enableModalOpen.value = false;
}

function closeDisableModal() {
  disableModalOpen.value = false;
}

// Exposed for white-box testing only — not part of the component's public contract.
defineExpose({
  selectActivated, one_time_password, image, secret,
  enableModalOpen, disableModalOpen,
  register, unregister, showEnableModal, showDisableModal,
  closeEnableModal, closeDisableModal,
});
</script>
