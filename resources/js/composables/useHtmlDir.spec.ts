import { describe, it, expect, vi } from 'vitest';
import { useHtmlDir } from './useHtmlDir';

// No vi.mock needed: tests/js/setup.js injects boot-data with htmldir='ltr'
// before any module loads, so boot.ts sees ltr at parse time.

describe('useHtmlDir', () => {
  it('returns dirltr=true when boot data has htmldir ltr (test default)', () => {
    const { dirltr } = useHtmlDir();
    expect(dirltr).toBe(true);
  });

  it('returns dirltr=false when htmldir is rtl', async () => {
    vi.resetModules();
    vi.doMock('../boot', () => ({ htmldir: 'rtl' }));
    const { useHtmlDir } = await import('./useHtmlDir');
    const { dirltr } = useHtmlDir();
    expect(dirltr).toBe(false);
    vi.doUnmock('../boot');
  });
});
