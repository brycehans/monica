<template>
  <monica-modal
    :model-value="show"
    :title="t('settings.personalization_genders_modal_add')"
    @update:model-value="onUpdateModelValue"
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

export default {
  props: {
    genderTypes: { type: Array, default: () => [] },
    defaultGenderType: { type: Object, default: null },
  },

  emits: ['saved', 'cancelled'],

  setup() {
    const { t } = useI18n();
    return { t };
  },

  data() {
    return {
      show: true,
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
    onUpdateModelValue(v) {
      this.show = v;
      if (!v) this.$emit('cancelled');
    },
    cancel() {
      this.show = false;
    },
    store() {
      return axios.post('settings/personalization/genders', this.form)
        .then(() => {
          this.$emit('saved');
          this.show = false;
        });
    },
  },
};
</script>
