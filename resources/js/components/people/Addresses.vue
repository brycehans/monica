<template>
  <div class="sidebar-box" :class="[ editMode ? 'edit' : '' ]">
    <div class="w-100 dt">
      <div class="sidebar-box-title">
        <h3>
          {{ t('people.contact_address_title') }}
        </h3>
      </div>
      <div v-if="contactAddresses.length > 0" class="dtc" :class="[ dirltr ? 'tr' : 'tl' ]">
        <a v-if="!editMode" class="pointer" href="" @click.prevent="editMode = true">
          {{ t('app.edit') }}
        </a>
        <a v-else class="pointer" href="" @click.prevent="toggleEditExcept(-1); resetState();">
          {{ t('app.done') }}
        </a>
      </div>
    </div>

    <!-- EMPTY BOX - DISPLAY ADD BUTTON -->
    <p v-if="contactAddresses.length === 0 && !addMode" class="mb0">
      <a class="pointer" href="" @click.prevent="toggleAdd">
        {{ t('app.add') }}
      </a>
    </p>

    <!-- LIST OF ADDRESSES  -->
    <ul v-if="contactAddresses.length > 0">
      <li v-for="(contactAddress, i) in contactAddresses" :key="contactAddress.id" class="mb2">
        <div v-show="!contactAddress.edit" class="w-100 dt">
          <div class="dtc">
            <em class="f6 light-silver fa fa-globe pr2"></em>

            <a v-if="!editMode" :href="contactAddress.googleMapAddress" target="_blank" rel="noopener noreferrer">
              {{ contactAddress.address }}
            </a>
            <span v-else>
              {{ contactAddress.address }}
            </span>

            <span v-if="contactAddress.name" class="light-silver">
              ({{ contactAddress.name }})
            </span>

            <span v-if="!contactAddress.address">
              <a v-if="contactAddress.latitude" :href="contactAddress.googleMapAddressLatitude" target="_blank" rel="noopener noreferrer">
                ({{ contactAddress.latitude }}, {{ contactAddress.longitude }})
              </a>
            </span>

            <div v-if="editMode" class="fr">
              <em class="fa fa-pencil-square-o pointer pr2" @click="toggleEdit(contactAddress)"></em>
              <em class="fa fa-trash-o pointer" @click="trash(contactAddress)"></em>
            </div>
          </div>
        </div>

        <!-- EDIT BOX -->
        <div v-show="contactAddress.edit" class="w-100">
          <form class="measure center" @keyup.enter="update(contactAddress)">
            <div class="mt3">
              <form-input
                :id="'name' + i"
                v-model="updateForm.name"
                :title="t('people.contact_address_form_name')"
                input-type="text"
                :required="false"
                :iclass="'pa2 db w-100'"
              />
            </div>
            <div class="mt3">
              <form-input
                :id="'street' + i"
                v-model="updateForm.street"
                :title="t('people.contact_address_form_street')"
                input-type="text"
                :required="false"
              />
            </div>
            <div class="mt3">
              <form-input
                :id="'city' + i"
                v-model="updateForm.city"
                :title="t('people.contact_address_form_city')"
                input-type="text"
                :required="false"
              />
            </div>
            <div class="mt3">
              <form-input
                :id="'province' + i"
                v-model="updateForm.province"
                :title="t('people.contact_address_form_province')"
                input-type="text"
                :required="false"
              />
            </div>
            <div class="mt3">
              <form-input
                :id="'postal_code' + i"
                v-model="updateForm.postal_code"
                :title="t('people.contact_address_form_postal_code')"
                input-type="text"
                :required="false"
              />
            </div>
            <div class="mt3">
              <form-select
                :id="'name' + i"
                v-model="updateForm.country"
                :title="t('people.contact_address_form_country')"
                :options="countries"
                :required="false"
              />
            </div>
            <div class="mt3">
              <form-input
                :id="'latitude' + i"
                v-model="updateForm.latitude"
                :title="t('people.contact_address_form_latitude')"
                input-type="number"
                step="0.0000001"
                :required="false"
              />
            </div>
            <div class="mt3">
              <form-input
                :id="'longitude' + i"
                v-model="updateForm.longitude"
                :title="t('people.contact_address_form_longitude')"
                input-type="number"
                step="0.0000001"
                :required="false"
              />
            </div>
            <div class="lh-copy mt3">
              <a class="btn btn-primary" href="" @click.prevent="update(contactAddress)">
                {{ t('app.save') }}
              </a>
              <a class="btn" href="" @click.prevent="toggleEdit(contactAddress)">
                {{ t('app.cancel') }}
              </a>
            </div>
          </form>
        </div>
      </li>

      <!-- ADD BUTTON ONLY WHEN EDIT MODE IS AVAILABLE  -->
      <li v-if="editMode && !addMode">
        <a class="pointer" href="" @click.prevent="toggleAdd">
          {{ t('app.add') }}
        </a>
      </li>
    </ul>


    <!-- ADD NEW ADDRESS  -->
    <div v-if="addMode">
      <form class="measure center" @keyup.enter="store">
        <div class="mt3">
          <form-input
            id="name"
            v-model="createForm.name"
            :title="t('people.contact_address_form_name')"
            input-type="text"
            :required="false"
            :iclass="'pa2 db w-100'"
          />
        </div>
        <div class="mt3">
          <form-input
            id="street"
            v-model="createForm.street"
            :title="t('people.contact_address_form_street')"
            input-type="text"
            :required="false"
          />
        </div>
        <div class="mt3">
          <form-input
            id="city"
            v-model="createForm.city"
            :title="t('people.contact_address_form_city')"
            input-type="text"
            :required="false"
          />
        </div>
        <div class="mt3">
          <form-input
            id="province"
            v-model="createForm.province"
            :title="t('people.contact_address_form_province')"
            input-type="text"
            :required="false"
          />
        </div>
        <div class="mt3">
          <form-input
            id="postal_code"
            v-model="createForm.postal_code"
            :title="t('people.contact_address_form_postal_code')"
            input-type="text"
            :required="false"
          />
        </div>
        <div class="mt3">
          <form-select
            id="name"
            v-model="createForm.country"
            :title="t('people.contact_address_form_country')"
            :options="countries"
            :required="false"
          />
        </div>
        <div class="mt3">
          <form-input
            id="latitude"
            v-model="createForm.latitude"
            :title="t('people.contact_address_form_latitude')"
            input-type="number"
            step="0.0000001"
            :required="false"
          />
        </div>
        <div class="mt3">
          <form-input
            id="longitude"
            v-model="createForm.longitude"
            :title="t('people.contact_address_form_longitude')"
            input-type="number"
            step="0.0000001"
            :required="false"
          />
        </div>
        <div class="lh-copy mt3">
          <a class="btn btn-primary" href="" @click.prevent="store">
            {{ t('app.add') }}
          </a>
          <a class="btn" href="" @click.prevent="resetState">
            {{ t('app.cancel') }}
          </a>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import axios from 'axios';
