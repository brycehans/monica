<style scoped>
textarea {
  transition: all;
  transition-duration: 0.2s;
  border: 1px solid #c4cdd5;
}
textarea:focus {
  border: 1px solid #5c6ac4;
}
</style>

<template>
  <div>
    <label
      v-if="label"
      :for="realid"
      class="mb2"
      :class="{ b: required }"
    >
      {{ label }}
    </label>
    <textarea
      :id="realid"
      v-model="buffer"
      autofocus
      :required="required"
      :name="id"
      :placeholder="placeholder"
      :rows="rows"
      class="br2 f5 w-100 ba b--black-40 pa2 outline-0"
      :style="textareaStyle"
      @input="emitUpdate"
    ></textarea>
  </div>
</template>

<script>
import { getCurrentInstance } from 'vue';

export default {

  props: {
    modelValue: {
      type: String,
      default: '',
    },
    modelModifiers: {
      type: Object,
      default: () => ({}),
    },
    label: {
      type: String,
      default: '',
    },
    id: {
      type: String,
      default: '',
    },
    placeholder: {
      type: String,
      default: '',
    },
    required: {
      type: Boolean,
      default: true,
    },
    width: {
      type: Number,
      default: -1,
    },
    rows: {
      type: Number,
      default: 0,
    }
  },

  emits: ['update:modelValue', 'input'],

  setup() {
    return { uid: getCurrentInstance().uid };
  },

  data() {
    return {
      buffer: this.modelValue
    };
  },

  computed: {
    realid() {
      return this.id + this.uid;
    },
    textareaStyle() {
      return this.width >= 0 ? 'width:' + this.width + 'px' : '';
    }
  },

  watch: {
    modelValue: function (newValue) {
      this.buffer = newValue;
    }
  },

  mounted() {
    this.buffer = this.modelValue;
  },

  methods: {
    emitUpdate() {
      this.$emit('update:modelValue', this.buffer);
      this.$emit('input', this.buffer);
    },
  },
};
</script>
