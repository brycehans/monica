<template>
  <monica-modal
    :model-value="modelValue"
    :title="t('settings.personalization_genders_modal_default')"
    @update:model-value="sync"
  >
    <form>
      <div class="form-group">
        <div class="form-group">
          <form-select
            :id="''"
            v-model="selectedId"
            :options="genders"
            :required="true"
            :title="t('settings.personalization_genders_select_default')"
          />
        </div>
      </div>
    </form>
    <template #button>
      <a class="btn" href="" @click.prevent="cancel">
        {{ t('app.cancel') }}
      </a>
      <a class="btn btn-primary" href="" @click.prevent="save">
        {{ t('app.save') }}
      </a>
    </template>
  </monica-modal>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import axios from 'axios';
import { useModalSelfClose } from '../../../composables/useModalSelfClose';

interface Gender {
  id: number;
  name: string;
  isDefault: boolean;
}

const props = withDefaults(
  defineProps<{
    modelValue?: boolean;
    genders?: Gender[];
    defaultId?: number | null;
  }>(),
  {
    modelValue: false,
    genders: () => [],
    defaultId: null,
  },
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'saved'): void;
}>();

const { t } = useI18n();
const { cancel, finish, sync } = useModalSelfClose(emit);

const selectedId = ref<number | null>(props.defaultId ?? null);

async function save() {
  await axios.put('settings/personalization/genders/default/' + selectedId.value);
  finish();
}

defineExpose({ selectedId, cancel, finish, sync, save });
</script>