import { useHtmlDir } from '../../composables/useHtmlDir';

interface Country {
  id: number | string;
  name: string;
}

interface AddressForm {
  id?: number | string;
  name: string;
  street: string;
  city: string;
  province: string;
  postal_code: string;
  country: string | number;
  latitude: number | string;
  longitude: number | string;
  errors?: string[];
}

interface ContactAddress extends AddressForm {
  id: number;
  edit?: boolean;
  // Derived properties returned by the server-side resource.
  address?: string;
  googleMapAddress?: string;
  googleMapAddressLatitude?: string;
}

const props = withDefaults(
  defineProps<{
    hash?: string;
  }>(),
  {
    hash: '',
  },
);

const { t } = useI18n();
const { dirltr } = useHtmlDir();

const contactAddresses = ref<ContactAddress[]>([]);
const countries = ref<Country[]>([]);

const editMode = ref(false);
const addMode = ref(false);

function blankForm(): AddressForm {
  return {
    name: '',
    street: '',
    city: '',
    province: '',
    postal_code: '',
    country: '',
    latitude: 0,
    longitude: 0,
  };
}

const createForm = reactive<AddressForm>(blankForm());
const updateForm = reactive<AddressForm>({ id: '', ...blankForm() });

onMounted(async () => {
  await Promise.all([getAddresses(), getCountries()]);
});

