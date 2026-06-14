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
 * spread. Empty / null / undefined / non-object inputs collapse to `[]`
 * so callers don't need their own guard.
 *
 * Conceptual replacement for the legacy `_.toArray(response.data)` /
 * `_.map(response.data, ...)` calls in the Options API era — those
 * accepted both shapes; native `.map(...)` would throw on objects.
 *
 * The `T` parameter is a caller-supplied trust hint about what the row
 * shape should look like — `Object.values` itself returns `unknown[]`,
 * so the cast at the boundary is the only place the call site's shape
 * knowledge enters the type system. Per-element runtime validation
 * would be the only way to remove the cast entirely, and it would be
 * a much heavier helper.
 */
export function collectionValues<T>(payload: unknown): T[] {
  if (typeof payload !== 'object' || payload === null) {
    // Covers null, undefined, primitives. Array-shaped payloads pass through.
    return [];
  }
  return Object.values(payload) as T[];
}
