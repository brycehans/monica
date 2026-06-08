<template>
  <monica-modal
    :model-value="modelValue"
    :title="t('settings.personalization_genders_modal_delete')"
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
          {{ t('settings.personalization_genders_modal_delete_desc', { name: form.name }) }}
        </p>
        <div v-if="form.numberOfContacts !== 0 || form.isDefault">
          <p v-if="form.numberOfContacts !== 0">
            {{ t('settings.personalization_genders_modal_delete_question', { count: form.numberOfContacts }, form.numberOfContacts) }}
          </p>
          <p v-else>
            {{ t('settings.personalization_genders_modal_delete_question_default') }}
          </p>
          <form-select
            :id="'deleteNewId'"
            v-model="form.newId"
            :options="genders"
            :required="true"
            :title="''"
            :excluded-id="form.id"
          />
        </div>
      </div>
    </form>
    <template #button>
      <a class="btn" href="" @click.prevent="cancel">
        {{ t('app.cancel') }}
      </a>
      <a v-if="form.numberOfContacts === 0 && !form.isDefault"
         class="btn btn-primary"
         href=""
         @click.prevent="trash"
      >
        {{ t('app.delete') }}
      </a>
      <a v-else class="btn btn-primary" href="" @click.prevent="trashAndReplace">
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
    gender: { type: Object, required: true },
    genders: { type: Array, default: () => [] },
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
        isDefault: this.gender.isDefault,
        numberOfContacts: this.gender.numberOfContacts,
        newId: 0,
      },
      errorMessage: '',
    };
  },

  methods: {
    trash() {
      return axios.delete('settings/personalization/genders/' + this.form.id).then(this.finish);
    },
    trashAndReplace() {
      return axios.delete('settings/personalization/genders/' + this.form.id + '/replaceby/' + this.form.newId)
        .then(this.finish)
        .catch((error) => {
          if (error?.response?.data && typeof error.response.data === 'object') {
            this.errorMessage = error.response.data.message;
          } else {
            this.errorMessage = this.t('app.error_try_again');
          }
        });
    },
  },
};
</script>
