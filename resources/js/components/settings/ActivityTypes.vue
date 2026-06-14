<template>
  <div>
    <notifications group="activityTypes" position="bottom right" />

    <h3 class="with-actions">
      {{ t('settings.personalization_activity_type_category_title') }}
      <a v-if="!limited" v-cy-name="'add-activity-type-category-button'" class="btn nt2" :class="[ dirltr ? 'fr' : 'fl' ]" href=""
         @click.prevent="showCreateCategoryModal"
      >
        {{ t('settings.personalization_activity_type_category_add') }}
      </a>
    </h3>
    <p>{{ t('settings.personalization_activity_type_category_description') }}</p>

    <div v-if="limited" v-cy-name="'activity-type-premium-message'" class="mt3 mb3 form-information-message br2">
      <div class="pa3 flex">
        <div class="mr3">
          <svg viewBox="0 0 20 20">
            <g fill-rule="evenodd">
              <circle cx="10" cy="10" r="9" fill="currentColor" /><path d="M10 0C4.486 0 0 4.486 0 10s4.486 10 10 10 10-4.486 10-10S15.514 0 10 0m0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8m1-5v-3a1 1 0 0 0-1-1H9a1 1 0 1 0 0 2v3a1 1 0 0 0 1 1h1a1 1 0 1 0 0-2m-1-5.9a1.1 1.1 0 1 0 0-2.2 1.1 1.1 0 0 0 0 2.2" />
            </g>
          </svg>
        </div>
        <div v-html="t('settings.personalisation_paid_upgrade_vue', {url: 'settings/subscriptions' })"></div>
      </div>
    </div>

    <div class="dt dt--fixed w-100 collapse br--top br--bottom">
      <div class="dt-row">
        <div class="dtc">
          <div class="pa2 b">
            {{ t('settings.personalization_activity_type_category_table_name') }}
          </div>
        </div>
        <div class="dtc" :class="[ dirltr ? 'tr' : 'tl' ]">
          <div class="pa2 b">
            {{ t('settings.personalization_activity_type_category_table_actions') }}
          </div>
        </div>
      </div>
    </div>

    <div v-cy-name="'activity-types'">
      <ul v-cy-name="'activity-type-categories'" v-cy-items="activityTypeCategories.map(a => a.id)">
        <li v-for="activityTypeCategory in activityTypeCategories" :key="activityTypeCategory.id" v-cy-name="'activity-types-'+activityTypeCategory.id"
            v-cy-items="activityTypeCategory.activityTypes ? activityTypeCategory.activityTypes.map(a => a.id) : ''" class="dt dt--fixed w-100 collapse br--top br--bottom mt3"
        >
          <!-- ACTIVITY TYPE CATEGORY -->
          <div class="dt-row hover bb b--light-gray">
            <div class="dtc">
              <div class="pa2 b">
                <strong>{{ activityTypeCategory.name }}</strong>
              </div>
            </div>
            <div class="dtc">
              <div class="pa2" :class="[ dirltr ? 'tr' : 'tl' ]">
                <em v-if="!limited" v-cy-name="'activity-type-category-edit-button-'+activityTypeCategory.id"
                    class="fa fa-pencil-square-o pointer pr2" @click="showEditCategory(activityTypeCategory)"
                ></em>
                <em v-if="!limited" v-cy-name="'activity-type-category-delete-button-'+activityTypeCategory.id"
                    class="fa fa-trash-o pointer" @click="showDeleteCategory(activityTypeCategory)"
                ></em>
              </div>
            </div>
          </div>
          <div v-for="activityType in activityTypeCategory.activityTypes" :key="activityType.id" class="dt-row hover bb b--light-gray">
            <div class="dtc">
              <div class="pa2 pl4">
                {{ activityType.name }}
              </div>
            </div>
            <div class="dtc" :class="[ dirltr ? 'tr' : 'tl' ]">
              <div class="pa2">
                <em v-if="!limited" v-cy-name="'activity-type-edit-button-'+activityType.id"
                    class="fa fa-pencil-square-o pointer pr2" @click="showEditType(activityType, activityTypeCategory.id)"
                ></em>
                <em v-if="!limited" v-cy-name="'activity-type-delete-button-'+activityType.id"
                    class="fa fa-trash-o pointer" @click="showDeleteType(activityType)"
                ></em>
              </div>
            </div>
          </div>
          <div v-if="!limited" class="dt-row">
            <div class="dtc">
              <div class="pa2 pl4">
                <a v-cy-name="'add-activity-type-button-for-category-'+activityTypeCategory.id" class="pointer" href=""
                   @click.prevent="showCreateTypeModal(activityTypeCategory)"
                >
                  {{ t('settings.personalization_activity_type_add_button') }}
                </a>
              </div>
            </div>
          </div>
        </li>
      </ul>
    </div>

    <!-- Create Activity Type Category -->
    <monica-modal v-model="createCategoryModalOpen" :title="t('settings.personalization_activity_type_category_modal_add')">
      <form @submit.prevent="storeCategory()">
        <div class="mb4">
          <p class="b mb2"></p>
          <form-input
            :id="'add-category-name'"
            v-model="createCategoryForm.name"
            :input-type="'text'"
            :required="true"
            :title="t('settings.personalization_activity_type_category_modal_question')"
          />
        </div>
      </form>
      <template #button>
        <a class="btn" href="" @click.prevent="closeCategoryModal()">
          {{ t('app.cancel') }}
        </a>
        <a v-cy-name="'add-activity-type-category-save-button'" class="btn btn-primary" href="" @click.prevent="storeCategory()">
          {{ t('app.save') }}
        </a>
      </template>
    </monica-modal>

    <!-- Update Activity Type Category -->
    <monica-modal v-model="showUpdateCategoryModal" :title="t('settings.personalization_activity_type_category_modal_edit')">
      <form @submit.prevent="updateCategory()">
        <div class="mb4">
          <p class="b mb2"></p>
          <form-input
            :id="'update-category-name'"
            v-model="updateCategoryForm.name"
            :input-type="'text'"
            :required="true"
            :title="t('settings.personalization_activity_type_category_modal_question')"
          />
        </div>
      </form>
      <template #button>
        <a class="btn" href="" @click.prevent="closeUpdateCategoryModal()">
          {{ t('app.cancel') }}
        </a>
        <a v-cy-name="'update-activity-type-category-button'" class="btn btn-primary" href="" @click.prevent="updateCategory()">
          {{ t('app.update') }}
        </a>
      </template>
    </monica-modal>

    <!-- Create Activity Type -->
    <monica-modal v-model="createTypeModalOpen" :title="t('settings.personalization_activity_type_modal_add')">
      <form @submit.prevent="storeType()">
        <div class="mb4">
          <p class="b mb2"></p>
          <form-input
            :id="'add-type-name'"
            v-model="createTypeForm.name"
            :input-type="'text'"
            :required="true"
            :title="t('settings.personalization_activity_type_modal_question')"
          />
        </div>
      </form>
      <template #button>
        <a class="btn" href="" @click.prevent="closeCreateTypeModal()">
          {{ t('app.cancel') }}
        </a>
        <a v-cy-name="'add-type-button'" class="btn btn-primary" href="" @click.prevent="storeType()">
          {{ t('app.save') }}
        </a>
      </template>
    </monica-modal>

    <!-- Update Activity Type -->
    <monica-modal v-model="showUpdateTypeModal" :title="t('settings.personalization_activity_type_modal_edit')">
      <form @submit.prevent="updateType()">
        <div class="mb4">
          <p class="b mb2"></p>
          <form-input
            :id="'update-type-name'"
            v-model="updateTypeForm.name"
            :input-type="'text'"
            :required="true"
            :title="t('settings.personalization_activity_type_modal_question')"
          />
        </div>
      </form>
      <template #button>
        <a class="btn" href="" @click.prevent="closeUpdateTypeModal()">
          {{ t('app.cancel') }}
        </a>
        <a v-cy-name="'update-type-button'" class="btn btn-primary" href="" @click.prevent="updateType()">
          {{ t('app.update') }}
        </a>
      </template>
    </monica-modal>

    <!-- Delete Activiy type category -->
    <monica-modal v-model="showDeleteCategoryModal" :title="t('settings.personalization_activity_type_category_modal_delete')">
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
            {{ t('settings.personalization_activity_type_category_modal_delete_desc') }}
          </p>
        </div>
      </form>
      <template #button>
        <a class="btn" href="" @click.prevent="closeDeleteCategoryModal()">
          {{ t('app.cancel') }}
        </a>
        <a v-cy-name="'delete-category-button'" class="btn btn-primary" href="" @click.prevent="destroyCategory()">
          {{ t('app.delete') }}
        </a>
      </template>
    </monica-modal>

    <!-- Delete Activiy type  -->
    <monica-modal v-model="showDeleteTypeModal" :title="t('settings.personalization_activity_type_modal_delete')">
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
            {{ t('settings.personalization_activity_type_modal_delete_desc') }}
          </p>
        </div>
      </form>
      <template #button>
        <a class="btn" href="" @click.prevent="closeDeleteTypeModal()">
          {{ t('app.cancel') }}
        </a>
        <a v-cy-name="'delete-type-button'" class="btn btn-primary" href="" @click.prevent="destroyType()">
          {{ t('app.delete') }}
        </a>
      </template>
    </monica-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import axios from 'axios';