async function getAddresses() {
  const response = await axios.get('people/' + props.hash + '/addresses');
  contactAddresses.value = response.data as ContactAddress[];
}

async function getCountries() {
  const response = await axios.get('countries');
  // `countries` endpoint may return an array OR an object keyed by code
  // (Laravel serialises a Collection::keyBy(...) result as an object).
  // Object.values handles both. Same trap as Participant.vue.
  const list = Object.values(response.data ?? {}) as Array<{ id: number; country: string }>;
  countries.value = list.map((country) => ({
    id: country.id,
    name: country.country,
  }));
}

function reinitialize() {
  Object.assign(createForm, blankForm());
}

function resetState() {
  editMode.value = false;
  addMode.value = false;
}

function toggleAdd() {
  addMode.value = true;
  editMode.value = true;
  reinitialize();
}

function toggleEditExcept(contactAddressId: number) {
  contactAddresses.value
    .filter((a) => a.id !== contactAddressId)
    .forEach((a) => {
      a.edit = false;
    });
}

function toggleEdit(contactAddress: ContactAddress) {
  addMode.value = false;
  toggleEditExcept(contactAddress.id);
  contactAddress.edit = !contactAddress.edit;
  updateForm.id = contactAddress.id;
  updateForm.name = contactAddress.name;
  updateForm.street = contactAddress.street;
  updateForm.city = contactAddress.city;
  updateForm.province = contactAddress.province;
  updateForm.postal_code = contactAddress.postal_code;
  updateForm.country = contactAddress.country;
  updateForm.latitude = contactAddress.latitude;
  updateForm.longitude = contactAddress.longitude;
}

async function persistClient(
  method: 'post' | 'put' | 'delete',
  uri: string,
  form: AddressForm,
): Promise<unknown> {
  form.errors = [];
  try {
    if (method === 'delete') {
      return await axios.delete(uri);
    }
    return await axios[method](uri, form);
  } catch (error: unknown) {
    const data = (error as { response?: { data?: unknown } })?.response?.data;
    if (data && typeof data === 'object') {
      form.errors = Object.values(data ?? {}).flat() as string[];
    } else {
      form.errors = [t('app.error_try_again')];
    }
    return undefined;
  }
}

async function store() {
  const response = (await persistClient(
    'post',
    'people/' + props.hash + '/addresses',
    createForm,
  )) as { data?: ContactAddress } | undefined;
  if (response?.data) {
    contactAddresses.value.push(response.data);
  }
  addMode.value = false;
}

async function update(contactAddress: ContactAddress) {
  contactAddress.edit = !contactAddress.edit;
  const response = (await persistClient(
    'put',
    'people/' + props.hash + '/addresses/' + contactAddress.id,
    updateForm,
  )) as { data?: ContactAddress } | undefined;
  if (response?.data) {
    const idx = contactAddresses.value.findIndex((item) => item.id === response.data!.id);
    if (idx >= 0) {
      contactAddresses.value[idx] = response.data;
    }
  }
}

async function trash(contactAddress: ContactAddress) {
  updateForm.id = contactAddress.id;
  const response = (await persistClient(
    'delete',
    'people/' + props.hash + '/addresses/' + contactAddress.id,
    updateForm,
  )) as { data?: { deleted: boolean; id: number } } | undefined;
  if (response?.data?.deleted === true) {
    const idx = contactAddresses.value.findIndex((item) => item.id === response.data!.id);
    if (idx >= 0) {
      contactAddresses.value.splice(idx, 1);
    }
  }
  if (contactAddresses.value.length <= 1) {
    editMode.value = false;
  }
}
</script>
