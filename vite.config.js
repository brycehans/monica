import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import vue from '@vitejs/plugin-vue2';
import purgecss from '@fullhuman/postcss-purgecss';
import path from 'node:path';

// Mix → Vite phase 3 PR-V₁: additive only. Mix still owns production builds
// and Blade @asset(mix(...)) calls. Vite outputs to public/build/ in parallel
// so we can smoke the toolchain before cutover (PR-V₄). See
// docs/plans/2026-05-26-mix-to-vite-scope.md.
//
// Vue 2 ceiling: @vitejs/plugin-vue2 is archived (2025-10-04, vitejs/vite-plugin-vue2)
// and peers vite ^3–^7. Pin vite to ~7 until Vue 3 migration lifts the cap.
export default defineConfig(({ mode }) => ({
  plugins: [
    laravel({
      input: [
        'resources/js/app.js',
        'resources/js/stripe.js',
        'resources/sass/app-ltr.scss',
        'resources/sass/app-rtl.scss',
        'resources/sass/stripe.scss',
      ],
      refresh: true,
    }),
    vue({
      template: {
        // SFC templates reference public assets like <img src="/img/foo.svg"> that
        // Laravel serves from public/. Don't try to resolve them as bundled modules.
        // The Blade <base href="..."> tag handles URL resolution at runtime.
        transformAssetUrls: false,
      },
    }),
  ],
  resolve: {
    alias: [
      // Runtime + template compiler build (templates are compiled at runtime, mirroring
      // webpack.mix.js .alias({ vue$: 'vue/dist/vue.esm.js' })).
      { find: /^vue$/, replacement: path.resolve(__dirname, 'node_modules/vue/dist/vue.esm.js') },
      // Webpack-style ~package/path imports in SCSS. Removed wholesale in PR-V₄'s
      // cutover when webpack.mix.js is deleted and SCSS tildes go with it.
      { find: /^~(.+)$/, replacement: path.resolve(__dirname, 'node_modules/$1') },
    ],
    // Match webpack/Mix's default: resolve .vue imports without explicit extension.
    extensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json', '.vue'],
  },
  build: {
    sourcemap: true,
  },
  css: {
    // PurgeCSS wired via Vite's css.postcss option rather than a postcss.config.js
    // at the project root — that file would also be picked up by Mix's
    // postcss-loader and double-purge. Production builds only; dev builds keep
    // every selector for fast iteration. Safelist ported verbatim from
    // webpack.mix.js. Removed in PR-V₄ when laravel-mix-purgecss exits.
    postcss: {
      plugins: mode === 'production' ? [
        purgecss({
          content: [
            './resources/views/**/*.blade.php',
            './resources/js/**/*.vue',
            './resources/js/**/*.js',
            './app/**/*.php',
          ],
          safelist: {
            standard: [
              /^autosuggest/,
              /^fa-/,
              /^vdp-datepicker/,
              /^StripeElement/,
              /^vgt/,
              /^vue-tooltip/,
              /^pretty/,
              /^sweet-/,
              /^vuejs-clipper-basic/,
              /^vs__/,
              /^sr-only/,
            ],
            deep: [
              /^vdp-datepicker/,
              /^vgt/,
              /^vue-tooltip/,
              /^pretty/,
              /^sweet-/,
              /^vs-/,
            ],
          },
        }),
      ] : [],
    },
  },
}));
