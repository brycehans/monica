import { htmldir } from '../boot';

export function useHtmlDir(): { dirltr: boolean } {
  return { dirltr: htmldir === 'ltr' };
}
