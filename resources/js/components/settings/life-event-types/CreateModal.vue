<template>
  <monica-modal
    :model-value="modelValue"
    :title="t('settings.personalization_life_event_type_modal_add')"
    @update:model-value="(v) => $emit('update:modelValue', v)"
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

<script>
import { useI18n } from 'vue-i18n';

// See genders/CreateModal.vue for the modelValue contract rationale.
export default {
  props: {
    modelValue: { type: Boolean, default: false },
    category: { type: Object, required: true },
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
        life_event_category_id: this.category.id,
        errors: [],
      },
    };
  },

  methods: {
    cancel() {
      this.$emit('update:modelValue', false);
    },
    store() {
      return axios.post('settings/personalization/lifeeventtypes', this.form)
        .then(() => {
          this.$emit('saved');
          this.$emit('update:modelValue', false);
        });
    },
  },
};
</script>
