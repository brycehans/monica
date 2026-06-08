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

<script>
import { useI18n } from 'vue-i18n';
import { useModalSelfClose } from '../../../composables/useModalSelfClose';

// See genders/CreateModal.vue for the modelValue contract rationale.
export default {
  props: {
    modelValue: { type: Boolean, default: false },
    type: { type: Object, required: true },
    categoryId: { type: Number, required: true },
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
    update() {
      return axios.put('settings/personalization/lifeeventtypes/' + this.form.id, this.form).then(this.finish);
    },
  },
};
</script>
