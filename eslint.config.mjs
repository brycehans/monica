import globals from 'globals';
import pluginVue from 'eslint-plugin-vue';

export default [
  // plugin-vue v9's `vue/recommended` resolved to vue2 rules; v10's `flat/recommended`
  // is Vue 3-oriented. Use `flat/vue2-recommended` explicitly since we're on Vue 2.
  ...pluginVue.configs['flat/vue2-recommended'],
  {
    languageOptions: {
      ecmaVersion: 12,
      sourceType: 'module',
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
