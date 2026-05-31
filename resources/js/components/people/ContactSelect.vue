<template>
  <div>
    <p v-if="title" class="mb2" :class="{ b: required }">
      {{ title }}
    </p>
    <input type="hidden" :name="name" :value="selected ? selected.id : ''" />
    <multiselect
      :id="id || ''"
      v-model="selected"
      :options="searchOptions"
      :placeholder="placeholder"
      :delay="wait"
      :min-chars="0"
      :resolve-on-load="true"
      :filter-results="false"
      :searchable="true"
      label="complete_name"
      value-prop="id"
      :object="true"
      :dir="$root.htmldir"
    />
  </div>
</template>

<script>
import Multiselect from '@vueform/multiselect';
import '@vueform/multiselect/themes/default.css';
import axios from 'axios';

export default {
  components: { Multiselect },

  props: {
    id: {
      type: String,
      default: null,
    },
    modelValue: {
      type: Object,
      default: null,
    },
    name: {
      type: String,
      default: '',
    },
    title: {
      type: String,
      default: '',
    },
    required: {
      type: Boolean,
      default: true,
    },
    userContactId: {
      type: Number,
      default: null,
    },
    defaultOptions: {
      type: Array,
      default: () => [],
    },
    placeholder: {
      type: String,
      default: '',
    },
    wait: {
      type: Number,
      default: 200,
    },
  },

  emits: ['update:modelValue'],

  data() {
    return {
      selected: this.modelValue,
    };
  },

  watch: {
    modelValue(newValue) {
      this.selected = newValue;
    },
    selected(newValue) {
      this.$emit('update:modelValue', newValue);
    },
  },

  methods: {
    async searchOptions(query) {
      if (!query) {
        return this.filterDefaults(this.defaultOptions);
      }
      const response = await axios.post('people/search', { needle: query });
      return this.filterDefaults(response.data.data);
    },

    filterDefaults(items) {
      if (this.userContactId === null) {
        return items;
      }
      return items.filter(item => item.id !== this.userContactId);
    },
  },
};
</script>
