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
}
