import { describe, it, expect } from 'vitest';
import { useHtmlDir } from './useHtmlDir';

// No vi.mock needed: tests/js/setup.js injects boot-data with htmldir='ltr'
// before any module loads, so boot.ts sees ltr at parse time.

describe('useHtmlDir', () => {
  it('returns dirltr=true when boot data has htmldir ltr (test default)', () => {
    const { dirltr } = useHtmlDir();
    expect(dirltr).toBe(true);
  });
});
