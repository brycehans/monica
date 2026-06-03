<template>
  <monica-modal
    :model-value="modelValue"
    :title="t('settings.personalization_genders_modal_add')"
    @update:model-value="(v) => $emit('update:modelValue', v)"
  >
    <form @submit.prevent="store">
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
      <a class="btn btn-primary" href="" @click.prevent="store">
        {{ t('app.save') }}
      </a>
    </template>
  </monica-modal>
</template>

<script>
import { useI18n } from 'vue-i18n';

// useModal()/ModalsContainer drive open/close via the modelValue prop.
// We forward that to MonicaModal and emit update:modelValue back out so
// ModalsContainer learns when the user dismisses the modal — without that
// link useModal() thinks the modal is still open, keepAlive=false never
// destroys the instance, and the next open() shows stale data.
export default {
  props: {
    modelValue: { type: Boolean, default: false },
    genderTypes: { type: Array, default: () => [] },
    defaultGenderType: { type: Object, default: null },
  },

  emits: ['update:modelValue', 'saved'],

  setup() {
    const { t } = useI18n();
    return { t };
  },

  data() {
    return {
      form: {
        name: '',
        type: this.defaultGenderType?.type ?? '',
        isDefault: false,
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
    cancel() {
      this.$emit('update:modelValue', false);
    },
    store() {
      return axios.post('settings/personalization/genders', this.form)
        .then(() => {
          this.$emit('saved');
          this.$emit('update:modelValue', false);
        });
    },
  },
};
</script>
