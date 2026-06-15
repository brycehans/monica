<template>
  <monica-modal
    :model-value="modelValue"
    :title="t('settings.personalization_life_event_type_modal_edit')"
    @update:model-value="sync"
  >
    <form @submit.prevent="update">
      <div class="mb4">
        <p class="b mb2"></p>
        <form-input
          :id="'update-type-name'"
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
      <a class="btn btn-primary" href="" @click.prevent="update">
        {{ t('app.update') }}
      </a>
    </template>
  </monica-modal>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import { useI18n } from 'vue-i18n';
import axios from 'axios';
import { useModalSelfClose } from '../../../composables/useModalSelfClose';

interface LifeEventType {
  id: number;
  name: string;
  default_life_event_type_key?: string;
}

const props = withDefaults(
  defineProps<{
    modelValue?: boolean;
    type: LifeEventType;
    categoryId: number;
  }>(),
  {
    modelValue: false,
  },
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'saved'): void;
}>();

const { t } = useI18n();
const { cancel, finish, sync } = useModalSelfClose(emit);

const form = reactive<{
  id: number;
  name: string;
  life_event_category_id: number;
  errors: string[];
}>({
  id: props.type.id,
  name: props.type.name
    ? props.type.name
    : t('people.life_event_sentence_' + props.type.default_life_event_type_key),
  life_event_category_id: props.categoryId,
  errors: [],
});

async function update() {
  await axios.put('settings/personalization/lifeeventtypes/' + form.id, form);
  finish();
}

defineExpose({ form, cancel, finish, sync, update });
</script>
