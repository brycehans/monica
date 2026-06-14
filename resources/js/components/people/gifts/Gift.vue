<style scoped>
  .photo {
    height: 200px;
  }
  .gift-date{
    float: right;
  }
</style>

<template>
  <div>
    <p class="mb1 bb b--gray-monica pa2">
      <span>
        <a v-if="gift.url" :href="gift.url" rel="noopener noreferrer" target="_blank">
          <strong>{{ gift.name }}</strong>
        </a>
        <strong v-else>{{ gift.name }}</strong>
      </span>
      <span v-if="gift.date" class="f7 gift-date">{{ formatDate(gift.date) }}</span>

      <span v-if="gift.recipient && gift.recipient.complete_name">
        <span class="black-50 mr1 ml1">
          •
        </span>
        {{ t('people.gifts_for', { name: gift.recipient.complete_name }) }}
      </span>
    </p>

    <!-- LIST OF PHOTO -->
    <div v-if="gift.photos !== undefined && gift.photos.length > 0" class="bb b--gray-monica pa1">
      <div class="flex flex-wrap">
        <div v-for="photo in gift.photos" :key="photo.id" class="w-third-ns w-100">
          <div class="pa2 mb1 br2 ba b--gray-monica" :class="dirltr ? 'mr3' : 'ml3'">
            <div class="cover bg-center photo w-100 h-auto br2 bb b--gray-monica pb2"
                 :style="'background-image: url(' + photo.link + ');'"
                 @click.prevent="modalPhoto(photo)"
            >
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="gift.amount || gift.comment" class="f6 pv1 mb1 ph2 pb2 bb b--gray-monica">
      <span v-if="gift.amount">
        {{ gift.amount_with_currency }}
      </span>
      <span v-if="gift.amount && gift.comment" class="black-50 mr1 ml1">
        •
      </span>
      <a v-if="gift.comment" class="pointer" href="" @click.prevent="comment = !comment">
        {{ t('people.gifts_view_comment') }}
      </a>
      <div v-if="comment" class="mb1 mt1">
        {{ gift.comment }}
      </div>
    </div>

    <div class="ph2 pb2 cf f7">
      <slot></slot>
    </div>

    <!-- MODAL ZOOM PHOTO -->
    <monica-modal v-model="showModalPhoto">
      <img :src="url" :alt="t('people.photo_title')" class="mw-90 h-auto mb3" />
    </monica-modal>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import moment from 'moment-timezone';
import { useHtmlDir } from '../../../composables/useHtmlDir';
import { timezone as bootTimezone } from '../../../boot';

interface Photo {
  id: number;
  link: string;
}

interface Gift {
  url?: string;
  name?: string;
  date?: string;
  recipient?: { complete_name?: string };
  photos?: Photo[];
  amount?: number;
  amount_with_currency?: string;
  comment?: string;
}

defineProps<{
  gift: Gift;
}>();

const { t, locale } = useI18n();
const { dirltr } = useHtmlDir();

const comment = ref(false);
const url = ref('');
const showModalPhoto = ref(false);

function modalPhoto(photo: Photo) {
  url.value = photo.link;
  showModalPhoto.value = true;
}

function formatDate(dateAsString: string): string {
  moment.locale(typeof locale.value === 'string' ? locale.value : 'en');
  moment.tz.setDefault('UTC');
  const date = moment.tz(moment(dateAsString), bootTimezone ?? 'UTC');
  return date.format('LL');
}
</script>
