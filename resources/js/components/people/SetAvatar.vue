<template>
  <div class="pa4-ns ph3 pv2 bb b--gray-monica">
    <p>{{ t('people.avatar_question') }}</p>
    <div class="mb3 mb0-ns">
      <!-- Default avatar -->
      <form-radio
        v-model="selectedAvatar"
        :name="'avatar'"
        :value="'default'"
        :dclass="'flex mb1'"
        :iclass="dirltr ? 'mr2' : 'ml2'"
      >
        <template #label>
          {{ t('people.avatar_default_avatar') }}
        </template>
        <template #extra>
          <img class="mb4 pa2 ba b--gray-monica br3" style="width: 150px" :src="defaultUrl" alt="" />
        </template>
      </form-radio>

      <!-- Gravatar -->
      <form-radio
        v-if="gravatarUrl"
        v-model="selectedAvatar"
        :name="'avatar'"
        :value="'gravatar'"
        :dclass="'flex mb1'"
        :iclass="dirltr ? 'mr2' : 'ml2'"
      >
        <template #label>
          <span v-html="t('people.avatar_gravatar')"></span>
        </template>
        <template #extra>
          <img class="mb4 pa2 ba b--gray-monica br3" style="width: 150px" :src="gravatarUrl" alt="" />
        </template>
      </form-radio>

      <!-- Existing avatar -->
      <form-radio
        v-if="initialAvatar === 'photo'"
        v-model="selectedAvatar"
        :name="'avatar'"
        :value="'photo'"
        :dclass="'flex mb1'"
        :iclass="dirltr ? 'mr2' : 'ml2'"
      >
        <template #label>
          {{ t('people.avatar_current') }}
        </template>
        <template #extra>
          <img class="mb4 pa2 ba b--gray-monica br3" style="width: 150px" :src="photoUrl" alt="" />
        </template>
      </form-radio>

      <!-- Upload avatar -->
      <form-radio
        v-model="selectedAvatar"
        :name="'avatar'"
        :value="'upload'"
        :dclass="'flex mb1'"
        :iclass="dirltr ? 'mr2' : 'ml2'"
        :disabled="hasReachedAccountStorageLimit"
      >
        <template #label>
          {{ t('people.avatar_photo') }}
          <span v-if="hasReachedAccountStorageLimit">
            <a href="settings/subscriptions">
              {{ t('app.upgrade') }}
            </a>
          </span>
        </template>
        <template #extra>
          <input ref="uploadedImg"
                 type="file"
                 class="form-control-file"
                 name="photo"
                 :disabled="hasReachedAccountStorageLimit"
                 @change="uploadImg($event)"
          />
          <small class="form-text text-muted">
            {{ t('people.information_edit_max_size2', { size: maxUploadSize }) }}
          </small>
          <img v-if="croppedImgUrl" class="mb4 pa2 ba b--gray-monica br3" style="width: 150px" :src="croppedImgUrl" alt="" />
        </template>
      </form-radio>
    </div>
    <monica-modal v-model="showCropModal" :title="t('people.avatar_crop_new_avatar_photo')" :blocking="true">
      <vue-cropper v-if="uploadedImgUrl"
                   ref="clipper"
                   :key="uploadedImgUrl"
                   :src="uploadedImgUrl"
                   :aspect-ratio="1"
                   :auto-crop-area="1"
                   :view-mode="1"
      />
      <template #button>
        <a class="btn" href="" @click.prevent="cancelCrop">
          {{ t('app.cancel') }}
        </a>
        <a class="btn btn-primary" href="" @click.prevent="setCroppedImg">
          {{ t('app.done') }}
        </a>
      </template>
    </monica-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, useTemplateRef } from 'vue';
import { useI18n } from 'vue-i18n';
// @ts-expect-error — vue-cropperjs ships no types
import VueCropper from 'vue-cropperjs';
import 'cropperjs/dist/cropper.css';
import { useHtmlDir } from '../../composables/useHtmlDir';

interface CropperInstance {
  getCroppedCanvas: () => HTMLCanvasElement;
}

const props = withDefaults(
  defineProps<{
    avatar?: string;
    defaultUrl?: string;
    gravatarUrl?: string;
    photoUrl?: string;
    hasReachedAccountStorageLimit?: boolean;
    maxUploadSize?: number;
  }>(),
  {
    avatar: '',
    defaultUrl: '',
    gravatarUrl: '',
    photoUrl: '',
    hasReachedAccountStorageLimit: false,
    maxUploadSize: 10000,
  },
);

const { t } = useI18n();
const { dirltr } = useHtmlDir();

const uploadedImg = useTemplateRef<HTMLInputElement>('uploadedImg');
const clipper = useTemplateRef<CropperInstance>('clipper');

const selectedAvatar = ref('');
const initialAvatar = ref('');
const uploadedImgUrl = ref('');
const croppedImgUrl = ref('');
const showCropModal = ref(false);

watch(() => props.avatar, (val) => {
  selectedAvatar.value = val;
});

onMounted(() => {
  initialAvatar.value = props.avatar;
  selectedAvatar.value = props.avatar;
});

function uploadImg(e: Event) {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files.length !== 0) {
    if (uploadedImgUrl.value) {
      URL.revokeObjectURL(uploadedImgUrl.value);
    }
    uploadedImgUrl.value = window.URL.createObjectURL(target.files[0]);
    showCropModal.value = true;
  }
}

function setCroppedImg() {
  const canvas = clipper.value?.getCroppedCanvas();
  if (!canvas) return;

  canvas.toBlob(
    (blob) => {
      if (!blob) return;
      const input = uploadedImg.value;
      if (!input || !input.files?.[0]) return;
      const file = new File([blob], input.files[0].name, { type: 'image/jpeg' });
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      input.files = dataTransfer.files;
      croppedImgUrl.value = window.URL.createObjectURL(blob);
    },
    'image/jpeg',
    1,
  );

  showCropModal.value = false;
}

function cancelCrop() {
  const dataTransfer = new DataTransfer();
  if (uploadedImg.value) {
    uploadedImg.value.files = dataTransfer.files;
  }
  croppedImgUrl.value = '';
  showCropModal.value = false;
}
</script>
