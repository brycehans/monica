import { htmldir } from '../boot';

export function useHtmlDir() {
  return { dirltr: htmldir === 'ltr' };
}
