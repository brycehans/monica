import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import path from 'node:path';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './resources/js'),
    },
  },
  test: {
    environment: 'happy-dom',
    setupFiles: ['./tests/js/setup.js'],
    globals: true,
    include: ['{resources,tests}/js/**/*.{spec,test}.{js,ts}'],
  },
});
