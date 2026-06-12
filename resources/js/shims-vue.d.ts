// Shim for *.vue SFC imports from TypeScript files.
// The SFCs are still Options API and not yet typed — treat each import as
// `any` so vue-tsc doesn't error on the component registry in app.ts and
// stripe.ts. Remove once each SFC has been converted to <script setup lang="ts">.
declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, any>;
  export default component;
}

// Shim for side-effect CSS imports (e.g. 'vue-final-modal/style.css').
declare module '*.css' {
  const css: string;
  export default css;
}
