<style scoped>
.code {
    margin-bottom: 0.1em;
}
.used {
    text-decoration: line-through;
}
</style>

<template>
  <div>
    <h3>{{ t('settings.recovery_title') }}</h3>
    <div class="form-group">
      <a class="btn btn-primary" href="" @click.prevent="showRecoveryModal">
        {{ t('settings.recovery_show') }}
      </a>
    </div>

    <monica-modal v-model="recoveryModalOpen" :title="t('settings.recovery_title')">
      <notifications group="recovery" position="top middle" :duration="5000" width="400" />

      <p>{{ t('settings.recovery_help_intro') }}</p>
      <p :class="[ dirltr ? 'ml3' : 'mr3' ]">
        <span v-for="code in codes" :key="code.id" v-cy-name="'recovery-' + code.id">
          <pre class="code" :class="[ code.used ? 'used' : '' ]" :title="code.used ? usedHelp : ''">{{ code.recovery }}</pre>
        </span>
      </p>
      <p>{{ t('settings.recovery_help_information') }}</p>
      <template #button>
        <span :class="[ dirltr ? 'fl' : 'fr' ]">
          <a class="btn" href="" @click.prevent="generateNewCodes">
            {{ t('settings.recovery_generate') }}
          </a>
          <br />
          <small class="form-text text-muted">
            {{ t('settings.recovery_generate_help') }}
          </small>
        </span>
        <span :class="[ dirltr ? 'fr' : 'fl' ]">
          <a class="btn btn-primary" :title="copyHelp" href="" @click.prevent="copyIntoClipboard">
            {{ t('app.copy') }}
          </a>
          <!--
            <a @click.prevent="download" class="btn" href="">{{ t('app.download') }}</a>
            -->
          <a class="btn" href="" @click.prevent="closeRecoveryModal">
            {{ t('app.close') }}
          </a>
        </span>
      </template>
    </monica-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import axios from 'axios';
import { useHtmlDir } from '../../composables/useHtmlDir';
import { useNotify } from '../../composables/useNotify';

interface RecoveryCode {
  id: number;
  recovery: string;
  used: boolean;
}

const { t } = useI18n();
const { dirltr } = useHtmlDir();
const { notify } = useNotify();

const codes = ref<RecoveryCode[]>([]);
const recoveryModalOpen = ref(false);

const usedHelp = computed(() => t('settings.recovery_already_used_help'));
const copyHelp = computed(() => t('settings.recovery_copy_help'));

function notifyMessage(text: string, success: boolean) {
  notify({
    group: 'recovery',
    title: text,
    text: '',
    type: success ? 'success' : 'error',
  });
}

async function showRecoveryModal() {
  codes.value = [];
  try {
    const response = await axios.post('settings/security/recovery-codes');
    codes.value = response.data;
    recoveryModalOpen.value = true;
  } catch (error: unknown) {
    notifyMessage(
      (error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? '',
      false,
    );
  }
}

async function generateNewCodes() {
  codes.value = [];
  try {
    const response = await axios.post('settings/security/generate-recovery-codes');
    codes.value = response.data;
  } catch (error: unknown) {
    notifyMessage(
      (error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? '',
      false,
    );
  }
}

function closeRecoveryModal() {
  recoveryModalOpen.value = false;
}

function getDataStream(): string {
  let text = t('settings.recovery_help_intro') + '\n';
  let i = 1;
  codes.value.forEach((code) => {
    if (code.used) {
      text += i + '. ---------\n';
    } else {
      text += i + '. ' + code.recovery + '\n';
    }
    i++;
  });
  return text;
}

async function copyIntoClipboard() {
  try {
    await navigator.clipboard.writeText(getDataStream());
    notifyMessage(t('settings.recovery_clipboard'), true);
  } catch {
    // silent on permission denial / non-secure context
  }
}
</script>
