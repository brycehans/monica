import type Popper from 'popper.js';
import type { AxiosStatic } from 'axios';
import type { LoDashStatic } from 'lodash';
import type { marked as MarkedFn } from 'marked';
import type DOMPurify from 'dompurify';

declare global {
  interface Window {
    _: LoDashStatic;
    Popper: typeof Popper;
    $: JQueryStatic;
    jQuery: JQueryStatic;
    axios: AxiosStatic;
    marked: typeof MarkedFn;
    DOMPurify: typeof DOMPurify;
  }

  // Bootstrap assigns window.$ = jQuery, so bare `$` is available globally.
  // @types/jquery uses `export = jQuery` (module syntax) and doesn't declare
  // ambient globals — we do it here so TypeScript accepts `$(document).ready()`.
  // eslint-disable-next-line no-var
  var $: JQueryStatic;
  // eslint-disable-next-line no-var
  var jQuery: JQueryStatic;
  // bootstrap.ts assigns window.axios = axios, and tests/js/setup.js mirrors
  // that onto globalThis so legacy Options API assertions referencing bare
  // `axios.post` keep working. Declared here so `globalThis.axios` typechecks
  // in spec files without a per-file `(globalThis as any)` cast.
  // eslint-disable-next-line no-var
  var axios: AxiosStatic;
}
