<template>
  <monica-modal
    :model-value="modelValue"
    :title="t('settings.personalization_genders_modal_edit')"
    @update:model-value="sync"
  >
    <form @submit.prevent="update">
      <div class="form-group">
        <div class="form-group">
          <form-input
            :id="''"
            v-model="form.name"
            :input-type="'text'"
            :required="true"
            :title="t('settings.personalization_genders_modal_name')"
          />
          <small class="form-text text-muted">
            {{ t('settings.personalization_genders_modal_name_help') }}
          </small>
        </div>
        <div class="form-group">
          <form-select
            :id="''"
            v-model="form.type"
            :options="genderTypes"
            :required="true"
            :title="t('settings.personalization_genders_modal_sex')"
          />
          <small class="form-text text-muted">
            {{ t('settings.personalization_genders_modal_sex_help') }}
          </small>
        </div>
        <div class="form-group">
          <form-toggle
            :id="''"
            v-model="form.isDefault"
            :labels="toggleOptions"
            :required="true"
            :title="t('settings.personalization_genders_modal_default')"
          />
        </div>
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
import { reactive, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import axios from 'axios';
import { useModalSelfClose } from '../../../composables/useModalSelfClose';

interface Gender {
  id: number | string;
  name: string;
  type: string;
  isDefault: boolean;
}

interface GenderType {
  id: string;
  name: string;
  type?: string;
}

const props = withDefaults(
  defineProps<{
    modelValue?: boolean;
    gender: Gender;
    genderTypes?: GenderType[];
  }>(),
  {
    modelValue: false,
    genderTypes: () => [],
  },
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'saved'): void;
}>();

const { t } = useI18n();
const { cancel, finish, sync } = useModalSelfClose(emit);

const form = reactive<{
  id: string;
  name: string;
  type: string;
  isDefault: boolean;
  errors: string[];
}>({
  id: props.gender.id.toString(),
  name: props.gender.name,
  type: props.gender.type,
  isDefault: props.gender.isDefault,
  errors: [],
});

const toggleOptions = computed(() => ({
  checked: t('app.yes'),
  unchecked: t('app.no'),
}));

async function update() {
  await axios.put('settings/personalization/genders/' + form.id, form);
  finish();
}

defineExpose({ form, toggleOptions, cancel, finish, sync, update });
</script>
