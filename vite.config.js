import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import vue from '@vitejs/plugin-vue';
import purgecss from '@fullhuman/postcss-purgecss';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import path from 'node:path';

export default defineConfig(({ mode }) => ({
  plugins: [
    laravel({
      input: [
        'resources/js/app.ts',
        'resources/js/stripe.ts',
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
      // Runtime + template compiler build. The app mounts onto Blade-rendered
      // `#app` markup that contains in-DOM Vue templates ({{ }} and v- directives),
      // so the runtime compiler is required. The default `vue` export points at
      // the runtime-only bundler build; force the full bundler build instead.
      { find: /^vue$/, replacement: path.resolve(__dirname, 'node_modules/vue/dist/vue.esm-bundler.js') },
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
  css: {
    // LightningCSS minification (Vite 8 default) rejects legacy IE6/7 star-
    // property hacks like Tachyons' `*zoom: 1`. Enable error recovery so the
    // minifier strips them instead of failing the build — modern browsers
    // ignore the hacks anyway.
    lightningcss: {
      errorRecovery: true,
    },
    // PurgeCSS wired via Vite's css.postcss option rather than a project-root
    // postcss.config.js so the safelist lives next to the bundler config that
    // depends on it. Production builds only; dev builds keep every selector.
    postcss: {
      plugins: mode === 'production' ? [
        purgecss({
          content: [
            './resources/views/**/*.blade.php',
            './resources/js/**/*.vue',
            './resources/js/**/*.{js,ts}',
            './app/**/*.php',
          ],
          // Vendor CSS class prefixes that PurgeCSS can't statically observe
          // because the consuming JS (in node_modules) injects them at runtime.
          // Update when swapping a vendor: drop the predecessor's prefix and
          // add the new vendor's.
          safelist: {
            standard: [
              /^fa-/,                  // font-awesome
              /^StripeElement/,        // @stripe/stripe-js
              /^sr-only/,              // accessibility utility
              /^pretty/,               // pretty-checkbox (still imported)
              /^vgt/,                  // vue-good-table-next (vgt-* prefix)
              /^multiselect/,          // @vueform/multiselect
              /^dp__/,                 // @vuepic/vue-datepicker (elements)
              /^dp--/,                 // @vuepic/vue-datepicker (modifiers)
              /^vfm/,                  // vue-final-modal (monica-modal wrapper)
              /^v-popper/,             // floating-vue tooltips
              /^cropper/,              // vue-cropperjs / cropperjs
              /^contact-autosuggest/,  // our ContactAutosuggest.vue scoped styles
            ],
            deep: [
              /^vgt/,
              /^pretty/,
              /^multiselect/,
              /^dp__/,
              /^dp--/,
              /^vfm/,
            ],
          },
        }),
      ] : [],
    },
  },
}));
