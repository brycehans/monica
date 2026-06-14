import { describe, it, expect } from 'vitest';
import { collectionValues } from './collection';

describe('collectionValues', () => {
  it('returns the array verbatim when payload is already an array', () => {
    const rows = [{ id: 1 }, { id: 2 }];
    expect(collectionValues<{ id: number }>(rows)).toEqual(rows);
  });

  it('flattens an object-keyed Collection to its values', () => {
    // Laravel ->keyBy('id') serialises as { "1": {...}, "2": {...} }.
    const payload = { '1': { id: 1, name: 'a' }, '2': { id: 2, name: 'b' } };
    expect(collectionValues<{ id: number; name: string }>(payload)).toEqual([
      { id: 1, name: 'a' },
      { id: 2, name: 'b' },
    ]);
  });

  it('returns an empty array for null / undefined / empty', () => {
    expect(collectionValues(null)).toEqual([]);
    expect(collectionValues(undefined)).toEqual([]);
    expect(collectionValues({})).toEqual([]);
    expect(collectionValues([])).toEqual([]);
  });
});
