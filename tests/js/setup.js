import { vi, beforeEach } from 'vitest';

// Components read window.Laravel at mount time (timezone, locale, htmldir).
window.Laravel = { locale: 'en', htmldir: 'ltr', timezone: 'UTC' };

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
