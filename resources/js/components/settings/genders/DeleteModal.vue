<template>
  <monica-modal
    :model-value="modelValue"
    :title="t('settings.personalization_genders_modal_delete')"
    @update:model-value="sync"
  >
    <form>
      <div v-if="errorMessage !== ''" class="form-error-message mb3">
        <div class="pa2">
          <p class="mb0">
            {{ errorMessage }}
          </p>
        </div>
      </div>
      <div class="mb4">
        <p class="mb2">
          {{ t('settings.personalization_genders_modal_delete_desc', { name: form.name }) }}
        </p>
        <div v-if="form.numberOfContacts !== 0 || form.isDefault">
          <p v-if="form.numberOfContacts !== 0">
            {{ t('settings.personalization_genders_modal_delete_question', { count: form.numberOfContacts }, form.numberOfContacts) }}
          </p>
          <p v-else>
            {{ t('settings.personalization_genders_modal_delete_question_default') }}
          </p>
          <form-select
            :id="'deleteNewId'"
            v-model="form.newId"
            :options="genders"
            :required="true"
            :title="''"
            :excluded-id="form.id"
          />
        </div>
      </div>
    </form>
    <template #button>
      <a class="btn" href="" @click.prevent="cancel">
        {{ t('app.cancel') }}
      </a>
      <a v-if="form.numberOfContacts === 0 && !form.isDefault"
         class="btn btn-primary"
         href=""
         @click.prevent="trash"
      >
        {{ t('app.delete') }}
      </a>
      <a v-else class="btn btn-primary" href="" @click.prevent="trashAndReplace">
        {{ t('app.delete') }}
      </a>
    </template>
  </monica-modal>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useI18n } from 'vue-i18n';
import axios from 'axios';
import { useModalSelfClose } from '../../../composables/useModalSelfClose';

interface Gender {
  id: number | string;
  name: string;
  isDefault: boolean;
  numberOfContacts: number;
}

const props = defineProps<{
  modelValue?: boolean;
  gender: Gender;
  genders?: Gender[];
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'saved'): void;
}>();

const { t } = useI18n();
const { cancel, finish, sync } = useModalSelfClose(emit);

const form = reactive<{
  id: string;
  name: string;
  isDefault: boolean;
  numberOfContacts: number;
  newId: number;
}>({
  id: props.gender.id.toString(),
  name: props.gender.name,
  isDefault: props.gender.isDefault,
  numberOfContacts: props.gender.numberOfContacts,
  newId: 0,
});

const errorMessage = ref('');

async function trash() {
  await axios.delete('settings/personalization/genders/' + form.id);
  finish();
}

async function trashAndReplace() {
  try {
    await axios.delete('settings/personalization/genders/' + form.id + '/replaceby/' + form.newId);
    finish();
  } catch (error: unknown) {
    const data = (error as { response?: { data?: unknown } })?.response?.data;
    if (data && typeof data === 'object') {
      errorMessage.value = (data as { message?: string }).message ?? '';
    } else {
      errorMessage.value = t('app.error_try_again');
    }
  }
}

defineExpose({ form, errorMessage, cancel, finish, sync, trash, trashAndReplace });
</script>
