const el = document.getElementById('boot-data');
if (!el) {
  throw new Error('[boot] #boot-data element not found — check that the Blade layout emits it before this script runs');
}
const data = JSON.parse(el.textContent);

export const locale = data.locale ?? 'en';
export const htmldir = data.htmldir ?? 'ltr';
export const timezone = data.timezone ?? null; // absent on auth pages
export const profileDefaultView = data.profileDefaultView ?? null; // absent on auth pages
export const env = data.env ?? 'production'; // absent on auth pages
