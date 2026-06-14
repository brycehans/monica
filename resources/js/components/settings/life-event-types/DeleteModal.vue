<template>
  <monica-modal
    :model-value="modelValue"
    :title="t('settings.personalization_life_event_type_modal_delete')"
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
          {{ t('settings.personalization_life_event_type_modal_delete_desc') }}
        </p>
      </div>
    </form>
    <template #button>
      <a class="btn" href="" @click.prevent="cancel">
        {{ t('app.cancel') }}
      </a>
      <a class="btn btn-primary" href="" @click.prevent="destroy">
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

interface LifeEventType {
  id: number;
  name?: string;
}

const props = defineProps<{
  modelValue?: boolean;
  type: LifeEventType;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'saved'): void;
}>();

const { t } = useI18n();
const { cancel, finish, sync } = useModalSelfClose(emit);

const form = reactive<{ id: number }>({
  id: props.type.id,
});

const errorMessage = ref('');

async function destroy() {
  try {
    await axios.delete('settings/personalization/lifeeventtypes/' + form.id);
    finish();
  } catch (error: unknown) {
    const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? '';
    errorMessage.value = msg;
  }
}

defineExpose({ form, errorMessage, cancel, finish, sync, destroy });
</script>
