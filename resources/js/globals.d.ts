import type { AxiosStatic } from 'axios';
import type { LoDashStatic } from 'lodash';
import type { marked as MarkedFn } from 'marked';
import type DOMPurify from 'dompurify';

declare global {
  interface Window {
    _: LoDashStatic;
    axios: AxiosStatic;
    marked: typeof MarkedFn;
    DOMPurify: typeof DOMPurify;
  }

  // bootstrap.ts assigns window.axios = axios, and tests/js/setup.js mirrors
  // that onto globalThis so legacy Options API assertions referencing bare
  // `axios.post` keep working. Declared here so `globalThis.axios` typechecks
  // in spec files without a per-file `(globalThis as any)` cast.
  var axios: AxiosStatic;
}
