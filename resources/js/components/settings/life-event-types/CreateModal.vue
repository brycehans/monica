<template>
  <monica-modal
    :model-value="modelValue"
    :title="t('settings.personalization_life_event_type_modal_add')"
    @update:model-value="sync"
  >
    <form @submit.prevent="store">
      <div class="mb4">
        <p class="b mb2"></p>
        <form-input
          :id="'add-type-name'"
          v-model="form.name"
          :input-type="'text'"
          :required="true"
          :title="t('settings.personalization_life_event_type_modal_question')"
        />
      </div>
    </form>
    <template #button>
      <a class="btn" href="" @click.prevent="cancel">
        {{ t('app.cancel') }}
      </a>
      <a class="btn btn-primary" href="" @click.prevent="store">
        {{ t('app.save') }}
      </a>
    </template>
  </monica-modal>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import { useI18n } from 'vue-i18n';
import axios from 'axios';
import { useModalSelfClose } from '../../../composables/useModalSelfClose';

interface LifeEventCategory {
  id: number;
  default_life_event_category_key?: string;
}

const props = defineProps<{
  modelValue?: boolean;
  category: LifeEventCategory;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'saved'): void;
}>();

const { t } = useI18n();
const { cancel, finish, sync } = useModalSelfClose(emit);

const form = reactive<{
  name: string;
  life_event_category_id: number;
  errors: string[];
}>({
  name: '',
  life_event_category_id: props.category.id,
  errors: [],
});

async function store() {
  await axios.post('settings/personalization/lifeeventtypes', form);
  finish();
}

defineExpose({ form, cancel, finish, sync, store });
</script>
