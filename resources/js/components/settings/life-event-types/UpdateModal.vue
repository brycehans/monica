<template>
  <monica-modal
    :model-value="modelValue"
    :title="t('settings.personalization_life_event_type_modal_edit')"
    @update:model-value="(v) => $emit('update:modelValue', v)"
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

<script>
import { useI18n } from 'vue-i18n';

// See genders/CreateModal.vue for the modelValue contract rationale.
export default {
  props: {
    modelValue: { type: Boolean, default: false },
    type: { type: Object, required: true },
    categoryId: { type: Number, required: true },
  },

  emits: ['update:modelValue', 'saved'],

  setup() {
    const { t } = useI18n();
    return { t };
  },

  data() {
    return {
      form: {
        id: this.type.id,
        name: this.type.name
          ? this.type.name
          : this.t('people.life_event_sentence_' + this.type.default_life_event_type_key),
        life_event_category_id: this.categoryId,
        errors: [],
      },
    };
  },

  methods: {
    cancel() {
      this.$emit('update:modelValue', false);
    },
    update() {
      return axios.put('settings/personalization/lifeeventtypes/' + this.form.id, this.form)
        .then(() => {
          this.$emit('saved');
          this.$emit('update:modelValue', false);
        });
    },
  },
};
</script>
