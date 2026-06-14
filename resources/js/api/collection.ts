/**
 * Owns the "Laravel may serialise a Collection as an object OR an array"
 * quirk so individual SFCs don't have to. A `Collection::keyBy(...)`,
 * `->filter(...)` without `->values()`, or `Collator::asort`-shaped result
 * encodes as a JSON object (non-sequential string keys), while a plain
 * `->all()` or a paginator's `.data` field encodes as a JSON array. From
 * the caller's perspective both should look like an iterable of rows.
 *
 * Internal SPA code calls this on the parsed response payload (typed
 * `unknown`); it returns a plain `T[]` ready for `.map` / `.filter` /
 * spread. Empty / null / undefined inputs collapse to `[]` so callers
 * don't need their own guard.
 *
 * Conceptual replacement for the legacy `_.toArray(response.data)` /
 * `_.map(response.data, ...)` calls in the Options API era — those
 * accepted both shapes; native `.map(...)` would throw on objects.
 */
export function collectionValues<T>(payload: unknown): T[] {
  if (payload === null || payload === undefined) return [];
  return Object.values(payload as Record<string, T>);
}
