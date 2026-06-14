/**
 * Shape that `FormErrors.vue` consumes via its loosely-typed `errors`
 * prop. Either a flat list of message strings (legacy Laravel envelope)
 * OR a positional tuple `[bannerString, { field: [msgs] }]` (modern
 * Laravel envelope). Both shapes are valid input to FormErrors —
 * `errors[0]` is treated as the banner string (suppressed when it
 * matches the well-known "given data was invalid" wording), and
 * `errors[1]`, when present and object-shaped, is rendered via the
 * per-field v-for.
 *
 * Naming the union explicitly here means form SFCs can declare
 * `form.errors: FormErrorList` instead of lying with `string[]`.
 */
export type FormErrorList = Array<string | Record<string, string[]>>;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getResponseData(error: unknown): unknown {
  if (typeof error !== 'object' || error === null) return undefined;
  const response = (error as { response?: unknown }).response;
  if (typeof response !== 'object' || response === null) return undefined;
  return (response as { data?: unknown }).data;
}

/**
 * Normalises a Laravel validation error response into a {@link FormErrorList}.
 * Both legacy `{ field: [msgs] }` and modern `{ message, errors: { ... } }`
 * envelopes flow through `Object.values(data).flat()` — `.flat()` only
 * descends into arrays, so a legacy envelope collapses to a flat string
 * list while a modern envelope is preserved as a `[banner, fieldMap]`
 * tuple. Both shapes are renderable by `FormErrors.vue`.
 *
 * Non-422 errors (network failure, 500, missing response.data, non-object
 * payload) get the caller-supplied fallback. Accepts either a single
 * string or an array so callers like `CreateGift` can pass a two-line
 * `[t('error'), e.message]` fallback.
 *
 * Replaces the duplicated catch-block pattern across the form SFCs:
 *
 *   const data = (error as { response?: { data?: unknown } })?.response?.data;
 *   if (data && typeof data === 'object') {
 *     form.errors = Object.values(data ?? {}).flat() as string[];
 *   } else {
 *     form.errors = [t('app.error_try_again')];
 *   }
 */
export function validationErrorsFromAxios(
  error: unknown,
  fallback: string | string[],
): FormErrorList {
  const data = getResponseData(error);
  if (isPlainObject(data)) {
    // The one unavoidable cast: `.flat()` on `unknown[]` returns `unknown[]`,
    // and TypeScript can't verify the runtime values match FormErrorList
    // without a per-element check. The CONTRACT (documented above + locked
    // by tests in errors.spec.ts) is that Laravel only emits the two
    // envelope shapes; values that fall outside that contract are still
    // safely rendered by FormErrors.vue's `any[]`-typed prop.
    return Object.values(data).flat() as FormErrorList;
  }
  return Array.isArray(fallback) ? fallback : [fallback];
}
