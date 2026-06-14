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

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === 'string');
}

/**
 * Runtime check that a single value matches the `FormErrorList` element
 * type. Used to validate `Object.values(data).flat()` element-by-element
 * so the helper's return value is type-safe by construction instead of
 * by `as`-cast.
 */
function isFormErrorEntry(value: unknown): value is string | Record<string, string[]> {
  if (typeof value === 'string') return true;
  if (!isPlainObject(value)) return false;
  return Object.values(value).every(isStringArray);
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
 * Every element of the candidate result is runtime-validated against
 * `FormErrorList`'s element type before the function returns. If any
 * element fails (Laravel version changes, a service-layer exception
 * leaks a non-envelope shape, etc.), the helper falls back to the
 * caller-supplied fallback rather than handing FormErrors.vue a
 * value it would render as `[object Object]`.
 *
 * Non-422 errors (network failure, 500, missing response.data, non-object
 * payload) likewise get the fallback. Accepts either a single string or
 * an array so callers like `CreateGift` can pass a two-line
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
    const candidates: unknown[] = Object.values(data).flat();
    if (candidates.every(isFormErrorEntry)) {
      // candidates is now narrowed to FormErrorList via the type predicate.
      return candidates;
    }
  }
  return Array.isArray(fallback) ? fallback : [fallback];
}
