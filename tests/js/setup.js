import { vi, beforeEach } from 'vitest';

// boot.js reads boot data from a <script type="application/json" id="boot-data"> element.
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

// axios is also global via bootstrap.js. Fresh mock per test.
beforeEach(() => {
  globalThis.axios = {
    get: vi.fn().mockResolvedValue({ data: [] }),
    post: vi.fn().mockResolvedValue({ data: {} }),
    put: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} }),
  };
});
