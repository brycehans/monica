<style scoped>
.photo {
  height: 250px;
}
</style>

<template>
  <div>
    <div class="">
      <h3>
        📄 {{ t('people.photo_list_title') }}
        <span v-if="reachLimit === 'false'" class="fr relative" style="top: -7px;">
          <a v-if="!onUpload" class="btn" href=""
             @click.prevent="onShowUpload"
          >
            {{ t('people.photo_list_cta') }}
          </a>
          <a v-else class="btn" href=""
             @click.prevent="onCancelUpload"
          >
            {{ t('app.cancel') }}
          </a>
        </span>
      </h3>
    </div>

    <p v-show="reachLimit === 'true'">
      {{ t('settings.storage_upgrade_notice') }}
    </p>

    <!-- EMPTY STATE -->
    <div v-if="!onUpload && photos.length === 0" class="ltr w-100 pt2">
      <div class="section-blank">
        <h3 class="mb4 mt3">
          {{ t('people.photo_list_blank_desc') }}
        </h3>
        <img src="/img/people/photos/photos_empty.svg" :alt="t('people.photo_title')" class="w-50 center" />
      </div>
    </div>

    <photo-upload
      ref="upload"
      :hash="hash"
      :contact-id="contactId"
      @newphoto="handleNewPhoto"
    />

    <!-- LIST OF PHOTO -->
    <div class="db mt3">
      <div class="flex flex-wrap">
        <div v-for="photo in photos" :key="photo.id" class="w-third-ns w-100 pointer">
          <div class="pa3 mb3 br2 ba b--gray-monica" :class="dirltr ? 'mr3' : 'ml3'">
            <div class="cover bg-center photo w-100 h-100 br2 bb b--gray-monica pb2"
                 :style="'background-image: url(' + photo.link + ');'"
                 @click.prevent="modalPhoto(photo)"
            >
            </div>
            <div class="pt2">
              <ul>
                <li v-show="String(currentPhotoIdAsAvatar) === String(photo.id)">
                  🤩 {{ t('people.photo_current_profile_pic') }}
                </li>
                <li v-show="String(currentPhotoIdAsAvatar) !== String(photo.id)">
                  <a class="pointer" @click.prevent="makeProfilePicture(photo)">
                    {{ t('people.photo_make_profile_pic') }}
                  </a>
                </li>
                <li v-show="confirmDestroyPhotoId !== photo.id">
                  <a class="pointer" href="" @click.prevent="confirmDestroyPhotoId = photo.id">
                    {{ t('people.photo_delete') }}
                  </a>
                </li>
                <li v-show="confirmDestroyPhotoId === photo.id">
                  <a class="pointer" href="" @click.prevent="confirmDestroyPhotoId = 0">
                    {{ t('app.cancel') }}
                  </a> <a class="pointer" href="" @click.prevent="deletePhoto(photo)">
                    {{ t('app.delete_confirm') }}
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL ZOOM PHOTO -->
    <!-- Legacy Vue 2 idiom: v-if is on <transition> rather than the inner
         element, so the transition CSS never fires (the wrapper itself
         mounts/unmounts with showModal). Moving v-if onto .modal-mask would
         make the modal fade in/out — that's a UI change, out of scope here. -->
    <transition v-if="showModal" name="modal">
      <!-- eslint-disable-next-line vue/require-toggle-inside-transition -->
      <div class="modal-mask">
        <div class="modal-wrapper">
          <div class="modal-container">
            <img :src="url" :alt="t('people.photo_title')" class="mw-90 h-auto mb3" />

            <ul class="list pl0 tc">
              <li class="di mr3">
                <a v-if="canShowPrev" class="pointer" @click="displayPrev">{{ t('people.photo_previous') }}</a>
              </li>
              <li class="di mr3">
                <button class="btn" @click="showModal = false">
                  {{ t('app.close') }}
                </button>
              </li>
              <li class="di">
                <a v-if="canShowNext" class="pointer" @click="displayNext">{{ t('people.photo_next') }}</a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, useTemplateRef } from 'vue';
import { useI18n } from 'vue-i18n';
import axios from 'axios';
import PhotoUpload from './PhotoUpload.vue';
import { useHtmlDir } from '../../../composables/useHtmlDir';
import { useNotify } from '../../../composables/useNotify';

interface PhotoEntity {
  id: number;
  link: string;
}

interface PhotoUploadInstance {
  showUploadZone: () => void;
  cancelUpload: () => void;
}

const props = withDefaults(
  defineProps<{
    hash?: string;
    contactId?: number;
    reachLimit?: string;
    currentPhotoIdAsAvatar?: string;
  }>(),
  {
    hash: '',
    contactId: 0,
    reachLimit: '',
    currentPhotoIdAsAvatar: '',
  },
);

const { t } = useI18n();
const { dirltr } = useHtmlDir();
const { notify } = useNotify();

const upload = useTemplateRef<PhotoUploadInstance>('upload');

const photos = ref<PhotoEntity[]>([]);
const confirmDestroyPhotoId = ref(0);
const showModal = ref(false);
const url = ref('');
const onUpload = ref(false);
const canShowPrev = ref(false);
const canShowNext = ref(false);
const modalPhotoRef = ref<PhotoEntity | null>(null);

onMounted(getPhotos);

async function getPhotos() {
  const response = await axios.get('people/' + props.hash + '/photos');
  photos.value = response.data.data as PhotoEntity[];
}

function onShowUpload() {
  onUpload.value = true;
  upload.value?.showUploadZone();
}

function onCancelUpload() {
  onUpload.value = false;
  upload.value?.cancelUpload();
}

function handleNewPhoto(photo: unknown) {
  const p = photo as PhotoEntity;
  notify({
    group: 'main',
    title: t('app.default_save_success'),
    text: '',
    type: 'success',
  });
  photos.value.push(p);
}

async function deletePhoto(photo: PhotoEntity) {
  await axios.delete('people/' + props.hash + '/photos/' + photo.id);
  const idx = photos.value.indexOf(photo);
  if (idx >= 0) photos.value.splice(idx, 1);
  notify({
    group: 'main',
    title: t('app.default_save_success'),
    text: '',
    type: 'success',
  });
}

async function makeProfilePicture(photo: PhotoEntity) {
  await axios.post('people/' + props.hash + '/makeProfilePicture/' + photo.id);
  window.location.href = 'people/' + props.hash;
}

function modalPhoto(photo: PhotoEntity) {
  modalPhotoRef.value = photo;
  url.value = photo.link;
  canShowNext.value = modalHasNext();
  canShowPrev.value = modalHasPrev();
  showModal.value = true;
}

function modalHasNext() {
  if (!modalPhotoRef.value) return false;
  const index = photos.value.indexOf(modalPhotoRef.value);
  return index < photos.value.length - 1;
}

function modalHasPrev() {
  if (!modalPhotoRef.value) return false;
  const index = photos.value.indexOf(modalPhotoRef.value);
  return index > 0;
}

function displayNext() {
  if (!modalPhotoRef.value) return;
  const index = photos.value.indexOf(modalPhotoRef.value);
  const photo = photos.value[index + 1];
  if (photo) modalPhoto(photo);
}

function displayPrev() {
  if (!modalPhotoRef.value) return;
  const index = photos.value.indexOf(modalPhotoRef.value);
  const photo = photos.value[index - 1];
  if (photo) modalPhoto(photo);
}
</script>
