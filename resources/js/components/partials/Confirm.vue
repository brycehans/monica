<template>
  <div class="di">
    <a :class="lclass" :title="title" href="" @click.prevent="open">
      <slot>
      </slot>
    </a>

    <monica-modal v-model="show">
      <div>
        {{ message }}
      </div>

      <template #button>
        <div class="flex-ns justify-between">
          <a class="btn mt2" href="" @click.prevent="close">
            {{ t('app.cancel') }}
          </a>
          <button v-cy-name="'confirm-' + name" class="btn btn-primary w-auto-ns w100 mt2 pb0-ns" @click="confirm($event)">
            {{ t('app.confirm') }}
          </button>
        </div>
      </template>
    </monica-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, getCurrentInstance } from 'vue';
import { useI18n } from 'vue-i18n';

const props = withDefaults(
  defineProps<{
    name?: string;
    title?: string;
    message?: string;
    linkClass?: string | string[];
  }>(),
  {
    name: '',
    title: '',
    message: '',
    linkClass: '',
  },
);

const emit = defineEmits<{
  (e: 'confirm', value: Event): void;
}>();

const { t } = useI18n();

const show = ref(false);

const instance = getCurrentInstance();

const lclass = computed(() => (props.linkClass === '' ? 'pointer' : props.linkClass));

function open() {
  show.value = true;
}

function close() {
  show.value = false;
}

function confirm(event: Event) {
  close();
  // vue-final-modal teleports the modal's submit button out of the parent
  // form, so the button's native submit no longer fires. The component's
  // root element is not teleported and is still inside the form when one
  // exists. See #727.
  const rootEl = instance?.vnode.el as HTMLElement | undefined;
  const form = rootEl?.closest('form');
  if (form) form.submit();
  emit('confirm', event);
}
</script>