import { useHtmlDir } from '../../composables/useHtmlDir';
import { useNotify } from '../../composables/useNotify';

interface ActivityType {
  id: number | string;
  name: string;
}

interface ActivityTypeCategory {
  id: number | string;
  name: string;
  activityTypes?: ActivityType[];
}

defineProps<{
  limited?: boolean;
}>();

const { t } = useI18n();
const { dirltr } = useHtmlDir();
const { notify } = useNotify();

const activityTypes = ref<ActivityType[]>([]);
const activityTypeCategories = ref<ActivityTypeCategory[]>([]);
const errorMessage = ref('');

const updatedCategory = ref<ActivityTypeCategory>({ id: '', name: '' });

const createCategoryForm = reactive<{ name: string; errors: string[] }>({ name: '', errors: [] });
const createTypeForm = reactive<{
  name: string;
  activity_type_category_id: number | string;
  errors: string[];
}>({ name: '', activity_type_category_id: '', errors: [] });
const updateCategoryForm = reactive<{
  id: number | string;
  name: string;
  activity_type_category_id: number | string;
  errors: string[];
}>({ id: '', name: '', activity_type_category_id: '', errors: [] });
const updateTypeForm = reactive<{
  id: number | string;
  name: string;
  activity_type_category_id?: number | string;
  errors: string[];
}>({ id: '', name: '', errors: [] });
const destroyCategoryForm = reactive<{ id: number | string; errors: string[] }>({ id: '', errors: [] });
const destroyTypeForm = reactive<{ id: number | string; errors: string[] }>({ id: '', errors: [] });

