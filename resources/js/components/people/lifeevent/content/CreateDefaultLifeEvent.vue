<template>
  <div>
    <div class="ph4 pv3 mb3 mb0-ns bb b--gray-monica">
      <label for="event-name" class="mr2">
        {{ t('people.life_event_create_default_title') }}
      </label>
      <input id="event-name" v-model="defaultEvent.name" autofocus class="br2 f5 w-100 ba b--black-40 pa2 outline-0" @input="broadcastContentChange" />
    </div>

    <div class="ph4 pv3 mb3 mb0-ns bb b--gray-monica">
      <label for="description" class="mr2">
        {{ t('people.life_event_create_default_story') }}
      </label>
      <form-textarea
        id="description"
        v-model="defaultEvent.note"
        :required="false"
        :no-label="true"
        :rows="4"
        :placeholder="t('people.life_event_create_default_description')"
        @input="broadcastContentChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import moment from 'moment';
import { useHtmlDir } from '../../../../composables/useHtmlDir';

interface DefaultLifeEvent {
  name: string;
  note: string;
  specific_information: string;
  happened_at?: string;
}

const { t } = useI18n();
const { dirltr } = useHtmlDir();

const emit = defineEmits<{
  (e: 'contentChange', value: DefaultLifeEvent): void;
}>();

const defaultEvent = reactive<DefaultLifeEvent>({
  name: '',
  note: '',
  specific_information: '',
});

onMounted(() => {
  defaultEvent.happened_at = moment().format('YYYY-MM-DD');
});

function broadcastContentChange() {
  emit('contentChange', defaultEvent);
}
</script>
