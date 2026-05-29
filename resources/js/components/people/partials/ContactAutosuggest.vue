<template>
  <div>
    <label
      v-if="title"
      class="mb2"
      :class="{ b: required }"
      :for="realid"
    >
      {{ title }}
    </label>
    <multiselect
      :id="realid"
      ref="multi"
      v-model="selected"
      :options="searchOptions"
      :placeholder="placeholder"
      :delay="wait"
      :min-chars="minLen"
      :resolve-on-load="false"
      :filter-results="false"
      :searchable="true"
      :input-class="inputClass"
      :can-clear="false"
      :can-deselect="false"
      label="complete_name"
      value-prop="id"
      :object="true"
      :open-direction="overflow ? 'bottom' : 'auto'"
      @select="selectHandler"
      @search-change="onSearchChange"
      @blur="blurHandler"
    >
      <template #option="{ option }">
        <component :is="componentItem" :item="option" />
      </template>
    </multiselect>
  </div>
</template>

<script>
import Multiselect from '@vueform/multiselect';
import '@vueform/multiselect/themes/default.css';
import axios from 'axios';

export default {

  components: {
    Multiselect,
  },

  props: {
    id: {
      type: String,
      default: null,
    },
    title: {
      type: String,
      default: null,
    },
    required: {
      type: Boolean,
      default: true,
    },
    addNoResult: {
      type: Boolean,
      default: true,
    },
    placeholder: {
      type: String,
      default: '',
    },
    componentItem: {
      type: Object,
      default: () => null,
    },
    wait: {
      type: Number,
      default: 200,
    },
    minLen: {
      type: Number,
      default: 1,
    },
    overflow: {
      type: Boolean,
      default: false,
    },
    inputClass: {
      type: String,
      default: '',
    },
    filter: {
      type: Function,
      default: () => true,
    },
  },

  emits: ['select', 'blur'],

  data() {
    return {
      selected: null,
      lastQuery: '',
    };
  },

  computed: {
    realid() {
      return this.id ? this.id : 'autosuggest__input';
    },
  },

  methods: {
    async searchOptions(query) {
      this.lastQuery = query || '';
      if (!query || query.length < this.minLen) {
        return this.addNoResult ? [this.addNewSentinel(query || '')] : [];
      }
      const response = await axios.post('people/search', { needle: query });
      const matches = (response.data.data || []).filter(this.filter).map(contact => ({
        ...contact,
        keyword: query,
      }));
      if (this.addNoResult) {
        matches.push(this.addNewSentinel(query));
      }
      return matches;
    },

    addNewSentinel(keyword) {
      return {
        id: -1,
        name: 'add_new_contact',
        complete_name: 'add_new_contact',
        keyword,
      };
    },

    onSearchChange(query) {
      this.lastQuery = query || '';
    },

    blurHandler() {
      this.$emit('blur');
    },

    selectHandler(option) {
      if (!option) {
        return;
      }
      // Preserve the wire contract: consumers (ContactSearch, ContactMultiSearch)
      // expect `{ item: contact }`.
      this.$emit('select', { item: option });

      // Clear the input + selection so the same field can be reused — matches
      // the previous vue-autosuggest behaviour where searchInput was reset.
      this.selected = null;
      const ref = this.$refs.multi;
      if (ref && typeof ref.clearSearch === 'function') {
        ref.clearSearch();
      }
    },
  },
};
</script>
