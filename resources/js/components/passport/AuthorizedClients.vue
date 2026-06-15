<template>
  <div>
    <h3 class="mb3">
      {{ t('settings.api_authorized_clients') }}
    </h3>
    <p>{{ t('settings.api_authorized_clients_desc') }}</p>

    <!-- Authorized Clients -->
    <p v-if="tokens.length === 0" class="mb0">
      {{ t('settings.api_authorized_clients_none') }}
    </p>

    <div v-else class="dt dt--fixed w-100 collapse br--top br--bottom">
      <em>{{ t('settings.api_authorized_clients_title') }}</em>
      <div class="dt-row">
        <div class="dtc w-20">
          <div class="pa2 b">
            {{ t('settings.api_authorized_clients_name') }}
          </div>
        </div>
        <div class="dtc w-20">
          <div class="pa2 b">
            {{ t('settings.api_authorized_clients_scopes') }}
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
          <div class="pa2">
            {{ token.client.name }}
          </div>
        </div>

        <!-- Scopes -->
        <div class="dtc">
          <div class="pa2">
            <span v-if="token.scopes.length > 0">
              {{ token.scopes.join(', ') }}
            </span>
          </div>
        </div>

        <!-- Revoke Button -->
        <div class="dtc" :class="[ dirltr ? 'tr' : 'tl' ]">
          <div class="pa2">
            <span class="pointer" @click="revoke(token)">{{ t('app.revoke') }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import axios from 'axios';
import { useHtmlDir } from '../../composables/useHtmlDir';

interface OAuthToken {
  id: string | number;
  client: { name: string };
  scopes: string[];
}

const { t } = useI18n();
const { dirltr } = useHtmlDir();

const tokens = ref<OAuthToken[]>([]);

onMounted(getTokens);

async function getTokens() {
  const response = await axios.get('oauth/tokens');
  tokens.value = response.data as OAuthToken[];
}

async function revoke(token: OAuthToken) {
  await axios.delete('oauth/tokens/' + token.id);
  await getTokens();
}
</script>
