import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import vue from '@vitejs/plugin-vue2';
import purgecss from '@fullhuman/postcss-purgecss';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import path from 'node:path';

// Vite drives production builds (phase 3 PR-V₄, Mix → Vite cutover).
//
// Vue 2 ceiling: @vitejs/plugin-vue2 is archived (2025-10-04,
// vitejs/vite-plugin-vue2) and peers vite ^3–^7. Pin vite to ~7 until the
// Vue 3 migration lifts the cap.

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
        // SFC templates reference public assets like <img src="/img/foo.svg">
        // that Laravel serves from public/. Don't try to resolve them as
        // bundled modules. The Blade <base href="..."> tag handles URL
        // resolution at runtime.
        transformAssetUrls: false,
      },
    }),
    // Font-awesome 4 ships its webfonts in node_modules. Copy them into the
    // build output so the URLs emitted by font-awesome's SCSS (rebased onto
    // /build/assets via $fa-font-path in resources/sass/app-ltr.scss) resolve.
    viteStaticCopy({
      targets: [
        { src: 'node_modules/font-awesome/fonts/*', dest: 'assets' },
      ],
    }),
  ],
  resolve: {
    alias: [
      // Runtime + template compiler build (templates are compiled at runtime).
      { find: /^vue$/, replacement: path.resolve(__dirname, 'node_modules/vue/dist/vue.esm.js') },
      // Force `import moment from 'moment'` to resolve to the ESM build at
      // dist/moment.js. The package's main field points at the UMD bundle,
      // whose UMD wrapper Rollup can't reliably rewrite — locale side-effect
      // modules then register on a separate (orphan) moment instance and
      // `moment.locale('fr')` becomes a silent no-op (#718). The ESM build
      // shares one instance with `moment/dist/locale/*`, so registrations
      // reach the consumer-facing moment.
      { find: /^moment$/, replacement: path.resolve(__dirname, 'node_modules/moment/dist/moment.js') },
    ],
    // Match webpack/Mix's default: resolve .vue imports without explicit extension.
    extensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json', '.vue'],
  },
  build: {
    sourcemap: true,
  },
  optimizeDeps: {
    // sweet-modal-vue's `module` field points at raw src/ with extension-less
    // .vue imports (`import SweetModal from './components/SweetModal'`).
    // Production `vite build` resolves those via plugin-vue2 + the .vue
    // extension in resolve.extensions, but the dev-server's esbuild
    // dep-pre-bundling step doesn't honour that list. Skipping pre-bundling
    // lets plugin-vue2 handle the imports lazily. Affects `vite` dev server
    // and @cypress/vite-dev-server; `vite build` (Rollup) is unaffected.
    exclude: ['sweet-modal-vue'],
  },
  css: {
    // PurgeCSS wired via Vite's css.postcss option rather than a project-root
    // postcss.config.js so the safelist lives next to the bundler config that
    // depends on it. Production builds only; dev builds keep every selector.
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
