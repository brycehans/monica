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

<script>
import { useI18n } from 'vue-i18n';
import { useModalSelfClose } from '../../../composables/useModalSelfClose';

// See genders/CreateModal.vue for the modelValue contract rationale.
export default {
  props: {
    modelValue: { type: Boolean, default: false },
    gender: { type: Object, required: true },
    genderTypes: { type: Array, default: () => [] },
  },

  emits: ['update:modelValue', 'saved'],

  setup(_, { emit }) {
    const { t } = useI18n();
    const { cancel, finish, sync } = useModalSelfClose(emit);
    return { t, cancel, finish, sync };
  },

  data() {
    return {
      form: {
        id: this.gender.id.toString(),
        name: this.gender.name,
        type: this.gender.type,
        isDefault: this.gender.isDefault,
        errors: [],
      },
    };
  },

  computed: {
    toggleOptions() {
      return {
        checked: this.t('app.yes'),
        unchecked: this.t('app.no'),
      };
    },
  },

  methods: {
    update() {
      return axios.put('settings/personalization/genders/' + this.form.id, this.form).then(this.finish);
    },
  },
};
</script>
