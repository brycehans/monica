<style scoped>
.contact-autosuggest {
  position: relative;
  width: 100%;
}

.contact-autosuggest__input {
  width: 100%;
}

.contact-autosuggest__results {
  position: absolute;
  left: 0;
  right: 0;
  z-index: 100;
  margin: 0;
  padding: 0;
  list-style: none;
  background: #ffffff;
  border: 1px solid #d0d0d0;
  border-top: none;
  max-height: 360px;
  overflow-y: auto;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.contact-autosuggest__result {
  background: #ffffff;
  cursor: pointer;
}

.contact-autosuggest__result:hover {
  background: #f5f5f5;
}

.contact-autosuggest--overflow .contact-autosuggest__results {
  max-height: 361px;
  overflow-y: scroll;
}
</style>

<template>
  <div class="contact-autosuggest" :class="{ 'contact-autosuggest--overflow': overflow }">
    <label
      v-if="title"
      class="mb2"
      :class="{ b: required }"
      :for="realid"
    >
      {{ title }}
    </label>
    <input
      :id="realid"
      v-model="query"
      type="text"
      autocomplete="off"
      class="form-control contact-autosuggest__input"
      :class="inputClass"
      :placeholder="placeholder"
      @input="onInput"
      @focus="onFocus"
      @blur="onBlur"
    />
    <ul v-if="open && items.length > 0" class="contact-autosuggest__results">
      <li
        v-for="(item, idx) in items"
        :key="item.id"
        class="contact-autosuggest__result"
        @mousedown.prevent="onSelect(item, idx)"
      >
        <component :is="componentItem" :item="item" />
      </li>
    </ul>
  </div>
</template>

<script>
import axios from 'axios';

export default {

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
      query: '',
      items: [],
      open: false,
      cache: {},
      debounced: null,
    };
  },

  computed: {
    realid() {
      return this.id ? this.id : 'autosuggest__input';
    },
  },

  mounted() {
    this.debounced = _.debounce((text) => {
      this.fetch(text);
    }, this.wait);
  },

  methods: {
    onInput() {
      const text = this.query;
      if (text === '' || text.length < this.minLen) {
        this.items = this.addNoResult && text !== '' ? [this.addNewSentinel(text)] : [];
        this.open = this.items.length > 0;
        return;
      }
      if (this.cache[text] !== undefined) {
        this.debounced.cancel();
        this.items = this.cache[text];
        this.open = this.items.length > 0;
      } else {
        this.debounced(text);
      }
    },

    async fetch(text) {
      try {
        const response = await axios.post('people/search', { needle: text });
        const matches = (response.data && response.data.data ? response.data.data : [])
          .map(contact => ({ ...contact, keyword: text }))
          .filter(this.filter);
        if (this.addNoResult) {
          matches.push(this.addNewSentinel(text));
        }
        this.cache[text] = matches;
        if (text === this.query) {
          this.items = matches;
          this.open = matches.length > 0;
        }
      } catch (e) {
        // network failure — leave the dropdown empty rather than throw.
      }
    },

    addNewSentinel(keyword) {
      return {
        id: -1,
        name: 'add_new_contact',
        complete_name: 'add_new_contact',
        keyword,
      };
    },

    onFocus() {
      if (this.items.length > 0) {
        this.open = true;
      }
    },

    onBlur() {
      // Defer to let the click handler fire first (mousedown beats blur via
      // .prevent, but click after mouseup can still race).
      setTimeout(() => {
        this.open = false;
        this.$emit('blur');
      }, 150);
    },

    onSelect(item) {
      this.open = false;
      this.$emit('select', { item });
      this.query = '';
      this.items = [];
    },

    clearCache() {
      this.cache = {};
      this.items = [];
    },
  },
};
</script>
