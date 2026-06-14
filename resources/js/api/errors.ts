/**
 * Normalises a Laravel validation error response into the positional
 * tuple shape that `FormErrors.vue` expects. Two consumer contracts:
 *
 *  - Legacy `{ field_a: [msg, msg], field_b: [msg] }` → `[msg, msg, msg]`.
 *    `FormErrors.vue` renders `errors[0]` as a plain banner string.
 *
 *  - Modern `{ message: "...invalid", errors: { field: [...] } }` →
 *    `["...invalid", { field: [...] }]`. `FormErrors.vue` suppresses
 *    `errors[0]` when it equals the well-known banner string and
 *    renders the nested map at `errors[1]`.
 *
 * Both contracts fall out of `Object.values(data).flat()` because `.flat()`
 * only flattens arrays — primitive values and plain objects pass through
 * unchanged. Tests in `errors.spec.ts` lock both shapes in.
 *
 * Non-422 errors (network failures, 500s, missing response.data) get the
 * caller-supplied fallback. Accepts either a single string or an array
 * so callers like `CreateGift` can pass `[t('error'), e.message]`.
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
export function validationErrorsFromAxios(error: unknown, fallback: string | string[]): string[] {
  const data = (error as { response?: { data?: unknown } })?.response?.data;
  if (data && typeof data === 'object') {
    return Object.values(data as Record<string, unknown>).flat() as string[];
  }
  return Array.isArray(fallback) ? fallback : [fallback];
}
