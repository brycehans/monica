const el = document.getElementById('boot-data');
if (!el) {
  throw new Error('[boot] #boot-data element not found — check that the Blade layout emits it before this script runs');
}
const data = JSON.parse(el.textContent as string);

export const locale: string = data.locale ?? 'en';
export const htmldir: string = data.htmldir ?? 'ltr';
export const timezone: string | null = data.timezone ?? null; // absent on auth pages
export const profileDefaultView: string | null = data.profileDefaultView ?? null; // absent on auth pages
export const env: string = data.env ?? 'production'; // absent on auth pages
