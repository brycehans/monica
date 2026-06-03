// Placeholder so `yarn run test:js` exits 0 between PR #759 landing and the
// first real component spec (genders/CreateModal.spec.js, #724 phase 1).
// Delete when CreateModal.spec.js (or any other resources/js/**/*.spec.js)
// lands.
import { describe, it, expect } from 'vitest';

describe('vitest harness sanity', () => {
  it('discovers and runs at least one spec', () => {
    expect(true).toBe(true);
  });
});
