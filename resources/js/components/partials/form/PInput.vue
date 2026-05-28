<template>
  <div :class="dclass">
    <div :class="wrapperClass">
      <input
        ref="input"
        :type="_type"
        :name="name"
        :value="value"
        :checked="shouldBeChecked"
        :disabled="disabled"
        :required="required"
        @change="onChange"
      />
      <div :class="stateClass">
        <slot name="inputextra"></slot>
        <label>
          <slot></slot>
        </label>
      </div>
    </div>
    <div class="pointer" @click="select()">
      <label v-if="hasSlot('label')" class="pointer">
        <slot name="label"></slot>
      </label>
      <slot name="extra"></slot>
    </div>
  </div>
</template>

<script>
export default {

  model: {
    prop: 'modelValue',
    event: 'change'
  },

  props: {
    name: {
      type: String,
      default: '',
    },
    value: {
      type: [String, Boolean],
      default: '',
    },
    modelValue: {
      type: [String, Boolean],
      default: '',
    },
    iclass: {
      type: [String, Array],
      default: ''
    },
    fullClass: {
      type: [String, Array],
      default: ''
    },
    dclass: {
      type: [String, Array],
      default: ''
    },
    color: {
      type: [String, Array],
      default: ''
    },
    disabled: {
      type: Boolean,
      default: false
    },
    required: {
      type: Boolean,
      default: false
    }
  },

  computed: {
    _type() {
      if (this.$options.input_type) {
        return this.$options.input_type;
      }
      return 'input';
    },
    inputClass() {
      return this.fullClass !== '' ? this.fullClass : [this.iclass, 'p-default', this.$options.input_iclass];
    },
    inputColor() {
      return this.color !== '' ? this.color : 'primary-o';
    },
    wrapperClass() {
      return ['pretty', this.inputClass];
    },
    stateClass() {
      return ['state', `p-${this.inputColor}`];
    },
    shouldBeChecked() {
      if (this._type === 'radio') {
        return this.modelValue === this.value;
      }
      return typeof this.modelValue === 'string' ? this.modelValue !== '' : !!this.modelValue;
    },
  },

  methods: {
    onChange(event) {
      if (this._type === 'radio') {
        this.$emit('change', this.value);
        return;
      }
      this.$emit('change', event.target.checked);
    },
    select() {
      if (this.disabled) {
        return;
      }
      switch (this._type) {
      case 'checkbox':
        this.$refs.input.checked = ! this.$refs.input.checked;
        this.$emit('change', this.$refs.input.checked);
        break;
      case 'radio':
        this.$refs.input.checked = true;
        this.$emit('change', this.value);
        break;
      case 'input':
          //this.$refs.input.focus();
      }
    },
    hasSlot (name = 'default') {
      return !!this.$slots[ name ];
    }
  }
};
</script>
