<style scoped>
.participant {
  background: #E5F3F9;
  border-radius: 7px;
}
.participant-list {
  height: 150px;
}
input[type=text] {
  background-color: #f5f5f5;
}
input[type=text]:focus {
  background-color: #fff;
}
.potential-participant:hover {
  background-color: #f1f5fd;
}
</style>

<template>
  <div class="relative">
    <ul v-show="chosenParticipants.length !== 0" class="mr2 mb3">
      <li v-for="chosenParticipant in chosenParticipants"
          :key="chosenParticipant.id"
          class="dib participant br5 mr2"
      >
        <span class="ph2 pv1 dib">
          {{ chosenParticipant.name }}
        </span>
        <span class="bl ph2 pv1 f6 pointer" @click.prevent="remove(chosenParticipant)">
          ❌
        </span>
      </li>
    </ul>
    <div v-show="participants.length !== 0" class="ba b--gray-monica">
      <span class="db bb b--gray-monica pa2">
        <input v-model="search" type="text" :placeholder="t('app.filter')" class="br2 f5 w-100 ba b--black-20 pa2 outline-0" />
      </span>
      <ul class="overflow-auto participant-list">
        <li v-for="fparticipant in filteredList"
            :key="fparticipant.id"
            class="bb b--gray-monica pa2 pointer potential-participant"
            @click.prevent="select(fparticipant)"
        >
          {{ fparticipant.name }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import axios from 'axios';
import { collectionValues } from '../../api/collection';

interface Participant {
  id: number;
  name: string;
}

const props = withDefaults(
  defineProps<{
    initialParticipants?: Participant[];
    hash?: string;
  }>(),
  {
    initialParticipants: () => [],
    hash: '',
  },
);

const emit = defineEmits<{
  (e: 'update', value: Participant[]): void;
}>();

const { t } = useI18n();

const search = ref('');
const participants = ref<Participant[]>([]);
const chosenParticipants = ref<Participant[]>([]);

const filteredList = computed(() => {
  const list = participants.value.filter((participant) => {
    return (
      participant.name.toLowerCase().includes(search.value.toLowerCase()) &&
      chosenParticipants.value.find((p) => p.id === participant.id) === undefined
    );
  });
  return list.slice().sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
});

onMounted(async () => {
  await getParticipants();
  chosenParticipants.value = props.initialParticipants;
});

async function getParticipants() {
  const response = await axios.get('people/' + props.hash + '/activities/contacts');
  participants.value = collectionValues<Participant>(response.data);
}

function select(participant: Participant) {
  chosenParticipants.value.push(participant);
  participants.value.splice(participants.value.indexOf(participant), 1);
  emit('update', chosenParticipants.value);
}

function remove(participant: Participant) {
  participants.value.push(participant);
  chosenParticipants.value.splice(chosenParticipants.value.indexOf(participant), 1);
}
</script>
