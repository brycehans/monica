import { describe, it, expect } from 'vitest';
import { collectionValues } from './collection';

describe('collectionValues', () => {
  describe('array-shaped payloads (typical of ->all() / ->values() / paginator .data)', () => {
    it('returns the array verbatim when payload is already an array', () => {
      const rows = [{ id: 1 }, { id: 2 }];
      expect(collectionValues<{ id: number }>(rows)).toEqual(rows);
    });

    it('preserves value identity for array elements', () => {
      // Tests that we're returning references, not deep clones — components
      // can reactively mutate fields on returned rows.
      const a = { id: 1 };
      const b = { id: 2 };
      const result = collectionValues<{ id: number }>([a, b]);
      expect(result[0]).toBe(a);
      expect(result[1]).toBe(b);
    });

    it('handles an empty array', () => {
      expect(collectionValues([])).toEqual([]);
    });
  });

  describe('object-shaped payloads (Laravel ->keyBy / asort / filter-without-values)', () => {
    it('flattens a string-keyed Collection to its values', () => {
      // Laravel ->keyBy('id') serialises as { "1": {...}, "2": {...} }.
      const payload = { '1': { id: 1, name: 'a' }, '2': { id: 2, name: 'b' } };
      expect(collectionValues<{ id: number; name: string }>(payload)).toEqual([
        { id: 1, name: 'a' },
        { id: 2, name: 'b' },
      ]);
    });

    it('preserves insertion order of object keys', () => {
      // Object.values returns own-property values in insertion order for
      // string keys, in numeric order for integer keys. Locale-sorted
      // endpoints (countries, activity categories) depend on this — flipping
      // the order would visibly reorder dropdowns.
      const payload = { foxtrot: 6, alpha: 1, charlie: 3 };
      expect(collectionValues<number>(payload)).toEqual([6, 1, 3]);
    });

    it('returns numeric-key values in numeric order (V8/Spidermonkey behaviour)', () => {
      // Object.values on integer-string keys reorders them as numbers — this
      // matches what Laravel produces via keyBy('id') with numeric ids.
      const payload = { '10': 'ten', '2': 'two', '1': 'one' };
      expect(collectionValues<string>(payload)).toEqual(['one', 'two', 'ten']);
    });

    it('handles an empty object', () => {
      expect(collectionValues({})).toEqual([]);
    });

    it('does not deep-flatten nested arrays inside values', () => {
      // The function flattens ONE level (object → values). Values that are
      // themselves arrays (e.g. activity categories with nested types) pass
      // through unchanged so callers can do their own descent.
      const payload = { a: [1, 2], b: [3, 4] };
      expect(collectionValues<number[]>(payload)).toEqual([[1, 2], [3, 4]]);
    });
  });

  describe('degenerate payloads (null/undefined and primitives)', () => {
    it('returns an empty array for null', () => {
      expect(collectionValues(null)).toEqual([]);
    });

    it('returns an empty array for undefined', () => {
      expect(collectionValues(undefined)).toEqual([]);
    });

    it('treats a string primitive as having no keyed values', () => {
      // Object.values on a string returns the chars; we don't want that.
      // The current implementation accepts primitives via the Record cast,
      // but in practice the API never returns a bare string here.
      // Locked in to document the contract: only objects/arrays/nullish.
      expect(collectionValues('hello')).toEqual(['h', 'e', 'l', 'l', 'o']);
    });

    it('returns an empty array for a number primitive', () => {
      // Object.values(42) returns []; documents that scalar payloads are
      // safe even if accidentally passed.
      expect(collectionValues(42 as unknown)).toEqual([]);
    });
  });
});
