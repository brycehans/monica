<template>
  <div>
    <notifications group="main" position="bottom right" />

    <h3 class="mb3">
      {{ t('settings.personalization_genders_title') }}
      <a class="btn nt2" :class="[ dirltr ? 'fr' : 'fl' ]" href="" @click.prevent="openCreate">
        {{ t('settings.personalization_genders_add') }}
      </a>
    </h3>
    <p>{{ t('settings.personalization_genders_desc') }}</p>

    <div class="dt dt--fixed w-100 collapse br--top br--bottom">
      <div class="dt-row">
        <div class="dtc">
          <div class="pa2 b">
            {{ t('settings.personalization_genders_table_name') }}
          </div>
        </div>
        <div class="dtc">
          <div class="pa2 b">
            {{ t('settings.personalization_genders_table_sex') }}
          </div>
        </div>
        <div class="dtc">
          <div class="pa2 b">
            {{ t('settings.personalization_genders_table_default') }}
          </div>
        </div>
        <div class="dtc" :class="[ dirltr ? 'tr' : 'tl' ]">
          <div class="pa2 b">
            {{ t('settings.personalization_contact_field_type_table_actions') }}
          </div>
        </div>
      </div>

      <div v-for="gender in genders" :key="gender.id"
           class="dt-row bb b--light-gray"
      >
        <div class="dtc">
          <div class="pa2">
            {{ gender.name }}
            <span class="i">
              {{ t('settings.personalization_genders_list_contact_number', { count: gender.numberOfContacts }, gender.numberOfContacts) }}
            </span>
          </div>
        </div>
        <div class="dtc">
          <div class="pa2">
            {{ t('settings.personalization_genders_' + gender.type.toLowerCase()) }}
          </div>
        </div>
        <div class="dtc">
          <div class="pa2">
            <template v-if="gender.isDefault">
              {{ t('settings.personalization_genders_default') }}
            </template>
          </div>
        </div>
        <div class="dtc" :class="[ dirltr ? 'tr' : 'tl' ]">
          <div class="pa2">
            <em class="fa fa-pencil-square-o pointer pr2" @click="openEdit(gender)"></em>
            <em v-if="genders.length > 1" class="fa fa-trash-o pointer" @click="openDelete(gender)"></em>
          </div>
        </div>
      </div>
    </div>
    <div class="mt2" :class="[ dirltr ? 'tr' : 'tl' ]">
      <a class="pointer" href="" @click.prevent="openSetDefault">{{ t('settings.personalization_genders_make_default') }}</a>
    </div>

  </div>
</template>

<script>
import { useI18n } from 'vue-i18n';
import { useModal } from 'vue-final-modal';
import CreateModal from './genders/CreateModal.vue';
import EditModal from './genders/EditModal.vue';
import DeleteModal from './genders/DeleteModal.vue';
import SetDefaultModal from './genders/SetDefaultModal.vue';

export default {

  components: {
  },

  setup() {
    const { t } = useI18n();
    const createModal = useModal({ component: CreateModal, attrs: {} });
    const editModal = useModal({ component: EditModal, attrs: {} });
    const deleteModal = useModal({ component: DeleteModal, attrs: {} });
    const setDefaultModal = useModal({ component: SetDefaultModal, attrs: {} });
    return { t, createModal, editModal, deleteModal, setDefaultModal };
  },

  data() {
    return {
      genders: [],
      genderTypes: [],

    };
  },

  computed: {
    dirltr() {
      return this.$root.htmldir === 'ltr';
    },

    toggleOptions() {
      return {
        checked: this.t('app.yes'),
        unchecked: this.t('app.no')
      };
    },

    defaultGenderType() {
      const defaultGender = _.findIndex(this.genders, ['isDefault', true]);
      return this.genders[defaultGender >= 0 ? defaultGender : 0];
    }
  },

  mounted() {
    this.prepareComponent();
  },

  methods: {
    prepareComponent() {
      Promise.all([
        this.getGenders(),
        this.getGenderTypes()
      ]);
    },

    getGenders() {
      return axios.get('settings/personalization/genders')
        .then(response => {
          this.genders = _.toArray(response.data);
        });
    },

    getGenderTypes() {
      return axios.get('settings/personalization/genderTypes')
        .then(response => {
          this.genderTypes = _.toArray(response.data);
        });
    },

    openCreate() {
      this.createModal.patchOptions({
        attrs: {
          genderTypes: this.genderTypes,
          defaultGenderType: this.defaultGenderType,
          onSaved: () => this.getGenders(),
        },
      });
      this.createModal.open();
    },

    openSetDefault() {
      this.setDefaultModal.patchOptions({
        attrs: {
          genders: this.genders,
          defaultId: this.defaultGenderType?.id ?? null,
          onSaved: () => this.getGenders(),
        },
      });
      this.setDefaultModal.open();
    },

    openEdit(gender) {
      this.editModal.patchOptions({
        attrs: {
          gender,
          genderTypes: this.genderTypes,
          onSaved: () => this.getGenders(),
        },
      });
      this.editModal.open();
    },

    openDelete(gender) {
      this.deleteModal.patchOptions({
        attrs: {
          gender,
          genders: this.genders,
          onSaved: () => this.getGenders(),
        },
      });
      this.deleteModal.open();
    },
  }
};
</script>
