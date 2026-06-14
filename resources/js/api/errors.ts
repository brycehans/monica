/**
 * Normalises a Laravel 422 validation error envelope into a flat string
 * list ready for a form-error component. The envelope is shaped like
 * `{ field_a: [msg, msg], field_b: [msg] }`; this collapses it to one
 * array of messages, in field order. Non-422 errors (network, 500,
 * etc.) get the caller-supplied fallback.
 *
 * Replaces the duplicated catch-block pattern across the form SFCs:
 *
 *   const data = (error as { response?: { data?: unknown } })?.response?.data;
 *   if (data && typeof data === 'object') {
 *     form.errors = Object.values(data ?? {}).flat() as string[];
 *   } else {
 *     form.errors = [t('app.error_try_again')];
 *   }
 *
 * The Options API equivalent was `_.flatten(_.toArray(error.response.data))`
 * with no fallback for non-object payloads — this helper closes that hole.
 */
export function validationErrorsFromAxios(error: unknown, fallback: string | string[]): string[] {
  const data = (error as { response?: { data?: unknown } })?.response?.data;
  if (data && typeof data === 'object') {
    return Object.values(data as Record<string, unknown>).flat() as string[];
  }
  return Array.isArray(fallback) ? fallback : [fallback];
}
