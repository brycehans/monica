import { vi, beforeEach } from 'vitest';

// Module-level axios mock — intercepted by both `import axios from 'axios'`
// in new <script setup lang="ts"> components and the bare `axios` global used
// by legacy Options API components (via globalThis). vi.mock is hoisted by
// vitest before any imports in this file.
vi.mock('axios', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: [] }),
    post: vi.fn().mockResolvedValue({ data: {} }),
    put: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} }),
  },
}));

// boot.ts reads boot data from a <script type="application/json" id="boot-data"> element.
const bootEl = document.createElement('script');
bootEl.type = 'application/json';
bootEl.id = 'boot-data';
bootEl.textContent = JSON.stringify({ locale: 'en', htmldir: 'ltr', timezone: 'UTC', env: 'testing' });
document.head.appendChild(bootEl);

// lodash is a global via bootstrap.js — provide the bits the modals use.
globalThis._ = {
  toArray: (x) => Array.isArray(x) ? x : Object.values(x ?? {}),
  findIndex: (arr, pred) => {
    if (typeof pred === 'object') {
      return (arr ?? []).findIndex((it) => Object.entries(pred).every(([k, v]) => it[k] === v));
    }
    return (arr ?? []).findIndex(pred);
  },
};

// Wire up globalThis.axios to the vi.mock'd module so legacy Options API
// test assertions that reference bare `axios.post` still work.
import axios from 'axios';
globalThis.axios = axios;

beforeEach(() => {
  // mockReset clears call history AND any one-off mockResolvedValueOnce stubs.
  // Re-add the defaults so tests that don't stub axios get sensible no-ops.
  axios.get.mockReset();
  axios.post.mockReset();
  axios.put.mockReset();
  axios.delete.mockReset();
  axios.get.mockResolvedValue({ data: [] });
  axios.post.mockResolvedValue({ data: {} });
  axios.put.mockResolvedValue({ data: {} });
  axios.delete.mockResolvedValue({ data: {} });
});
