<template>
  <monica-modal
    :model-value="modelValue"
    :title="t('settings.personalization_life_event_type_modal_delete')"
    @update:model-value="sync"
  >
    <form>
      <div v-if="errorMessage !== ''" class="form-error-message mb3">
        <div class="pa2">
          <p class="mb0">
            {{ errorMessage }}
          </p>
        </div>
      </div>
      <div class="mb4">
        <p class="mb2">
          {{ t('settings.personalization_life_event_type_modal_delete_desc') }}
        </p>
      </div>
    </form>
    <template #button>
      <a class="btn" href="" @click.prevent="cancel">
        {{ t('app.cancel') }}
      </a>
      <a class="btn btn-primary" href="" @click.prevent="destroy">
        {{ t('app.delete') }}
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
      },
      errorMessage: '',
    };
  },

  methods: {
    destroy() {
      return axios.delete('settings/personalization/lifeeventtypes/' + this.form.id)
        .then(this.finish)
        .catch((error) => {
          this.errorMessage = error.response.data.message;
        });
    },
  },
};
</script>
