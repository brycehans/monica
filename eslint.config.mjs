import globals from 'globals';
import pluginVue from 'eslint-plugin-vue';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';

export default [
  // plugin-vue v9's `vue/recommended` resolved to vue2 rules; v10's `flat/recommended`
  // is Vue 3-oriented. Use `flat/vue2-recommended` explicitly since we're on Vue 2.
  ...pluginVue.configs['flat/vue2-recommended'],
  // Register @typescript-eslint as a plugin (no rules enabled) so that
  // existing `// eslint-disable-next-line @typescript-eslint/no-explicit-any`
  // comments resolve. Without the plugin loaded, those rule names produce a
  // "Definition for rule '...' was not found" error.
  {
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
  },
  // Standalone TypeScript files (not inside .vue SFCs). The pluginVue block
  // above configures vue-eslint-parser for .vue files and delegates to tsParser
  // for `<script lang="ts">` blocks — but bare `.ts` files don't go through
  // vue-eslint-parser at all, so they need tsParser as the outer parser here.
  // Without this block, eslint would try (and fail) to parse them with espree.
  {
    files: ['**/*.ts'],
    languageOptions: {
      ecmaVersion: 12,
      sourceType: 'module',
      parser: tsParser,
      globals: {
        ...globals.browser,
      },
    },
  },
  {
    languageOptions: {
      ecmaVersion: 12,
      sourceType: 'module',
      // vue-eslint-parser tokenises SFCs and delegates `<script>` block parsing
      // to the inner parser declared here. The Composition API pilot lands the
      // first `<script setup lang="ts">` blocks; without @typescript-eslint/parser
      // ESLint chokes on `interface`, type annotations, and optional-chaining
      // type narrowing. Vanilla JS files keep working because vue-eslint-parser
      // falls back to espree for non-`lang="ts"` scripts.
      parserOptions: {
        parser: tsParser,
      },
      globals: {
        ...globals.browser,
      },
    },
    rules: {
      'array-bracket-spacing': ['error', 'never'],
      'indent': ['error', 2],
      'linebreak-style': ['error', 'unix'],
      'no-trailing-spaces': ['error', {
        'ignoreComments': true,
        'skipBlankLines': true,
      }],
      'quotes': ['error', 'single'],
      'semi': ['error', 'always'],
      'semi-spacing': ['error', {
        'after': true,
        'before': false,
      }],
      'semi-style': ['error', 'last'],

      // strongly recommended
      'vue/component-name-in-template-casing': ['error', 'kebab-case'],
      // plugin-vue 10 replaced `vue/component-tags-order` with `vue/block-order`.
      // Same option shape, same intent: style first, then template/script in any order.
      'vue/block-order': ['error', {
        'order': [
          'style',
          ['template', 'script'],
        ],
      }],
      'vue/html-end-tags': 'error',
      'vue/html-self-closing': ['error', {
        'html': {
          'normal': 'never',
          'void': 'always',
        },
      }],
      'vue/no-v-html': 0,
      // plugin-vue v9 introduced these in vue2-strongly-recommended; preserved as off
      // to avoid an out-of-scope style sweep during PR-B (build-chain audit).
      'vue/multi-word-component-names': 'off',
      'vue/first-attribute-linebreak': 'off',
      'vue/html-closing-bracket-spacing': 'off',
      // plugin-vue v10 added this to vue2-recommended. Two existing ContactItem
      // components declare `item: { required: true, default: () => ({}) }` —
      // legitimate code smell (default unreachable when required) but out of
      // scope for the dep-upgrade PR.
      'vue/no-required-prop-with-default': 'off',
      'vue/max-attributes-per-line': [
        // https://vuejs.org/v2/style-guide/#Multi-attribute-elements-strongly-recommended
        'error',
        {
          'singleline': 5,
          'multiline': 5,
        },
      ],
    },
  },
];
