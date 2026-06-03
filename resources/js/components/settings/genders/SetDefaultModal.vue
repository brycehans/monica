<template>
  <monica-modal
    :model-value="modelValue"
    :title="t('settings.personalization_genders_modal_default')"
    @update:model-value="(v) => $emit('update:modelValue', v)"
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

<script>
import { useI18n } from 'vue-i18n';

// See genders/CreateModal.vue for the modelValue contract rationale.
export default {
  props: {
    modelValue: { type: Boolean, default: false },
    genders: { type: Array, default: () => [] },
    defaultId: { type: Number, default: null },
  },

  emits: ['update:modelValue', 'saved'],

  setup() {
    const { t } = useI18n();
    return { t };
  },

  data() {
    return {
      selectedId: this.defaultId,
    };
  },

  methods: {
    cancel() {
      this.$emit('update:modelValue', false);
    },
    save() {
      return axios.put('settings/personalization/genders/default/' + this.selectedId)
        .then(() => {
          this.$emit('saved');
          this.$emit('update:modelValue', false);
        });
    },
  },
};
</script>