const createCategoryModalOpen = ref(false);
const showUpdateCategoryModal = ref(false);
const createTypeModalOpen = ref(false);
const showUpdateTypeModal = ref(false);
const showDeleteCategoryModal = ref(false);
const showDeleteTypeModal = ref(false);

onMounted(getActivityTypeCategories);

function notifySaved() {
  notify({
    group: 'activityTypes',
    title: t('app.default_save_success'),
    text: '',
    type: 'success',
  });
}

async function getActivityTypeCategories() {
  const response = await axios.get('settings/personalization/activitytypecategories');
  activityTypeCategories.value = response.data as ActivityTypeCategory[];
}

function closeCategoryModal() {
  createCategoryModalOpen.value = false;
}

function closeDeleteCategoryModal() {
  showDeleteCategoryModal.value = false;
}

function showCreateCategoryModal() {
  createCategoryModalOpen.value = true;
}

async function storeCategory() {
  const response = await axios.post('settings/personalization/activitytypecategories', createCategoryForm);
  createCategoryModalOpen.value = false;
  activityTypeCategories.value.push(response.data.data);
  createCategoryForm.name = '';
  notifySaved();
}

function showEditCategory(category: ActivityTypeCategory) {
  updateCategoryForm.id = category.id;
  updateCategoryForm.name = category.name;
  updatedCategory.value = category;
  showUpdateCategoryModal.value = true;
}

function showDeleteCategory(category: ActivityTypeCategory) {
  destroyCategoryForm.id = category.id;
  showDeleteCategoryModal.value = true;
}

function showDeleteType(type: ActivityType) {
  destroyTypeForm.id = type.id;
  showDeleteTypeModal.value = true;
}

function showEditType(type: ActivityType, categoryId: number | string) {
  updateTypeForm.id = type.id;
  updateTypeForm.name = type.name;
  updateTypeForm.activity_type_category_id = categoryId;
  showUpdateTypeModal.value = true;
}

function closeUpdateCategoryModal() {
  showUpdateCategoryModal.value = false;
}

function closeCreateTypeModal() {
  createTypeModalOpen.value = false;
}

function closeUpdateTypeModal() {
  showUpdateTypeModal.value = false;
}

function closeDeleteTypeModal() {
  showDeleteTypeModal.value = false;
}

async function updateCategory() {
  await axios.put(
    'settings/personalization/activitytypecategories/' + updateCategoryForm.id,
    updateCategoryForm,
  );
  showUpdateCategoryModal.value = false;
  updatedCategory.value.name = updateCategoryForm.name;
  updateCategoryForm.name = '';
  notifySaved();
}

function showCreateTypeModal(category: ActivityTypeCategory) {
  createTypeModalOpen.value = true;
  createTypeForm.activity_type_category_id = category.id;
}

async function storeType() {
  const response = await axios.post('settings/personalization/activitytypes', createTypeForm);
  createTypeModalOpen.value = false;
  activityTypes.value.push(response.data);
  createTypeForm.name = '';
  await getActivityTypeCategories();
  notifySaved();
}

async function destroyCategory() {
  try {
    await axios.delete('settings/personalization/activitytypecategories/' + destroyCategoryForm.id);
    showDeleteCategoryModal.value = false;
    destroyCategoryForm.id = '';
    await getActivityTypeCategories();
    notifySaved();
  } catch (error: unknown) {
    errorMessage.value =
      (error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? '';
  }
}

async function updateType() {
  await axios.put('settings/personalization/activitytypes/' + updateTypeForm.id, updateTypeForm);
  showUpdateTypeModal.value = false;
  updatedCategory.value.name = updateTypeForm.name;
  updateTypeForm.name = '';
  await getActivityTypeCategories();
  notifySaved();
}

async function destroyType() {
  try {
    await axios.delete('settings/personalization/activitytypes/' + destroyTypeForm.id);
    showDeleteTypeModal.value = false;
    destroyTypeForm.id = '';
    await getActivityTypeCategories();
    notifySaved();
  } catch (error: unknown) {
    errorMessage.value =
      (error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? '';
  }
}
</script>
