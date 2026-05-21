module.exports = {
  'env': {
    'browser': true,
    'es6': true
  },
  'extends': [
    'plugin:vue/recommended'
  ],
  'parserOptions': {
    'ecmaVersion': 12,
    'sourceType': 'module'
  },
  'plugins': [
    'vue'
  ],
  'rules': {
    'array-bracket-spacing': [
      'error',
      'never'
    ],
    'indent': [
      'error',
      2
    ],
    'linebreak-style': [
      'error',
      'unix'
    ],
    'no-trailing-spaces': [
      'error',
      {
        'ignoreComments': true,
        'skipBlankLines': true
      }
    ],
    'quotes': [
      'error',
      'single'
    ],
    'semi': [
      'error',
      'always'
    ],
    'semi-spacing': [
      'error',
      {
        'after': true,
        'before': false
      }
    ],
    'semi-style': [
      'error',
      'last'
    ],

    // strongly recommended
    'vue/component-name-in-template-casing': [
      'error',
      'kebab-case'
    ],
    'vue/component-tags-order': [
      'error', {
        'order': [
          'style',
          [
            'template',
            'script'
          ]
        ]
      }],
    'vue/html-end-tags' : 'error',
    'vue/html-self-closing': [
      'error',
      {
        'html': {
          'normal': 'never',
          'void': 'always'
        }
      }
    ],
    'vue/no-v-html' : 0,
    // plugin-vue v9 introduced these in vue2-strongly-recommended; preserved as off
    // to avoid an out-of-scope style sweep during PR-B (build-chain audit).
    'vue/multi-word-component-names': 'off',
    'vue/first-attribute-linebreak': 'off',
    'vue/html-closing-bracket-spacing': 'off',
    'vue/max-attributes-per-line': [
      // https://vuejs.org/v2/style-guide/#Multi-attribute-elements-strongly-recommended
      'error',
      {
        'singleline': 5,
        'multiline': 5
      }
    ],
  }
};
