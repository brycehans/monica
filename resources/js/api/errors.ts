import { isRef, type Ref } from 'vue';

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

/**
 * Fallback for `validationErrorsFromAxios` when the response shape isn't
 * a recognised Laravel envelope. Most callers pass a constant — a single
 * string ("Please try again") or a two-line array. `CreateGift` and
 * `CreateActivity` pass a function so they can include the raw error
 * message alongside the localised banner.
 */
export type FormErrorFallback =
  | string
  | string[]
  | ((error: unknown) => string | string[]);

/**
 * Reactive holder that `withFormErrors` can write the error list into.
 * Most form SFCs reactive a `{ errors: FormErrorList }` form-bag; a
 * couple (`CreateGift`, `CreateActivity`) keep errors in a top-level
 * `ref<FormErrorList>([])`. Accept both shapes so callers don't have
 * to wrap one in the other.
 */
export type FormErrorTarget = { errors?: FormErrorList } | Ref<FormErrorList>;

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

function resolveFallback(fallback: FormErrorFallback, error: unknown): string[] {
  const value = typeof fallback === 'function' ? fallback(error) : fallback;
  return Array.isArray(value) ? value : [value];
}

function writeErrors(target: FormErrorTarget, errors: FormErrorList): void {
  if (isRef(target)) target.value = errors;
  else target.errors = errors;
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
 * payload) likewise get the fallback. The fallback can be:
 *   - a string (single-line banner)
 *   - a string[] (multi-line banner — CreateGift et al)
 *   - a function `(error) => string | string[]` that derives the lines
 *     from the error object (used to include `error.message` raw)
 */
export function validationErrorsFromAxios(
  error: unknown,
  fallback: FormErrorFallback,
): FormErrorList {
  const data = getResponseData(error);
  if (isPlainObject(data)) {
    const candidates: unknown[] = Object.values(data).flat();
    if (candidates.every(isFormErrorEntry)) {
      // candidates is now narrowed to FormErrorList via the type predicate.
      return candidates;
    }
  }
  return resolveFallback(fallback, error);
}

/**
 * Convenience wrapper for the catch/assign boilerplate that appears in
 * every form SFC's submit handler. Resets the target's error list,
 * runs the supplied action, and on rejection writes the normalised
 * validation errors into the target. Returns the action's result on
 * success and `undefined` on failure, so callers can branch on a
 * single truthy check instead of try/catching themselves.
 *
 * Accepts either a reactive form-bag (`{ errors: FormErrorList }`) or a
 * `Ref<FormErrorList>` — `isRef` discriminates internally. Callers don't
 * have to manually clear `errors` before submitting; this helper does.
 *
 *   const response = await withFormErrors(form, () => axios.post(uri, form), t('app.error'));
 *   if (!response) return;
 *   clients.value.push(response.data);
 */
export async function withFormErrors<T>(
  target: FormErrorTarget,
  action: () => Promise<T>,
  fallback: FormErrorFallback,
): Promise<T | undefined> {
  writeErrors(target, []);
  try {
    return await action();
  } catch (error) {
    writeErrors(target, validationErrorsFromAxios(error, fallback));
    return undefined;
  }
}
