<style scoped>
  .photo {
      height: 200px;
  }
</style>

<template>
  <div>
    <!-- Add a gift -->
    <!-- Legacy Vue 2 idiom: <transition> wraps an always-rendered child so the
         transition CSS never fires. Cleanup would alter UI behaviour (suddenly
         animate on mount) — out of scope for the fork's "no UI changes" rule. -->
    <transition name="fade">
      <!-- eslint-disable-next-line vue/require-toggle-inside-transition -->
      <div class="ba br3 mb3 pa3 b--black-40">
        <div class="pb3 mb3 flex-ns b--gray-monica">
          <!-- STATUS -->
          <form-radio
            :id="'status_idea'"
            v-model="newGift.status"
            :name="'status'"
            :required="true"
            :value="'idea'"
            :color="'success'"
            :full-class="'p-default p-fill p-curve'"
          >
            {{ t('people.gifts_add_gift_idea') }}
          </form-radio>

          <form-radio
            :id="'status_offered'"
            v-model="newGift.status"
            :name="'status'"
            :required="true"
            :value="'offered'"
            :color="'info'"
            :full-class="'p-default p-fill p-curve'"
          >
            {{ t('people.gifts_add_gift_already_offered') }}
          </form-radio>

          <form-radio
            :id="'status_received'"
            v-model="newGift.status"
            :name="'status'"
            :required="true"
            :value="'received'"
            :color="'warning'"
            :full-class="'p-default p-fill p-curve'"
          >
            {{ t('people.gifts_add_gift_received') }}
          </form-radio>
        </div>

        <div class="dt dt--fixed pb3 mb3 mb0-ns bb b--gray-monica">
          <!-- NAME -->
          <form-input
            :id="'name'"
            v-model="newGift.name"
            :input-type="'text'"
            :maxlength="255"
            :required="true"
            :class="'dtc pr2'"
            :title="t('people.gifts_add_gift_name')"
            :validator="v$.newGift.name"
            @submit="store"
          />
        </div>

        <!-- ADDITIONAL FIELDS -->
        <div v-show="displayMenu" class="bb b--gray-monica pv3 mb3">
          <ul class="list">
            <li v-show="!displayComment" class="di pointer" :class="dirltr ? 'mr3' : 'ml3'">
              <a href="" @click.prevent="displayComment = true">{{ t('people.gifts_add_comment') }}</a>
            </li>
            <li v-show="!displayUrl" class="di pointer" :class="dirltr ? 'mr3' : 'ml3'">
              <a href="" @click.prevent="displayUrl = true">{{ t('people.gifts_add_link') }}</a>
            </li>
            <li v-show="!displayAmount" class="di pointer" :class="dirltr ? 'mr3' : 'ml3'">
              <a href="" @click.prevent="displayAmount = true; newGift.amount = 0;">{{ t('people.gifts_add_value') }}</a>
            </li>
            <li v-if="familyContacts.length > 0" v-show="!displayRecipient" class="di pointer" :class="dirltr ? 'mr3' : 'ml3'">
              <a href="" @click.prevent="displayRecipient = true">{{ t('people.gifts_add_recipient') }}</a>
            </li>
            <li v-if="!reachLimit" v-show="!displayUpload" class="di pointer" :class="dirltr ? 'mr3' : 'ml3'">
              <a href="" @click.prevent="onShowUpload">{{ t('people.gifts_add_photo') }}</a>
            </li>
            <li v-show="!displayDate" class="di pointer" :class="dirltr ? 'mr3' : 'ml3'">
              <a href="" @click.prevent="displayDate = true">{{ t('people.gifts_add_date') }}</a>
            </li>
          </ul>
        </div>

        <div v-if="displayComment" class="dt dt--fixed pb3 mb3 bb b--gray-monica">
          <!-- COMMENT -->
          <form-input
            :id="'comment'"
            v-model="newGift.comment"
            :input-type="'text'"
            :class="'dtc pr2'"
            :title="t('people.gifts_add_comment')"
            @submit="store"
          />
        </div>

        <div v-if="displayUrl" class="dt dt--fixed pb3 mb3 bb b--gray-monica">
          <!-- URL -->
          <form-input
            :id="'url'"
            v-model="newGift.url"
            :input-type="'text'"
            :class="'dtc pr2'"
            :title="t('people.gifts_add_link')"
            :placeholder="'https://'"
            @submit="store"
          />
        </div>

        <div v-if="displayDate" class="dt dt--fixed pb3 mb3 bb b--gray-monica">
          <!-- Date -->
          <form-date
            :id="'date'"
            v-model="newGift.date"
            :show-calendar-on-focus="true"
            :locale="locale"
            :class="[ dirltr ? 'fl dtc pr2' : 'fr dtc pr2' ]"
            :label="t('people.gifts_add_date')"
            @submit="store"
          />
        </div>

        <div v-if="displayAmount" class="dt dt--fixed pb3 mb3 bb b--gray-monica">
          <!-- AMOUNT -->
          <form-input
            :id="'amount'"
            v-model="newGift.amount"
            :input-type="'number'"
            :class="'dtc pr2'"
            :title="t('people.gifts_add_value')"
            :required="displayAmount"
            step=".01"
            @submit="store"
          />
        </div>

        <div v-if="displayRecipient" class="dt dt--fixed pb3 mb3 bb b--gray-monica">
          <!-- RECIPIENT -->
          <form-checkbox
            v-model="hasRecipient"
            :name="'has_recipient'"
            @change="(val: unknown) => { if (val) { recipient?.focus() } }"
          >
            {{ t('people.gifts_add_someone', {name: ''}) }}
          </form-checkbox>
          <form-select
            ref="recipient"
            v-model="newGift.recipient_id"
            :label="t('people.gifts_add_recipient_field')"
            :options="familyContacts"
            :validator="v$.newGift.recipient_id"
            @input="hasRecipient = true"
          />
        </div>

        <div v-show="displayUpload" class="dt dt--fixed pb3 mb3 bb b--gray-monica">
          <span class="mb2 b">
            {{ t('people.gifts_add_photo_title') }}
          </span>

          <photo-upload
            v-show="photos.length === 0"
            ref="upload"
            :hash="hash"
            :contact-id="contactId"
            @upload.stop="handlePhoto"
          />

          <!-- LIST OF PHOTO -->
          <div v-show="photos.length > 0">
            <div class="flex flex-wrap">
              <div v-for="photo in photos" :key="photo.id" class="w-third-ns w-100">
                <div v-if="photo.id > 0" class="pa2 mb3 br2 ba b--gray-monica" :class="dirltr ? 'mr3' : 'ml3'">
                  <div class="cover bg-center photo w-100 h-100 br2 bb b--gray-monica pb2"
                       :style="'background-image: url(' + photo.link + ');'"
                  >
                  </div>
                  <div class="pt2">
                    <ul>
                      <li>
                        <a class="pointer" href="" @click.prevent="deletePhoto(photo)">
                          {{ t('people.photo_delete') }}
                        </a>
                      </li>
                    </ul>
                  </div>
                </div>
                <div v-else class="ba br3 photo-upload-zone mb3 pa3">
                  <div class="tc dib w-100 relative">
                    {{ t('app.file_selected', {count: photos.length}, photos.length) }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <form-errors :errors="errors" />

        <!-- ACTIONS -->
        <div class="pt3">
          <div class="flex-ns justify-between">
            <div class="">
              <a class="btn tc w-auto-ns w-100 mb2 pb0-ns" @click.prevent="close">
                {{ t('app.cancel') }}
              </a>
            </div>
            <div class="">
              <button class="btn btn-primary w-auto-ns w-100 mb2 pb0-ns" @click.prevent="store">
                {{ gift ? t('app.update') : t('app.add') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, useTemplateRef } from 'vue';
import { useI18n } from 'vue-i18n';
import axios from 'axios';
import { useVuelidate } from '@vuelidate/core';
import { required, maxLength } from '@vuelidate/validators';
import FormErrors from '../../partials/FormErrors.vue';
import PhotoUpload from '../photo/PhotoUpload.vue';
import { useHtmlDir } from '../../../composables/useHtmlDir';
import { useNotify } from '../../../composables/useNotify';
import { withFormErrors, validationErrorsFromAxios, type FormErrorList } from '../../../api/errors';
import { locale as bootLocale } from '../../../boot';
import type { Gift as GiftRecord, Photo } from './types';

interface FamilyContact {
  id: number;
  complete_name?: string;
}

interface PhotoUploadInstance {
  forceFileUpload: () => Promise<Photo | undefined>;
  showUploadZone: () => void;
}

const props = withDefaults(
  defineProps<{
    hash?: string;
    contactId?: number;
    gift?: GiftRecord | null;
    familyContacts?: FamilyContact[];
    reachLimit?: boolean;
  }>(),
  {
    hash: '',
    contactId: 0,
    gift: null,
    familyContacts: () => [],
    reachLimit: true,
  },
);

const emit = defineEmits<{
  (e: 'update', value: GiftRecord): void;
  (e: 'cancel'): void;
}>();

const { t } = useI18n();
const { dirltr } = useHtmlDir();
const { notify } = useNotify();
const locale = bootLocale;

const upload = useTemplateRef<PhotoUploadInstance>('upload');
const recipient = useTemplateRef<{ focus: () => void }>('recipient');

function onShowUpload() {
  displayUpload.value = true;
  upload.value?.showUploadZone();
}

const photos = ref<Photo[]>([]);
const displayComment = ref(false);
const displayUrl = ref(false);
const displayAmount = ref(false);
const displayRecipient = ref(false);
const displayUpload = ref(false);
const displayDate = ref(false);

const newGift = reactive<{
  name: string;
  status: string;
  comment: string | null;
  url: string | null;
  amount: number | null;
  date: string | null;
  recipient_id: number | null;
  photo_id: number | null;
  contact_id?: number;
}>({
  name: '',
  status: 'idea',
  comment: null,
  url: null,
  amount: null,
  date: null,
  recipient_id: null,
  photo_id: null,
});

const hasRecipient = ref(false);
const errors = ref<FormErrorList>([]);

const rules = computed(() => {
  const base: Record<string, unknown> = {
    name: { required, maxLength: maxLength(255) },
  };
  if (hasRecipient.value) {
    base.recipient_id = { required };
  }
  return { newGift: base };
});

const v$ = useVuelidate(rules, { newGift });

const displayMenu = computed(() =>
  !displayComment.value ||
  !displayUrl.value ||
  !displayAmount.value ||
  !displayDate.value ||
  !(displayRecipient.value || props.familyContacts.length === 0) ||
  !(displayUpload.value || props.reachLimit),
);

watch(() => props.gift, (val) => {
  if (val) {
    Object.assign(newGift, val);
  }
});

onMounted(resetFields);

function resetFields() {
  newGift.contact_id = props.contactId;
  if (props.gift) {
    newGift.contact_id = props.gift.contact?.id ?? props.contactId;
    newGift.name = props.gift.name;
    newGift.comment = props.gift.comment ?? null;
    newGift.url = props.gift.url ?? null;
    newGift.amount = props.gift.amount ?? null;
    newGift.status = props.gift.status;
    newGift.recipient_id = props.gift.recipient?.id ?? null;
    hasRecipient.value = newGift.recipient_id !== null;
    newGift.date = props.gift.date ?? null;
    photos.value = props.gift.photos ?? [];
  } else {
    newGift.name = '';
    newGift.comment = null;
    newGift.url = null;
    newGift.amount = null;
    newGift.status = 'idea';
    newGift.recipient_id = null;
    newGift.date = null;
    hasRecipient.value = false;
  }
  displayComment.value = !!(props.gift && props.gift.comment);
  displayDate.value = !!(props.gift && props.gift.date);
  displayUrl.value = !!(props.gift && props.gift.url);
  displayAmount.value = !!(props.gift && props.gift.amount);
  displayRecipient.value = !!(props.gift && props.gift.recipient && props.gift.recipient.id !== 0);
  displayUpload.value = !!(props.gift && props.gift.photos && props.gift.photos.length > 0);
  errors.value = [];
  v$.value.$reset();
}

function close() {
  resetFields();
  emit('cancel');
}

// Caller-supplied fallback shared between `store` and `storePhoto`:
// errors.value receives the localised banner plus the raw `error.message`
// for diagnostic context, mirroring the pre-#805 `_errorHandle` shape.
const giftErrorFallback = (e: unknown): string[] =>
  [t('app.error_try_again'), (e as { message?: string }).message ?? ''];

async function store() {
  if (!hasRecipient.value) {
    newGift.recipient_id = null;
  }

  v$.value.$touch();

  if (v$.value.$invalid) {
    return;
  }

  const method: 'put' | 'post' = props.gift ? 'put' : 'post';
  const url = `people/${props.hash}/gifts${props.gift ? '/' + props.gift.id : ''}`;

  const response = await withFormErrors(errors, () => axios[method](url, newGift), giftErrorFallback);
  if (!response) return;

  // storePhoto may surface its own (photo-upload) errors into `errors.value`
  // without rolling back the gift create — see its catch block.
  const finalResponse = await storePhoto(response);
  close();
  emit('update', finalResponse.data.data);
  notify({ group: 'main', title: t('people.gifts_add_success'), text: '', type: 'success' });
}

// Returns an axios-like response with the updated gift payload — the original
// implementation pushed any new photo into response.data.data.photos and let
// the caller emit the entire object via @update. Photo-upload failure
// surfaces an error banner but does NOT roll back the already-created gift,
// so this can't simply be wrapped in withFormErrors (which would discard
// the original response on rejection).
async function storePhoto<R extends { data: { data: GiftRecord } }>(response: R): Promise<R> {
  if (!upload.value) return response;
  try {
    const photo = (await upload.value.forceFileUpload()) as Photo | undefined;
    if (photo !== undefined) {
      await axios.put(`people/${props.hash}/gifts/${response.data.data.id}/photo/${photo.id}`);
      response.data.data.photos.push(photo);
    }
    return response;
  } catch (error: unknown) {
    errors.value = validationErrorsFromAxios(error, giftErrorFallback);
    return response;
  }
}

async function deletePhoto(photo: Photo) {
  await axios.delete(`people/${props.hash}/photos/${photo.id}`);
  const idx = photos.value.indexOf(photo);
  if (idx >= 0) photos.value.splice(idx, 1);
  if (photos.value.length === 0) {
    upload.value?.showUploadZone();
  }
}

function handlePhoto() {
  photos.value.push({ id: -1, link: '' });
}
</script>
