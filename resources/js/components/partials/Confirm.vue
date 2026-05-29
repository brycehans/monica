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
            {{ $t('app.cancel') }}
          </a>
          <button v-cy-name="'confirm-' + name" class="btn btn-primary w-auto-ns w100 mt2 pb0-ns" @click="confirm($event)">
            {{ $t('app.confirm') }}
          </button>
        </div>
      </template>
    </monica-modal>
  </div>
</template>

<script>
export default {

  props: {
    name: {
      type: String,
      default: '',
    },
    title: {
      type: String,
      default: '',
    },
    message: {
      type: String,
      default: '',
    },
    linkClass: {
      type: [String, Array],
      default: '',
    },
  },

  data() {
    return {
      show: false,
    };
  },

  computed: {
    lclass() {
      return this.linkClass === '' ? 'pointer' : this.linkClass;
    }
  },

  methods: {
    open() {
      this.show = true;
    },
    close() {
      this.show = false;
    },
    confirm(event) {
      this.close();
      this.$emit('confirm', event);
    }
  }

};
</script>
