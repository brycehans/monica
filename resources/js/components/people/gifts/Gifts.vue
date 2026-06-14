<template>
  <div>
    <notifications group="main" position="bottom right" />

    <!-- Title -->
    <div>
      <img src="/img/people/gifts.svg" :alt="t('people.gifts_title')" class="icon-section icon-tasks" />
      <h3>
        {{ t('people.gifts_title') }}
        <a v-cy-name="'add-gift-button'" href="" class="btn f6 pt2" :class="[ dirltr ? 'fr' : 'fl' ]"
           @click.prevent="displayCreateGift = true"
        >
          {{ t('people.gifts_add_gift') }}
        </a>
      </h3>
    </div>

    <template v-if="displayCreateGift">
      <create-gift
        :hash="hash"
        :contact-id="contactId"
        :family-contacts="familyContacts"
        :reach-limit="reachLimit"
        @update="updateList()"
        @cancel="displayCreateGift = false"
      />
    </template>

    <!-- Listing -->
    <div>
      <ul class="mb3">
        <li class="di">
          <p class="di pointer" :class="[activeTab === 'idea' ? 'b' : 'black-50', dirltr ? 'mr3' : 'ml3']"
             @click.prevent="setActiveTab('idea')"
          >
            {{ t('people.gifts_ideas') }} ({{ ideas.length }})
          </p>
        </li>
        <li class="di">
          <p class="di pointer" :class="[activeTab === 'offered' ? 'b' : 'black-50', dirltr ? 'mr3' : 'ml3']"
             @click.prevent="setActiveTab('offered')"
          >
            {{ t('people.gifts_offered') }} ({{ offered.length }})
          </p>
        </li>
        <li class="di">
          <p class="di pointer" :class="[activeTab === 'received' ? 'b' : 'black-50', dirltr ? 'mr3' : 'ml3']"
             @click.prevent="setActiveTab('received')"
          >
            {{ t('people.gifts_received') }} ({{ received.length }})
          </p>
        </li>
      </ul>

      <div v-for="gift in filteredGifts" :key="gift.id" v-cy-name="'gift-item-' + gift.id" class="ba b--gray-monica mb3 br2">
        <gift v-if="!gift.edit"
              :gift="gift"
              @update="() => { updateList() }"
        >
          <div :class="dirltr ? 'fl' : 'fr'">
            <a v-if="gift.status === 'idea'" class="di" href="" @click.prevent="toggle(gift)">
              {{ t('people.gifts_mark_offered') }}
            </a>
            <a v-if="gift.status === 'offered'" class="di" href="" @click.prevent="toggle(gift)">
              {{ t('people.gifts_offered_as_an_idea') }}
            </a>
          </div>

          <div :class="dirltr ? 'fr' : 'fl'">
            <a v-cy-name="'edit-gift-button-' + gift.id" :class="dirltr ? 'mr1' : 'ml1'" class="di" href=""
               @click.prevent="gift.edit = true"
            >
              {{ t('app.edit') }}
            </a>
            <a v-cy-name="'delete-gift-button-' + gift.id" :class="dirltr ? 'mr1' : 'ml1'" class="di" href=""
               @click.prevent="showDeleteModal(gift)"
            >
              {{ t('app.delete') }}
            </a>
          </div>
        </gift>
        <create-gift
          v-else
          :hash="hash"
          :gift="gift"
          :contact-id="contactId"
          :family-contacts="familyContacts"
          :reach-limit="reachLimit"
          @update="updateGift(gift, $event)"
          @cancel="gift.edit = false"
        />
      </div>
    </div>

    <monica-modal v-model="showModal" :title="t('people.gifts_delete_title')">
      <form>
        <div class="mb4">
          {{ t('people.gifts_delete_confirmation') }}
        </div>
      </form>
      <template #button>
        <a class="btn" href="" @click.prevent="closeDeleteModal()">
          {{ t('app.cancel') }}
        </a>
        <a v-if="giftToTrash" v-cy-name="'modal-delete-gift-button-' + giftToTrash.id" class="btn btn-primary" href="" @click.prevent="trash(giftToTrash)">
          {{ t('app.delete') }}
        </a>
      </template>
    </monica-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import axios from 'axios';
import moment from 'moment';
import Gift from './Gift.vue';
import CreateGift from './CreateGift.vue';
import { useHtmlDir } from '../../../composables/useHtmlDir';

interface FamilyContact {
  id: number;
  complete_name?: string;
}

interface GiftRecord {
  id: number;
  status: string;
  name: string;
  date?: string | null;
  comment?: string | null;
  url?: string | null;
  amount?: number | null;
  amount_with_currency?: string;
  recipient?: { id?: number; complete_name?: string } | null;
  contact?: { id: number };
  photos: { id: number; link: string }[];
  contact_id?: number;
  edit?: boolean;
}

const props = withDefaults(
  defineProps<{
    hash?: string;
    contactId?: number;
    giftsActiveTab?: string;
    familyContacts?: FamilyContact[];
    reachLimit?: boolean;
  }>(),
  {
    hash: '',
    contactId: 0,
    giftsActiveTab: 'idea',
    familyContacts: () => [],
    reachLimit: true,
  },
);

const emit = defineEmits<{
  (e: 'update', value: GiftRecord): void;
}>();

const { t } = useI18n();
const { dirltr } = useHtmlDir();

const gifts = ref<GiftRecord[]>([]);
const activeTab = ref('');
const giftToTrash = ref<GiftRecord | null>(null);
const displayCreateGift = ref(false);
const showModal = ref(false);

const ideas = computed(() => gifts.value.filter((g) => g.status === 'idea'));
const offered = computed(() => gifts.value.filter((g) => g.status === 'offered'));
const received = computed(() => gifts.value.filter((g) => g.status === 'received'));
const filteredGifts = computed(() => gifts.value.filter((g) => g.status === activeTab.value));

onMounted(() => {
  getGifts();
  setActiveTab(props.giftsActiveTab);
});

function setActiveTab(view: string) {
  activeTab.value = view === 'ideas' ? 'idea' : view;
}

async function getGifts() {
  const response = await axios.get(`people/${props.hash}/gifts`);
  gifts.value = response.data.data as GiftRecord[];
}

async function toggle(gift: GiftRecord) {
  if (gift.status === 'idea') {
    gift.status = 'offered';
    gift.date = moment().format('YYYY-MM-DD');
  } else {
    gift.status = 'idea';
    gift.date = null;
  }
  gift.contact_id = props.contactId;
  const response = await axios.put(`people/${props.hash}/gifts/${gift.id}`, gift);
  gift.status = response.data.data.status;
  gift.date = response.data.data.date;
}

function showDeleteModal(gift: GiftRecord) {
  showModal.value = true;
  giftToTrash.value = gift;
}

async function trash(gift: GiftRecord) {
  await axios.delete(`people/${props.hash}/gifts/${gift.id}`);
  const idx = gifts.value.indexOf(gift);
  if (idx >= 0) gifts.value.splice(idx, 1);
  closeDeleteModal();
}

function updateList() {
  displayCreateGift.value = false;
  getGifts();
}

function updateGift(gift: GiftRecord, response: GiftRecord) {
  gift.edit = false;
  gift.name = response.name;
  gift.comment = response.comment;
  gift.url = response.url;
  gift.amount = response.amount;
  gift.amount_with_currency = response.amount_with_currency;
  gift.status = response.status;
  gift.recipient = response.recipient;
  gift.date = response.date;
  gift.photos = response.photos;
  emit('update', response);
}

function closeDeleteModal() {
  showModal.value = false;
}
</script>
